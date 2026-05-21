import { MEMORY } from "@/data/memory";
import { PROJECT_MAP } from "@/data/projects";

export default function MemoryPage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Project Memory</h1>
        <p className="mt-3 text-neutral-400">
          Decisions, risks, and context for each project. Update{" "}
          <code className="rounded bg-neutral-800 px-1 text-xs">data/memory.ts</code>{" "}
          after each session.
        </p>

        <div className="mt-10 space-y-5">
          {MEMORY.map((mem) => {
            const project = PROJECT_MAP[mem.projectId];
            if (!project) return null;

            return (
              <a
                key={mem.projectId}
                href={`/projects/${mem.projectId}`}
                className="group block rounded-2xl border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold group-hover:text-emerald-400 transition-colors">
                    {project.name}
                  </h2>
                  <span className="text-xs text-neutral-600">
                    Updated {mem.lastUpdated}
                  </span>
                </div>

                <p className="mt-3 text-sm text-neutral-300">{mem.summary}</p>

                <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                    Current goal
                  </p>
                  <p className="mt-1.5 text-sm text-neutral-300">{mem.currentGoal}</p>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                      Decisions
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      {mem.decisions.length} recorded
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                      Risks
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      {mem.risks.length} noted
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-neutral-600 group-hover:text-emerald-600 transition-colors">
                  View full details →
                </p>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
