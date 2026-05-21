import {
  TASKS,
  STATUS_ORDER,
  STATUS_LABEL,
  PRIORITY_COLOR,
  PROMPT_TYPE_LABEL,
  type Task,
  type TaskStatus,
} from "@/data/tasks";
import { PROJECT_MAP } from "@/data/projects";

function TaskCard({ task }: { task: Task }) {
  const project = PROJECT_MAP[task.projectId];

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
      {/* Priority + title */}
      <div>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}
        >
          {task.priority}
        </span>
        <p className="mt-2 text-sm font-semibold leading-snug">{task.title}</p>
      </div>

      {/* Project link */}
      {project && (
        <a
          href={`/projects/${task.projectId}`}
          className="block text-xs text-emerald-600 hover:text-emerald-400 transition-colors"
        >
          {project.name} →
        </a>
      )}

      {/* Next action */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
          Next
        </p>
        <p className="mt-1 text-xs text-neutral-400">{task.nextAction}</p>
      </div>

      {/* Suggested prompt */}
      <a
        href="/prompt-builder"
        className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 hover:border-emerald-800 transition-colors group"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
            Suggested prompt
          </p>
          <p className="mt-0.5 text-xs text-neutral-400 group-hover:text-emerald-400 transition-colors">
            {PROMPT_TYPE_LABEL[task.suggestedPromptType]}
          </p>
        </div>
        <span className="text-xs text-neutral-700 group-hover:text-emerald-600 transition-colors">
          Build →
        </span>
      </a>
    </div>
  );
}

function Column({
  status,
  tasks,
}: {
  status: TaskStatus;
  tasks: Task[];
}) {
  const colors: Record<TaskStatus, string> = {
    backlog: "text-neutral-500",
    ready: "text-blue-400",
    "in-progress": "text-emerald-400",
    review: "text-yellow-400",
    done: "text-neutral-600",
  };

  return (
    <div className="flex w-64 shrink-0 flex-col gap-3 lg:w-auto lg:flex-1">
      {/* Column header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${colors[status]}`}>
          {STATUS_LABEL[status]}
        </h2>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-800 px-4 py-6 text-center text-xs text-neutral-700">
            Empty
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const grouped = STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>(
    (acc, s) => {
      acc[s] = TASKS.filter((t) => t.status === s);
      return acc;
    },
    { backlog: [], ready: [], "in-progress": [], review: [], done: [] }
  );

  const totalActive = TASKS.filter((t) => t.status !== "done").length;

  return (
    <main>
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Task Board</h1>
          <p className="mt-2 text-neutral-400">
            {totalActive} active tasks across {Object.keys(PROJECT_MAP).length} projects.
            Edit <code className="rounded bg-neutral-800 px-1 text-xs">data/tasks.ts</code> to
            update.
          </p>
        </div>

        {/* Kanban columns — horizontally scrollable */}
        <div className="mt-8 overflow-x-auto pb-4">
          <div className="mx-auto flex min-w-max gap-4 px-6 lg:max-w-[1400px] lg:min-w-0 lg:grid lg:grid-cols-5">
            {STATUS_ORDER.map((status) => (
              <Column key={status} status={status} tasks={grouped[status]} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
