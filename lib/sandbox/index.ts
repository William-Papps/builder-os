import fs from "fs";
import path from "path";

const SANDBOX_ROOT = path.join(process.cwd(), ".builder-os", "sandboxes");

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 80);
}

export function getSandboxPath(taskPacketId: string): string {
  const safe = sanitizeId(taskPacketId);
  return path.join(SANDBOX_ROOT, safe);
}

function assertInsideSandboxRoot(p: string): void {
  const resolved = path.resolve(p);
  const root = path.resolve(SANDBOX_ROOT);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Path escape detected: ${resolved}`);
  }
}

export function getSandboxStatus(taskPacketId: string): {
  exists: boolean;
  sandboxPath: string;
  hasTaskPacket: boolean;
} {
  const sandboxPath = getSandboxPath(taskPacketId);
  const exists = fs.existsSync(sandboxPath);
  const hasTaskPacket = exists && fs.existsSync(path.join(sandboxPath, "TASK_PACKET.md"));
  return { exists, sandboxPath, hasTaskPacket };
}

export function deleteSandbox(taskPacketId: string): void {
  const sandboxPath = getSandboxPath(taskPacketId);
  assertInsideSandboxRoot(sandboxPath);
  if (fs.existsSync(sandboxPath)) {
    fs.rmSync(sandboxPath, { recursive: true, force: true });
  }
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next"]);

export function createSandbox(
  taskPacketId: string,
  repoPath: string,
  taskPacketContent?: string
): {
  success: boolean;
  sandboxPath: string;
  copied: number;
  taskPacketMd: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const sandboxPath = getSandboxPath(taskPacketId);
  assertInsideSandboxRoot(sandboxPath);

  const absRepo = path.resolve(repoPath);

  // Validation
  if (!fs.existsSync(absRepo)) {
    return { success: false, sandboxPath, copied: 0, taskPacketMd: false, errors: [`Repo path does not exist: ${absRepo}`] };
  }

  const stat = fs.statSync(absRepo);
  if (!stat.isDirectory()) {
    return { success: false, sandboxPath, copied: 0, taskPacketMd: false, errors: [`Repo path is not a directory: ${absRepo}`] };
  }

  // Prevent sandbox-of-sandbox recursion
  const sandboxRootResolved = path.resolve(SANDBOX_ROOT);
  if (absRepo.startsWith(sandboxRootResolved)) {
    return { success: false, sandboxPath, copied: 0, taskPacketMd: false, errors: ["Cannot create sandbox from inside sandbox root"] };
  }

  // Require package.json or .git or tsconfig.json — must look like a project
  const hasMarker = [
    path.join(absRepo, "package.json"),
    path.join(absRepo, ".git"),
    path.join(absRepo, "tsconfig.json"),
  ].some((f) => fs.existsSync(f));

  if (!hasMarker) {
    return { success: false, sandboxPath, copied: 0, taskPacketMd: false, errors: ["Repo path does not look like a project (no package.json, .git, or tsconfig.json)"] };
  }

  if (fs.existsSync(sandboxPath)) {
    return { success: false, sandboxPath, copied: 0, taskPacketMd: false, errors: ["Sandbox already exists — delete it first before recreating"] };
  }

  fs.mkdirSync(sandboxPath, { recursive: true });

  let copied = 0;

  fs.cpSync(absRepo, sandboxPath, {
    recursive: true,
    filter: (src: string) => {
      const rel = path.relative(absRepo, src);
      if (!rel) return true;
      const top = rel.split(path.sep)[0];
      if (SKIP_DIRS.has(top)) return false;
      copied++;
      return true;
    },
  });

  let taskPacketMd = false;
  if (taskPacketContent) {
    try {
      fs.writeFileSync(path.join(sandboxPath, "TASK_PACKET.md"), taskPacketContent, "utf8");
      taskPacketMd = true;
    } catch (e) {
      errors.push(`Failed to write TASK_PACKET.md: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // RUN_CLAUDE.ps1 — one-click launcher for Windows PowerShell
  const runClaudePs1 = [
    "# Builder OS — Sandbox Execution Script",
    "# Run this to open Claude Code in the sandbox.",
    "# DO NOT run git commit or git push inside the sandbox.",
    "",
    `Set-Location "${sandboxPath}"`,
    "claude",
  ].join("\r\n");

  try {
    fs.writeFileSync(path.join(sandboxPath, "RUN_CLAUDE.ps1"), runClaudePs1, "utf8");
  } catch (e) {
    errors.push(`Failed to write RUN_CLAUDE.ps1: ${e instanceof Error ? e.message : String(e)}`);
  }

  // SANDBOX_SUMMARY_TEMPLATE.md — Claude fills this when done
  const summaryTemplate = [
    "# Sandbox Execution Summary",
    "",
    "## Files Changed",
    "<!-- List every file that was created, modified, or deleted -->",
    "",
    "## Architecture Decisions",
    "<!-- Describe any architectural choices Claude made and why -->",
    "",
    "## Build Result",
    "PASS / FAIL",
    "",
    "## Errors",
    "<!-- List any errors encountered during execution -->",
    "",
    "## Risks",
    "<!-- List any risks or concerns identified -->",
    "",
    "## Next Recommended Task",
    "<!-- What should be built next? -->",
  ].join("\n");

  try {
    fs.writeFileSync(path.join(sandboxPath, "SANDBOX_SUMMARY_TEMPLATE.md"), summaryTemplate, "utf8");
  } catch (e) {
    errors.push(`Failed to write SANDBOX_SUMMARY_TEMPLATE.md: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { success: true, sandboxPath, copied, taskPacketMd, errors };
}
