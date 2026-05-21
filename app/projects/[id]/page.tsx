import { notFound } from "next/navigation";
import { PROJECTS, PROJECT_MAP, STATUS_LABEL, STATUS_COLOR, TYPE_LABEL } from "@/data/projects";
import { MEMORY_MAP } from "@/data/memory";
import { getSessionsForProject, STATUS_COLOR as SESSION_STATUS_COLOR, STATUS_LABEL as SESSION_STATUS_LABEL } from "@/data/sessions";
import { RELEASE_MAP, STATUS_LABEL as RELEASE_STATUS_LABEL, STATUS_COLOR as RELEASE_STATUS_COLOR } from "@/data/releases";
import { CopyButton } from "@/app/_components/CopyButton";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

function buildSuggestedPrompt(name: string, path: string, goal: string): string {
  return `You are helping with a safe coding task.

Project: ${name}
Local path: ${path}
Current goal: ${goal}

Rules:
- Work inside this single repository only.
- Do not touch other repos.
- Do not push to GitHub automatically.
- Do not delete data files.
- Do not expose .env or secrets.
- Explain each file you plan to change BEFORE editing.
- Summarize all changes after finishing.
- If unsure about a change, stop and ask.

Task:
[DESCRIBE THE SPECIFIC TASK HERE]`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = PROJECT_MAP[id];

  if (!project) {
    notFound();
  }

  const memory = MEMORY_MAP[id];
  const release = RELEASE_MAP[id];
  const recentSessions = getSessionsForProject(id, 3);
  const suggestedPrompt = buildSuggestedPrompt(
    project.name,
    project.localPath,
    memory?.currentGoal ?? project.currentGoal
  );

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <a href="/projects" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← All projects
        </a>

        {/* Header */}
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">{project.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">{TYPE_LABEL[project.type]}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLOR[project.status]}`}
          >
            {STATUS_LABEL[project.status]}
          </span>
        </div>

        <p className="mt-4 text-neutral-300">{project.purpose}</p>

        {/* Paths */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
              Local Path
            </p>
            <p className="mt-2 break-all font-mono text-sm text-neutral-300">
              {project.localPath}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
              Repository
            </p>
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-sm text-emerald-400 hover:text-emerald-300"
              >
                {project.repoUrl} ↗
              </a>
            ) : (
              <p className="mt-2 text-sm text-neutral-600">No public repo</p>
            )}
          </div>
        </div>

        {/* Memory section */}
        {memory ? (
          <>
            {/* Summary */}
            <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Memory</h2>
                <span className="text-xs text-neutral-600">Updated {memory.lastUpdated}</span>
              </div>
              <p className="mt-3 text-sm text-neutral-300">{memory.summary}</p>
            </div>

            {/* Current goal */}
            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-semibold">Current Goal</h2>
              <p className="mt-3 text-neutral-300">{memory.currentGoal}</p>
            </div>

            {/* Decisions */}
            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-semibold">Decisions</h2>
              <p className="mt-1 text-xs text-neutral-600">
                Choices already made — don&apos;t revisit unless you have a strong reason.
              </p>
              <ul className="mt-4 space-y-2">
                {memory.decisions.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-sm text-neutral-300">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="mt-4 rounded-2xl border border-yellow-900 bg-yellow-950/20 p-6">
              <h2 className="text-lg font-semibold text-yellow-300">Risks</h2>
              <p className="mt-1 text-xs text-yellow-900/80 text-neutral-600">
                Known risks — keep these in mind before starting any work.
              </p>
              <ul className="mt-4 space-y-2">
                {memory.risks.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-sm text-yellow-300">
                    <span className="mt-0.5 shrink-0 text-yellow-600">!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next actions from memory */}
            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-semibold">Next Actions</h2>
              <ul className="mt-4 space-y-2">
                {memory.nextActions.map((action, i) => (
                  <li key={action} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-neutral-700 text-xs text-neutral-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          // Fallback if no memory entry
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-semibold">Current Goal</h2>
            <p className="mt-3 text-neutral-300">{project.currentGoal}</p>

            <h2 className="mt-6 text-lg font-semibold">Next Actions</h2>
            <ul className="mt-4 space-y-2">
              {project.nextActions.map((action, i) => (
                <li key={action} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-neutral-700 text-xs text-neutral-600">
                    {i + 1}
                  </span>
                  <span className="text-sm text-neutral-300">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Release status */}
        {release && (
          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Release Status</h2>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-medium ${RELEASE_STATUS_COLOR[release.publicStatus]}`}
                >
                  {RELEASE_STATUS_LABEL[release.publicStatus]}
                </span>
                <a
                  href="/releases"
                  className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                >
                  Full pipeline →
                </a>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-400">{release.notes}</p>
            {release.checklist.length > 0 && (
              <div className="mt-4">
                {(() => {
                  const done = release.checklist.filter((c) => c.done).length;
                  const total = release.checklist.length;
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs text-neutral-600">
                        <span>Release checklist</span>
                        <span>{done}/{total}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-800">
                        <div
                          className="h-1.5 rounded-full bg-emerald-700 transition-all"
                          style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">Next action</p>
              <p className="mt-1 text-sm text-neutral-300">{release.nextAction}</p>
            </div>
          </div>
        )}

        {/* Safety Rules */}
        <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-300">Safety Rules</h2>
          <ul className="mt-4 space-y-2">
            {project.safetyRules.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-500">✕</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Recent Sessions</h2>
              <a
                href="/sessions"
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                View all →
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{s.goal}</p>
                      <p className="mt-0.5 text-xs text-neutral-600">
                        {s.date} · {s.toolUsed}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SESSION_STATUS_COLOR[s.status]}`}
                    >
                      {SESSION_STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">{s.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt actions */}
        <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Ready to work on this?</h2>
              <p className="mt-1 text-xs text-neutral-600">
                Use Prompt Builder to generate a task-specific prompt pre-filled with this project.
              </p>
            </div>
            <a
              href="/prompt-builder"
              className="shrink-0 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              Open Prompt Builder →
            </a>
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
              Show quick-start prompt
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black p-4 text-sm text-neutral-200">
              {suggestedPrompt}
            </pre>
            <CopyButton text={suggestedPrompt} />
          </details>
        </div>
      </section>
    </main>
  );
}
