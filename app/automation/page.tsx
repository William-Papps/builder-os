import {
  AUTOMATION_STAGES,
  APPROVAL_LEVELS,
  AUTOMATION_SAFETY_RULES,
  DEFAULT_APPROVAL_LEVEL,
} from "@/data/automation";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const finalizePrompt = `Turn this idea into a complete automation plan for Builder OS.

My idea / brief:
[PASTE YOUR APPROVED BRIEF HERE]

Return the following — I will paste this into Builder OS to prepare execution.

---
finalBrief: [one clear sentence describing the complete goal]

selectedProject: [project id from: builder-os / builder-hub / eternalnotes-public / eternalnotes-private]

repoPath: [local path to the selected repo]

taskList:
1. [first task — small, specific, reversible]
2. [second task]
3. [third task]
4. [fourth task — if needed]
5. [fifth task — if needed]

agentRecommendation: [Claude Code / Codex / Ruflo / ChatGPT — and why]

requiredApprovalLevel: [1–6 — what is the minimum level needed for this work?]

executionPrompts:
- Task 1 prompt: [ready-to-paste prompt for the first task]
- Task 2 prompt: [if different agent or context]

risks:
- [risk 1 — label HIGH / MEDIUM / LOW]
- [risk 2]

rollbackPlan: [what to do if something goes wrong — how to undo the changes]
---

Rules:
- Keep tasks small and reversible
- Do not recommend Level 4+ unless file edits are truly required
- Default to Level 2 (generate prompts) or Level 3 (read-only analysis)
- Never recommend automatic push or deploy
- One repo only — no cross-repo tasks`;

const executePrompt = `You are executing an approved task from Builder OS.

Project: [PROJECT NAME]
Repo path: [LOCAL REPO PATH]
Approved task: [PASTE APPROVED TASK HERE]
Approval level: [LEVEL 1–6]

STRICT EXECUTION RULES — do not deviate from these:

1. Scope lock
   - Work inside this repo only
   - Do not touch other repos
   - Do not expand scope beyond the approved task
   - If you discover adjacent work, report it — do not do it

2. Before editing anything
   - List every file you plan to change and why
   - Confirm there are no unintended side effects
   - Wait for me to say "proceed" before making any edits

3. While working
   - Make the smallest safe change that achieves the task
   - Do not delete files without explicit approval
   - Do not touch private notes or .env files

4. After editing
   - Summarize every file changed (file path + what changed + why)
   - Run build or typecheck if available — report the result
   - Do not stage or commit anything unless I explicitly say to

5. Result format
   Return this exactly:

   filesChanged:
   - [file path] — [what changed]

   buildResult: [passed / failed / not available]

   risks: [any new risks discovered]

   nextActions:
   - [what I should do next]

   memoryUpdates: [what to update in data/memory.ts]

   taskUpdates: [which tasks to mark done or update]`;

