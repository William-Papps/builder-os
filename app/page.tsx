const projects = [
  {
    name: "Builder OS",
    href: "/projects",
    purpose: "Private dashboard for planning, tasks, prompts, and managing projects.",
    path: "C:\\Users\\willi\\Projects\\builder-os",
    status: "Active",
    next: "Expand project memory files",
  },
  {
    name: "Builder Hub",
    href: "/projects",
    purpose: "Public website showing downloadable free tools like EternalNotes.",
    path: "C:\\Users\\willi\\Projects\\builder-hub",
    status: "In Progress",
    next: "Finish public homepage + EternalNotes page",
  },
  {
    name: "Public EternalNotes",
    href: "/projects/eternalnotes",
    purpose: "Open-source local-first RAG note tool. No accounts, no billing.",
    path: "C:\\Users\\willi\\Projects\\obsidian-like-rag-system",
    status: "Cleanup Needed",
    next: "Remove auth/billing, add sample notes",
  },
  {
    name: "Private EternalNotes",
    href: "/projects/eternalnotes",
    purpose: "Personal setup with real notes. Never push to public.",
    path: "C:\\Users\\willi\\Projects\\private-eternalnotes",
    status: "Safe",
    next: "Verify .gitignore protects notes folder",
  },
];

const workflowSteps = [
  "Think in Builder OS",
  "Generate prompt",
  "Run Claude / Codex / Ruflo manually inside one repo",
  "Review changes",
  "Test locally",
  "Commit",
  "Push public-safe changes",
  "Update Builder Hub",
];

const safetyRules = [
  "Never expose private notes",
  "Never push .env files",
  "Public repo gets sample data only",
  "Builder Hub is public only",
  "Builder OS is private only",
  "Agents should not push/deploy automatically yet",
];

const statusColor: Record<string, string> = {
  Active: "bg-emerald-900 text-emerald-300",
  "In Progress": "bg-blue-900 text-blue-300",
  "Cleanup Needed": "bg-yellow-900 text-yellow-300",
  Safe: "bg-neutral-800 text-neutral-300",
};

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-medium text-emerald-400">Private Builder OS</p>
        <h1 className="mt-3 text-5xl font-bold">Project Command Center</h1>
        <p className="mt-4 max-w-2xl text-neutral-400">
          Your private place to plan projects, track tasks, generate AI prompts, and
          manage what gets pushed publicly.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/projects"
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium hover:border-neutral-600 hover:bg-neutral-800 transition-colors"
          >
            View Projects
          </a>
          <a
            href="/tasks"
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium hover:border-neutral-600 hover:bg-neutral-800 transition-colors"
          >
            Active Tasks
          </a>
          <a
            href="/prompts"
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            Prompt Generator
          </a>
        </div>
      </section>

      {/* Projects */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-2xl font-semibold">Projects</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <a
              key={p.name}
              href={p.href}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold group-hover:text-emerald-400 transition-colors">
                  {p.name}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[p.status] ?? "bg-neutral-800 text-neutral-300"}`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-400">{p.purpose}</p>
              <p className="mt-3 font-mono text-xs text-neutral-600">{p.path}</p>
              <p className="mt-3 text-sm text-neutral-500">
                <span className="text-neutral-400">Next:</span> {p.next}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-2xl font-semibold">Safe Workflow</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Follow this order every time you work on a project.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {workflowSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm">
                <span className="mr-2 text-xs text-emerald-500">{i + 1}</span>
                {step}
              </div>
              {i < workflowSteps.length - 1 && (
                <span className="text-neutral-700">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Safety Rules */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">Safety Rules</h2>
        <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <ul className="space-y-2">
            {safetyRules.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-500">✕</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
