import {
  getAllHealthSections,
  getOverallStatus,
  getRecommendedAction,
  type HealthStatus,
  type HealthItem,
} from "@/data/systemHealth";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const healthPrompt = `Review the current state of Builder OS and return a structured health report.

Review the following areas:

1. Projects (data/projects.ts)
   - Are all projects still active and relevant?
   - Does each project have a memory entry in data/memory.ts?
   - Is any project stale or abandoned?

2. Tasks (data/tasks.ts)
   - What tasks are in-progress, ready, or backlog?
   - Are any tasks blocked or stale?
   - Are there tasks that should be marked done?

3. Sessions (data/sessions.ts)
   - When was the last session for each project?
   - Are any sessions marked partial or blocked with outstanding follow-ups?
   - Is the session log missing entries for recent work?

4. Memory (data/memory.ts)
   - Is each project's memory current and accurate?
   - Are the risks and next actions still relevant?
   - Has the memory drifted from the actual project state?

5. Releases (data/releases.ts)
   - Are any projects marked needs-review or preparing-public?
   - Are there incomplete checklist items for public projects?

6. Task Packets (data/taskPackets.ts)
   - Are any packets in draft — waiting for approval?
   - Are any packets blocked — waiting for a decision?
   - Are approved packets ready to execute?

Return the following:

---
staleItems:
- [item that needs updating — and why]
- [or: none]

riskyItems:
- [item that poses a risk — label HIGH / MEDIUM / LOW]
- [or: none]

suggestedUpdates:
- [specific data file change needed, e.g., "Mark task X as done in data/tasks.ts"]
- [another specific update]

nextBestAction: [one sentence — the single most important thing to do right now]

overallHealth: [healthy / needs-attention / stale / risky]
---

Do NOT edit any files. This is a read-only review.`;

const STATUS_ICON: Record<HealthStatus, string> = {
  ok: "✓",
  warning: "!",
  stale: "~",
  missing: "✕",
};

const STATUS_COLOR: Record<HealthStatus, string> = {
  ok: "text-emerald-400",
  warning: "text-yellow-400",
  stale: "text-blue-400",
  missing: "text-red-400",
};

const STATUS_ICON_BG: Record<HealthStatus, string> = {
  ok: "bg-emerald-950 border-emerald-900",
  warning: "bg-yellow-950 border-yellow-900",
  stale: "bg-blue-950 border-blue-900",
  missing: "bg-red-950 border-red-900",
};

const OVERALL_LABEL: Record<HealthStatus, string> = {
  ok: "Healthy",
  warning: "Needs attention",
  stale: "Some items stale",
  missing: "Missing updates",
};

const OVERALL_STYLE: Record<HealthStatus, { border: string; bg: string; text: string }> = {
  ok: { border: "border-emerald-900", bg: "bg-emerald-950/30", text: "text-emerald-300" },
  warning: { border: "border-yellow-900", bg: "bg-yellow-950/30", text: "text-yellow-300" },
  stale: { border: "border-blue-900", bg: "bg-blue-950/20", text: "text-blue-300" },
  missing: { border: "border-red-900", bg: "bg-red-950/30", text: "text-red-300" },
};

function HealthRow({ item }: { item: HealthItem }) {
  const content = (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${STATUS_ICON_BG[item.status]} ${STATUS_COLOR[item.status]}`}
      >
        {STATUS_ICON[item.status]}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${item.status === "ok" ? "text-neutral-300" : STATUS_COLOR[item.status]}`}>
          {item.label}
        </p>
        <p className="mt-0.5 text-xs text-neutral-600">{item.detail}</p>
      </div>
    </div>
  );

  if (item.link) {
    return (
      <a
        href={item.link}
        className="block rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700 transition-colors"
      >
        {content}
      </a>
    );
  }
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">{content}</div>
  );
}

export default function SystemHealthPage() {
  const sections = getAllHealthSections();
  const overall = getOverallStatus();
  const nextAction = getRecommendedAction();
  const style = OVERALL_STYLE[overall];

  const warningCount = sections
    .flatMap((s) => s.items)
    .filter((i) => i.status === "warning" || i.status === "missing" || i.status === "stale").length;

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">System Health</h1>
        <p className="mt-3 text-neutral-400">
          A snapshot of whether Builder OS is organized, current, and ready to use. All derived
          from the existing data files — no manual input required.
        </p>

        {/* Overall status */}
        <div className={`mt-6 rounded-xl border px-5 py-4 ${style.border} ${style.bg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-lg font-semibold ${style.text}`}>{OVERALL_LABEL[overall]}</p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {warningCount > 0
                  ? `${warningCount} item${warningCount > 1 ? "s" : ""} need attention`
                  : "All sections look current"}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.border} border ${style.text}`}>
              {OVERALL_LABEL[overall]}
            </span>
          </div>
        </div>

        {/* Recommended next action */}
        <div className="mt-4 rounded-xl border border-emerald-900 bg-emerald-950/20 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Recommended next action
          </p>
          <p className="mt-1.5 text-sm text-emerald-300">{nextAction}</p>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          {(["ok", "warning", "stale", "missing"] as HealthStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${STATUS_ICON_BG[s]} ${STATUS_COLOR[s]}`}
              >
                {STATUS_ICON[s]}
              </span>
              <span className="text-xs text-neutral-600 capitalize">
                {s === "ok" ? "OK" : s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Health sections */}
        <div className="mt-8 space-y-10">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
                  {section.title}
                </p>
                {section.link && (
                  <a
                    href={section.link}
                    className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
                  >
                    View all →
                  </a>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {section.items.map((item, i) => (
                  <HealthRow key={`${section.id}-${i}`} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Health review prompt */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold">Prompt: Review Builder OS Health</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Paste this into any Claude session to get a full health review across all data files.
            Returns stale items, risks, suggested updates, and the single best next action.
          </p>
          <div className="mt-3">
            <CopyPrompt text={healthPrompt} customizeLink />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/tasks", label: "Tasks" },
            { href: "/memory", label: "Memory" },
            { href: "/sessions", label: "Sessions" },
            { href: "/releases", label: "Releases" },
            { href: "/task-packets", label: "Task Packets" },
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
