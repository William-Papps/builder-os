export default function EternalNotesProjectPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <a href="/" className="text-sm text-emerald-400">
          ← Back
        </a>

        <h1 className="mt-8 text-4xl font-bold">
          EternalNotes
        </h1>

        <p className="mt-4 text-neutral-300">
          A local-first RAG note-taking system using Markdown notes.
        </p>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-2xl font-semibold">
            Current Goal
          </h2>

          <p className="mt-3 text-neutral-300">
            Split the project into a private version and public version.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-2xl font-semibold">
            Repositories
          </h2>

          <div className="mt-4 space-y-3 text-neutral-300">
            <p>
              Private Repo:
              {" "}
              <a
                className="text-emerald-400"
                href="https://github.com/William-Papps/private-eternalnotes"
              >
                private-eternalnotes
              </a>
            </p>

            <p>
              Public Repo:
              {" "}
              <a
                className="text-emerald-400"
                href="https://github.com/William-Papps/obsidian-like-rag-system"
              >
                obsidian-like-rag-system
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}