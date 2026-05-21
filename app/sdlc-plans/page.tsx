import { EXAMPLE_SDLC_PLANS, SDLC_SECTIONS } from "@/data/sdlcTemplate";

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-neutral-800 text-neutral-400",
  approved: "bg-emerald-900 text-emerald-300",
  "in-progress": "bg-blue-900 text-blue-300",
  complete: "bg-purple-900 text-purple-300",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
  "in-progress": "In Progress",
  complete: "Complete",
};

export default function SDLCPlansPage() {
  const plan = EXAMPLE_SDLC_PLANS[0];

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Builder OS</p>
            <h1 className="mt-2 text-4xl font-bold">SDLC Plans</h1>
            <p className="mt-3 max-w-xl text-neutral-400">
              Approved SDLC documents generated from planner conversations. Each plan drives task packet creation.
            </p>
          </div>
          <a
            href="/planner-chat"
            className="shrink-0 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            Start Planner Chat →
          </a>
        </div>

        {/* Plan list */}
        <div className="mt-8 space-y-3">
          {EXAMPLE_SDLC_PLANS.map((p) => (
            <a
              key={p.id}
              href={`#plan-${p.id}`}
              className="block rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-neutral-600">{p.id}</p>
                  <h2 className="mt-1 text-lg font-semibold">{p.title}</h2>
                  <p className="mt-1 text-sm text-neutral-400">{p.idea}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                  <p className="text-xs text-neutral-700">{p.createdAt}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Empty state placeholder */}
        <div className="mt-4 rounded-xl border border-dashed border-neutral-800 px-5 py-8 text-center">
          <p className="text-sm text-neutral-600">Your approved SDLC plans will appear here.</p>
          <p className="mt-1 text-xs text-neutral-700">Start with a planner conversation → approve the SDLC → it lands here.</p>
        </div>

        {/* Full plan detail */}
        <div id={`plan-${plan.id}`} className="mt-16 scroll-mt-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-800 pb-6">
            <div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[plan.status]}`}>
                {STATUS_LABEL[plan.status]}
              </span>
              <h2 className="mt-3 text-3xl font-bold">{plan.title}</h2>
              <p className="mt-2 text-neutral-400">{plan.idea}</p>
              <p className="mt-2 font-mono text-xs text-neutral-700">
                Project: {plan.projectId} · Created: {plan.createdAt}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <a
                href="/task-packets"
                className="rounded-xl border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-950/60 transition-colors"
              >
                View Task Packets →
              </a>
              <a
                href="/planner-chat"
                className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors text-center"
              >
                New Plan →
              </a>
            </div>
          </div>

          {/* All SDLC sections */}
          <div className="mt-8 space-y-6">
            {SDLC_SECTIONS.map((section, i) => {
              const items = plan.sections[section.id];
              return (
                <div key={section.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-neutral-800 px-5 py-4">
                    <span className="font-mono text-xs text-neutral-700">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-semibold text-neutral-200">{section.title}</h3>
                  </div>
                  <div className="px-5 py-4">
                    {items && items.length > 0 ? (
                      <ul className="space-y-2">
                        {items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-neutral-400">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm italic text-neutral-700">{section.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="mt-12 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/planner-chat", label: "Planner Chat" },
            { href: "/task-packets", label: "Task Packets" },
            { href: "/sessions", label: "Sessions" },
            { href: "/projects", label: "Projects" },
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
