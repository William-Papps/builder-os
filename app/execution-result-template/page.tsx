import { CopyPrompt } from "@/app/_components/CopyPrompt";

const RESULT_TEMPLATE = `SESSION LOG ENTRY
  id: [kebab-slug — e.g. builder-os-add-sessions-page]
  date: [YYYY-MM-DD]
  projectId: [project-id]
  toolUsed: [Claude Code / Codex / Ruflo / Manual]
  goal: [one sentence — what was attempted]
  summary: [2–4 sentences — what actually happened, what changed, what was skipped]
  changedFiles:
    - [path/to/file.tsx] — [what changed]
    - [path/to/file.ts]  — [what changed]
  nextActions:
    - [next step 1]
    - [next step 2]
  status: [completed / partial / blocked / in-progress]

MEMORY UPDATE
  File: memory/[project].md
  Field: [currentGoal / decisions / risks / nextActions]
  New value: [exact text to add or replace]
  — OR —
  No update needed.

TASK STATUS UPDATE
  Packet id: [id]
  Status: [draft → approved → completed / blocked]
  Reason: [one sentence]
  — OR —
  No update needed.

RELEASE UPDATE
  Project: [project name]
  What changed: [description]
  Release note: [one sentence for changelog]
  — OR —
  No release affected.`;

const FIELDS = [
  { label: "Project",               desc: "Which projectId was this for?",                           example: "builder-os" },
  { label: "Tool Used",             desc: "Which agent ran the task?",                               example: "Claude Code" },
  { label: "Task Packet ID",        desc: "The id from data/taskPackets.ts",                         example: "improve-prompt-builder" },
  { label: "Original Goal",         desc: "One sentence from the packet's goal field",               example: "Add a 3-step prompt builder flow" },
  { label: "Result Summary",        desc: "What the agent actually did — 2–4 sentences",             example: "Created /prompt-builder with project selector and 6 task types." },
  { label: "Files Changed",         desc: "List every file the agent modified",                      example: "app/prompt-builder/page.tsx, app/_components/PromptBuilder.tsx" },
  { label: "Commands Run",          desc: "Build, test, or lint commands the agent ran",             example: "npm run build → PASS" },
  { label: "Build / Test Result",   desc: "PASS or FAIL — include errors if FAIL",                  example: "PASS — 0 errors, 0 warnings" },
  { label: "Risks Identified",      desc: "Any scope expansion, data exposure, or breaking changes", example: "None — all changes within scope" },
  { label: "Next Actions",          desc: "What should happen next based on this result",            example: "Add task board connected to prompt builder" },
  { label: "Memory Updates",        desc: "Which memory files need updating and how",                example: "memory/builder-os.md — update currentGoal" },
  { label: "Task Status Updates",   desc: "Packet status changes to make in data/taskPackets.ts",   example: "improve-prompt-builder → completed" },
  { label: "Release Status",        desc: "Did this affect anything that could ship publicly?",      example: "No release impact" },
];

