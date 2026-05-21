import {
  V1_GOAL,
  V1_DONE_SIGNAL,
  V1_CHECKLIST,
  NOT_V1,
  SCOPE_CREEP_RULES,
} from "@/data/mvpLock";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const v1CheckPrompt = `Review the current state of Builder OS and return a v1 completion assessment.

Builder OS v1 goal:
A private local command center that helps me plan projects, generate prompts, track tasks, record sessions, and prepare safe agent work.

v1 required features:
- Projects registry (/projects)
- Prompt builder (/prompt-builder)
- Task board (/tasks)
- Memory pages (/memory)
- Session logs (/sessions)
- Release pipeline (/releases)
- Daily command page (/command)
- Task packets (/task-packets)
- Planner workflow (/planner)
- Agent readiness checklist (/agent-readiness)
- System health page (/system-health)
- MVP lock page (/mvp-lock)

Review the current state of this project and return:

---
v1Complete:
- [feature name] — [yes / partial / missing] — [one sentence on state]

missingFromV1:
- [what is not yet usable or not yet built]
- [or: none — all v1 features are present]

unnecessary:
- [pages or features that exist but are not needed for v1]
- [or: none]

shouldCut:
- [anything that adds complexity without adding v1 value]
- [or: nothing]

nextThreeActions:
1. [most important thing to finish or fix for v1]
2. [second most important]
3. [third most important]

v1ReadyToUse: [yes / not yet — reason]
---

Do NOT edit any files. This is a read-only assessment.`;

export default function MvpLockPage() {
  const doneCount = V1_CHECKLIST.filter((i) => i.done).length;
  const totalCount = V1_CHECKLIST.length;
  const allDone = doneCount === totalCount;
  const pct = Math.round((doneCount / totalCount) * 100);

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">MVP Lock — v1</h1>
        <p className="mt-3 text-neutral-400">
          Defines what Builder OS v1 must include before scope creep takes over. When this checklist
          is complete, stop building pages and start doing real work.
        </p>

        {/* v1 goal */}
        <div className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/20 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            v1 goal
          </p>
          <p className="mt-2 text-base font-medium text-emerald-300">{V1_GOAL}</p>
        </div>

        {/* Progress bar */}
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-300">
              {doneCount} / {totalCount} v1 features complete
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                allDone
                  ? "bg-emerald-900 text-emerald-300"
                  : "bg-yellow-900 text-yellow-400"
              }`}
            >
              {allDone ? "v1 Complete" : `${pct}%`}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full rounded-full transition-all ${
                allDone ? "bg-emerald-500" : "bg-yellow-600"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stop building warning */}
        <div className="mt-4 rounded-xl border border-yellow-900 bg-yellow-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-yellow-300">
            Stop building pages when these are done.
          </p>
          <p className="mt-1 text-xs text-yellow-800">{V1_DONE_SIGNAL}</p>
        </div>

        {/* v1 required checklist */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            v1 required
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            Every item must be present and usable. No partial credit.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
            {V1_CHECKLIST.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 px-5 py-4 ${
                  i < V1_CHECKLIST.length - 1 ? "border-b border-neutral-800" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    item.done
                      ? "border-emerald-800 bg-emerald-950 text-emerald-400"
                      : "border-red-900 bg-red-950 text-red-500"
                  }`}
                >
                  {item.done ? "✓" : "✕"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${
                        item.done ? "text-neutral-200" : "text-red-400"
                      }`}
                    >
                      {item.label}
                    </p>
                    <a
                      href={item.route}
                      className="shrink-0 text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
                    >
                      {item.route} →
                    </a>
                  </div>
                  {item.note && (
                    <p className="mt-0.5 text-xs text-neutral-600">{item.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOT v1 */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            NOT v1
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            These features are explicitly out of scope. Do not build them until v1 is fully used in
            real work.
          </p>
          <div className="mt-4 space-y-2">
            {NOT_V1.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3"
              >
                <span className="mt-0.5 shrink-0 text-red-800">✕</span>
                <div>
                  <p className="text-sm font-medium text-neutral-500">{item.label}</p>
                  <p className="mt-0.5 text-xs text-neutral-700">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scope creep rules */}
        <div className="mt-10 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-300">Scope creep rules</h2>
          <p className="mt-1 text-xs text-neutral-600">
            Follow these before adding anything new to Builder OS.
          </p>
          <ul className="mt-4 space-y-2">
            {SCOPE_CREEP_RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-600">✕</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* v1 check prompt */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold">Prompt: Check If Builder OS v1 Is Done</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Paste into any Claude session to get an honest v1 assessment — what's complete, what's
            missing, what should be cut, and the next 3 actions to ship v1.
          </p>
          <div className="mt-3">
            <CopyPrompt text={v1CheckPrompt} customizeLink />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/command", label: "Daily Command" },
            { href: "/system-health", label: "System Health" },
            { href: "/tasks", label: "Tasks" },
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
