export default function TasksPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", padding: "48px" }}>
      <a href="/" style={{ color: "#34d399" }}>? Back</a>

      <h1 style={{ fontSize: "42px", fontWeight: "bold", marginTop: "32px" }}>
        Active Tasks
      </h1>

      <section style={{ marginTop: "32px", border: "1px solid #27272a", borderRadius: "16px", padding: "24px" }}>
        <h2>Builder Hub</h2>
        <ul>
          <li>Finish public homepage</li>
          <li>Add EternalNotes page</li>
          <li>Add screenshots later</li>
        </ul>
      </section>

      <section style={{ marginTop: "24px", border: "1px solid #27272a", borderRadius: "16px", padding: "24px" }}>
        <h2>Public EternalNotes</h2>
        <ul>
          <li>Remove accounts/signup</li>
          <li>Remove billing</li>
          <li>Add sample notes</li>
        </ul>
      </section>
    </main>
  );
}
