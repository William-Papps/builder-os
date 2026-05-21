// ─── Types ───────────────────────────────────────────────────────────────────

export type FlowStep = {
  id: string;
  step: number;
  title: string;
  description: string;
  builderOsLink?: string;
  isGate?: boolean;
  isFuture?: boolean;
};

export type ExecutionMode = {
  id: string;
  name: string;
  description: string;
  allowedActions: string[];
  notAllowed: string[];
  color: string;
  border: string;
  badge: string;
  available: "now" | "future";
};

export type SupportedAgent = {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  limitations: string[];
  available: "now" | "future";
};

export type ArchitectureNote = {
  id: string;
  principle: string;
  detail: string;
};

// ─── Execution flow ──────────────────────────────────────────────────────────

export const EXECUTION_FLOW: FlowStep[] = [
  {
    id: "planner",
    step: 1,
    title: "Planner Conversation",
    description: "Clarify the idea, resolve assumptions, define what NOT to build, produce a final brief.",
    builderOsLink: "/planner",
  },
  {
    id: "brief",
    step: 2,
    title: "Final Brief",
    description: "Structured brief: raw idea, problem, outcome, MVP scope, out of scope, risks, first task.",
    builderOsLink: "/brief",
  },
  {
    id: "task-packet",
    step: 3,
    title: "Approved Task Packet",
    description: "Locked work unit: scope, allowed actions, forbidden actions, execution prompt, rollback plan.",
    builderOsLink: "/task-packets",
  },
  {
    id: "readiness",
    step: 4,
    title: "Agent Readiness Check",
    description: "All 11 checklist items confirmed. No blocking items. Readiness level determined.",
    builderOsLink: "/agent-readiness",
    isGate: true,
  },
  {
    id: "model-selection",
    step: 5,
    title: "Model / Agent Selection",
    description: "Best agent chosen for the task type, approval level, and risk profile.",
    builderOsLink: "/model-router",
  },
  {
    id: "execution-request",
    step: 6,
    title: "Execution Request",
    description: "Execution prompt assembled from the task packet and sent to the selected agent.",
    isFuture: true,
  },
  {
    id: "human-gate",
    step: 7,
    title: "Human Approval Gate",
    description: "The agent lists every file it plans to change. Human reviews and says proceed.",
    isGate: true,
  },
  {
    id: "agent-execution",
    step: 8,
    title: "Agent Execution",
    description: "Agent works within the defined scope. No files outside scope. No autonomous expansion.",
    isFuture: true,
  },
  {
    id: "build-verify",
    step: 9,
    title: "Build / Test Verification",
    description: "Build or typecheck runs. Result reported back. Failures block the next step.",
    isFuture: true,
  },
  {
    id: "session-summary",
    step: 10,
    title: "Session Summary",
    description: "Agent returns structured result: files changed, build result, risks, next actions.",
    builderOsLink: "/sessions",
    isFuture: true,
  },
  {
    id: "memory-update",
    step: 11,
    title: "Memory + Tasks Updated",
    description: "Builder OS data files updated: sessions, tasks, memory. Source of truth stays in code.",
    builderOsLink: "/memory",
    isFuture: true,
  },
  {
    id: "commit-review",
    step: 12,
    title: "Commit Review",
    description: "Human reviews staged changes. Approves commit message. Push requires explicit sign-off.",
    isGate: true,
    isFuture: true,
  },
];

// ─── Execution modes ─────────────────────────────────────────────────────────

