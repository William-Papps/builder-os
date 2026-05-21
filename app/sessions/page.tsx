import {
  getRecentSessions,
  STATUS_COLOR,
  STATUS_LABEL,
  type Session,
} from "@/data/sessions";
import { PROJECT_MAP } from "@/data/projects";

function SessionCard({ session }: { session: Session }) {
  const project = PROJECT_MAP[session.projectId];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-600">{session.date}</span>
            {project && (
              <a
                href={`/projects/${session.projectId}`}
                className="text-xs text-emerald-600 hover:text-emerald-400 transition-colors"
              >
                {project.name}
              </a>
            )}
            <span className="text-xs text-neutral-700">{session.toolUsed}</span>
          </div>
          <h2 className="text-lg font-semibold">{session.goal}</h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[session.status]}`}
        >
          {STATUS_LABEL[session.status]}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-neutral-300">{session.summary}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Changed files */}
        {session.changedFiles.length > 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
              Changed files
            </p>
            <ul className="mt-2 space-y-1">
              {session.changedFiles.map((f) => (
                <li key={f} className="font-mono text-xs text-neutral-500">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next actions */}
        {session.nextActions.length > 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
              Next actions
            </p>
            <ul className="mt-2 space-y-1.5">
              {session.nextActions.map((a) => (
                <li key={a} className="flex items-start gap-1.5 text-xs text-neutral-400">
                  <span className="mt-0.5 shrink-0 text-neutral-700">→</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const sessions = getRecentSessions();

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Session Log</h1>
        <p className="mt-3 text-neutral-400">
          A record of every AI/code session across all projects. Add new entries to{" "}
          <code className="rounded bg-neutral-800 px-1 text-xs">data/sessions.ts</code>{" "}
          after each session.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
          <p className="text-sm text-neutral-400">
            After each session, use the{" "}
            <a href="/prompt-builder" className="text-emerald-400 hover:text-emerald-300">
              Summarize Session
            </a>{" "}
            prompt to generate a structured summary — then paste it into{" "}
            <code className="rounded bg-neutral-800 px-1 text-xs">data/sessions.ts</code>.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      </section>
    </main>
  );
}
