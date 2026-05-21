import { TASK_PACKETS, LEVEL_LABEL } from "@/data/taskPackets";
import { SDLC_PROMPTS } from "@/data/sdlcPrompts";
import { TaskPacketViewer } from "@/app/_components/TaskPacketViewer";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

// Pick the first approved packet as the "ready to execute" example
const readyPacket = TASK_PACKETS.find((p) => p.status === "approved") ?? TASK_PACKETS[0];

const RISK_BY_LEVEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "plan-only":       { label: "Minimal — no files touched",    color: "#4ade80", bg: "rgba(6,78,59,0.15)",   border: "#064e3b" },
  "prompt-only":     { label: "Minimal — no files touched",    color: "#4ade80", bg: "rgba(6,78,59,0.15)",   border: "#064e3b" },
  "read-only":       { label: "Low — reads only, no edits",    color: "#60a5fa", bg: "rgba(30,58,138,0.15)", border: "#1e3a8a" },
  "edit-approved":   { label: "Medium — file edits, no commit",color: "#fb923c", bg: "rgba(124,45,18,0.15)", border: "#7c2d12" },
  "commit-approved": { label: "High — commits to repo",        color: "#f87171", bg: "rgba(127,29,29,0.2)",  border: "#7f1d1d" },
  "push-approved":   { label: "Critical — pushes to remote",   color: "#e11d48", bg: "rgba(136,19,55,0.25)", border: "#881337" },
};

const executionPrompts = SDLC_PROMPTS.filter((p) =>
  p.id === "prepare-claude-execution-packet" || p.id === "review-execution-result"
);

// ─── Export prompt builders ───────────────────────────────────────────────────

import type { TaskPacket } from "@/data/taskPackets";

function buildClaudePrompt(p: TaskPacket): string {
  return `You are executing an approved Builder OS task packet inside Claude Code.

PROJECT: ${p.projectId}
REPO: ${p.repoPath}
TASK: ${p.title}
APPROVAL LEVEL: ${p.approvalLevel}

BEFORE EDITING:
1. Read the scope below and list every file you plan to change and why.
2. Do NOT make any edits yet. Wait for me to type "proceed".

SCOPE:
${p.scope}

GOAL:
${p.goal}

ALLOWED ACTIONS:
${p.allowedActions.map((a) => `- ${a}`).join("\n")}

FORBIDDEN ACTIONS:
${p.forbiddenActions.map((f) => `- ${f}`).join("\n")}
- Do not push or deploy automatically
- Do not expand scope beyond what is listed above

EXPECTED OUTPUT:
${p.expectedOutput}

AFTER EDITING:
1. Run the build command for this project.
2. If build fails: fix ONLY the build error, nothing else.
3. Return this summary:

Changed files:
- [path] — [what changed and why]

Build result: PASS / FAIL — [output if failed]
Out of scope (noted, not implemented): [list]
Ready for review: YES / NO

ROLLBACK PLAN:
${p.rollbackPlan}`;
}

function buildRufloPrompt(p: TaskPacket): string {
  return `# Builder OS — Ruflo Task Execution

task_id: ${p.id}
project: ${p.projectId}
repo: ${p.repoPath}
approval_level: ${p.approvalLevel}

## Task
${p.goal}

## Scope
${p.scope}

## Pre-execution
Before any file changes:
1. List all files you will modify and why
2. Wait for explicit confirmation before proceeding

## Allowed
${p.allowedActions.map((a) => `- ${a}`).join("\n")}

## Forbidden
${p.forbiddenActions.map((f) => `- ${f}`).join("\n")}
- No automatic git commit or push
- No scope expansion

## After execution
Run build. Store result in Ruflo memory.

Return:
task_id: ${p.id}
status: complete | partial | failed
changed:
  - path: description
build: pass | fail
notes: [out of scope]

## Rollback
${p.rollbackPlan}`;
}

