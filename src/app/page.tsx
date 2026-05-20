export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">
          Private Builder OS
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          Project Command Center
        </h1>

        <p className="mt-4 max-w-2xl text-neutral-300">
          This is your private place to plan projects, track tasks,
          generate AI prompts, and manage what gets pushed publicly.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a href="/tasks" className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <p className="mt-2 text-neutral-400">View active project work.</p>
          </a>

          <a href="/prompts" className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">Prompt Generator</h2>
            <p className="mt-2 text-neutral-400">Copy prompts for Claude, Codex, or Ruflo.</p>
          </a>
        </div>
      </section>
    </main>
  );
}
