import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { PROJECTS } from "@/data/projects";
import { PACKET_MAP } from "@/data/taskPackets";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_PATHS = new Set(PROJECTS.map((p) => p.localPath));
// All sandboxes live inside Builder OS itself, isolated from target repos
const SANDBOX_BASE = path.join(process.cwd(), ".builder-os", "sandboxes");

// ── Forbidden patterns in execution prompts ───────────────────────────────────

const FORBIDDEN_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bgit\s+push\b/i,          reason: "git push is not allowed via automation" },
  { pattern: /\bgit\s+commit\b/i,        reason: "git commit must be done manually" },
  { pattern: /\bnpm\s+publish\b/i,       reason: "npm publish is not allowed via automation" },
  { pattern: /\bvercel\b.*deploy/i,      reason: "vercel deploy is not allowed via automation" },
  { pattern: /\bnpm\s+run\s+deploy\b/i,  reason: "deploy scripts are not allowed via automation" },
  { pattern: /\brm\s+-rf\b/i,            reason: "rm -rf is forbidden" },
  { pattern: /\bdel\s+\/[sqf]/i,         reason: "destructive del commands are forbidden" },
  { pattern: /\brmdir\b.*\/s\b/i,        reason: "rmdir /s is forbidden" },
  { pattern: /curl.*\|\s*(ba)?sh\b/i,    reason: "piped remote execution is forbidden" },
];

// ── Spawn helper ──────────────────────────────────────────────────────────────

function spawnWithTimeout(
  cmd: string,
  args: string[],
  opts: { cwd: string; timeout: number }
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const out: Buffer[] = [];
    const err: Buffer[] = [];

    const proc = spawn(cmd, args, {
      cwd: opts.cwd,
      shell: process.platform === "win32",
      windowsHide: true,
    });

    proc.stdout?.on("data", (d: Buffer) => out.push(d));
    proc.stderr?.on("data", (d: Buffer) => err.push(d));

    const timer = setTimeout(() => {
      proc.kill();
      resolve({
        stdout: Buffer.concat(out).toString("utf-8"),
        stderr: Buffer.concat(err).toString("utf-8") + "\n[Timed out]",
        exitCode: null,
      });
    }, opts.timeout);

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout: Buffer.concat(out).toString("utf-8"),
        stderr: Buffer.concat(err).toString("utf-8"),
        exitCode: code,
      });
    });

    proc.on("error", (e) => {
      clearTimeout(timer);
      resolve({ stdout: "", stderr: e.message, exitCode: -1 });
    });
  });
}

// ── Git helpers ───────────────────────────────────────────────────────────────

async function gitBranch(repoPath: string): Promise<string> {
  const r = await spawnWithTimeout("git", ["branch", "--show-current"], { cwd: repoPath, timeout: 8_000 });
  return r.stdout.trim() || "unknown";
}

async function gitStatusShort(repoPath: string): Promise<{ output: string; isDirty: boolean }> {
  const r = await spawnWithTimeout("git", ["status", "--short", "--porcelain"], { cwd: repoPath, timeout: 8_000 });
  const output = r.stdout.trim();
  return { output: output || "(clean)", isDirty: output.length > 0 };
}

function assessSafety(
  branch: string,
  isDirty: boolean,
  taskPacketId: string,
  allowMain: boolean,
  allowDirty: boolean
) {
  const isMain = branch === "main" || branch === "master";
  const suggestedBranch = `builder-os/task-${taskPacketId}`;
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (isMain && !allowMain) {
    blockers.push(`On "${branch}" — automation must run on a task branch to protect main`);
  } else if (isMain) {
    warnings.push(`Running on "${branch}" — override accepted, proceed with caution`);
  }

  if (isDirty && !allowDirty) {
    blockers.push("Working tree has uncommitted changes — execution may conflict with in-progress work");
  } else if (isDirty) {
    warnings.push("Working tree is dirty — override accepted");
  }

  return {
    isMain, isDirty,
    warnings, blockers,
    isSafe: blockers.length === 0,
    suggestedBranch,
    rollbackCommands: ["git checkout main", `git branch -D ${suggestedBranch}`],
  };
}

