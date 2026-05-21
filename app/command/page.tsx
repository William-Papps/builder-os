import { PROJECT_MAP } from "@/data/projects";
import { CopyPrompt } from "@/app/_components/CopyPrompt";
import { TASKS, PRIORITY_COLOR, type Task } from "@/data/tasks";
import {
  getRecentSessions,
  STATUS_COLOR as SESSION_STATUS_COLOR,
  STATUS_LABEL as SESSION_STATUS_LABEL,
} from "@/data/sessions";
import { RELEASES } from "@/data/releases";

const STATUS_PRIORITY: Record<string, number> = {
  "in-progress": 1,
  review: 2,
  ready: 3,
  backlog: 4,
};

const PRIORITY_WEIGHT: Record<string, number> = { high: 1, medium: 2, low: 3 };

function getRecommended(limit: number): Task[] {
  return [...TASKS]
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const s = (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5);
      if (s !== 0) return s;
      return (PRIORITY_WEIGHT[a.priority] ?? 5) - (PRIORITY_WEIGHT[b.priority] ?? 5);
    })
    .slice(0, limit);
}

function buildCommandPrompt(task: Task | undefined, projectName: string): string {
  if (!task) {
    return "No active tasks found.\n\nUpdate data/tasks.ts with your next priorities, then reopen /command.";
  }
  return `Review the current state of my Builder OS projects and recommend the safest next action.

Active project: ${projectName}
Recommended task: ${task.title}

Review in order:
1. Current tasks — what is in-progress, ready, or backlog? What is highest priority?
2. Latest session results — what was completed last? Any open follow-ups?
3. Release pipeline — are any projects blocked before going public?
4. Project memory — any open risks or decisions that affect this task?

Return:
1. The single safest next action I can take right now
2. Any blockers or risks to address first
3. What NOT to touch yet
4. A one-sentence session goal I can use as a commit message prefix

Do NOT edit any files. This is a planning review only.
Do not push to GitHub automatically.`;
}

export default function CommandPage() {
  const recommended = getRecommended(4);
  const [topTask, ...nextTasks] = recommended;
  const topProject = topTask ? PROJECT_MAP[topTask.projectId] : undefined;
  const latestSession = getRecentSessions(1)[0];
  const needsAttention = RELEASES.filter(
    (r) => r.publicStatus === "needs-review" || r.publicStatus === "preparing-public"
  );
  const commandPrompt = buildCommandPrompt(topTask, topProject?.name ?? "Unknown");

  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Daily Command</h1>
        <p className="mt-3 text-neutral-400">
          Your starting point for every work session. One recommended task, one suggested prompt.
        </p>

        {/* Release warning */}
        {needsAttention.length > 0 && (
          <div className="mt-5 rounded-xl border border-yellow-900 bg-yellow-950/30 px-4 py-3">
            <p className="text-sm text-yellow-300">
              {needsAttention.length} project{needsAttention.length > 1 ? "s" : ""} need
              attention before going public.{" "}
              <a href="/releases" className="underline hover:text-yellow-200 transition-colors">
                Check release pipeline →
              </a>
            </p>
          </div>
        )}

        {/* Top recommended task */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Recommended task
          </p>
          {topTask ? (
            <div className="mt-3 rounded-2xl border border-emerald-800 bg-emerald-950/20 p-6">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[topTask.priority]}`}
                >
                  {topTask.priority}
                </span>
                <span className="text-xs text-neutral-600 capitalize">
                  {topTask.status.replace("-", " ")}
                </span>
                {topProject && (
                  <span className="text-xs text-neutral-700">{topProject.name}</span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-semibold">{topTask.title}</h2>
              <div className="mt-4 rounded-xl border border-emerald-900 bg-neutral-950 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                  Next action
                </p>
                <p className="mt-1 text-sm text-neutral-300">{topTask.nextAction}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="/prompt-builder"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600 transition-colors"
                >
                  Build prompt →
                </a>
                {topProject && (
                  <a
                    href={`/projects/${topTask.projectId}`}
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-xs text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors"
                  >
                    View project →
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-neutral-500">
                No active tasks. Update <code className="rounded bg-neutral-800 px-1 text-xs">data/tasks.ts</code> to add priorities.
              </p>
            </div>
          )}
        </div>

        {/* Next 3 tasks */}
        {nextTasks.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
              Up next
            </p>
            <div className="mt-3 space-y-2">
              {nextTasks.map((t) => {
                const proj = PROJECT_MAP[t.projectId];
                return (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[t.priority]}`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-sm truncate">{t.title}</span>
                      {proj && (
                        <span className="shrink-0 text-xs text-neutral-600">{proj.name}</span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-700 capitalize shrink-0">
                      {t.status.replace("-", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
            <a
              href="/tasks"
              className="mt-3 inline-block text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              View full task board →
            </a>
          </div>
        )}

        {/* Latest session */}
        {latestSession && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
              Last session
            </p>
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{latestSession.goal}</p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    {latestSession.date} · {latestSession.toolUsed} ·{" "}
                    {PROJECT_MAP[latestSession.projectId]?.name ?? latestSession.projectId}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SESSION_STATUS_COLOR[latestSession.status]}`}
                >
                  {SESSION_STATUS_LABEL[latestSession.status]}
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">{latestSession.summary}</p>
              {latestSession.nextActions.length > 0 && (
                <div className="mt-3 border-t border-neutral-800 pt-3">
                  <p className="text-xs text-neutral-600">Follow-up from last session:</p>
                  <ul className="mt-1.5 space-y-1">
                    {latestSession.nextActions.slice(0, 2).map((a) => (
                      <li key={a} className="text-xs text-neutral-400">
                        → {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suggested prompt */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Suggested prompt
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Paste this into Claude Code or Codex while inside the{" "}
            {topProject ? (
              <strong className="text-neutral-500">{topProject.name}</strong>
            ) : (
              "target"
            )}{" "}
            repo.
          </p>
          <div className="mt-3">
            <CopyPrompt text={commandPrompt} customizeLink />
          </div>
        </div>

        {/* Workflow steps */}
        <div className="mt-10 border-t border-neutral-800 pt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Core workflow
          </p>
          <div className="mt-4 space-y-2">
            {[
              { href: "/planner-chat",              label: "1. Planner Chat",         desc: "Start here — turn your idea into an SDLC plan" },
              { href: "/sdlc-plans",                label: "2. SDLC Plans",            desc: "Review the full spec before writing any code" },
              { href: "/task-packets",              label: "3. Task Packets",          desc: "Create one scoped packet per agent run" },
              { href: "/execution",                 label: "4. Execution Export",      desc: "Copy the prompts and run them in the correct repo" },
              { href: "/execution-result-template", label: "5. Import Result",         desc: "Fill in what the agent did and bring it back here" },
              { href: "/sessions",                  label: "6. Session Log",           desc: "Record the result in data/sessions.ts" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700 transition-colors group"
              >
                <p className="text-sm font-semibold text-neutral-300 group-hover:text-emerald-400 transition-colors shrink-0">
                  {link.label}
                </p>
                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
