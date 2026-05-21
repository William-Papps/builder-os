const projects = [
  {
    name: "Builder OS",
    slug: null,
    purpose: "Private dashboard for planning, prompts, tasks, and managing the whole system. Never make this public.",
    path: "C:\\Users\\willi\\Projects\\builder-os",
    github: null,
    status: "Active",
    next: "Expand memory files, add more project pages",
    rules: [
      "Private only — never push to a public repo",
      "No login or accounts needed",
      "No real data stored yet — Markdown files only",
    ],
  },
  {
    name: "Builder Hub",
    slug: null,
    purpose: "Public website showing free downloadable tools. Currently only EternalNotes.",
    path: "C:\\Users\\willi\\Projects\\builder-hub",
    github: "https://github.com/William-Papps/builder-hub",
    status: "In Progress",
    next: "Finish public homepage and add EternalNotes page",
    rules: [
      "Public website only — no private controls",
      "No private notes or data",
      "No Ruflo controls visible",
    ],
  },
  {
    name: "Public EternalNotes",
    slug: "/projects/eternalnotes",
    purpose: "Open-source local-first RAG note tool. Clean, simple, no accounts, no billing.",
    path: "C:\\Users\\willi\\Projects\\obsidian-like-rag-system",
    github: "https://github.com/William-Papps/obsidian-like-rag-system",
    status: "Cleanup Needed",
    next: "Remove auth/billing code, add sample notes, rewrite README",
    rules: [
      "Sample notes only — no real private notes",
      "No auth, no billing, no private data",
      "Must be clean and simple to set up",
    ],
  },
  {
    name: "Private EternalNotes",
    slug: "/projects/eternalnotes",
    purpose: "Personal setup with real notes. Kept private forever.",
    path: "C:\\Users\\willi\\Projects\\private-eternalnotes",
    github: "https://github.com/William-Papps/private-eternalnotes",
    status: "Safe",
    next: "Verify .gitignore protects notes folder and databases",
    rules: [
      "Never push real notes to GitHub",
      "Never push .env files",
      "Backup before any changes",
      "Do not merge code from public repo without review",
    ],
  },
];

const statusColor: Record<string, string> = {
  Active: "bg-emerald-900 text-emerald-300",
  "In Progress": "bg-blue-900 text-blue-300",
  "Cleanup Needed": "bg-yellow-900 text-yellow-300",
  Safe: "bg-neutral-800 text-neutral-300",
};

export default function ProjectsPage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold">Projects</h1>
        <p className="mt-3 text-neutral-400">
          Overview of all repos in the system. Each has its own purpose, rules, and current status.
        </p>

        <div className="mt-10 space-y-6">
          {projects.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{p.name}</h2>
                  <p className="mt-1 font-mono text-xs text-neutral-600">{p.path}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[p.status] ?? "bg-neutral-800 text-neutral-300"}`}
                >
                  {p.status}
                </span>
              </div>

              <p className="mt-4 text-neutral-300">{p.purpose}</p>

              <div className="mt-4 flex flex-wrap gap-3">
                {p.slug && (
                  <a
                    href={p.slug}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
                  >
                    View Details →
                  </a>
                )}
                {p.github && (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
                  >
                    GitHub ↗
                  </a>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                    Next Action
                  </p>
                  <p className="mt-2 text-sm text-neutral-300">{p.next}</p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                    Safety Rules
                  </p>
                  <ul className="mt-2 space-y-1">
                    {p.rules.map((r) => (
                      <li key={r} className="flex items-start gap-1.5 text-sm text-neutral-400">
                        <span className="mt-0.5 shrink-0 text-neutral-600">—</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