// ── Sandbox helpers ───────────────────────────────────────────────────────────

function getSandboxPath(taskPacketId: string): string {
  // Sanitise: only alphanumeric, hyphens, underscores
  const safeId = taskPacketId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);
  const p = path.join(SANDBOX_BASE, safeId);
  // Path traversal guard
  if (!p.startsWith(SANDBOX_BASE + path.sep) && p !== SANDBOX_BASE) {
    throw new Error(`Unsafe sandbox path derived from: ${taskPacketId}`);
  }
  return p;
}

async function sandboxExists(sandboxPath: string): Promise<boolean> {
  try {
    await fs.access(sandboxPath);
    return true;
  } catch {
    return false;
  }
}

function buildSandboxPrompt(originalPrompt: string, sandboxPath: string, repoPath: string): string {
  // Replace repo path references with sandbox path
  let prompt = originalPrompt
    .split(repoPath).join(sandboxPath)
    .split(repoPath.replace(/\\/g, "/")).join(sandboxPath.replace(/\\/g, "/"));

  const header = `⚠ SANDBOX EXECUTION MODE
${"═".repeat(50)}
You are working in an ISOLATED SANDBOX COPY of the repository.

Sandbox path: ${sandboxPath}
Original repo: ${repoPath}  ← DO NOT TOUCH

SANDBOX RULES (non-negotiable):
1. Work ONLY inside the sandbox directory shown above
2. Do NOT access directories above the sandbox root (no ../traversal)
3. Do NOT git push or deploy — this is an isolated copy
4. Do NOT access external network resources or remote services
5. After completing the task:
   - List every file you changed with a one-line description
   - Run the build/test command if one exists
   - Report: PASS / FAIL with any error output
   - Do NOT commit — changes will be reviewed manually

${"═".repeat(50)}

`;
  return header + prompt;
}

function buildMergeSteps(sandboxPath: string, repoPath: string, taskPacketId: string): string {
  const isWin = process.platform === "win32";
  const patchFile = isWin
    ? path.join(process.cwd(), ".builder-os", `${taskPacketId}.patch`)
    : `/tmp/builder-os-${taskPacketId}.patch`;

  return `# ── Apply sandbox changes to the real repo ──────────────

# Step 1: Review what changed in the sandbox
git -C "${sandboxPath}" diff HEAD --stat

# Step 2a: Create a patch and apply (recommended)
git -C "${sandboxPath}" diff HEAD > "${patchFile}"
git -C "${repoPath}" apply "${patchFile}"

# Step 2b: Or copy files manually (review diff first)
# cp "${sandboxPath}/path/to/file" "${repoPath}/path/to/file"

# Step 3: Review changes in the real repo before committing
git -C "${repoPath}" diff --stat
git -C "${repoPath}" add -p
git -C "${repoPath}" commit -m "feat: [describe the change]"`;
}

