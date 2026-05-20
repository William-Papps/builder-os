export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <a href="/" className="text-sm text-emerald-400">
          ← Back
        </a>

        <h1 className="mt-8 text-4xl font-bold">
          Projects
        </h1>

        <div className="mt-8 grid gap-4">
          <a
            href="/projects/eternalnotes"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          >
            <h2 className="text-2xl font-semibold">
              EternalNotes
            </h2>

            <p className="mt-2 text-neutral-300">
              Private personal version plus public open-source version.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}