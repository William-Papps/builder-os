"use client";

import { useState } from "react";
import { TASK_PACKETS, LEVEL_LABEL, type TaskPacket } from "@/data/taskPackets";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

type Phase = "select" | "preview" | "running" | "result";
type ExecMode = "sandbox" | "direct" | "dry-run";

type GitSafety = {
  branch: string;
  statusOutput: string;
  isDirty: boolean;
  isMain: boolean;
  isSafe: boolean;
  warnings: string[];
  blockers: string[];
  suggestedBranch: string;
  rollbackCommands: string[];
};

type DryRunResult = {
  action: "dry-run";
  status: "ready";
  repoPath: string;
  promptFilePath: string;
  command: string;
  safetyWarnings: string[];
  risks: string[];
  note: string;
  git: GitSafety;
  packet: { id: string; title: string; approvalLevel: string; goal: string };
};

type BranchResult = {
  action: "create-branch";
  success: boolean;
  branchName?: string;
  error?: string;
};

type SandboxResult = {
  action?: string;
  success?: boolean;
  exists?: boolean;
  sandboxPath?: string;
  gitStatus?: string;
  diffStat?: string;
  note?: string;
  error?: string;
};

type RunResult = {
  action: "run";
  status: "completed" | "partial";
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  gitStatus: string;
  diffStat?: string;
  mergeSteps?: string;
  sandboxPath?: string;
  safetyWarnings: string[];
  suggestedCommit: string;
  manualCommitCommand: string;
  rollbackCommands: string[];
  outputFilePath: string | null;
  note: string;
  packet: { id: string; title: string; approvalLevel: string; goal: string };
};

type ApiError = { error: string; violations?: string[]; blockers?: string[] };

const APPROVED = TASK_PACKETS.filter((p) => p.status === "approved");

const RISK_STYLE: Record<string, { color: string; border: string; bg: string }> = {
  "read-only":       { color: "#4ade80", border: "#064e3b", bg: "rgba(6,78,59,0.15)" },
  "edit-approved":   { color: "#fbbf24", border: "#92400e", bg: "rgba(146,64,14,0.15)" },
  "commit-approved": { color: "#f87171", border: "#7f1d1d", bg: "rgba(127,29,29,0.2)" },
  "push-approved":   { color: "#e11d48", border: "#881337", bg: "rgba(136,19,55,0.25)" },
  "plan-only":       { color: "#6ee7b7", border: "#064e3b", bg: "rgba(6,78,59,0.1)" },
  "prompt-only":     { color: "#6ee7b7", border: "#064e3b", bg: "rgba(6,78,59,0.1)" },
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
      {children}
    </p>
  );
}

