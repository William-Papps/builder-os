export default function PromptsPage() {
  const prompt = `Analyze this repository as a public open-source local-first app.

Do not edit files yet.

Find:
- auth/signup code
- billing code
- private notes/data
- .env or secret risks
- setup friction
- README problems

Return:
1. public safety risks
2. files likely needing changes
3. safest cleanup order
4. one safe first commit recommendation`;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <a href="/" className="text-sm text-emerald-400">
          ← Back
        </a>

        <h1 className="mt-8 text-4xl font-bold">
          Prompt Generator
        </h1>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-2xl font-semibold">
            Public Repo Safety Audit
          </h2>

          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black p-4 text-sm text-neutral-200">
            {prompt}
          </pre>
        </div>
      </section>
    </main>
  );
}