export default function AutomationPage() {
  const gates = AUTOMATION_STAGES.filter((s) => s.isGate);

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Automation Plan</h1>
        <p className="mt-3 text-neutral-400">
          The future Builder OS automation pipeline — Planner → Tasks → Agents → Memory. Designed
          with approval gates so nothing runs without your sign-off.
        </p>

        {/* Default level callout */}
        <div className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-300">
            Default approval level: {DEFAULT_APPROVAL_LEVEL} — Generate prompts only.
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Agents do not run automatically. Push and deploy are always Level 6 and always
            require manual approval.
          </p>
        </div>

        {/* Agent Readiness bridge */}
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/20 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-300">
                Before execution, check Agent Readiness.
              </p>
              <p className="mt-1 text-xs text-red-900/80 text-neutral-600">
                Every task packet must pass the readiness checklist before any agent runs. Missing
                items block execution — not delay it.
              </p>
            </div>
            <a
              href="/agent-readiness"
              className="shrink-0 text-xs text-red-600 hover:text-red-400 transition-colors"
            >
              Check readiness →
            </a>
          </div>
        </div>

        {/* Planner bridge */}
        <div className="mt-6 rounded-xl border border-purple-900 bg-purple-950/20 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-purple-300">
                Messy idea → Planner conversation → Final brief
              </p>
              <p className="mt-1 text-xs text-purple-800">
                Before creating a task packet, use{" "}
                <code className="text-purple-700">/planner</code> to clarify the idea, challenge
                assumptions, and define what NOT to build. The planner produces the brief that
                becomes the task packet.
              </p>
            </div>
            <a
              href="/planner"
              className="shrink-0 text-xs text-purple-600 hover:text-purple-400 transition-colors"
            >
              Open Planner →
            </a>
          </div>
        </div>

        {/* Task Packet bridge */}
        <div className="mt-6 rounded-xl border border-blue-900 bg-blue-950/20 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-300">
                Final brief → Approved Task Packet → Agent execution (future)
              </p>
              <p className="mt-1 text-xs text-blue-800">
                Once a brief is approved, it becomes a Task Packet in{" "}
                <code className="text-blue-700">data/taskPackets.ts</code> — a locked work unit
                with scope, allowed actions, and a ready-to-copy execution prompt.
              </p>
            </div>
            <a
              href="/task-packets"
              className="shrink-0 text-xs text-blue-600 hover:text-blue-400 transition-colors"
            >
              View Task Packets →
            </a>
          </div>
        </div>

        {/* Pipeline */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Automation pipeline
          </p>
          <div className="mt-4 space-y-1">
            {AUTOMATION_STAGES.map((stage, i) => (
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
                    {stage.builderOsLink && (
                      <a
                        href={stage.builderOsLink}
                        className="mt-1.5 inline-block text-xs text-yellow-700 hover:text-yellow-500 transition-colors"
                      >
                        Open {stage.builderOsLink} →
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-xs font-bold text-neutral-600">
                        {stage.step}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-neutral-200">{stage.title}</p>
                          <span className="text-xs text-neutral-700">
                            min. Level {stage.minimumLevel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">{stage.description}</p>
                        {stage.builderOsLink && (
                          <a
                            href={stage.builderOsLink}
                            className="mt-1 inline-block text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
                          >
                            {stage.builderOsLink} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {i < AUTOMATION_STAGES.length - 1 && (
                  <div className="flex justify-center py-0.5 text-base text-neutral-800">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Approval levels */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Approval levels
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            Levels 2 and 3 are the default. Level 6 always requires manual approval.
          </p>
          <div className="mt-4 space-y-3">
            {APPROVAL_LEVELS.map((lvl) => (
              <div
                key={lvl.level}
                className={`rounded-2xl border bg-neutral-900 p-5 ${lvl.border}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${lvl.badge}`}
                    >
                      {lvl.level}
                    </span>
                    <div>
                      <p className={`font-semibold ${lvl.color}`}>{lvl.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-600">{lvl.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lvl.isDefault && (
                      <span className="rounded-full bg-emerald-900 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        Default
                      </span>
                    )}
                    {lvl.requiresManualApproval && (
                      <span className="rounded-full bg-yellow-900 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
                        Manual approval
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-neutral-700">Allowed</p>
                    <ul className="mt-2 space-y-1">
                      {lvl.allowedActions.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-xs text-neutral-400">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-700">Not allowed</p>
                    <ul className="mt-2 space-y-1">
                      {lvl.notAllowed.map((n) => (
                        <li key={n} className="flex items-start gap-2 text-xs text-neutral-600">
                          <span className="mt-0.5 shrink-0 text-neutral-800">✕</span>
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety rules */}
        <div className="mt-10 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-300">Automation safety rules</h2>
          <p className="mt-1 text-xs text-red-900/80 text-neutral-600">
            These apply regardless of approval level.
          </p>
          <ul className="mt-4 space-y-2">
            {AUTOMATION_SAFETY_RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-600">✕</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Prompts */}
        <div className="mt-12 space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Prompt: Finalize Idea Into Automation Plan</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Paste into any Claude session after approving a brief. Returns a structured plan
              ready to paste into Builder OS.
            </p>
            <div className="mt-3">
              <CopyPrompt text={finalizePrompt} customizeLink />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Prompt: Execute Approved Task Safely</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Paste into Claude Code or Ruflo inside the selected repo. Fill in the project,
              task, and approval level before sending.
            </p>
            <div className="mt-3">
              <CopyPrompt text={executePrompt} customizeLink />
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/brief", label: "Project Brief" },
            { href: "/tasks", label: "Tasks" },
            { href: "/model-router", label: "Model Router" },
            { href: "/prompt-builder", label: "Prompt Builder" },
            { href: "/ruflo", label: "Ruflo Setup" },
            { href: "/update-guide", label: "Update Guide" },
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
