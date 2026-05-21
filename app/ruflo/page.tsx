import { PROJECTS } from "@/data/projects";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const RUFLO_IS_FOR = [
  "Multi-step tasks that span many files in one repo",
  "Subagent planning and coordination (plan → inspect → edit → summarize)",
  "Larger coordinated tasks with dependencies between steps",
  "Automated repo analysis and structured reporting",
  "Running Claude Code as a worker with memory and hooks",
];

const RUFLO_NOT_FOR = [
  "Being the source of truth — Builder OS owns that",
  "Running across multiple repos at once",
  "Committing or pushing automatically",
  "Making decisions about what to build — you decide in Builder OS first",
  "Storing project memory — keep that in data/ files here",
];

const APPROVAL_LEVELS = [
  {
    level: "Read only",
    description: "Inspect files, list structure, report findings",
    safe: true,
    autoOk: true,
  },
  {
    level: "Plan only",
    description: "Propose changes, list files to edit, estimate risk",
    safe: true,
    autoOk: true,
  },
  {
    level: "Edit with approval",
    description: "Make file changes after you say 'proceed'",
    safe: true,
    autoOk: false,
  },
  {
    level: "Commit with approval",
    description: "Stage and commit only files you reviewed and approved",
    safe: true,
    autoOk: false,
  },
  {
    level: "Push / deploy",
    description: "Never automatically — you push manually after reviewing the diff",
    safe: false,
    autoOk: false,
  },
];

const SAFETY_RULES = [
  "Run Ruflo inside one repo at a time — never across repos",
  "Always start with inspect/plan mode, not edit mode",
  "Read every changed file before accepting",
  "Never let Ruflo commit or push automatically",
  "Builder OS stays the source of truth — update data/ files here after sessions",
  "If Ruflo proposes touching private notes or .env files, stop and review",
];

const firstSafePrompt = `Analyze this repo only. Do not edit any files yet.

Find and report:
1. Current project structure and overall health
2. Any obvious risks, issues, or tech debt
3. The 3–5 most important next tasks based on the codebase
4. The single safest first improvement I could make

Rules:
- Work inside this repo only
- Do not touch other repos
- Do not edit any files in this pass
- Do not push to GitHub
- Wait for my approval before making any changes`;

export default function RufloPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Ruflo Setup</h1>
        <p className="mt-3 text-neutral-400">
          Ruflo (claude-flow) is the agent orchestration worker. It runs inside a repo and
          coordinates multi-step tasks. Builder OS stays the source of truth — Ruflo is just the
          executor.
        </p>

        {/* Role */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Ruflo is for
            </p>
            <ul className="mt-3 space-y-2">
              {RUFLO_IS_FOR.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-neutral-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-900">
              Ruflo is NOT for
            </p>
            <ul className="mt-3 space-y-2">
              {RUFLO_NOT_FOR.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-neutral-500">
                  <span className="mt-0.5 shrink-0 text-neutral-700">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Safe usage callout */}
        <div className="mt-5 rounded-xl border border-yellow-900 bg-yellow-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-yellow-300">
            Golden rule: only run Ruflo inside one repo at a time.
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            Clarify the task in Builder OS first. Then open that repo and run Ruflo with the
            prepared prompt. Never send a raw idea straight to Ruflo.
          </p>
        </div>

        {/* Safety rules */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Safety Rules</h2>
          <div className="mt-3 rounded-2xl border border-red-900 bg-red-950/30 p-5">
            <ul className="space-y-2">
              {SAFETY_RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-red-300">
                  <span className="mt-0.5 shrink-0 text-red-600">✕</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Approval levels */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Approval Levels</h2>
          <p className="mt-1 text-sm text-neutral-500">
            What Ruflo can do vs. what always requires you.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-800">
            {APPROVAL_LEVELS.map((a, i) => (
              <div
                key={a.level}
                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
                  i < APPROVAL_LEVELS.length - 1 ? "border-b border-neutral-800" : ""
                } ${!a.safe ? "bg-red-950/20" : "bg-neutral-900"}`}
              >
                <div>
                  <p className={`text-sm font-medium ${a.safe ? "text-neutral-200" : "text-red-300"}`}>
                    {a.level}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600">{a.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${
                    a.autoOk
                      ? "bg-emerald-900 text-emerald-300"
                      : a.safe
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-red-900 text-red-300"
                  }`}
                >
                  {a.autoOk ? "Auto OK" : a.safe ? "Needs approval" : "Never automatic"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Install */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Install (global, once)</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-black p-5 text-sm text-neutral-200">
            <span className="text-neutral-600"># Install Claude Code CLI</span>{"\n"}
            npm install -g @anthropic-ai/claude-code{"\n\n"}
            <span className="text-neutral-600"># Install claude-flow agent layer</span>{"\n"}
            npm install -g claude-flow@alpha
          </pre>
        </div>

        {/* Per-repo setup */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Per-repo Setup</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Run these once inside each repo you want Ruflo to work in. Replace the path for
            each project.
          </p>
          <div className="mt-4 space-y-4">
            {PROJECTS.map((p) => (
              <div key={p.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 font-mono text-xs text-neutral-600">{p.localPath}</p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-black p-4 text-xs text-neutral-300">
                  cd {p.localPath}{"\n"}
                  claude-flow init{"\n"}
                  claude-flow memory init{"\n"}
                  claude mcp add claude-flow npx claude-flow@alpha mcp start{"\n"}
                  claude mcp list
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* First safe prompt */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">First Safe Prompt</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Use this the first time you run Ruflo in any repo. Inspect only — no edits.
          </p>
          <div className="mt-3">
            <CopyPrompt text={firstSafePrompt} customizeLink />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          <a
            href="/model-router"
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
          >
            Model Router →
          </a>
          <a
            href="/workflow"
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
          >
            Workflow →
          </a>
          <a
            href="/prompt-builder"
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
          >
            Prompt Builder →
          </a>
        </div>
      </section>
    </main>
  );
}
