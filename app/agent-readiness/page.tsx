import {
  READINESS_CHECKLIST,
  READINESS_LEVELS,
  AUTOMATION_BLOCK_RULES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ChecklistCategory,
} from "@/data/agentReadiness";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const readinessPrompt = `Review this task packet and return an agent execution readiness assessment.

Task packet:
[PASTE YOUR TASK PACKET HERE — include: goal, scope, allowedActions, forbiddenActions, approvalLevel, rollbackPlan, expectedOutput]

Return the following — I will use this to decide whether to proceed with execution.

---
readinessLevel: [Not ready / Ready for read-only analysis / Ready for approved edits / Ready for commit review / Not safe for automation]

missingInformation:
- [anything that is undefined, vague, or missing from the task packet]
- [or: none — all required fields are present]

risks:
- [risk 1 — label HIGH / MEDIUM / LOW]
- [risk 2]
- [or: none identified]

approvalLevelRequired: [minimum level needed for this specific task — plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved]

safestNextAction: [one sentence — the safest thing to do right now before running any agent]

blockExecution: [yes / no]

blockReason: [if yes — why is execution blocked? Be specific.]

checklist:
- [ ] Final brief exists
- [ ] Project is selected
- [ ] Repo path is confirmed
- [ ] Task packet is created
- [ ] Approval level is selected
- [ ] Allowed actions are defined
- [ ] Forbidden actions are defined
- [ ] Rollback plan is written
- [ ] Private data risk is checked
- [ ] Build/test command is known
- [ ] Expected output is defined
---

Rules:
- Block execution if any HIGH risk is present
- Block execution if rollback plan is missing
- Block execution if private data risk has not been confirmed clear
- Default to the more restrictive readiness level when in doubt
- Never recommend automatic push or deploy
- Do not edit any files — this is an assessment only`;

export default function AgentReadinessPage() {
  const byCategory = CATEGORY_ORDER.reduce<Record<ChecklistCategory, typeof READINESS_CHECKLIST>>(
    (acc, cat) => {
      acc[cat] = READINESS_CHECKLIST.filter((c) => c.category === cat);
      return acc;
    },
    { brief: [], scope: [], safety: [], execution: [] }
  );

  const blockingCount = READINESS_CHECKLIST.filter((c) => c.blocksExecution).length;

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Agent Execution Readiness</h1>
        <p className="mt-3 text-neutral-400">
          Before any agent runs, every item on this checklist must be confirmed. A missing item
          blocks execution — not slows it.
        </p>

        {/* Summary callout */}
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-red-300">
            {blockingCount} of {READINESS_CHECKLIST.length} checklist items block execution if
            incomplete.
          </p>
          <p className="mt-1 text-xs text-red-800">
            Work through this checklist before pasting any execution prompt into an agent. Use the
            readiness assessment prompt at the bottom to get a fast AI review.
          </p>
        </div>

        {/* Flow */}
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <p className="text-sm text-neutral-400">
            <a href="/planner" className="text-purple-500 hover:text-purple-400 transition-colors">
              Planner
            </a>{" "}
            <span className="text-neutral-700">→</span>{" "}
            <a href="/brief" className="text-neutral-400 hover:text-white transition-colors">
              Brief
            </a>{" "}
            <span className="text-neutral-700">→</span>{" "}
            <a
              href="/task-packets"
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              Task Packet
            </a>{" "}
            <span className="text-neutral-700">→</span>{" "}
            <span className="font-semibold text-emerald-400">Agent Readiness ← you are here</span>{" "}
            <span className="text-neutral-700">→</span>{" "}
            <span className="text-neutral-600">Agent execution</span>
          </p>
        </div>

        {/* Checklist by category */}
        <div className="mt-10 space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const items = byCategory[cat];
            return (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="mt-3 overflow-hidden rounded-xl border border-neutral-800">
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 px-5 py-4 ${
                        i < items.length - 1 ? "border-b border-neutral-800" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 text-base ${
                          item.blocksExecution ? "text-red-700" : "text-neutral-700"
                        }`}
                      >
                        ☐
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-neutral-200">{item.label}</p>
                          {item.blocksExecution && (
                            <span className="rounded-full bg-red-950 px-2 py-0.5 text-xs font-medium text-red-500">
                              Blocks execution
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-neutral-600">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Readiness levels */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Readiness levels
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            Use the assessment prompt below to determine which level applies to your task packet.
          </p>
          <div className="mt-4 space-y-3">
            {READINESS_LEVELS.map((level) => (
              <div
                key={level.id}
                className={`rounded-xl border px-5 py-4 ${level.border} ${level.bgColor}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${level.badge}`}
                  >
                    {level.label}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${level.color}`}>{level.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Block rules */}
        <div className="mt-10 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-300">Automation block rules</h2>
          <p className="mt-1 text-xs text-neutral-600">
            These rules apply regardless of readiness level. Violation means execution is blocked.
          </p>
          <ul className="mt-4 space-y-2">
            {AUTOMATION_BLOCK_RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-600">✕</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Readiness assessment prompt */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold">Prompt: Check Agent Execution Readiness</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Paste your task packet and get an AI readiness assessment before running anything.
            Returns a readiness level, missing information, risks, and a block decision.
          </p>
          <div className="mt-3">
            <CopyPrompt text={readinessPrompt} customizeLink />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/planner", label: "Idea Planner" },
            { href: "/task-packets", label: "Task Packets" },
            { href: "/automation", label: "Automation Plan" },
            { href: "/brief", label: "Project Brief" },
            { href: "/prompt-builder", label: "Prompt Builder" },
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
