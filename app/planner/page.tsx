import {
  PLANNER_STAGES,
  CLARIFYING_QUESTIONS,
  BRIEF_TEMPLATE_FIELDS,
  HANDOFF_CHECKLIST,
} from "@/data/planner";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const plannerConversationPrompt = `You are helping me plan a new idea using the Builder OS planning workflow.

My raw idea:
[PASTE YOUR IDEA HERE]

Work through the following stages with me:

1. Ask only the necessary clarifying questions — maximum 3 at a time. Do not ask questions with obvious answers.
2. Challenge weak assumptions directly. If the idea is underspecified or likely to overbuild, say so.
3. Help me define what NOT to build. Explicitly name scope that sounds tempting but should be deferred.
4. Help me identify risks: privacy exposure, breaking changes, over-engineering, maintenance burden.
5. Do NOT produce a final brief until the above are resolved. Ask first, brief later.

When we're ready, produce a final brief using this exact structure:

---
rawIdea: [one clear sentence]
projectId: [builder-os / builder-hub / eternalnotes-public / eternalnotes-private]
repoPath: [local path to the selected repo]
problem: [specific problem this solves]
targetUser: [who is this for?]
desiredOutcome: [success in concrete terms — not features, but outcome]
mvpScope: [what is included in this brief only]
outOfScope: [what is explicitly deferred — name it]
risks:
- [risk 1 — label HIGH / MEDIUM / LOW]
- [risk 2]
firstTask: [one small, safe, reversible task — specific enough to implement in one session]
approvalLevel: [plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved]
---

Rules:
- Keep the MVP as small as possible
- One project only — no cross-repo work
- Do not suggest a database, auth, or external services unless strictly required
- Do not suggest live agent execution
- Do not produce the brief until clarifying questions are resolved`;

const briefToPacketPrompt = `Convert this approved final brief into an Approved Task Packet for Builder OS.

My approved brief:
[PASTE YOUR FINAL BRIEF HERE]

Return a task packet using this exact structure — I will paste it into data/taskPackets.ts.

---
id: [kebab-case-slug]
title: [clear task title]
projectId: [from the brief]
repoPath: [from the brief]
status: draft
approvalLevel: [from the brief — plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved]
goal: [one sentence — the exact outcome from the brief]
scope: [exact files and directories the agent may work in — be specific]

allowedActions:
- [action 1 — matched to the approval level]
- [action 2]
- [action 3]

forbiddenActions:
- No automatic commit or push
- No touching files outside the defined scope
- [additional forbidden action specific to this task]

executionPrompt: |
  [A complete, ready-to-paste prompt for Claude Code or Ruflo.
   Must include:
   - Project name and repo path
   - The specific approved task
   - "Before editing: list every file you plan to change and why"
   - "Wait for me to say proceed before making any edits"
   - Post-edit summary format (file path + what changed)
   - Build/typecheck step
   - No automatic push or commit]

expectedOutput: [what the agent should return when done — used to verify completion]
rollbackPlan: [how to undo the changes if something goes wrong]
createdAt: [today's date]
---

Rules:
- Default approvalLevel to read-only unless file edits are clearly required
- Never recommend push-approved without a strong reason
- The executionPrompt must include the "list files before editing" step
- The forbiddenActions must include "no automatic push or commit"
- Keep the scope narrow — resist adding adjacent improvements`;