// ── POST /api/execute-task ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    action: "check" | "create-branch" | "create-sandbox" | "sandbox-status" | "delete-sandbox" | "dry-run" | "run";
    mode?: "sandbox" | "direct";
    taskPacketId: string;
    projectId?: string;
    repoPath: string;
    executionPrompt?: string;
    agentType?: string;
    allowDirty?: boolean;
    allowMain?: boolean;
    dryRun?: boolean; // legacy
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action ?? (body.dryRun ? "dry-run" : "run");
  const { taskPacketId, repoPath, allowDirty = false, allowMain = false } = body;

  if (!taskPacketId || !repoPath) {
    return NextResponse.json({ error: "taskPacketId and repoPath are required" }, { status: 400 });
  }

  if (!ALLOWED_PATHS.has(repoPath)) {
    return NextResponse.json(
      { error: `Repo path not in allowed list: "${repoPath}". Register it in data/projects.ts first.` },
      { status: 403 }
    );
  }

  // ── create-sandbox ────────────────────────────────────────────────────────

  if (action === "create-sandbox") {
    let sandboxPath: string;
    try { sandboxPath = getSandboxPath(taskPacketId); }
    catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

    await fs.mkdir(SANDBOX_BASE, { recursive: true });

    if (await sandboxExists(sandboxPath)) {
      return NextResponse.json({
        action: "create-sandbox",
        status: "already-exists",
        sandboxPath,
        note: "Sandbox already exists. Use sandbox-status to check it, or delete-sandbox to recreate.",
      });
    }

    const cloneResult = await spawnWithTimeout(
      "git", ["clone", "--local", repoPath, sandboxPath],
      { cwd: SANDBOX_BASE, timeout: 60_000 }
    );

    if (cloneResult.exitCode !== 0) {
      return NextResponse.json(
        { error: `git clone failed: ${cloneResult.stderr.trim()}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      action: "create-sandbox",
      status: "created",
      sandboxPath,
      note: `Cloned from ${repoPath}. Node_modules and .gitignored files are excluded.`,
    });
  }

  // ── sandbox-status ────────────────────────────────────────────────────────

  if (action === "sandbox-status") {
    let sandboxPath: string;
    try { sandboxPath = getSandboxPath(taskPacketId); }
    catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

    const exists = await sandboxExists(sandboxPath);
    if (!exists) {
      return NextResponse.json({ action: "sandbox-status", exists: false, sandboxPath });
    }

    const { output: gitStatus, isDirty } = await gitStatusShort(sandboxPath);
    const diffStat = await spawnWithTimeout("git", ["diff", "--stat", "HEAD"], { cwd: sandboxPath, timeout: 10_000 });

    return NextResponse.json({
      action: "sandbox-status",
      exists: true,
      sandboxPath,
      gitStatus,
      isDirty,
      diffStat: diffStat.stdout.trim() || "(no changes from HEAD)",
    });
  }

  // ── delete-sandbox ────────────────────────────────────────────────────────

  if (action === "delete-sandbox") {
    let sandboxPath: string;
    try { sandboxPath = getSandboxPath(taskPacketId); }
    catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

    if (!(await sandboxExists(sandboxPath))) {
      return NextResponse.json({ action: "delete-sandbox", deleted: false, note: "Sandbox did not exist" });
    }

    try {
      await fs.rm(sandboxPath, { recursive: true, force: true });
      return NextResponse.json({ action: "delete-sandbox", deleted: true, sandboxPath });
    } catch (e) {
      return NextResponse.json({ error: `Failed to delete sandbox: ${(e as Error).message}` }, { status: 500 });
    }
  }

  // ── check ─────────────────────────────────────────────────────────────────

  if (action === "check") {
    const branch = await gitBranch(repoPath);
    const { output: statusOutput, isDirty } = await gitStatusShort(repoPath);
    const safety = assessSafety(branch, isDirty, taskPacketId, allowMain, allowDirty);
    return NextResponse.json({ action: "check", repoPath, branch, statusOutput, ...safety });
  }

  // ── create-branch ─────────────────────────────────────────────────────────

  if (action === "create-branch") {
    const branchName = `builder-os/task-${taskPacketId}`;
    const r = await spawnWithTimeout("git", ["checkout", "-b", branchName], { cwd: repoPath, timeout: 10_000 });
    if (r.exitCode === 0) {
      return NextResponse.json({
        action: "create-branch", success: true, branchName, repoPath,
        rollbackCommands: ["git checkout main", `git branch -D ${branchName}`],
      });
    }
    const sw = await spawnWithTimeout("git", ["checkout", branchName], { cwd: repoPath, timeout: 10_000 });
    if (sw.exitCode === 0) {
      return NextResponse.json({
        action: "create-branch", success: true, branchName, repoPath,
        note: "Branch already existed — switched to it",
        rollbackCommands: ["git checkout main", `git branch -D ${branchName}`],
      });
    }
    return NextResponse.json(
      { error: `Failed to create branch: ${r.stderr.trim() || sw.stderr.trim()}` },
      { status: 500 }
    );
  }

  // ── dry-run / run: require packet ─────────────────────────────────────────

  const packet = PACKET_MAP[taskPacketId];
  if (!packet) return NextResponse.json({ error: `Task packet not found: ${taskPacketId}` }, { status: 404 });
  if (packet.status !== "approved") {
    return NextResponse.json({ error: `Packet "${taskPacketId}" is not approved (status: ${packet.status})` }, { status: 403 });
  }

  const executionPrompt = body.executionPrompt ?? packet.executionPrompt;
  if (!executionPrompt || executionPrompt.trim().length < 20) {
    return NextResponse.json({ error: "Execution prompt is empty or too short" }, { status: 400 });
  }

  const violations: string[] = [];
  for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
    if (pattern.test(executionPrompt)) violations.push(reason);
  }
  if (violations.length > 0) {
    return NextResponse.json({ error: "Safety check failed", violations }, { status: 400 });
  }

  const promptWarnings: string[] = [];
  if (!/no.*push|don.t.*push|do not push|forbidden/i.test(executionPrompt)) {
    promptWarnings.push('Prompt does not explicitly say "no push"');
  }
  if (!/expected output/i.test(executionPrompt)) {
    promptWarnings.push('Prompt does not include "expected output" section');
  }

  // Git info for real repo
  const branch = await gitBranch(repoPath);
  const { output: statusOutput, isDirty } = await gitStatusShort(repoPath);
  const safety = assessSafety(branch, isDirty, taskPacketId, allowMain, allowDirty);

  const isWindows = process.platform === "win32";
  const cdCommand = isWindows ? `cd "${repoPath}"` : `cd '${repoPath}'`;
  const displayCommand = `${cdCommand}\nclaude`;

  const risksByLevel: Record<string, string> = {
    "read-only":     "LOW — read-only analysis, no file changes",
    "edit-approved": "MEDIUM — agent may create and modify files",
    "plan-only":     "MINIMAL — no file access",
    "prompt-only":   "MINIMAL — no file access",
  };

  // ── dry-run ───────────────────────────────────────────────────────────────

  if (action === "dry-run") {
    const builderOsDir = path.join(repoPath, ".builder-os");
    const promptFilePath = path.join(builderOsDir, "task-prompt.md");
    try {
      await fs.mkdir(builderOsDir, { recursive: true });
      await fs.writeFile(promptFilePath, executionPrompt, "utf-8");
    } catch { /* non-fatal */ }

    let sandboxPath: string | null = null;
    try { sandboxPath = getSandboxPath(taskPacketId); } catch { /* ignore */ }

    return NextResponse.json({
      action: "dry-run",
      status: "ready",
      repoPath,
      promptFilePath,
      sandboxPath,
      command: displayCommand,
      safetyWarnings: promptWarnings,
      git: { branch, statusOutput, ...safety },
      packet: { id: packet.id, title: packet.title, approvalLevel: packet.approvalLevel, goal: packet.goal },
      risks: [
        risksByLevel[packet.approvalLevel] ?? "Review approval level carefully",
        "Nothing is committed automatically",
        "Review git status before any manual commit",
      ],
      note: `Prompt written to: ${promptFilePath}`,
    });
  }

  // ── run ───────────────────────────────────────────────────────────────────

  const execMode = body.mode ?? "sandbox";

  // ── run / sandbox mode ────────────────────────────────────────────────────

  if (execMode === "sandbox") {
    let sandboxPath: string;
    try { sandboxPath = getSandboxPath(taskPacketId); }
    catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

    if (!(await sandboxExists(sandboxPath))) {
      return NextResponse.json(
        { error: "Sandbox does not exist. Create the sandbox first before running in sandbox mode.", sandboxPath },
        { status: 400 }
      );
    }

    // Build sandbox-modified prompt
    const sandboxPrompt = buildSandboxPrompt(executionPrompt, sandboxPath, repoPath);

    // Write sandbox prompt into sandbox
    const sandboxBuilderDir = path.join(sandboxPath, ".builder-os");
    const sandboxPromptFile = path.join(sandboxBuilderDir, "task-prompt.md");
    const sandboxOutputFile = path.join(sandboxBuilderDir, "task-output.md");
    try {
      await fs.mkdir(sandboxBuilderDir, { recursive: true });
      await fs.writeFile(sandboxPromptFile, sandboxPrompt, "utf-8");
    } catch { /* non-fatal */ }

    // Execute in sandbox
    const claudeCmd = isWindows ? "claude.cmd" : "claude";
    const execResult = await spawnWithTimeout(claudeCmd, ["--print", sandboxPrompt], {
      cwd: sandboxPath,
      timeout: 120_000,
    });

    if (execResult.stdout.trim()) {
      try { await fs.writeFile(sandboxOutputFile, execResult.stdout, "utf-8"); } catch { /* non-fatal */ }
    }

    // Diff in sandbox (shows what agent changed vs HEAD)
    const diffStat = await spawnWithTimeout("git", ["diff", "--stat", "HEAD"], { cwd: sandboxPath, timeout: 10_000 });
    const { output: sandboxStatus } = await gitStatusShort(sandboxPath);
    const mergeSteps = buildMergeSteps(sandboxPath, repoPath, taskPacketId);

    const failed = execResult.exitCode !== 0 || execResult.stdout.trim() === "";

    return NextResponse.json({
      action: "run",
      mode: "sandbox",
      status: failed ? "partial" : "completed",
      sandboxPath,
      repoPath,
      stdout: execResult.stdout || null,
      stderr: execResult.stderr || null,
      exitCode: execResult.exitCode,
      gitStatus: sandboxStatus,
      diffStat: diffStat.stdout.trim() || "(no uncommitted changes in sandbox)",
      mergeSteps,
      safetyWarnings: promptWarnings,
      packet: { id: packet.id, title: packet.title, approvalLevel: packet.approvalLevel, goal: packet.goal },
      note: failed
        ? `Auto-run returned no output. Open the sandbox manually:\n${isWindows ? `cd "${sandboxPath}"` : `cd '${sandboxPath}'`}\nclaude\n# Paste prompt from: ${sandboxPromptFile}`
        : `Sandbox output saved to: ${sandboxOutputFile}`,
    });
  }

  // ── run / direct mode ─────────────────────────────────────────────────────

  if (!safety.isSafe) {
    return NextResponse.json(
      {
        error: "Pre-execution safety check failed",
        blockers: safety.blockers,
        hint: "Use sandbox mode (safer), or pass allowMain/allowDirty overrides",
        git: { branch, statusOutput, ...safety },
      },
      { status: 403 }
    );
  }

  const builderOsDir = path.join(repoPath, ".builder-os");
  const promptFilePath = path.join(builderOsDir, "task-prompt.md");
  const outputFilePath = path.join(builderOsDir, "task-output.md");
  try {
    await fs.mkdir(builderOsDir, { recursive: true });
    await fs.writeFile(promptFilePath, executionPrompt, "utf-8");
  } catch { /* non-fatal */ }

  const claudeCmd = isWindows ? "claude.cmd" : "claude";
  const execResult = await spawnWithTimeout(claudeCmd, ["--print", executionPrompt], {
    cwd: repoPath,
    timeout: 120_000,
  });

  if (execResult.stdout.trim()) {
    try { await fs.writeFile(outputFilePath, execResult.stdout, "utf-8"); } catch { /* non-fatal */ }
  }

  const { output: postStatus } = await gitStatusShort(repoPath);
  const goalShort = packet.goal.replace(/['"]/g, "").slice(0, 60);
  const suggestedCommit = `feat: ${goalShort}`;
  const nl = isWindows ? "\r\n" : "\n";
  const manualCommitCommand = `${cdCommand}${nl}git diff --stat${nl}git add -p${nl}git commit -m "${suggestedCommit}"`;
  const failed = execResult.exitCode !== 0 || execResult.stdout.trim() === "";

  return NextResponse.json({
    action: "run",
    mode: "direct",
    status: failed ? "partial" : "completed",
    repoPath,
    stdout: execResult.stdout || null,
    stderr: execResult.stderr || null,
    exitCode: execResult.exitCode,
    gitStatus: postStatus,
    safetyWarnings: promptWarnings,
    suggestedCommit,
    manualCommitCommand,
    rollbackCommands: safety.rollbackCommands,
    packet: { id: packet.id, title: packet.title, approvalLevel: packet.approvalLevel, goal: packet.goal },
    note: failed
      ? `Auto-run returned no output.\nManual: ${displayCommand}\nPrompt at: ${promptFilePath}`
      : `Output saved to: ${outputFilePath}`,
  });
}