export default function ExecutionResultTemplatePage() {
  return (
    <main>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#fb923c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Builder OS — Execution Result
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginTop: 10, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Execution Result Template
        </h1>
        <p style={{ marginTop: 12, color: "#737373", fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
          After an agent finishes a task, copy this template and fill in each field.
          Then paste it into{" "}
          <a href="/sessions" style={{ color: "#93c5fd", textDecoration: "none" }}>Sessions</a>{" "}
          or run the{" "}
          <a href="/execution" style={{ color: "#a78bfa", textDecoration: "none" }}>Convert Agent Result</a>{" "}
          prompt to generate the Builder OS update automatically.
        </p>

        {/* Flow breadcrumb */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: "Planner", href: "/planner-chat", done: true },
            { label: "SDLC",    href: "/sdlc-plans",   done: true },
            { label: "Packet",  href: "/task-packets",  done: true },
            { label: "Export",  href: "/execution",     done: true },
            { label: "Execute", href: "#",              done: true },
            { label: "Import",  href: "#",              current: true },
            { label: "Commit",  href: "#",              done: false },
          ].map((s, i) => (
            <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <a href={s.href} style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 20, textDecoration: "none",
                fontWeight: "current" in s && s.current ? 700 : 400,
                border: "current" in s && s.current ? "1px solid #7c2d12" : s.done ? "1px solid #064e3b" : "1px solid #1a1a1a",
                background: "current" in s && s.current ? "rgba(124,45,18,0.2)" : s.done ? "rgba(6,78,59,0.12)" : "#0a0a0a",
                color: "current" in s && s.current ? "#fb923c" : s.done ? "#4ade80" : "#333",
              }}>
                {s.done && !("current" in s && s.current) && <span style={{ marginRight: 4, fontSize: 10 }}>✓</span>}
                {s.label}
              </a>
              {i < 6 && <span style={{ fontSize: 12, color: "#222" }}>→</span>}
            </span>
          ))}
        </div>

        {/* ── Template copy block ── */}
        <div style={{ marginTop: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Full Result Template
          </p>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 }}>
            Copy this entire block. Fill in each section after your agent run. Then add it to data/sessions.ts or run the Convert prompt.
          </p>

          <div style={{ borderRadius: 12, border: "1px solid #7c2d12", background: "rgba(124,45,18,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #7c2d12" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fb923c", margin: 0 }}>Execution Result Template — copy and fill in</p>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <CopyPrompt text={RESULT_TEMPLATE} />
            </div>
          </div>
        </div>

        {/* ── Field reference ── */}
        <div style={{ marginTop: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
            Field Reference
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 12, border: "1px solid #1a1a1a", overflow: "hidden" }}>
            {FIELDS.map((f, i) => (
              <div key={f.label} style={{
                display: "grid", gridTemplateColumns: "200px 1fr",
                borderBottom: i < FIELDS.length - 1 ? "1px solid #141414" : undefined,
                padding: "12px 16px",
                background: i % 2 === 0 ? "#080808" : "#060606",
              }}>
                <div style={{ paddingRight: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5", margin: "0 0 2px" }}>{f.label}</p>
                  <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
                <div>
                  <code style={{ fontSize: 11, color: "#777", fontFamily: "monospace", lineHeight: 1.6 }}>
                    {f.example}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── What to do with this ── */}
        <div style={{ marginTop: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            After Filling In
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                step: "1",
                label: "Add session to data/sessions.ts",
                desc: "Open data/sessions.ts and add a new entry at the top of the SESSIONS array with the values from your filled template.",
                color: "#4ade80", border: "#064e3b", bg: "rgba(6,78,59,0.12)",
              },
              {
                step: "2",
                label: "Update memory if needed",
                desc: "If memory updates were identified, open the relevant memory/*.md file and update the currentGoal, decisions, risks, or nextActions fields.",
                color: "#60a5fa", border: "#1e3a8a", bg: "rgba(30,58,138,0.12)",
              },
              {
                step: "3",
                label: "Update task packet status",
                desc: "Open data/taskPackets.ts and change the packet status (e.g. approved → completed or blocked).",
                color: "#a78bfa", border: "#4c1d95", bg: "rgba(76,29,149,0.12)",
              },
              {
                step: "4",
                label: "Update releases if public work happened",
                desc: "If the task changed something that could ship, open data/releases.ts and add a release note.",
                color: "#fb923c", border: "#7c2d12", bg: "rgba(124,45,18,0.12)",
              },
              {
                step: "5",
                label: "Commit only if build passed and review is clean",
                desc: "Run npm run build. If it passes and the scope check is clean, commit the specific files changed. Never auto-commit.",
                color: "#f87171", border: "#7f1d1d", bg: "rgba(127,29,29,0.12)",
              },
            ].map((item) => (
              <div key={item.step} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                borderRadius: 10, border: `1px solid ${item.border}`, background: item.bg,
                padding: "12px 16px",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: item.color,
                  border: `1px solid ${item.border}`,
                }}>
                  {item.step}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: item.color, margin: "0 0 2px" }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: "#555", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ marginTop: 40, borderTop: "1px solid #141414", paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { href: "/execution", label: "← Execution" },
            { href: "/sessions",  label: "Sessions" },
            { href: "/workflow",  label: "Workflow" },
            { href: "/memory",    label: "Memory" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{
              fontSize: 13, padding: "8px 16px", borderRadius: 8,
              border: "1px solid #1a1a1a", background: "#080808",
              color: "#555", textDecoration: "none",
            }}>
              {link.label}
            </a>
          ))}
        </div>

      </div>
    </main>
  );
}
