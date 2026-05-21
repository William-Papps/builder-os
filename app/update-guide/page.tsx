import { CopyPrompt } from "@/app/_components/CopyPrompt";

const SESSION_CHECKLIST = [
  "What was the goal of this session?",
  "What project did it affect?",
  "What tool was used — Claude Code, Codex, or Ruflo?",
  "What files changed?",
  "What worked as expected?",
  "What broke or was left incomplete?",
  "What is the single next action?",
  "Should anything affect the public hub or release status?",
  "Should any of this become a new task in data/tasks.ts?",
  "Does project memory need updating in data/memory.ts?",
];

type UpdateStep = {
  id: string;
  title: string;
  file: string;
  link: string | null;
  description: string;
  fields: string[];
  required: boolean;
};

const UPDATE_STEPS: UpdateStep[] = [
  {
    id: "sessions",
    title: "Add session log entry",
    file: "data/sessions.ts",
    link: "/sessions",
    description:
      "Add a new entry to the SESSIONS array. Every session should be logged — completed, partial, or blocked.",
    fields: [
      "id — unique slug",
      "date — YYYY-MM-DD",
      "projectId — from data/projects.ts",
      "toolUsed — Claude Code / Codex / Ruflo / Manual",
      "goal — one sentence",
      "summary — 2–3 sentences on what happened",
      "changedFiles — every file created or modified",
      "nextActions — 3–5 specific follow-up steps",
      "status — completed / partial / blocked / in-progress",
    ],
    required: true,
  },
  {
    id: "memory",
    title: "Update project memory",
    file: "data/memory.ts",
    link: "/memory",
    description:
      "Update the project's memory entry to reflect what changed. Keep it current — stale memory leads to bad prompts.",
    fields: [
      "currentGoal — update if the goal shifted",
      "decisions — add any new decisions made",
      "risks — add new risks discovered, remove resolved ones",
      "nextActions — replace with fresh priorities",
      "lastUpdated — today's date",
    ],
    required: true,
  },
  {
    id: "tasks",
    title: "Update task status",
    file: "data/tasks.ts",
    link: "/tasks",
    description:
      "Mark completed tasks as 'done'. Add new tasks you discovered. Update nextAction on tasks still in progress.",
    fields: [
      "status — move completed tasks to 'done'",
      "nextAction — refresh for in-progress tasks",
      "Add new Task entries for anything newly discovered",
    ],
    required: true,
  },
  {
    id: "releases",
    title: "Update release status",
    file: "data/releases.ts",
    link: "/releases",
    description:
      "Only if the session touched public-facing work. Update checklist items that are now complete, status if it advanced, or nextAction.",
    fields: [
      "checklist — mark newly completed items as done: true",
      "publicStatus — advance if the project is ready for next stage",
      "nextAction — update to reflect current blocker",
    ],
    required: false,
  },
  {
    id: "hub",
    title: "Update Builder Hub",
    file: "builder-hub repo",
    link: null,
    description:
      "Only if a public tool changed and the hub page needs updating. Open the builder-hub repo separately — do not update it from Builder OS.",
    fields: [
      "Update the relevant project page",
      "Update install instructions if setup changed",
      "Add new screenshots if UI changed",
    ],
    required: false,
  },
  {
    id: "commit",
    title: "Commit Builder OS changes",
    file: "git commit",
    link: null,
    description:
      "Stage only the data/ files you updated. Write a clear commit message. Do not commit Builder OS with private session data or .env files.",
    fields: [
      "git add data/sessions.ts data/memory.ts data/tasks.ts",
      "git add data/releases.ts (if updated)",
      "git commit -m 'Update session log and project memory after [project] session'",
      "Do NOT push Builder OS — it stays private",
    ],
    required: true,
  },
];

const summarizePrompt = `Summarize this AI/code session for Builder OS.

Return the following — I will paste this directly into Builder OS data files.

---
project: [which project was worked on?]

toolUsed: [Claude Code / Codex / Ruflo / Manual / other]

goal: [one sentence — what was the original objective?]

result: [2–3 sentences — what actually happened? Was the goal achieved?]

status: [completed / partial / blocked / in-progress]

changedFiles:
- [every file created or modified, one per line]

commands: [important commands run — git, npm, builds, typecheck]

risks: [any new risks or concerns discovered during this session]

decisions:
- [any decisions made that should be recorded in project memory]

nextActions:
- [3–5 specific next steps in priority order]

taskUpdates:
- [list any tasks that should be marked done or have their status changed]
- [list any new tasks to add]

memoryUpdates:
- [what in data/memory.ts should change for this project?]

releaseUpdates: [only if public-facing work happened — what checklist items are now done?]
---

Be factual and concise. I will paste each section into the appropriate data/ file in Builder OS.`;

export default function UpdateGuidePage() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Update Guide</h1>
        <p className="mt-3 text-neutral-400">
          Builder OS is only useful if it stays current. After every AI or code session, update
          these files — it takes under 5 minutes and keeps every page accurate.
        </p>

        {/* Banner */}
        <div className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-300">
            After every session: log it, update memory, update tasks, commit.
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Skip any of these and Builder OS will give you stale recommendations.
          </p>
        </div>

        {/* Mental checklist */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Ask yourself after every session</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Answer these before updating anything. Use the summarize prompt below to get the
            answers from your AI tool.
          </p>
          <ol className="mt-4 space-y-2">
            {SESSION_CHECKLIST.map((q, i) => (
              <li key={q} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-neutral-700 text-xs text-neutral-600">
                  {i + 1}
                </span>
                <span className="text-sm text-neutral-300">{q}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Update steps */}
        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">What to update</h2>
          {UPDATE_STEPS.map((step) => (
            <div
              key={step.id}
              className={`rounded-2xl border bg-neutral-900 p-6 ${
                step.required ? "border-neutral-700" : "border-neutral-800 opacity-80"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    {!step.required && (
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
                        Only if applicable
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-neutral-600">{step.file}</p>
                </div>
                {step.link && (
                  <a
                    href={step.link}
                    className="shrink-0 text-xs text-emerald-600 hover:text-emerald-400 transition-colors"
                  >
                    Open page →
                  </a>
                )}
              </div>
              <p className="mt-3 text-sm text-neutral-400">{step.description}</p>
              {step.fields.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {step.fields.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-500">
                      <span className="mt-0.5 shrink-0 font-mono text-neutral-700">→</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Summarize session prompt */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Prompt: Summarize This Session For Builder OS</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Run this inside your AI tool at the end of each session. Paste the output back into
            the relevant data/ files.
          </p>
          <div className="mt-3">
            <CopyPrompt text={summarizePrompt} customizeLink />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 border-t border-neutral-800 pt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Update these pages
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { href: "/sessions", label: "Sessions" },
              { href: "/memory", label: "Memory" },
              { href: "/tasks", label: "Tasks" },
              { href: "/releases", label: "Releases" },
              { href: "/prompt-builder", label: "Prompt Builder" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
