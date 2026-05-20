export default function TasksPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <a href="/" className="text-sm text-emerald-400">
          ← Back
        </a>

        <h1 className="mt-8 text-4xl font-bold">
          Active Tasks
        </h1>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-2xl font-semibold">
            Builder Hub
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-neutral-300">
            <li>Finish public homepage</li>
            <li>Add EternalNotes page</li>
            <li>Add screenshots later</li>
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-2xl font-semibold">
            Public EternalNotes
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-neutral-300">
            <li>Remove accounts/signup</li>
            <li>Remove billing</li>
            <li>Add sample notes</li>
          </ul>
        </div>
      </section>
    </main>
  );
}