"use client";

import { useState } from "react";
import { TASK_PACKETS, type TaskPacket } from "@/data/taskPackets";
import { PROJECT_MAP } from "@/data/projects";
import { SDLC_PROMPTS } from "@/data/sdlcPrompts";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const APPROVED = TASK_PACKETS.filter((p) => p.status === "approved");
const BUILDER_OS_ROOT = PROJECT_MAP["builder-os"]?.localPath ?? "C:\\Users\\willi\\Projects\\builder-os";

function sandboxPath(id: string) {
  return `${BUILDER_OS_ROOT}\\.builder-os\\sandboxes\\${id}`;
}
function patchPath(id: string) {
  return `${BUILDER_OS_ROOT}\\.builder-os\\patches\\${id}.patch`;
}
function suggestedCommit(packet: TaskPacket) {
  const goal = packet.goal.charAt(0).toLowerCase() + packet.goal.slice(1);
  return `feat(${packet.projectId}): ${goal.slice(0, 70)}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
      {children}
    </p>
  );
}

function StepBlock({ step, label, desc, color, border, bg, children }: {
  step: string; label: string; desc: string; color: string; border: string; bg: string; children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${border}`, background: bg, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${border}` }}>
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

const REVIEW_PATCH_PROMPT = SDLC_PROMPTS.find((p) => p.id === "review-patch-before-commit");

export default function SandboxReviewPage() {
  const [selected, setSelected] = useState<TaskPacket | null>(APPROVED[0] ?? null);

  const sbPath = selected ? sandboxPath(selected.id) : "—";
  const ptPath = selected ? patchPath(selected.id) : "—";
  const repoPath = selected?.repoPath ?? "—";
  const packetId = selected?.id ?? "packet-id";

  const stepColor = "#4ade80";
  const stepBorder = "#064e3b";
  const stepBg = "rgba(6,78,59,0.1)";

  return (
    <main>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Builder OS — Sandbox Review
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginTop: 10, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Apply Patch Manually
        </h1>
        <p style={{ marginTop: 12, color: "#737373", fontSize: 15, lineHeight: 1.7, maxWidth: 580 }}>
          Sandbox run → Review diff → Generate patch → Apply on review branch → Build/test → Commit manually.
          No automatic application. No automatic commit. No push.
        </p>

        {/* Workflow strip */}
        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0 }}>
          {[
            { label: "Sandbox Run",     href: "/execute",          done: true  },
            { label: "Generate Patch",  href: "/sandbox-review",   done: false, current: true },
            { label: "Apply on Branch", href: "/sandbox-review",   done: false },
            { label: "Build / Test",    href: "/sandbox-review",   done: false },
            { label: "Commit Manually", href: "/sandbox-review",   done: false },
          ].map((s, i, arr) => (
            <span key={s.label} style={{ display: "flex", alignItems: "center" }}>
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                fontWeight: s.current ? 700 : 400,
                border: s.current ? "1px solid #064e3b" : s.done ? "1px solid #064e3b" : "1px solid #1a1a1a",
                background: s.current ? "rgba(6,78,59,0.25)" : s.done ? "rgba(6,78,59,0.12)" : "#0a0a0a",
                color: s.current ? "#4ade80" : s.done ? "#4ade80" : "#333",
              }}>
                {s.done && !s.current && <span style={{ marginRight: 3, fontSize: 10 }}>✓</span>}
                {s.label}
              </span>
              {i < arr.length - 1 && <span style={{ fontSize: 12, color: "#222", margin: "0 4px" }}>→</span>}
            </span>
          ))}
        </div>

        {/* Warnings */}
        <div style={{ marginTop: 28, padding: "14px 18px", borderRadius: 10, border: "1px solid #92400e", background: "rgba(146,64,14,0.12)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", margin: "0 0 8px" }}>⚠ Before you apply any patch</p>
          <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              "Do not apply the patch if the real repo has uncommitted changes — stash or commit them first.",
              "Apply the patch only on a dedicated review branch, never directly on main.",
              "Inspect the full diff before running git add or git commit.",
              "Never push to remote until you have reviewed and confirmed the changes.",
              "If anything looks wrong, use the rollback commands at the bottom of this page.",
            ].map((w) => (
              <li key={w} style={{ fontSize: 12, color: "#fbbf24", lineHeight: 1.5 }}>{w}</li>
            ))}
          </ul>
        </div>

        {/* Packet selector */}
        <div style={{ marginTop: 36 }}>
          <Label>Select Task Packet</Label>
          {APPROVED.length === 0 ? (
            <div style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid #1a1a1a", background: "#080808" }}>
              <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
                No approved packets. Go to{" "}
                <a href="/task-packets" style={{ color: "#93c5fd", textDecoration: "none" }}>/task-packets</a>.
              </p>
            </div>
          ) : (
            <>
              <select
                value={selected?.id ?? ""}
                onChange={(e) => setSelected(APPROVED.find((x) => x.id === e.target.value) ?? null)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#e5e5e5", fontSize: 14, cursor: "pointer", marginBottom: 14 }}
              >
                {APPROVED.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              {selected && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 0 }}>
                  <div style={{ borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", padding: "12px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Sandbox path</p>
                    <code style={{ fontSize: 11, color: "#555", fontFamily: "monospace", wordBreak: "break-all" }}>{sbPath}</code>
                  </div>
                  <div style={{ borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", padding: "12px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Patch file path</p>
                    <code style={{ fontSize: 11, color: "#555", fontFamily: "monospace", wordBreak: "break-all" }}>{ptPath}</code>
                  </div>
                  <div style={{ borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", padding: "12px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Real repo path</p>
                    <code style={{ fontSize: 11, color: "#555", fontFamily: "monospace", wordBreak: "break-all" }}>{repoPath}</code>
                  </div>
                  <div style={{ borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", padding: "12px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Review branch name</p>
                    <code style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>review/{packetId}</code>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Steps */}
        <div style={{ marginTop: 36 }}>
          <Label>Apply Patch Manually — Step by Step</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <StepBlock step="0" label="Generate patch from sandbox" desc="Run inside the sandbox directory to export changes as a patch file." color={stepColor} border={stepBorder} bg={stepBg}>
              <CopyPrompt text={`cd "${sbPath}"\nmkdir -p "${BUILDER_OS_ROOT}\\.builder-os\\patches"\ngit diff HEAD > "${ptPath}"`} />
              <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
                If the patch file is empty, the agent made no changes relative to HEAD.
              </p>
            </StepBlock>

            <StepBlock step="A" label="Open real repo" desc="Navigate to the real repository in your terminal." color={stepColor} border={stepBorder} bg={stepBg}>
              <CopyPrompt text={`cd "${repoPath}"`} />
            </StepBlock>

            <StepBlock step="B" label="Check current status" desc="Confirm the working tree is clean before applying anything." color={stepColor} border={stepBorder} bg={stepBg}>
              <CopyPrompt text="git status" />
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, border: "1px solid #92400e", background: "rgba(146,64,14,0.1)" }}>
                <p style={{ fontSize: 12, color: "#fbbf24", margin: 0 }}>
                  ⚠ Stop if the output shows modified or staged files. Stash or commit your work first:
                  <code style={{ display: "block", marginTop: 4, fontFamily: "monospace", fontSize: 11, color: "#f59e0b" }}>git stash</code>
                </p>
              </div>
            </StepBlock>

            <StepBlock step="C" label="Create review branch" desc="Apply the patch only on a dedicated review branch — never on main." color={stepColor} border={stepBorder} bg={stepBg}>
              <CopyPrompt text={`git checkout -b review/${packetId}`} />
            </StepBlock>

            <StepBlock step="D" label="Apply patch" desc="Apply the generated patch to the review branch. Inspect any conflicts before proceeding." color={stepColor} border={stepBorder} bg={stepBg}>
              <CopyPrompt text={`git apply "${ptPath}"`} />
              <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
                If git apply fails with conflicts, use{" "}
                <code style={{ fontFamily: "monospace" }}>git apply --check &quot;{ptPath}&quot;</code>{" "}
                to diagnose before applying.
              </p>
            </StepBlock>

            <StepBlock step="E" label="Run build / test" desc="Verify the patch does not break the project before reviewing the diff." color={stepColor} border={stepBorder} bg={stepBg}>
              <CopyPrompt text="npm run build" />
              <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
                If the build fails, do NOT commit. Fix the error or roll back the patch.
              </p>
            </StepBlock>

            <StepBlock step="F" label="Review changed files" desc="Inspect every change before staging anything." color={stepColor} border={stepBorder} bg={stepBg}>
              <CopyPrompt text={`git status\ngit diff --stat\ngit diff`} />
            </StepBlock>

            <StepBlock
              step="G"
              label="Commit manually — only if safe"
              desc="Only after reviewing the full diff and confirming the build passes."
              color="#fbbf24"
              border="#92400e"
              bg="rgba(146,64,14,0.1)"
            >
              <p style={{ fontSize: 12, color: "#666", marginBottom: 8, lineHeight: 1.5 }}>
                Stage specific files, not everything. Review each file with{" "}
                <code style={{ fontFamily: "monospace" }}>git diff --staged</code> before committing.
              </p>
              <CopyPrompt text={`git add -p\ngit commit -m "${selected ? suggestedCommit(selected) : "feat(project): describe change"}"`} />
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.12)" }}>
                <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>
                  Do NOT run git push. Review the commit locally first. Push only after explicit decision.
                </p>
              </div>
            </StepBlock>

          </div>
        </div>

        {/* Review Patch prompt */}
        {REVIEW_PATCH_PROMPT && (
          <div style={{ marginTop: 48, borderTop: "1px solid #141414", paddingTop: 36 }}>
            <Label>Review Patch Before Commit — AI Prompt</Label>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 }}>
              After Step F, paste the diff output into a new Claude session along with this prompt.
              Claude will tell you whether it is safe to commit and suggest a commit message.
            </p>
            <div style={{ borderRadius: 12, border: "1px solid #1a1a1a", background: "#070707", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: "#064e3b", color: "#4ade80" }}>
                  {REVIEW_PATCH_PROMPT.category}
                </span>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5", margin: 0 }}>{REVIEW_PATCH_PROMPT.title}</p>
              </div>
              <div style={{ padding: "12px 20px 4px" }}>
                <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>{REVIEW_PATCH_PROMPT.description}</p>
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                <CopyPrompt text={REVIEW_PATCH_PROMPT.text} />
              </div>
            </div>
          </div>
        )}

        {/* Rollback */}
        <div style={{ marginTop: 48, borderTop: "1px solid #141414", paddingTop: 36 }}>
          <Label>Rollback — Undo All Patch Work</Label>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.6 }}>
            If anything looks wrong after applying the patch, run these commands to undo everything and return to main.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Reverse the patch (while still on the review branch):</p>
              <CopyPrompt text={`git apply -R "${ptPath}"`} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Return to main and delete the review branch:</p>
              <CopyPrompt text={`git checkout main\ngit branch -D review/${packetId}`} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Or — if you committed and want to undo the commit:</p>
              <CopyPrompt text={`git reset --soft HEAD~1\ngit checkout -- .\ngit checkout main\ngit branch -D review/${packetId}`} />
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ marginTop: 40, borderTop: "1px solid #141414", paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { href: "/execute",                   label: "← Execute (Sandbox)" },
            { href: "/execution",                 label: "Execution Export" },
            { href: "/execution-result-template", label: "Result Template" },
            { href: "/sessions",                  label: "Sessions" },
            { href: "/task-packets",              label: "Task Packets" },
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
