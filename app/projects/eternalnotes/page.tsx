export default function EternalNotesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", padding: "48px" }}>
      <a href="/" style={{ color: "#34d399" }}>
        ← Back
      </a>

      <h1 style={{ fontSize: "52px", fontWeight: "bold", marginTop: "32px" }}>
        EternalNotes
      </h1>

      <section style={{ marginTop: "32px", border: "1px solid #27272a", borderRadius: "20px", padding: "24px" }}>
        <h2>Purpose</h2>

        <p style={{ marginTop: "12px", color: "#d4d4d8" }}>
          A free local-first RAG note system using Markdown notes.
        </p>
      </section>

      <section style={{ marginTop: "24px", border: "1px solid #27272a", borderRadius: "20px", padding: "24px" }}>
        <h2>Current Direction</h2>

        <ul style={{ marginTop: "12px", color: "#d4d4d8", lineHeight: "1.8" }}>
          <li>Private personal version</li>
          <li>Public open-source version</li>
        </ul>
      </section>

      <section style={{ marginTop: "24px", border: "1px solid #27272a", borderRadius: "20px", padding: "24px" }}>
        <h2>Repositories</h2>

        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <a
            href="https://github.com/William-Papps/private-eternalnotes"
            style={{ color: "#34d399" }}
          >
            Private Repo
          </a>

          <a
            href="https://github.com/William-Papps/obsidian-like-rag-system"
            style={{ color: "#34d399" }}
          >
            Public Repo
          </a>
        </div>
      </section>
    </main>
  );
}