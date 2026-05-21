import { PROJECT_MAP, STATUS_LABEL, STATUS_COLOR } from "@/data/projects";

export default function EternalNotesOverviewPage() {
  const pub = PROJECT_MAP["eternalnotes-public"];
  const priv = PROJECT_MAP["eternalnotes-private"];

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <a href="/projects" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← All projects
        </a>

        <h1 className="mt-6 text-4xl font-bold">EternalNotes</h1>
        <p className="mt-3 text-neutral-400">
          A free local-first RAG note-taking system using Markdown. Split into a
          private personal version and a clean public open-source version.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[pub, priv].map((p) => (
            <a
              key={p.id}
              href={`/projects/${p.id}`}
              className="group block rounded-2xl border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold group-hover:text-emerald-400 transition-colors">
                  {p.name}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </div>

              <p className="mt-2 text-sm text-neutral-400">{p.purpose}</p>

              <p className="mt-3 font-mono text-xs text-neutral-700">{p.localPath}</p>

              {p.repoUrl && (
                <p className="mt-2 text-xs text-emerald-600 group-hover:text-emerald-400 transition-colors">
                  {p.repoUrl}
                </p>
              )}

              <p className="mt-4 text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                View full details →
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
