const prompts = [
  {
    title: "Clean Public EternalNotes Repo",
    text: `Analyze this repository as the public downloadable version of EternalNotes.

Do not edit files yet.

Find:
- auth/signup code
- billing/Stripe code
- private notes/data risks
- .env or secret risks
- setup friction
- README problems

Return:
1. public safety risks
2. files likely needing changes
3. safest cleanup order
4. what NOT to delete yet
5. one small first commit recommendation`,
  },
  {
    title: "Review Private Repo Safety",
    text: `Analyze this private EternalNotes repo.

Do not edit files yet.

Find:
- where my real notes/data are stored
- whether private data is gitignored
- whether .env files are protected
- whether databases are tracked
- whether uploads/notes folders are safe
- any risk of accidentally pushing private data

Return:
1. safety risks
2. backup recommendations
3. .gitignore improvements
4. files to avoid touching
5. one safe first commit recommendation`,
  },
  {
    title: "Small Safe Coding Task",
    text: `Work on this repository safely.

Goal:
[WRITE THE GOAL HERE]

Rules:
- Make the smallest safe change.
- Do not touch unrelated files.
- Do not delete data.
- Do not expose secrets.
- Explain what files you will change before editing.
- After editing, summarize changed files.
- Run typecheck/build if available.`,
  },
  {
    title: "Generate Next Task Plan",
    text: `Based on this project state, create the next task plan.

Project:
[PROJECT NAME]

Current goal:
[CURRENT GOAL]

Known constraints:
[CONSTRAINTS]

Return:
1. the next 5 small tasks
2. the safest order
3. what should not be touched yet
4. one recommended first task
5. a commit message for each task`,
  },
];

export default function PromptsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", padding: "48px" }}>
      <a href="/" style={{ color: "#34d399" }}>← Back</a>

      <h1 style={{ fontSize: "42px", fontWeight: "bold", marginTop: "32px" }}>
        Prompt Generator
      </h1>

      <p style={{ maxWidth: "700px", color: "#d4d4d8", marginTop: "16px" }}>
        Copy these prompts into Claude Code, Codex, ChatGPT, or Ruflo.
      </p>

      <div style={{ marginTop: "32px", display: "grid", gap: "24px" }}>
        {prompts.map((prompt) => (
          <section
            key={prompt.title}
            style={{
              border: "1px solid #27272a",
              borderRadius: "20px",
              padding: "24px",
              background: "#09090b",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>
              {prompt.title}
            </h2>

            <pre
              style={{
                marginTop: "16px",
                background: "black",
                padding: "16px",
                borderRadius: "12px",
                whiteSpace: "pre-wrap",
                overflowX: "auto",
                color: "#d4d4d8",
              }}
            >
              {prompt.text}
            </pre>
          </section>
        ))}
      </div>
    </main>
  );
}