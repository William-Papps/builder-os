const steps = [
  {
    step: "Start from /command",
    detail: "Open Builder OS and go to /command. Check the recommended task, last session follow-ups, and any release warnings before deciding what to work on.",
    phase: "plan",
  },
  {
    step: "Run Planner Chat",
    detail: "Go to /planner-chat. Describe your raw idea. The planner asks questions, challenges weak assumptions, and produces a complete SDLC with FRs, NFRs, constraints, risks, and architecture.",
    phase: "plan",
  },
  {
    step: "Generate Task Packets",
    detail: "From the planner output, go to /task-packets. Create one locked packet per agent run — with scope, allowed actions, forbidden actions, approval level, and expected output.",
    phase: "plan",
  },
  {
    step: "Approve packet at /execution",
    detail: "Go to /execution. Review the packet fields. Confirm the approval level is correct. Only continue if the scope is specific and the risk is acceptable.",
    phase: "execute",
  },
  {
    step: "Export packet — copy prompts",
    detail: "In /execution, use the Export Execution Packet section. Copy blocks A–E in order: navigate to repo (cd), launch agent (claude), paste full prompt, then run. Do not modify the packet mid-run.",
    phase: "execute",
  },
  {
    step: "Run agent inside the correct repo only",
    detail: "Open the target repo in Claude Code or Ruflo. Paste the execution prompt. The agent must list files before editing and wait for 'proceed'. Never run in the wrong repo.",
    phase: "execute",
  },
  {
    step: "Import result — fill in /execution-result-template",
    detail: "After the agent finishes, go to /execution-result-template. Fill in: files changed, build result, risks, next actions, memory updates, task status updates, and release status. This is the record of what happened.",
    phase: "execute",
  },
  {
    step: "Review changes",
    detail: "Read every changed file before accepting. Check for unexpected changes, private data in diffs, or broken logic. Run the Review Execution Result prompt if needed.",
    phase: "execute",
  },
  {
    step: "Test locally",
    detail: "Run the dev server or build. Verify the change works. Run typecheck if available. If build fails, fix only the build error — nothing else.",
    phase: "execute",
  },
  {
    step: "Commit",
    detail: "Stage only the files you intended. Write a clear commit message. Do not stage .env or data files. Never commit automatically — this is always a human decision.",
    phase: "execute",
  },
  {
    step: "Update Builder OS — sessions, memory, tasks",
    detail: "Add a new entry to data/sessions.ts. Update data/memory.ts with decisions and next actions. Update data/tasks.ts or data/taskPackets.ts to reflect task progress. Commit only the data/ files.",
    phase: "record",
  },
  {
    step: "Check release pipeline before going public",
    detail: "Before listing a tool publicly, open /releases and verify the release checklist is complete. Do not push to public repos or list on Builder Hub until all checklist items are done.",
    phase: "record",
  },
  {
    step: "Push / update public hub if needed",
    detail: "Only push to public repos what is safe. If a public tool improved, update Builder Hub too.",
    phase: "record",
  },
];

const rules = [
  "Work in one repo at a time",
  "Review every diff before committing",
  "No autonomous pushes — you decide what ships",
  "Builder OS is private — never push its content publicly",
  "Never push .env files or private notes",
  "Agents do not deploy or push automatically yet",
];

export default function WorkflowPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-3 text-4xl font-bold">Workflow</h1>
        <p className="mt-3 text-neutral-400">
          The exact sequence to follow every time you work on a project.
          Keeps changes safe, deliberate, and reversible. See{" "}
          <a href="/system-map" className="text-emerald-500 hover:text-emerald-400 transition-colors">
            /system-map
          </a>{" "}
          for how all the pieces connect.
        </p>

        <div className="mt-10 space-y-3">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className="flex gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950 text-sm font-bold text-emerald-400">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold">{s.step}</p>
                <p className="mt-1 text-sm text-neutral-400">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-300">Safety Rules</h2>
          <ul className="mt-4 space-y-2">
            {rules.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-500">✕</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
