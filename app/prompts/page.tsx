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
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", padding: "48px" }}>
      <a href="/" style={{ color: "#34d399" }}>? Back</a>

      <h1 style={{ fontSize: "42px", fontWeight: "bold", marginTop: "32px" }}>
        Prompt Generator
      </h1>

      <section style={{ marginTop: "32px", border: "1px solid #27272a", borderRadius: "16px", padding: "24px" }}>
        <h2>Public Repo Safety Audit</h2>

        <pre style={{ marginTop: "16px", background: "black", padding: "16px", borderRadius: "12px", whiteSpace: "pre-wrap" }}>
          {prompt}
        </pre>
      </section>
    </main>
  );
}
