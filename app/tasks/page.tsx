type Task = { label: string; done?: boolean; note?: string };

const taskGroups: { title: string; color: string; tasks: Task[] }[] = [
  {
    title: "Builder OS",
    color: "border-emerald-900",
    tasks: [
      { label: "Build dashboard homepage", done: true },
      { label: "Build projects page", done: true },
      { label: "Build EternalNotes project page", done: true },
      { label: "Build tasks page", done: true },
      { label: "Build prompt generator page", done: true },
      { label: "Create memory files", done: true },
      { label: "Add nav layout" },
      { label: "Add safety workflow section" },
      { label: "Link Builder Hub project page" },
    ],
  },
  {
    title: "Builder Hub",
    color: "border-blue-900",
    tasks: [
      { label: "Finish public homepage" },
      { label: "Add EternalNotes project page" },
      { label: "Add install instructions" },
      { label: "Add screenshots", note: "After public repo is clean" },
    ],
  },
  {
    title: "Public EternalNotes",
    color: "border-yellow-900",
    tasks: [
      { label: "Remove accounts/signup code" },
      { label: "Remove billing/Stripe code" },
      { label: "Remove private data from repo" },
      { label: "Add sample notes" },
      { label: "Rewrite README" },
      { label: "Simplify installation" },
    ],
  },
  {
    title: "Private EternalNotes — Safety",
    color: "border-red-900",
    tasks: [
      { label: "Verify .gitignore protects notes folder" },
      { label: "Verify .env is not tracked" },
      { label: "Verify database files are not tracked" },
      { label: "Backup notes before any changes" },
      { label: "Audit GitHub history for accidental data leaks" },
    ],
  },
];

export default function TasksPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold">Active Tasks</h1>
        <p className="mt-3 text-neutral-400">
          Tasks grouped by project. Update memory files when tasks are completed.
        </p>

        <div className="mt-8 space-y-6">
          {taskGroups.map((group) => (
            <div
              key={group.title}
              className={`rounded-2xl border bg-neutral-900 p-6 ${group.color}`}
            >
              <h2 className="text-xl font-semibold">{group.title}</h2>

              <ul className="mt-5 space-y-3">
                {group.tasks.map((task) => (
                  <li key={task.label} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        task.done
                          ? "border-emerald-600 bg-emerald-900 text-emerald-400"
                          : "border-neutral-700"
                      } text-xs`}
                    >
                      {task.done ? "✓" : ""}
                    </span>
                    <span className={`text-sm ${task.done ? "text-neutral-500 line-through" : "text-neutral-300"}`}>
                      {task.label}
                      {task.note && (
                        <span className="ml-2 text-xs text-neutral-600">
                          ({task.note})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
