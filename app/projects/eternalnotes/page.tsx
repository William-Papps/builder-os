import { CopyButton } from "@/app/_components/CopyButton";

const currentTasks = [
  "Remove accounts/signup code",
  "Remove billing/Stripe code",
  "Remove private data from repo",
  "Add sample notes (no real notes)",
  "Rewrite README for simple setup",
  "Simplify installation instructions",
];

const safetyRules = [
  "Never put real notes in the public repo",
  "Never push .env files",
  "Public repo must contain sample notes only",
  "Keep private repo notes in .gitignore",
  "Backup private notes before any changes",
  "Do not merge public code into private without review",
];

const recommendedPrompt = `Analyze this repository as the public downloadable version of EternalNotes.

Do not edit files yet.

Find:
- auth/signup code to remove
- billing/Stripe code to remove
- private notes or real data at risk
- .env or secret risks
- setup friction for new users
- README problems

Return:
1. public safety risks
2. files likely needing changes
3. safest cleanup order
4. what NOT to delete yet
5. one small safe first commit recommendation`;

export default function EternalNotesProjectPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold">EternalNotes</h1>
        <p className="mt-3 text-neutral-400">
          A free local-first RAG note-taking system using Markdown. Split into a
          private personal version and a clean public open-source version.
        </p>

        {/* Repos */}
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold">Repositories</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                Private Repo
              </p>
              <p className="mt-1 font-mono text-xs text-neutral-500">
                C:\Users\willi\Projects\private-eternalnotes
              </p>
              <a
                href="https://github.com/William-Papps/private-eternalnotes"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-emerald-400 hover:border-emerald-700 transition-colors"
              >
                Open on GitHub ↗
              </a>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
                Public Repo
              </p>
              <p className="mt-1 font-mono text-xs text-neutral-500">
                C:\Users\willi\Projects\obsidian-like-rag-system
              </p>
              <a
                href="https://github.com/William-Papps/obsidian-like-rag-system"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-emerald-400 hover:border-emerald-700 transition-colors"
              >
                Open on GitHub ↗
              </a>
            </div>
          </div>
        </div>

        {/* Current Goal */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold">Current Goal</h2>
          <p className="mt-3 text-neutral-300">
            Clean the public repo so it is a simple, safe, downloadable open-source
            tool. No accounts, no billing, no private data. Anyone should be able to
            clone it and run it with minimal setup.
          </p>
        </div>

        {/* Tasks */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold">Current Tasks</h2>
          <ul className="mt-4 space-y-2">
            {currentTasks.map((task) => (
              <li key={task} className="flex items-start gap-2.5 text-sm text-neutral-300">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-neutral-700" />
                {task}
              </li>
            ))}
          </ul>
        </div>

        {/* Safety Rules */}
        <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-xl font-semibold text-red-300">Safety Rules</h2>
          <ul className="mt-4 space-y-2">
            {safetyRules.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-500">✕</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Prompt */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold">Recommended Next Claude Prompt</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Run this in the public repo (obsidian-like-rag-system) to audit it safely.
          </p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black p-4 text-sm text-neutral-200">
            {recommendedPrompt}
          </pre>
          <CopyButton text={recommendedPrompt} />
        </div>
      </section>
    </main>
  );
}