function Card({ border = "#1a1a1a", bg = "#080808", style, children }: {
  border?: string; bg?: string; style?: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${border}`, background: bg, padding: "14px 18px", ...style }}>
      {children}
    </div>
  );
}

function ModeCard({ mode, selected, onSelect, title, badge, desc, warning }: {
  mode: ExecMode; selected: boolean; onSelect: () => void;
  title: string; badge: string; desc: string; warning?: string;
}) {
  const styles: Record<ExecMode, { border: string; bg: string; badgeBg: string; badgeColor: string }> = {
    sandbox: { border: selected ? "#064e3b" : "#1a1a1a", bg: selected ? "rgba(6,78,59,0.15)" : "#080808", badgeBg: "rgba(6,78,59,0.2)", badgeColor: "#4ade80" },
    direct:  { border: selected ? "#92400e" : "#1a1a1a", bg: selected ? "rgba(146,64,14,0.1)" : "#080808", badgeBg: "rgba(146,64,14,0.2)", badgeColor: "#fbbf24" },
    "dry-run": { border: selected ? "#1e3a5f" : "#1a1a1a", bg: selected ? "rgba(30,58,95,0.1)" : "#080808", badgeBg: "rgba(30,58,95,0.2)", badgeColor: "#93c5fd" },
  };
  const c = styles[mode];
  return (
    <button
      onClick={onSelect}
      style={{ flex: 1, minWidth: 180, padding: "14px 16px", borderRadius: 10, cursor: "pointer", border: `1px solid ${c.border}`, background: c.bg, textAlign: "left" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: c.badgeBg, color: c.badgeColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {badge}
        </span>
        {selected && <span style={{ fontSize: 10, color: c.badgeColor }}>✓</span>}
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", margin: "0 0 4px" }}>{title}</p>
      <p style={{ fontSize: 12, color: "#666", margin: 0, lineHeight: 1.5 }}>{desc}</p>
      {warning && <p style={{ fontSize: 11, color: "#fbbf24", margin: "6px 0 0", lineHeight: 1.4 }}>⚠ {warning}</p>}
    </button>
  );
}

function GitSafetyPanel({ git, allowDirty, allowMain, onAllowDirty, onAllowMain, onCreateBranch, branchCreated, branchName, compact = false }: {
  git: GitSafety; allowDirty: boolean; allowMain: boolean;
  onAllowDirty: (v: boolean) => void; onAllowMain: (v: boolean) => void;
  onCreateBranch: () => void; branchCreated: boolean; branchName: string; compact?: boolean;
}) {
  const safeColor = git.isSafe ? "#4ade80" : "#f87171";
  const safeBorder = git.isSafe ? "#064e3b" : "#7f1d1d";
  const safeBg = git.isSafe ? "rgba(6,78,59,0.12)" : "rgba(127,29,29,0.12)";

  if (compact) {
    return (
      <div style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${safeBorder}`, background: safeBg }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: safeColor, margin: 0 }}>
          Branch: <code style={{ fontFamily: "monospace", fontWeight: 400 }}>{git.branch}</code>
          {" · "}{git.isDirty ? "Dirty working tree" : "Clean working tree"}
        </p>
        <p style={{ fontSize: 11, color: "#444", margin: "2px 0 0" }}>
          Sandbox runs in an isolated clone — real repo is not affected.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${safeBorder}`, background: safeBg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: safeColor, margin: 0 }}>
            {git.isSafe ? "✓ Safe to run" : "✕ Not safe to run"}
          </p>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: `1px solid ${safeBorder}`, color: safeColor, background: safeBg, textTransform: "uppercase" }}>
            {git.isSafe ? "clear" : "blocked"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Current Branch</p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: git.isMain ? "#f87171" : "#e5e5e5" }}>
            {git.branch}{git.isMain && <span style={{ fontSize: 11, color: "#f87171", marginLeft: 6 }}>⚠ main</span>}
          </p>
          <p style={{ fontSize: 11, color: "#444", margin: 0 }}>
            Suggested: <code style={{ fontFamily: "monospace", color: "#777" }}>{git.suggestedBranch}</code>
          </p>
        </Card>
        <Card border={git.isDirty ? "#92400e" : "#1a1a1a"} bg={git.isDirty ? "rgba(146,64,14,0.1)" : "#080808"}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Working Tree</p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: git.isDirty ? "#fbbf24" : "#4ade80" }}>
            {git.isDirty ? "Dirty" : "Clean"}
          </p>
          <p style={{ fontSize: 11, color: "#555", margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
            {git.statusOutput.slice(0, 80)}{git.statusOutput.length > 80 ? "…" : ""}
          </p>
        </Card>
      </div>

      {git.blockers.map((b) => (
        <div key={b} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.15)", fontSize: 12, color: "#f87171" }}>✕ {b}</div>
      ))}
      {git.warnings.map((w) => (
        <div key={w} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #92400e", background: "rgba(146,64,14,0.1)", fontSize: 12, color: "#fbbf24" }}>⚠ {w}</div>
      ))}

      {!branchCreated ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onCreateBranch}
            style={{ padding: "8px 18px", borderRadius: 8, cursor: "pointer", border: "1px solid #064e3b", background: "rgba(6,78,59,0.2)", fontSize: 13, fontWeight: 700, color: "#4ade80" }}
          >
            Create Task Branch →
          </button>
          <code style={{ fontSize: 12, color: "#444", fontFamily: "monospace" }}>{git.suggestedBranch}</code>
        </div>
      ) : (
        <div style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #064e3b", background: "rgba(6,78,59,0.15)", fontSize: 13, fontWeight: 700, color: "#4ade80" }}>
          ✓ On branch: <code style={{ fontFamily: "monospace", fontWeight: 400 }}>{branchName}</code>
        </div>
      )}

      {git.blockers.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#060606" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Override (use with caution)</p>
          {git.isMain && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginBottom: 6 }}>
              <input type="checkbox" checked={allowMain} onChange={(e) => onAllowMain(e.target.checked)} style={{ marginTop: 2, accentColor: "#f87171" }} />
              <span style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>I understand I am running on <strong>main</strong> — I accept the risk</span>
            </label>
          )}
          {git.isDirty && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={allowDirty} onChange={(e) => onAllowDirty(e.target.checked)} style={{ marginTop: 2, accentColor: "#f87171" }} />
              <span style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>I understand the working tree is <strong>dirty</strong> — I have reviewed uncommitted changes</span>
            </label>
          )}
        </div>
      )}

      <div>
        <p style={{ fontSize: 11, color: "#333", marginBottom: 6 }}>Rollback (if needed after execution):</p>
        <CopyPrompt text={git.rollbackCommands.join("\n")} />
      </div>
    </div>
  );
}

export default function ExecutePage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [execMode, setExecMode] = useState<ExecMode>("sandbox");
  const [selectedPacket, setSelectedPacket] = useState<TaskPacket | null>(APPROVED[0] ?? null);
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [allowDirty, setAllowDirty] = useState(false);
  const [allowMain, setAllowMain] = useState(false);
  const [branchCreated, setBranchCreated] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchError, setBranchError] = useState<string | null>(null);
  // Sandbox state
  const [sandboxPath, setSandboxPath] = useState<string | null>(null);
  const [sandboxExists, setSandboxExists] = useState(false);
  const [sandboxDiffStat, setSandboxDiffStat] = useState<string | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [sandboxDeleted, setSandboxDeleted] = useState(false);

  async function fetchSandboxStatus(taskPacketId: string) {
    setSandboxLoading(true);
    setSandboxError(null);
    const res = await fetch("/api/execute-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sandbox-status", taskPacketId }),
    });
    const data = await res.json() as SandboxResult;
    setSandboxLoading(false);
    if (!res.ok) { setSandboxError(data.error ?? "Status check failed"); return; }
    setSandboxExists(data.exists ?? false);
    setSandboxPath(data.sandboxPath ?? null);
    setSandboxDiffStat(data.diffStat ?? null);
  }

  async function handlePrepare() {
    if (!selectedPacket) return;
    setApiError(null);
    setPhase("preview");
    const res = await fetch("/api/execute-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "dry-run",
        taskPacketId: selectedPacket.id,
        projectId: selectedPacket.projectId,
        repoPath: selectedPacket.repoPath,
        executionPrompt: selectedPacket.executionPrompt,
        agentType: "claude-code",
      }),
    });
    const data = await res.json();
    if (!res.ok) { setApiError(data); setPhase("select"); return; }
    setDryRun(data as DryRunResult);
    setConfirmed(false);
    setBranchCreated(false);
    setBranchName("");
    setSandboxPath(null);
    setSandboxExists(false);
    setSandboxDiffStat(null);
    setSandboxError(null);
    setSandboxDeleted(false);
    if (execMode === "sandbox") {
      await fetchSandboxStatus(selectedPacket.id);
    }
  }

  async function handleCreateSandbox() {
    if (!selectedPacket) return;
    setSandboxLoading(true);
    setSandboxError(null);
    const res = await fetch("/api/execute-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-sandbox", taskPacketId: selectedPacket.id, repoPath: selectedPacket.repoPath }),
    });
    const data = await res.json() as SandboxResult;
    setSandboxLoading(false);
    if (!res.ok || !data.success) { setSandboxError(data.error ?? "Sandbox creation failed"); return; }
    setSandboxExists(true);
    setSandboxPath(data.sandboxPath ?? null);
    setSandboxDeleted(false);
  }

  async function handleDeleteSandbox() {
    if (!selectedPacket) return;
    setSandboxLoading(true);
    setSandboxError(null);
    const res = await fetch("/api/execute-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-sandbox", taskPacketId: selectedPacket.id }),
    });
    const data = await res.json();
    setSandboxLoading(false);
    if (!res.ok) { setSandboxError(data.error ?? "Deletion failed"); return; }
    setSandboxExists(false);
    setSandboxPath(null);
    setSandboxDiffStat(null);
    setSandboxDeleted(true);
  }

  async function handleCreateBranch() {
    if (!selectedPacket) return;
    setBranchError(null);
    const res = await fetch("/api/execute-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-branch", taskPacketId: selectedPacket.id, repoPath: selectedPacket.repoPath }),
    });
    const data = await res.json() as BranchResult & { error?: string };
    if (!res.ok || !data.success) { setBranchError(data.error ?? "Branch creation failed"); return; }
    setBranchCreated(true);
    setBranchName(data.branchName ?? "");
    await handlePrepare();
  }

  async function handleRun() {
    if (!selectedPacket || !confirmed) return;
    setApiError(null);
    setPhase("running");
    const res = await fetch("/api/execute-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "run",
        mode: execMode,
        taskPacketId: selectedPacket.id,
        projectId: selectedPacket.projectId,
        repoPath: selectedPacket.repoPath,
        executionPrompt: selectedPacket.executionPrompt,
        agentType: "claude-code",
        allowDirty,
        allowMain,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setApiError(data); setPhase("preview"); return; }
    setRunResult(data as RunResult);
    setPhase("result");
  }

  function reset() {
    setPhase("select");
    setDryRun(null);
    setRunResult(null);
    setApiError(null);
    setConfirmed(false);
    setShowFullPrompt(false);
    setAllowDirty(false);
    setAllowMain(false);
    setBranchCreated(false);
    setBranchName("");
    setBranchError(null);
    setSandboxPath(null);
    setSandboxExists(false);
    setSandboxDiffStat(null);
    setSandboxError(null);
    setSandboxLoading(false);
    setSandboxDeleted(false);
  }

  const risk = selectedPacket ? (RISK_STYLE[selectedPacket.approvalLevel] ?? RISK_STYLE["read-only"]) : null;

  return (
    <main>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 24px 80px" }}>

        <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Builder OS — Automation
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginTop: 10, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Execute Task
        </h1>
        <p style={{ marginTop: 12, color: "#737373", fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
          Run an approved task packet. Sandbox mode is the default — agents work in an isolated clone, not your real repo.
        </p>

        <div style={{ marginTop: 20, padding: "10px 16px", borderRadius: 8, border: "1px solid #7c2d12", background: "rgba(124,45,18,0.15)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#fb923c", margin: "0 0 2px" }}>⚠ Execution rules</p>
          <p style={{ fontSize: 12, color: "#9a4220", margin: 0 }}>
            Only approved packets run · Sandbox default · No auto-commit · No auto-push · No automatic scope expansion
          </p>
        </div>

        {/* Phase strip */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 0 }}>
          {(["select", "preview", "running", "result"] as Phase[]).map((p, i, arr) => {
            const labels: Record<Phase, string> = { select: "Select", preview: "Preview", running: "Running", result: "Result" };
            const active = p === phase;
            const done = arr.indexOf(phase) > i;
            return (
              <span key={p} style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: active ? 700 : 400, border: active ? "1px solid #4c1d95" : done ? "1px solid #064e3b" : "1px solid #1a1a1a", background: active ? "rgba(76,29,149,0.25)" : done ? "rgba(6,78,59,0.12)" : "#0a0a0a", color: active ? "#c4b5fd" : done ? "#4ade80" : "#333" }}>
                  {done && !active && <span style={{ marginRight: 3, fontSize: 10 }}>✓</span>}
                  {labels[p]}
                </span>
                {i < arr.length - 1 && <span style={{ fontSize: 12, color: "#222", margin: "0 4px" }}>→</span>}
              </span>
            );
          })}
        </div>

        {/* API Error */}
        {apiError && (
          <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 8, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.2)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", margin: "0 0 4px" }}>Error</p>
            <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 6px" }}>{apiError.error}</p>
            {apiError.violations?.map((v) => <p key={v} style={{ fontSize: 12, color: "#dc2626", margin: "2px 0" }}>· {v}</p>)}
            {apiError.blockers?.map((b) => <p key={b} style={{ fontSize: 12, color: "#dc2626", margin: "2px 0" }}>· {b}</p>)}
          </div>
        )}

        {/* ── SELECT ────────────────────────────────────── */}
        {phase === "select" && (
          <div style={{ marginTop: 40 }}>

            <div style={{ marginBottom: 36 }}>
              <Label>Execution Mode</Label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ModeCard
                  mode="sandbox"
                  selected={execMode === "sandbox"}
                  onSelect={() => setExecMode("sandbox")}
                  title="Sandbox Mode"
                  badge="Default · Safe"
                  desc="Clones the repo into an isolated sandbox. Agent works on the clone. You manually apply changes you approve."
                />
                <ModeCard
                  mode="direct"
                  selected={execMode === "direct"}
                  onSelect={() => setExecMode("direct")}
                  title="Direct Repo Mode"
                  badge="Advanced"
                  desc="Agent edits the real repo on a task branch. Use only after sandbox validation."
                  warning="Edits real repo — requires branch creation and safety review."
                />
                <ModeCard
                  mode="dry-run"
                  selected={execMode === "dry-run"}
                  onSelect={() => setExecMode("dry-run")}
                  title="Dry Run"
                  badge="Preview Only"
                  desc="Shows the safety check, command, and prompt. No agent runs. No files changed."
                />
              </div>
            </div>

            <Label>Select Approved Packet</Label>
            {APPROVED.length === 0 ? (
              <Card>
                <p style={{ fontSize: 13, color: "#555" }}>
                  No approved packets. Go to{" "}
                  <a href="/task-packets" style={{ color: "#93c5fd", textDecoration: "none" }}>/task-packets</a>{" "}
                  and set a packet status to &quot;approved&quot;.
                </p>
              </Card>
            ) : (
              <>
                <select
                  value={selectedPacket?.id ?? ""}
                  onChange={(e) => setSelectedPacket(APPROVED.find((x) => x.id === e.target.value) ?? null)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, marginBottom: 14, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#e5e5e5", fontSize: 14, cursor: "pointer" }}
                >
                  {APPROVED.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>

                {selectedPacket && risk && (
                  <Card border={risk.border} bg={risk.bg} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", margin: "0 0 4px" }}>{selectedPacket.title}</p>
                        <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px", fontFamily: "monospace" }}>{selectedPacket.id}</p>
                        <p style={{ fontSize: 12, color: "#888", margin: 0, lineHeight: 1.5 }}>{selectedPacket.goal}</p>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: `1px solid ${risk.border}`, color: risk.color, background: risk.bg }}>
                        {LEVEL_LABEL[selectedPacket.approvalLevel as keyof typeof LEVEL_LABEL]}
                      </span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <code style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>{selectedPacket.repoPath}</code>
                    </div>
                  </Card>
                )}

                <button
                  onClick={handlePrepare}
                  disabled={!selectedPacket}
                  style={{ padding: "10px 22px", borderRadius: 10, cursor: selectedPacket ? "pointer" : "not-allowed", border: "1px solid #4c1d95", background: "rgba(76,29,149,0.25)", fontSize: 13, fontWeight: 700, color: "#c4b5fd", opacity: selectedPacket ? 1 : 0.4 }}
                >
                  {execMode === "sandbox" ? "Prepare — Set Up Sandbox →" : execMode === "direct" ? "Prepare — Safety Check →" : "Prepare — Preview →"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── PREVIEW (loading) ─────────────────────────── */}
        {phase === "preview" && !dryRun && (
          <div style={{ marginTop: 48 }}>
            <Card>
              <p style={{ fontSize: 13, color: "#a78bfa", margin: 0 }}>Running safety check…</p>
            </Card>
          </div>
        )}

        {/* ── PREVIEW (ready) ───────────────────────────── */}
        {phase === "preview" && dryRun && (
          <div style={{ marginTop: 40 }}>
            <button
              onClick={() => { setPhase("select"); setDryRun(null); }}
              style={{ fontSize: 12, color: "#555", background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: 0 }}
            >
              ← Change packet
            </button>

            {/* Mode badge */}
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em",
                ...(execMode === "sandbox"
                  ? { background: "rgba(6,78,59,0.2)", color: "#4ade80", border: "1px solid #064e3b" }
                  : execMode === "direct"
                  ? { background: "rgba(146,64,14,0.2)", color: "#fbbf24", border: "1px solid #92400e" }
                  : { background: "rgba(30,58,95,0.15)", color: "#93c5fd", border: "1px solid #1e3a5f" }),
              }}>
                {execMode === "sandbox" ? "Sandbox Mode" : execMode === "direct" ? "Direct Repo Mode" : "Dry Run"}
              </span>
              <span style={{ fontSize: 12, color: "#444" }}>{selectedPacket?.title}</span>
            </div>

            {/* ── SANDBOX PREVIEW ── */}
            {execMode === "sandbox" && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <Label>1 — Repo Status</Label>
                  <GitSafetyPanel
                    git={dryRun.git}
                    allowDirty={false} allowMain={false}
                    onAllowDirty={() => {}} onAllowMain={() => {}}
                    onCreateBranch={() => {}} branchCreated={false} branchName=""
                    compact
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <Label>2 — Sandbox</Label>
                  {sandboxError && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>Error: {sandboxError}</p>}
                  {sandboxExists && sandboxPath ? (
                    <Card border="#064e3b" bg="rgba(6,78,59,0.12)" style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: "0 0 4px" }}>✓ Sandbox ready</p>
                      <code style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>{sandboxPath}</code>
                      {sandboxDiffStat && (
                        <pre style={{ marginTop: 8, fontSize: 11, color: "#777", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{sandboxDiffStat}</pre>
                      )}
                    </Card>
                  ) : (
                    <Card style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 13, color: "#666", margin: "0 0 6px" }}>No sandbox for this packet yet.</p>
                      <p style={{ fontSize: 11, color: "#444", margin: 0, lineHeight: 1.5 }}>
                        Will clone: <code style={{ fontFamily: "monospace" }}>{selectedPacket?.repoPath}</code>
                        {" → "}<code style={{ fontFamily: "monospace" }}>.builder-os/sandboxes/{selectedPacket?.id}/</code>
                      </p>
                    </Card>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    {!sandboxExists ? (
                      <button
                        onClick={handleCreateSandbox}
                        disabled={sandboxLoading}
                        style={{ padding: "8px 18px", borderRadius: 8, cursor: sandboxLoading ? "wait" : "pointer", border: "1px solid #064e3b", background: "rgba(6,78,59,0.2)", fontSize: 13, fontWeight: 700, color: "#4ade80", opacity: sandboxLoading ? 0.6 : 1 }}
                      >
                        {sandboxLoading ? "Creating…" : "Create Sandbox →"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => selectedPacket && fetchSandboxStatus(selectedPacket.id)}
                          disabled={sandboxLoading}
                          style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", border: "1px solid #1a1a1a", background: "#0a0a0a", fontSize: 12, color: "#666" }}
                        >
                          Refresh
                        </button>
                        <button
                          onClick={handleDeleteSandbox}
                          disabled={sandboxLoading}
                          style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.15)", fontSize: 12, color: "#f87171" }}
                        >
                          Delete sandbox
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <Label>3 — Execution Prompt</Label>
                  <div style={{ borderRadius: 10, border: "1px solid #1a1a1a", background: "#060606", overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px", borderBottom: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#a3a3a3", margin: 0 }}>Prompt (will be modified for sandbox path)</p>
                      <button onClick={() => setShowFullPrompt(!showFullPrompt)} style={{ fontSize: 11, color: "#555", background: "none", border: "none", cursor: "pointer" }}>
                        {showFullPrompt ? "Collapse" : "Expand"}
                      </button>
                    </div>
                    <pre style={{ padding: "12px 14px", margin: 0, fontSize: 11, color: "#666", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: showFullPrompt ? "none" : "100px", overflow: showFullPrompt ? "visible" : "hidden" }}>
                      {selectedPacket?.executionPrompt}
                    </pre>
                  </div>
                </div>

                <div>
                  <Label>4 — Confirm &amp; Run in Sandbox</Label>
                  {!sandboxExists && (
                    <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#060606" }}>
                      <p style={{ fontSize: 13, color: "#555", margin: 0 }}>Create a sandbox above before running.</p>
                    </div>
                  )}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 8, marginBottom: 16, border: confirmed ? "1px solid #064e3b" : "1px solid #1a1a1a", background: confirmed ? "rgba(6,78,59,0.1)" : "#070707" }}>
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: "#4ade80" }} />
                    <span style={{ fontSize: 13, color: confirmed ? "#4ade80" : "#555", lineHeight: 1.5 }}>
                      I have reviewed the prompt. Agent will run inside the sandbox — real repo is NOT affected.
                    </span>
                  </label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Manual command (run inside sandbox):</p>
                      <CopyPrompt text={`cd "${sandboxPath ?? `.builder-os/sandboxes/${selectedPacket?.id}`}"\n${dryRun.command}`} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <p style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Or auto-run in sandbox:</p>
                      <button
                        onClick={handleRun}
                        disabled={!confirmed || !sandboxExists}
                        style={{ padding: "10px 20px", borderRadius: 10, cursor: (confirmed && sandboxExists) ? "pointer" : "not-allowed", border: "1px solid #064e3b", background: (confirmed && sandboxExists) ? "rgba(6,78,59,0.3)" : "#0a0a0a", fontSize: 13, fontWeight: 700, color: (confirmed && sandboxExists) ? "#4ade80" : "#2d2d2d" }}
                      >
                        Run in Sandbox →
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── DIRECT PREVIEW ── */}
            {execMode === "direct" && (
              <>
                <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 8, border: "1px solid #92400e", background: "rgba(146,64,14,0.15)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", margin: "0 0 4px" }}>⚠ Direct Repo Mode — agent will edit the real repo</p>
                  <p style={{ fontSize: 12, color: "#9a4220", margin: 0 }}>Consider Sandbox Mode first to validate changes safely.</p>
                </div>

                <div style={{ marginBottom: 36 }}>
                  <Label>1 — Repo Safety</Label>
                  <GitSafetyPanel
                    git={dryRun.git} allowDirty={allowDirty} allowMain={allowMain}
                    onAllowDirty={setAllowDirty} onAllowMain={setAllowMain}
                    onCreateBranch={handleCreateBranch} branchCreated={branchCreated} branchName={branchName}
                  />
                  {branchError && <p style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>Branch error: {branchError}</p>}
                </div>

                <div style={{ marginBottom: 36 }}>
                  <Label>2 — Execution Preview</Label>
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>Command:</p>
                    <CopyPrompt text={dryRun.command} />
                  </div>
                  <div style={{ borderRadius: 10, border: "1px solid #1a1a1a", background: "#060606", overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ padding: "8px 14px", borderBottom: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#a3a3a3", margin: 0 }}>Execution prompt</p>
                      <button onClick={() => setShowFullPrompt(!showFullPrompt)} style={{ fontSize: 11, color: "#555", background: "none", border: "none", cursor: "pointer" }}>
                        {showFullPrompt ? "Collapse" : "Expand"}
                      </button>
                    </div>
                    <pre style={{ padding: "12px 14px", margin: 0, fontSize: 11, color: "#666", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: showFullPrompt ? "none" : "100px", overflow: showFullPrompt ? "visible" : "hidden" }}>
                      {selectedPacket?.executionPrompt}
                    </pre>
                  </div>
                  {dryRun.risks.map((r) => (
                    <div key={r} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #1a1a1a", background: "#070707", fontSize: 12, color: "#666", marginBottom: 4 }}>{r}</div>
                  ))}
                  {dryRun.safetyWarnings.map((w) => (
                    <div key={w} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #92400e", background: "rgba(146,64,14,0.1)", fontSize: 12, color: "#fbbf24", marginTop: 4 }}>⚠ {w}</div>
                  ))}
                </div>

                <div>
                  <Label>3 — Confirm &amp; Run</Label>
                  {!dryRun.git.isSafe && dryRun.git.blockers.length > 0 &&
                   !(dryRun.git.isMain && allowMain) && !(dryRun.git.isDirty && allowDirty) && (
                    <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.12)" }}>
                      <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>Resolve safety blockers above before running.</p>
                    </div>
                  )}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 8, marginBottom: 16, border: confirmed ? "1px solid #4c1d95" : "1px solid #1a1a1a", background: confirmed ? "rgba(76,29,149,0.1)" : "#070707" }}>
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: "#a78bfa" }} />
                    <span style={{ fontSize: 13, color: confirmed ? "#c4b5fd" : "#555", lineHeight: 1.5 }}>
                      I have reviewed the prompt, branch, and risks. <strong>claude --print</strong> will run in{" "}
                      <code style={{ fontFamily: "monospace", fontSize: 11 }}>{dryRun.repoPath}</code>.
                      I will review all changes before any manual commit.
                    </span>
                  </label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <p style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Recommended — run manually:</p>
                      <CopyPrompt text={`${dryRun.command}\n# Prompt at: ${dryRun.promptFilePath}`} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <p style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Or auto-run:</p>
                      <button
                        onClick={handleRun}
                        disabled={!confirmed}
                        style={{ padding: "10px 20px", borderRadius: 10, cursor: confirmed ? "pointer" : "not-allowed", border: "1px solid #4c1d95", background: confirmed ? "rgba(76,29,149,0.3)" : "#0a0a0a", fontSize: 13, fontWeight: 700, color: confirmed ? "#c4b5fd" : "#2d2d2d" }}
                      >
                        Auto-Run →
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── DRY RUN PREVIEW ── */}
            {execMode === "dry-run" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <Label>Safety Check (read-only)</Label>
                  <GitSafetyPanel
                    git={dryRun.git} allowDirty={false} allowMain={false}
                    onAllowDirty={() => {}} onAllowMain={() => {}}
                    onCreateBranch={() => {}} branchCreated={false} branchName=""
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <Label>Command (reference — not run)</Label>
                  <CopyPrompt text={dryRun.command} />
                  <p style={{ fontSize: 11, color: "#444", marginTop: 6 }}>
                    Prompt file: <code style={{ fontFamily: "monospace" }}>{dryRun.promptFilePath}</code>
                  </p>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <Label>Execution Prompt</Label>
                  <div style={{ borderRadius: 10, border: "1px solid #1a1a1a", background: "#060606", overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px", borderBottom: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#a3a3a3", margin: 0 }}>Execution prompt</p>
                      <button onClick={() => setShowFullPrompt(!showFullPrompt)} style={{ fontSize: 11, color: "#555", background: "none", border: "none", cursor: "pointer" }}>
                        {showFullPrompt ? "Collapse" : "Expand"}
                      </button>
                    </div>
                    <pre style={{ padding: "12px 14px", margin: 0, fontSize: 11, color: "#666", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: showFullPrompt ? "none" : "100px", overflow: showFullPrompt ? "visible" : "hidden" }}>
                      {selectedPacket?.executionPrompt}
                    </pre>
                  </div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #1e3a5f", background: "rgba(30,58,95,0.12)", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#93c5fd", margin: 0 }}>
                    Dry run complete — no files changed. Switch to Sandbox or Direct mode to execute.
                  </p>
                </div>
                <button
                  onClick={() => setPhase("select")}
                  style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "1px solid #1a1a1a", background: "#080808", fontSize: 12, color: "#555" }}
                >
                  ← Back to Mode Selection
                </button>
              </>
            )}
          </div>
        )}

        {/* ── RUNNING ───────────────────────────────────── */}
        {phase === "running" && (
          <div style={{ marginTop: 48 }}>
            <Label>Running…</Label>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #a78bfa", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 13, color: "#a78bfa", margin: 0 }}>
                  Running <code style={{ fontFamily: "monospace" }}>claude --print</code>{" "}
                  {execMode === "sandbox"
                    ? `in sandbox (.builder-os/sandboxes/${selectedPacket?.id}/)…`
                    : `in ${selectedPacket?.repoPath}…`}
                </p>
              </div>
              <p style={{ fontSize: 12, color: "#444", marginTop: 8, lineHeight: 1.6 }}>
                Timeout: 2 minutes. Real repo is {execMode === "sandbox" ? "NOT affected." : "being edited on task branch."}{" "}
                The manual command always works if this fails.
              </p>
            </Card>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────── */}
        {phase === "result" && runResult && (
          <div style={{ marginTop: 48 }}>

            <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 8, border: runResult.status === "completed" ? "1px solid #064e3b" : "1px solid #7c2d12", background: runResult.status === "completed" ? "rgba(6,78,59,0.15)" : "rgba(124,45,18,0.15)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", color: runResult.status === "completed" ? "#4ade80" : "#fb923c" }}>
                {runResult.status === "completed" ? "✓ Execution completed" : "⚠ Partial or failed"}
                {execMode === "sandbox" && " — sandbox only, real repo untouched"}
              </p>
              <p style={{ fontSize: 12, color: "#555", margin: 0, lineHeight: 1.6 }}>{runResult.note}</p>
            </div>

            {runResult.stdout && (
              <div style={{ marginBottom: 24 }}>
                <Label>Output (stdout)</Label>
                <pre style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#060606", fontSize: 12, color: "#a3a3a3", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 400, overflowY: "auto" }}>
                  {runResult.stdout}
                </pre>
              </div>
            )}

            {runResult.stderr && (
              <div style={{ marginBottom: 24 }}>
                <Label>Error log</Label>
                <pre style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.12)", fontSize: 12, color: "#f87171", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>
                  {runResult.stderr}
                </pre>
              </div>
            )}

            {/* Sandbox results */}
            {execMode === "sandbox" && (
              <>
                {runResult.diffStat && (
                  <div style={{ marginBottom: 24 }}>
                    <Label>Changed files in sandbox (git diff --stat)</Label>
                    <pre style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid #064e3b", background: "rgba(6,78,59,0.08)", fontSize: 12, color: "#4ade80", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {runResult.diffStat}
                    </pre>
                  </div>
                )}
                {runResult.mergeSteps && (
                  <div style={{ marginBottom: 24 }}>
                    <Label>Apply sandbox changes to real repo</Label>
                    <p style={{ fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 1.6 }}>
                      Review the diff above, then run these commands to apply changes to the real repo:
                    </p>
                    <CopyPrompt text={runResult.mergeSteps} />
                  </div>
                )}
                <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 10, border: "1px solid #1a1a1a", background: "#070707" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", margin: "0 0 8px" }}>Sandbox cleanup</p>
                  <p style={{ fontSize: 12, color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>
                    Keep the sandbox to inspect manually, or delete once changes are applied.
                  </p>
                  {sandboxDeleted ? (
                    <p style={{ fontSize: 13, color: "#4ade80", margin: 0 }}>✓ Sandbox deleted</p>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={handleDeleteSandbox}
                        disabled={sandboxLoading}
                        style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.15)", fontSize: 12, fontWeight: 600, color: "#f87171" }}
                      >
                        {sandboxLoading ? "Deleting…" : "Delete Sandbox"}
                      </button>
                      <span style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#0a0a0a", fontSize: 12, color: "#444" }}>
                        Keep (inspect at {runResult.sandboxPath ?? ".builder-os/sandboxes/"})
                      </span>
                    </div>
                  )}
                  {sandboxError && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{sandboxError}</p>}
                </div>
              </>
            )}

            {/* Direct mode results */}
            {execMode === "direct" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <Label>Changed files (git status)</Label>
                  <pre style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#060606", fontSize: 12, color: "#a3a3a3", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {runResult.gitStatus}
                  </pre>
                </div>
                <div style={{ marginBottom: 24, padding: "16px 18px", borderRadius: 10, border: "1px solid #1a1a1a", background: "#070707" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", margin: "0 0 4px" }}>Do NOT commit automatically</p>
                  <p style={{ fontSize: 12, color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>
                    Review every change with <code style={{ fontFamily: "monospace" }}>git diff</code> before staging:
                  </p>
                  <CopyPrompt text={runResult.manualCommitCommand} />
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 11, color: "#444", margin: "0 0 4px" }}>Suggested message:</p>
                    <CopyPrompt text={runResult.suggestedCommit} />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <Label>Rollback</Label>
                  <CopyPrompt text={runResult.rollbackCommands.join("\n")} />
                </div>
              </>
            )}

            <div style={{ marginBottom: 24 }}>
              <Label>Next Steps</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { href: "/execution-result-template", label: "Record result", desc: "Fill in execution-result-template" },
                  { href: "/sessions",                  label: "Add session",   desc: "Add entry to data/sessions.ts" },
                  { href: "/memory",                    label: "Update memory", desc: "Update memory files if needed" },
                ].map((link) => (
                  <a key={link.href} href={link.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#070707", textDecoration: "none" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#a3a3a3" }}>→ {link.label}</span>
                    <span style={{ fontSize: 12, color: "#444" }}>{link.desc}</span>
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={reset}
              style={{ padding: "10px 22px", borderRadius: 10, cursor: "pointer", border: "1px solid #1a1a1a", background: "#080808", fontSize: 13, fontWeight: 600, color: "#555" }}
            >
              ← Start Over
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, borderTop: "1px solid #141414", paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { href: "/task-packets",              label: "← Task Packets" },
            { href: "/execution",                 label: "Export Prompts" },
            { href: "/execution-result-template", label: "Result Template" },
            { href: "/sessions",                  label: "Sessions" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", color: "#555", textDecoration: "none" }}>
              {link.label}
            </a>
          ))}
        </div>

      </div>
    </main>
  );
}
