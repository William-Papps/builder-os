import { PROJECTS, STATUS_LABEL, STATUS_COLOR, TYPE_LABEL } from "@/data/projects";

export default function ProjectsPage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold">Projects</h1>
        <p className="mt-3 text-neutral-400">
          {PROJECTS.length} connected projects. Each has its own purpose, rules, and current status.
        </p>

        <div className="mt-10 space-y-5">
          {PROJECTS.map((p) => (
            <a
              key={p.id}
              href={`/projects/${p.id}`}
              className="group block rounded-2xl border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold group-hover:text-emerald-400 transition-colors">
                    {p.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    {TYPE_LABEL[p.type]}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </div>

              <p className="mt-3 text-sm text-neutral-400">{p.purpose}</p>

              <div className="mt-4 flex items-center justify-between">
                <p className="font-mono text-xs text-neutral-700">{p.localPath}</p>
                <span className="text-xs text-neutral-600 group-hover:text-emerald-500 transition-colors">
                  View details →
                </span>
              </div>

              {p.nextActions[0] && (
                <p className="mt-3 text-sm text-neutral-500">
                  <span className="text-neutral-400">Next:</span>{" "}
                  {p.nextActions[0]}
                </p>
              )}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