export default function PlannerPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Idea Planner</h1>
        <p className="mt-3 text-neutral-400">
          Turn a messy idea into an approved brief, then into a locked task packet. One stage at a
          time — no code until the brief is solid.
        </p>

        {/* Flow summary */}
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <p className="text-sm text-neutral-400">
            Messy idea{" "}
            <span className="text-neutral-700">→</span>{" "}
            <span className="text-emerald-500">Planner conversation</span>{" "}
            <span className="text-neutral-700">→</span>{" "}
            Final brief{" "}
            <span className="text-neutral-700">→</span>{" "}
            <a href="/task-packets" className="text-blue-500 hover:text-blue-400 transition-colors">
              Task Packet
            </a>{" "}
            <span className="text-neutral-700">→</span>{" "}
            Agent execution
          </p>
        </div>

        {/* Planning stages */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Planning stages
          </p>
          <div className="mt-4 space-y-1">
            {PLANNER_STAGES.map((stage, i) => (
              <div key={stage.id} className="flex flex-col items-stretch">
                {stage.isGate ? (
                  <div className="rounded-xl border border-yellow-900 bg-yellow-950/30 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-yellow-800 text-xs font-bold text-yellow-600">
                          {stage.step}
                        </span>
                        <p className="font-semibold text-yellow-300">{stage.title}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-yellow-900 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                        Approval gate
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-yellow-400/80">{stage.description}</p>
                    <p className="mt-1.5 text-xs text-yellow-700">Goal: {stage.goal}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-xs font-bold text-neutral-600">
                        {stage.step}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-200">{stage.title}</p>
                        <p className="mt-1 text-sm text-neutral-500">{stage.description}</p>
                        <p className="mt-1 text-xs text-neutral-700">Goal: {stage.goal}</p>
                      </div>
                    </div>
                  </div>
                )}
                {i < PLANNER_STAGES.length - 1 && (
                  <div className="flex justify-center py-0.5 text-base text-neutral-800">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Clarifying questions */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Clarifying questions
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            Ask these before producing a brief — not all at once, only the ones that are unresolved.
          </p>
          <div className="mt-4 space-y-3">
            {CLARIFYING_QUESTIONS.map((q, i) => (
              <div
                key={q.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-xs font-bold text-neutral-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">{q.question}</p>
                    <p className="mt-1 text-xs text-neutral-600">{q.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final brief template */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Final brief template
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            Every field must be filled before converting to a task packet.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
            {BRIEF_TEMPLATE_FIELDS.map((field, i) => (
              <div
                key={field.id}
                className={`flex flex-col gap-1 px-5 py-3 ${
                  i < BRIEF_TEMPLATE_FIELDS.length - 1 ? "border-b border-neutral-800" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-xs font-mono font-medium text-emerald-400">{field.label}:</code>
                  {field.note && (
                    <span className="text-xs text-yellow-700">{field.note}</span>
                  )}
                </div>
                <p className="text-xs text-neutral-600">{field.placeholder}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Task packet handoff checklist */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Task packet handoff checklist
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            Every item must be complete before a brief becomes an Approved Task Packet.
          </p>
          <div className="mt-4 space-y-2">
            {HANDOFF_CHECKLIST.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3"
              >
                <span className="mt-0.5 shrink-0 text-neutral-700">☐</span>
                <div>
                  <p className="text-sm font-medium text-neutral-300">{item.item}</p>
                  <p className="mt-0.5 text-xs text-neutral-600">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <a
              href="/task-packets"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors"
            >
              View Task Packets →
            </a>
            <a
              href="/automation"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors"
            >
              Automation Plan →
            </a>
          </div>
        </div>

        {/* Prompts */}
        <div className="mt-12 space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Prompt: Planner Conversation</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Start here. Paste your raw idea and let the AI ask the necessary clarifying questions
              before producing a brief.
            </p>
            <div className="mt-3">
              <CopyPrompt text={plannerConversationPrompt} customizeLink />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Prompt: Final Brief To Task Packet</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Use this after the brief is approved. Converts a final brief into a structured task
              packet ready to paste into{" "}
              <code className="rounded bg-neutral-800 px-1 text-xs">data/taskPackets.ts</code>.
            </p>
            <div className="mt-3">
              <CopyPrompt text={briefToPacketPrompt} customizeLink />
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/brief", label: "Project Brief" },
            { href: "/task-packets", label: "Task Packets" },
            { href: "/automation", label: "Automation Plan" },
            { href: "/prompt-builder", label: "Prompt Builder" },
            { href: "/command", label: "Daily Command" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
            >
              {link.label} →
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