const POST_EXECUTION_PROMPT = `You are reviewing an agent execution result in Builder OS.

PASTE THE AGENT'S SUMMARY BELOW:
[PASTE CHANGED FILES + BUILD RESULT HERE]

REVIEW:

1. SCOPE CHECK
   Did the agent stay within the defined scope?
   Files changed: [list]
   Any files outside scope? YES / NO

2. CHANGED FILES SUMMARY
   For each file changed:
   - [path] — [what changed] — Risk: LOW / MEDIUM / HIGH

3. BUILD RESULT
   Build: PASS / FAIL
   TypeScript errors: NONE / [list]

4. COMMIT SAFETY
   Is it safe to commit?
   YES / NO — Reason: [specific]

   If YES — recommended commit message:
   "[type]: [what changed] — [why]"

   If NO — what must be fixed:
   - [issue]

5. MEMORY UPDATE NEEDED?
   YES / NO — [which files, what to update]

6. TASK UPDATE NEEDED?
   YES / NO — [packet status change]

7. SAFETY FLAGS
   - Data exposure risk: NONE / [detail]
   - Breaking change: NONE / [detail]
   - Rollback needed: NO / YES — [command]

8. RECOMMENDED NEXT ACTION
   → [commit / fix build / rollback / create follow-up packet]`;

// ─── ExportBlock sub-component ────────────────────────────────────────────────

function ExportBlock({
  step, label, desc, color, border, bg, children,
}: {
  step: string;
  label: string;
  desc: string;
  color: string;
  border: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${border}`, background: bg, overflow: "hidden" }}>
      <div style={{
        padding: "10px 16px", borderBottom: `1px solid ${border}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color, background: `${color}18`,
          border: `1px solid ${border}`,
        }}>
          {step}
        </span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color, margin: 0 }}>{label}</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{desc}</p>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  );
}

const FLOW_STEPS = [
  { label: "Planner Chat",    href: "/planner-chat",   done: true,  current: false },
  { label: "Task Packet",     href: "/task-packets",   done: true,  current: false },
  { label: "Export",          href: "/execution",      done: false, current: true  },
  { label: "Sandbox Run",     href: "/execute",        done: false, current: false },
  { label: "Review Diff",     href: "/sandbox-review", done: false, current: false },
  { label: "Apply Patch",     href: "/sandbox-review", done: false, current: false },
  { label: "Commit",          href: "/sandbox-review", done: false, current: false },
];