export const EXECUTION_MODES: ExecutionMode[] = [
  {
    id: "read-only",
    name: "Read-only analysis",
    description: "Agent reads, inspects, and reports. No file edits.",
    allowedActions: [
      "Read files and directories",
      "Run read-only commands (git log, ls, grep)",
      "Generate reports and summaries",
      "Produce plans and prompts",
    ],
    notAllowed: ["Edit any files", "Create or delete files", "Stage, commit, or push"],
    color: "text-blue-300",
    border: "border-blue-900",
    badge: "bg-blue-900 text-blue-300",
    available: "now",
  },
  {
    id: "approved-edit",
    name: "Approved edit",
    description: "Agent may edit files within the defined scope after human approval.",
    allowedActions: [
      "Edit files inside the approved scope",
      "Create new files within scope",
      "Run build or typecheck after editing",
    ],
    notAllowed: [
      "Edit files outside scope",
      "Delete files without explicit approval",
      "Stage, commit, or push automatically",
    ],
    color: "text-emerald-300",
    border: "border-emerald-900",
    badge: "bg-emerald-900 text-emerald-300",
    available: "now",
  },
  {
    id: "commit-review",
    name: "Commit review",
    description: "Edits are done and staged. Human reviews diff before committing.",
    allowedActions: [
      "Stage changed files for review",
      "Propose a commit message",
      "Run build or typecheck to confirm clean state",
    ],
    notAllowed: ["Commit without explicit human approval", "Push automatically", "Amend prior commits without approval"],
    color: "text-yellow-300",
    border: "border-yellow-900",
    badge: "bg-yellow-900 text-yellow-400",
    available: "now",
  },
  {
    id: "deploy",
    name: "Future deploy mode",
    description: "Automated deployment after full approval chain. Not available yet.",
    allowedActions: ["TBD — requires full approval pipeline first"],
    notAllowed: [
      "Deployment without complete approval chain",
      "Any deploy before commit review is complete",
    ],
    color: "text-neutral-500",
    border: "border-neutral-800",
    badge: "bg-neutral-800 text-neutral-500",
    available: "future",
  },
];

// ─── Supported agents ─────────────────────────────────────────────────────────

export const SUPPORTED_AGENTS: SupportedAgent[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Interactive CLI agent. Excellent for repo inspection, edits, and build verification.",
    bestFor: [
      "File edits and refactoring",
      "Build and typecheck verification",
      "Code review and analysis",
      "Structured output (session summaries, task packets)",
    ],
    limitations: [
      "Requires manual prompt-paste workflow today",
      "Not yet wired to automatic task packet dispatch",
    ],
    available: "now",
  },
  {
    id: "codex",
    name: "Codex",
    description: "Headless background worker. Best for focused implementation tasks.",
    bestFor: [
      "Focused implementation tasks",
      "Test writing",
      "Bug fixes with clear spec",
    ],
    limitations: [
      "Less interactive than Claude Code",
      "Better for well-defined tasks than exploratory work",
    ],
    available: "now",
  },
  {
    id: "ruflo",
    name: "Ruflo",
    description: "Multi-step repo agent. Handles coordinated work across multiple files.",
    bestFor: [
      "Multi-file coordinated changes",
      "Subagent planning across a repo",
      "Larger scoped tasks with multiple steps",
    ],
    limitations: [
      "Requires Ruflo CLI setup in each repo",
      "Higher risk — approval gates are critical",
    ],
    available: "now",
  },
  {
    id: "ollama",
    name: "Local Ollama models",
    description: "Local inference. Best for cheap, fast, private analysis tasks.",
    bestFor: [
      "Summarization and rewriting",
      "Brainstorming and planning",
      "Tasks that don't require repo access",
    ],
    limitations: [
      "Lower capability than frontier models",
      "No tool use or repo access without additional setup",
    ],
    available: "future",
  },
  {
    id: "custom",
    name: "Future custom agents",
    description: "Purpose-built agents for specific Builder OS workflows.",
    bestFor: ["TBD — depends on workflow needs"],
    limitations: ["Not yet designed or built"],
    available: "future",
  },
];

// ─── Architecture principles ──────────────────────────────────────────────────

export const ARCHITECTURE_NOTES: ArchitectureNote[] = [
  {
    id: "source-of-truth",
    principle: "Builder OS is the source of truth",
    detail:
      "All project state lives in data/ TypeScript files. Agents read from and write to Builder OS — not the other way around.",
  },
  {
    id: "scoped-packets",
    principle: "Agents only receive scoped task packets",
    detail:
      "No agent gets open-ended access to a repo. Every execution starts from a task packet with defined scope, allowed actions, and forbidden actions.",
  },
  {
    id: "one-repo",
    principle: "Agents work on one repo at a time",
    detail:
      "A single task packet maps to a single repo. Cross-repo work requires separate packets and separate approval.",
  },
  {
    id: "no-discovery",
    principle: "No autonomous repo discovery",
    detail:
      "Agents do not browse, scan, or discover repos autonomously. The repo path comes from the task packet — which comes from a human-approved brief.",
  },
  {
    id: "no-autonomous-deploy",
    principle: "No autonomous deployment (initially)",
    detail:
      "Commit and push are always the final human gate. Automated deployment is a future mode that requires a full approval pipeline to be in place first.",
  },
  {
    id: "results-return",
    principle: "All execution results return to Builder OS",
    detail:
      "After any agent run, the structured result (files changed, build result, risks, next actions) is pasted back into Builder OS data files — keeping the system coherent.",
  },
];
