import { CopyPrompt } from "@/app/_components/CopyPrompt";

type Route = {
  id: string;
  name: string;
  tagline: string;
  costLabel: string;
  costColor: string;
  borderColor: string;
  headerColor: string;
  useCases: string[];
  notFor: string[];
};

const ROUTES: Route[] = [
  {
    id: "cheap-local",
    name: "Cheap / Local Model",
    tagline: "Fast, free, low-risk thinking",
    costLabel: "Free or near-free",
    costColor: "text-emerald-400",
    borderColor: "border-emerald-900",
    headerColor: "text-emerald-300",
    useCases: [
      "Brainstorm ideas",
      "Summarize notes",
      "Rewrite or simplify prompts",
      "Create task lists",
      "Draft commit messages",
      "Quick Q&A with no file access needed",
    ],
    notFor: ["File inspection", "Code changes", "Multi-step work"],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    tagline: "Planning, strategy, and concept work",
    costLabel: "Low–mid cost",
    costColor: "text-blue-400",
    borderColor: "border-blue-900",
    headerColor: "text-blue-300",
    useCases: [
      "Planning a feature or system",
      "Strategy and decision-making",
      "Explaining technical concepts",
      "Improving or rewriting prompts",
      "Research and comparisons",
    ],
    notFor: ["Direct repo access", "File edits", "Multi-step code tasks"],
  },
  {
    id: "claude-code",
    name: "Claude Code",
    tagline: "Repo inspection and safe implementation",
    costLabel: "Mid–high cost",
    costColor: "text-violet-400",
    borderColor: "border-violet-900",
    headerColor: "text-violet-300",
    useCases: [
      "Inspect a repo for state, issues, or structure",
      "Implement a specific code change",
      "Refactor existing code safely",
      "Summarize changed files after a session",
      "Run typecheck or build and report results",
    ],
    notFor: ["Long multi-step orchestration", "Autonomous commits or pushes"],
  },
  {
    id: "codex",
    name: "Codex",
    tagline: "Focused code generation and fixes",
    costLabel: "Mid cost",
    costColor: "text-orange-400",
    borderColor: "border-orange-900",
    headerColor: "text-orange-300",
    useCases: [
      "Focused code implementation",
      "Writing or updating tests",
      "Bug fixes with clear reproduction steps",
      "Generating boilerplate",
    ],
    notFor: [
      "System architecture decisions",
      "Repo-wide analysis",
      "Multi-repo work",
    ],
  },
  {
    id: "ruflo",
    name: "Ruflo",
    tagline: "Multi-step orchestration and subagents",
    costLabel: "High cost — use intentionally",
    costColor: "text-cyan-400",
    borderColor: "border-cyan-900",
    headerColor: "text-cyan-300",
    useCases: [
      "Multi-step tasks spanning many files",
      "Subagent planning and coordination",
      "Larger coordinated tasks with dependencies",
      "Automated repo analysis pipelines",
    ],
    notFor: [
      "Simple single-file changes",
      "Exploration and planning",
      "Tasks a single agent handles easily",
    ],
  },
];

const HUMAN_REQUIRED = [
  "Deleting files or directories",
  "Changing auth, security, or access controls",
  "Touching private notes or .env files",
  "Committing code to git",
  "Pushing to any remote repository",
  "Deploying to production or staging",
  "Publishing to Builder Hub",
  "Any irreversible action",
];

const chooseModelPrompt = `Classify the following task and recommend the best tool or model to use.

Task I want to do:
[DESCRIBE YOUR TASK HERE]

Classify this task and return:

1. Best tool/model — choose one: Cheap/Local Model, ChatGPT, Claude Code, Codex, or Ruflo
2. Why — one sentence explaining the choice
3. Cheapest safe option — if a cheaper tool can handle this safely, name it
4. Human approval required — yes or no, and what specifically needs sign-off
5. Exact prompt — write a ready-to-use prompt for the recommended tool, pre-filled with the task and project context

Routing rules:
- Cheap/local model: brainstorming, summarizing, rewriting prompts, creating task lists
- ChatGPT: planning, strategy, explaining concepts, improving prompts
- Claude Code: repo inspection, code changes, refactoring, summarizing changed files
- Codex: focused implementation, tests, bug fixes
- Ruflo: multi-step repo work, subagent planning, larger coordinated tasks
- Human approval always required for: deleting files, changing auth/security, touching private notes, committing, pushing, deploying

Do not suggest an expensive model if a cheaper one is safe for this task.`;

function RouteCard({ route }: { route: Route }) {
  return (
    <div className={`rounded-2xl border bg-neutral-900 p-6 ${route.borderColor}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className={`text-lg font-semibold ${route.headerColor}`}>{route.name}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">{route.tagline}</p>
        </div>
        <span className={`text-xs font-medium ${route.costColor}`}>{route.costLabel}</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Use for
          </p>
          <ul className="mt-2 space-y-1.5">
            {route.useCases.map((u) => (
              <li key={u} className="flex items-start gap-2 text-sm text-neutral-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600" />
                {u}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Not for
          </p>
          <ul className="mt-2 space-y-1.5">
            {route.notFor.map((n) => (
              <li key={n} className="flex items-start gap-2 text-sm text-neutral-500">
                <span className="mt-0.5 shrink-0 text-neutral-700">✕</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ModelRouterPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Model Router</h1>
        <p className="mt-3 text-neutral-400">
          Choose the cheapest safe tool for each task. Don&apos;t use an expensive model when a
          cheap one will do. Don&apos;t run agents on tasks that need human review.
        </p>

        {/* Decision shortcut */}
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Quick decision
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-neutral-300">
              <span className="font-medium text-neutral-200">Thinking / planning?</span>
              {" → "}
              <span className="text-emerald-400">Cheap/local model or ChatGPT</span>
            </p>
            <p className="text-neutral-300">
              <span className="font-medium text-neutral-200">Reading or changing code?</span>
              {" → "}
              <span className="text-violet-400">Claude Code or Codex</span>
            </p>
            <p className="text-neutral-300">
              <span className="font-medium text-neutral-200">Multi-step across many files?</span>
              {" → "}
              <span className="text-cyan-400">Ruflo</span>
            </p>
            <p className="text-neutral-300">
              <span className="font-medium text-neutral-200">Committing, pushing, or deleting?</span>
              {" → "}
              <span className="text-red-400">You — human approval required</span>
            </p>
          </div>
        </div>

        {/* Route cards */}
        <div className="mt-10 space-y-5">
          {ROUTES.map((r) => (
            <RouteCard key={r.id} route={r} />
          ))}
        </div>

        {/* Human approval */}
        <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-300">Human Approval Required</h2>
          <p className="mt-1 text-sm text-red-400/70">
            Agents do not do these. You do. Always.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {HUMAN_REQUIRED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-600">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Choose Best Agent prompt */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Prompt: Choose Best Agent / Model
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Paste this into any Claude session. Replace the placeholder with your task.
          </p>
          <div className="mt-3">
            <CopyPrompt text={chooseModelPrompt} customizeLink />
          </div>
        </div>
      </section>
    </main>
  );
}