export default function ExecutionPage() {
  const risk = RISK_BY_LEVEL[readyPacket.approvalLevel];

  return (
    <main>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* ── Header ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Builder OS — Execution Bridge
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginTop: 10, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Execution
        </h1>
        <p style={{ marginTop: 12, color: "#737373", fontSize: 15, lineHeight: 1.7, maxWidth: 580 }}>
          Export approved packets for agent execution. The full workflow:
          Task Packet → Export → Sandbox Run → Review Diff → Apply Patch → Build/Test → Commit manually.
          No agent runs without an approved packet. No commit without human review.
        </p>

        {/* ── Flow strip ── */}
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0 }}>
          {FLOW_STEPS.map((step, i) => (
            <span key={step.label} style={{ display: "flex", alignItems: "center" }}>
              <a href={step.href} style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 20, textDecoration: "none",
                fontWeight: step.current ? 700 : 400,
                border: step.current
                  ? "1px solid #4c1d95"
                  : step.done
                  ? "1px solid #064e3b"
                  : "1px solid #1a1a1a",
                background: step.current
                  ? "rgba(76,29,149,0.25)"
                  : step.done
                  ? "rgba(6,78,59,0.15)"
                  : "#0a0a0a",
                color: step.current
                  ? "#c4b5fd"
                  : step.done
                  ? "#4ade80"
                  : "#333",
              }}>
                {step.done && !step.current && <span style={{ marginRight: 4, fontSize: 10 }}>✓</span>}
                {step.label}
              </a>
              {i < FLOW_STEPS.length - 1 && (
                <span style={{ fontSize: 12, color: "#222", margin: "0 4px" }}>→</span>
              )}
            </span>
          ))}
        </div>

        {/* ─────────────────────────────────── */}
        {/* SECTION 1 — Execution Ready        */}
        {/* ─────────────────────────────────── */}
        <div style={{ marginTop: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
            Execution Ready
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>

            {/* Selected repo */}
            <div style={{ borderRadius: 10, border: "1px solid #1a1a1a", background: "#0a0a0a", padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Selected Repo
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5", margin: "0 0 4px" }}>{readyPacket.projectId}</p>
              <code style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>{readyPacket.repoPath}</code>
            </div>

            {/* Approval level */}
            <div style={{ borderRadius: 10, border: "1px solid #1a1a1a", background: "#0a0a0a", padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Approval Level
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", margin: "0 0 4px" }}>
                {LEVEL_LABEL[readyPacket.approvalLevel]}
              </p>
              <p style={{ fontSize: 11, color: "#555", margin: 0 }}>Agent may edit files. No commit or push.</p>
            </div>

            {/* Risk */}
            <div style={{
              borderRadius: 10, border: `1px solid ${risk.border}`,
              background: risk.bg, padding: "14px 18px",
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: risk.color, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Estimated Risk
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: risk.color, margin: "0 0 4px" }}>
                {risk.label.split("—")[0].trim()}
              </p>
              <p style={{ fontSize: 11, color: risk.color, opacity: 0.6, margin: 0 }}>
                {risk.label.split("—")[1]?.trim()}
              </p>
            </div>

            {/* Execution status */}
            <div style={{ borderRadius: 10, border: "1px solid #064e3b", background: "rgba(6,78,59,0.12)", padding: "14px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Execution Status
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", margin: "0 0 4px" }}>
                Ready for manual dispatch
              </p>
              <p style={{ fontSize: 11, color: "#2d6a4f", margin: 0 }}>
                Copy prompt below → paste into Claude Code or Ruflo
              </p>
            </div>

          </div>

          {/* Recommended agents */}
          <div style={{ borderRadius: 10, border: "1px solid #1a1a1a", background: "#0a0a0a", padding: "14px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Recommended Agent / Model
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { agent: "Claude Code", model: "claude-sonnet-4-6", color: "#4ade80", border: "#064e3b", bg: "rgba(6,78,59,0.2)", note: "Best for file editing, TypeScript, build verification" },
                { agent: "Ruflo",       model: "claude-sonnet-4-6", color: "#a78bfa", border: "#4c1d95", bg: "rgba(76,29,149,0.15)", note: "Best for multi-step tasks with memory" },
                { agent: "Codex",       model: "gpt-4o",            color: "#60a5fa", border: "#1e3a8a", bg: "rgba(30,58,138,0.15)", note: "Best for parallel headless execution" },
              ].map((a) => (
                <div key={a.agent} style={{
                  flex: 1, minWidth: 160,
                  borderRadius: 8, border: `1px solid ${a.border}`, background: a.bg,
                  padding: "10px 14px",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: a.color, margin: "0 0 2px" }}>{a.agent}</p>
                  <p style={{ fontSize: 11, color: "#444", fontFamily: "monospace", margin: "0 0 4px" }}>{a.model}</p>
                  <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{a.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────── */}
        {/* SECTION 2 — Task Packet Viewer     */}
        {/* ─────────────────────────────────── */}
        <div style={{ marginTop: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Active Task Packet
            </p>
            <a href="/task-packets" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>
              All task packets →
            </a>
          </div>
          <TaskPacketViewer packet={readyPacket} showPrompt={true} />
        </div>

        {/* ─────────────────────────────────── */}
        {/* SECTION 3 — Execution Controls     */}
        {/* ─────────────────────────────────── */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Execution Controls
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {/* Active controls */}
            <button style={{
              padding: "10px 20px", borderRadius: 10, cursor: "pointer",
              border: "1px solid #1e3a8a", background: "rgba(30,58,138,0.2)",
              fontSize: 13, fontWeight: 600, color: "#93c5fd",
            }}>
              Review Packet
            </button>
            <button style={{
              padding: "10px 20px", borderRadius: 10, cursor: "pointer",
              border: "1px solid #064e3b", background: "rgba(6,78,59,0.25)",
              fontSize: 13, fontWeight: 600, color: "#4ade80",
            }}>
              Approve For Execution
            </button>

            {/* Future controls */}
            <button disabled style={{
              padding: "10px 20px", borderRadius: 10, cursor: "not-allowed",
              border: "1px solid #1a1a1a", background: "#0a0a0a",
              fontSize: 13, fontWeight: 500, color: "#2d2d2d",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>Launch Claude Code</span>
              <span style={{ fontSize: 10, color: "#2a2a2a" }}>Phase 5</span>
            </button>
            <button disabled style={{
              padding: "10px 20px", borderRadius: 10, cursor: "not-allowed",
              border: "1px solid #1a1a1a", background: "#0a0a0a",
              fontSize: 13, fontWeight: 500, color: "#2d2d2d",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>Launch Ruflo</span>
              <span style={{ fontSize: 10, color: "#2a2a2a" }}>Phase 5</span>
            </button>
          </div>

          <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #141414", background: "#070707" }}>
            <p style={{ fontSize: 12, color: "#3a3a3a", margin: 0, lineHeight: 1.6 }}>
              For now: copy the execution prompt above → paste into Claude Code or Ruflo with your packet.
              Automatic dispatch coming in Phase 5 when the Builder OS ↔ agent integration is built.
            </p>
          </div>
        </div>

        {/* ─────────────────────────────────── */}
        {/* SECTION 4 — Future Architecture    */}
        {/* ─────────────────────────────────── */}
        <div style={{ marginTop: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Future Execution Architecture
          </p>

          <div style={{ borderRadius: 12, border: "1px solid #1a1a1a", background: "#080808", padding: "20px 24px" }}>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 20 }}>
              When Phase 5 is built, Builder OS will dispatch agents directly — no copy/paste required.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { step: "Builder OS",         desc: "Selects approved task packet + target agent",                  color: "#a78bfa" },
                { step: "Launches Agent",      desc: "Opens Claude Code / Ruflo scoped to ONE repo",                color: "#60a5fa" },
                { step: "Scoped Execution",   desc: "Agent works only within defined scope — no repo discovery",    color: "#60a5fa" },
                { step: "Approved Packet Only", desc: "Agent receives the locked packet, no other instructions",    color: "#60a5fa" },
                { step: "Returns Summary",    desc: "Changed files + build result returned to Builder OS",           color: "#fb923c" },
                { step: "Human Reviews",       desc: "William reviews result in /execution before any commit",       color: "#fb923c" },
                { step: "Commit Approval",    desc: "git commit only after explicit human approval — never automatic", color: "#f87171" },
              ].map((s, i, arr) => (
                <div key={s.step} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: s.color, marginTop: 12,
                    }} />
                    {i < arr.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "#1a1a1a", minHeight: 20 }} />
                    )}
                  </div>
                  <div style={{ paddingLeft: 14, paddingBottom: i < arr.length - 1 ? 16 : 0, paddingTop: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: s.color, margin: "0 0 2px" }}>{s.step}</p>
                    <p style={{ fontSize: 12, color: "#555", margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────── */}
        {/* SECTION 5 — Execution Prompts      */}
        {/* ─────────────────────────────────── */}
        <div style={{ marginTop: 48, borderTop: "1px solid #141414", paddingTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Execution Prompts
          </p>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 28, lineHeight: 1.6 }}>
            Use these before and after each agent run — paste into Claude Code or Ruflo.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {executionPrompts.map((prompt) => (
              <div key={prompt.id} style={{
                borderRadius: 12, border: "1px solid #1a1a1a", background: "#070707",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "14px 20px", borderBottom: "1px solid #141414",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const,
                    padding: "2px 8px", borderRadius: 20,
                    background: "#4c1d95", color: "#c4b5fd",
                  }}>
                    {prompt.category}
                  </span>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5", margin: 0 }}>{prompt.title}</p>
                </div>
                <div style={{ padding: "10px 20px 4px" }}>
                  <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>{prompt.description}</p>
                </div>
                <div style={{ padding: "0 20px 20px" }}>
                  <CopyPrompt text={prompt.text} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────── */}
        {/* SECTION 6 — Export Execution Packet */}
        {/* ─────────────────────────────────── */}
        <div style={{ marginTop: 48, borderTop: "1px solid #141414", paddingTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Export Execution Packet
          </p>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 24, lineHeight: 1.6, maxWidth: 540 }}>
            Copy each block in order. Open the repo, start the agent, paste the prompt, and run.
          </p>

          {/* Warning */}
          <div style={{
            marginBottom: 24, padding: "12px 16px", borderRadius: 8,
            border: "1px solid #7c2d12", background: "rgba(124,45,18,0.15)",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#fb923c", margin: "0 0 4px" }}>
              ⚠ Run only inside the selected repo
            </p>
            <code style={{ fontSize: 12, color: "#9a4220", fontFamily: "monospace" }}>{readyPacket.repoPath}</code>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* A — Repo open command */}
            <ExportBlock
              step="A"
              label="Open Repo"
              desc="Run this in your terminal to navigate to the correct repo."
              color="#4ade80"
              border="#064e3b"
              bg="rgba(6,78,59,0.12)"
            >
              <CopyPrompt text={`cd ${readyPacket.repoPath}`} />
            </ExportBlock>

            {/* B — Start agent */}
            <ExportBlock
              step="B"
              label="Start Claude Code"
              desc="Launch Claude Code inside the repo. Do not open any other directory."
              color="#4ade80"
              border="#064e3b"
              bg="rgba(6,78,59,0.12)"
            >
              <CopyPrompt text="claude" />
            </ExportBlock>

            {/* C — Full Claude Code prompt */}
            <ExportBlock
              step="C"
              label="Full Claude Code Prompt"
              desc="Paste this entire block into Claude Code. It includes all safety rules, scope, and the task."
              color="#60a5fa"
              border="#1e3a8a"
              bg="rgba(30,58,138,0.12)"
            >
              <CopyPrompt text={buildClaudePrompt(readyPacket)} />
            </ExportBlock>

            {/* D — Ruflo-safe variant */}
            <ExportBlock
              step="D"
              label="Ruflo Prompt Variant"
              desc="Use this when dispatching via Ruflo instead of Claude Code directly. Structured for Ruflo's agent format."
              color="#a78bfa"
              border="#4c1d95"
              bg="rgba(76,29,149,0.12)"
            >
              <CopyPrompt text={buildRufloPrompt(readyPacket)} />
            </ExportBlock>

            {/* E — Post-execution summary prompt */}
            <ExportBlock
              step="E"
              label="Post-Execution Summary Prompt"
              desc="After the agent finishes, paste this into a new Claude session to review the result and determine if commit is safe."
              color="#fb923c"
              border="#7c2d12"
              bg="rgba(124,45,18,0.12)"
            >
              <CopyPrompt text={POST_EXECUTION_PROMPT} />
            </ExportBlock>

          </div>

          {/* Session log note */}
          <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 10, border: "1px solid #1a1a1a", background: "#080808" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5", margin: "0 0 6px" }}>
              After execution: paste result into Builder OS session log
            </p>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>
              Copy the agent's summary (changed files + build result) and paste it into{" "}
              <a href="/sessions" style={{ color: "#93c5fd", textDecoration: "none" }}>Sessions</a>.
              This keeps your execution history in Builder OS and makes the Review Execution Result prompt
              more accurate.
            </p>
          </div>
        </div>

        {/* ─────────────────────────────────────── */}
        {/* SECTION 7 — Import Execution Result   */}
        {/* ─────────────────────────────────────── */}
        <div style={{ marginTop: 48, borderTop: "1px solid #141414", paddingTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#fb923c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Import Execution Result
          </p>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 24, lineHeight: 1.6, maxWidth: 560 }}>
            After the agent finishes, capture the result here. This closes the loop and keeps Builder OS up to date.
            Use the{" "}
            <a href="/execution-result-template" style={{ color: "#fb923c", textDecoration: "none" }}>result template</a>{" "}
            or the Convert Agent Result prompt to structure the output.
          </p>

          {/* Result fields — visual reference */}
          <div style={{ borderRadius: 12, border: "1px solid #7c2d12", background: "rgba(124,45,18,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #7c2d12" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fb923c", margin: 0 }}>
                Execution Result — fields to record
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Project",             value: readyPacket.projectId,      note: "Which project was this for?" },
                { label: "Tool Used",           value: "Claude Code / Ruflo / Codex", note: "Which agent ran the task?" },
                { label: "Task Packet ID",      value: readyPacket.id,             note: "From data/taskPackets.ts" },
                { label: "Original Goal",       value: readyPacket.goal,           note: "One sentence from the packet" },
                { label: "Result Summary",      value: "[paste agent summary]",    note: "What the agent actually did" },
                { label: "Files Changed",       value: "[list every changed file]",note: "With path and what changed" },
                { label: "Commands Run",        value: "npm run build → ?",        note: "Build, test, or lint results" },
                { label: "Build / Test Result", value: "PASS / FAIL",              note: "Include errors if FAIL" },
                { label: "Risks Identified",    value: "[scope, data, breaking]",  note: "Any unexpected changes?" },
                { label: "Next Actions",        value: "[follow-up tasks]",        note: "What happens next?" },
                { label: "Memory Updates",      value: "[memory/*.md changes]",    note: "Which files, what fields" },
                { label: "Task Status Updates", value: "[packet status change]",   note: "e.g. approved → completed" },
                { label: "Release Status",      value: "No release impact",        note: "Did anything public-facing change?" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "grid", gridTemplateColumns: "190px 1fr",
                  borderBottom: i < arr.length - 1 ? "1px solid #1a1a1a" : undefined,
                  padding: "10px 20px",
                  background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.2)",
                }}>
                  <div style={{ paddingRight: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#a3a3a3", margin: "0 0 1px" }}>{row.label}</p>
                    <p style={{ fontSize: 11, color: "#444", margin: 0 }}>{row.note}</p>
                  </div>
                  <div>
                    <code style={{ fontSize: 11, color: "#666", fontFamily: "monospace", lineHeight: 1.6, display: "block" }}>
                      {row.value}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <a href="/execution-result-template" style={{
              display: "inline-block", padding: "10px 18px", borderRadius: 10, textDecoration: "none",
              border: "1px solid #7c2d12", background: "rgba(124,45,18,0.2)",
              fontSize: 13, fontWeight: 600, color: "#fb923c",
            }}>
              Open Result Template →
            </a>
            <a href="/sessions" style={{
              display: "inline-block", padding: "10px 18px", borderRadius: 10, textDecoration: "none",
              border: "1px solid #1e3a8a", background: "rgba(30,58,138,0.15)",
              fontSize: 13, fontWeight: 600, color: "#93c5fd",
            }}>
              View Sessions →
            </a>
          </div>

          {/* Convert prompt */}
          {SDLC_PROMPTS.filter((p) => p.id === "convert-agent-result").map((prompt) => (
            <div key={prompt.id} style={{
              marginTop: 20, borderRadius: 12, border: "1px solid #1a1a1a", background: "#070707", overflow: "hidden",
            }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const,
                  padding: "2px 8px", borderRadius: 20, background: "#4c1d95", color: "#c4b5fd",
                }}>
                  {prompt.category}
                </span>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5", margin: 0 }}>{prompt.title}</p>
              </div>
              <div style={{ padding: "10px 20px 4px" }}>
                <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>{prompt.description}</p>
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                <CopyPrompt text={prompt.text} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div style={{ marginTop: 40, borderTop: "1px solid #141414", paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { href: "/planner-chat",              label: "← Planner Chat" },
            { href: "/task-packets",              label: "Task Packets" },
            { href: "/execute",                   label: "Execute (Sandbox)" },
            { href: "/sandbox-review",            label: "Patch Review →" },
            { href: "/sessions",                  label: "Sessions" },
            { href: "/execution-result-template", label: "Result Template" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{
              fontSize: 13, padding: "8px 16px", borderRadius: 8,
              border: "1px solid #1a1a1a", background: "#080808",
              color: "#555", textDecoration: "none",
            }}>
              {link.label}
            </a>
          ))}
        </div>

      </div>
    </main>
  );
}
