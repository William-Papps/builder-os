export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", padding: "48px" }}>
      <p style={{ color: "#34d399" }}>Private Builder OS</p>
      <h1 style={{ fontSize: "48px", fontWeight: "bold", marginTop: "16px" }}>
        Project Command Center
      </h1>
      <p style={{ maxWidth: "650px", marginTop: "16px", color: "#d4d4d8" }}>
        This is your private place to plan projects, track tasks, generate AI prompts,
        and manage what gets pushed publicly.
      </p>
      <div style={{ display: "flex", gap: "16px", marginTop: "40px" }}>
<a href="/projects/eternalnotes" style={{ border: "1px solid #27272a", padding: "24px", borderRadius: "16px", color: "white" }}>
  EternalNotes Project
</a>
        <a href="/tasks" style={{ border: "1px solid #27272a", padding: "24px", borderRadius: "16px", color: "white" }}>
          Tasks
        </a>
        <a href="/prompts" style={{ border: "1px solid #27272a", padding: "24px", borderRadius: "16px", color: "white" }}>
          Prompt Generator
        </a>
      </div>
    </main>
  );
}
