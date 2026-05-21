export type ApprovalLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type AutomationStage = {
  id: string;
  step: number;
  title: string;
  description: string;
  isGate: boolean;
  minimumLevel: ApprovalLevel;
  builderOsLink?: string;
};

export type ApprovalLevelDef = {
  level: ApprovalLevel;
  name: string;
  description: string;
  allowedActions: string[];
  notAllowed: string[];
  isDefault: boolean;
  requiresManualApproval: boolean;
  color: string;
  border: string;
  badge: string;
};

export const AUTOMATION_STAGES: AutomationStage[] = [
  {
    id: "idea",
    step: 1,
    title: "Idea conversation",
    description:
      "Talk with a planner AI to clarify the idea, goals, and constraints. Use /brief to structure the output.",
    isGate: false,
    minimumLevel: 1,
    builderOsLink: "/brief",
  },
  {
    id: "brief-approved",
    step: 2,
    title: "Final brief approved",
    description:
      "Review and approve the project brief before anything executes. No work starts until you confirm the goal.",
    isGate: true,
    minimumLevel: 1,
    builderOsLink: "/brief",
  },
  {
    id: "task-breakdown",
    step: 3,
    title: "Task breakdown",
    description:
      "Builder OS breaks the brief into specific, ordered tasks. Each task gets a project, priority, and suggested agent.",
    isGate: false,
    minimumLevel: 1,
    builderOsLink: "/tasks",
  },
  {
    id: "project-selected",
    step: 4,
    title: "Project selected",
    description:
      "The correct repo is identified from data/projects.ts. One repo per task — no cross-repo work.",
    isGate: false,
    minimumLevel: 1,
    builderOsLink: "/projects",
  },
  {
    id: "agent-selected",
    step: 5,
    title: "Agent / model selected",
    description:
      "The best tool is chosen using the routing rules in /model-router. Cheapest safe option wins.",
    isGate: false,
    minimumLevel: 1,
    builderOsLink: "/model-router",
  },
  {
    id: "prompt-generated",
    step: 6,
    title: "Execution prompt generated",
    description:
      "A ready-to-use prompt is built from the task, project context, and safety rules. Available in /prompt-builder.",
    isGate: false,
    minimumLevel: 2,
    builderOsLink: "/prompt-builder",
  },
  {
    id: "approval-gate",
    step: 7,
    title: "Human approval gate",
    description:
      "You review the plan and generated prompt before anything runs. Default approval: Level 2 (prompts only) or Level 3 (read-only analysis).",
    isGate: true,
    minimumLevel: 2,
  },
  {
    id: "agent-runs",
    step: 8,
    title: "Agent runs task",
    description:
      "Claude Code, Codex, or Ruflo executes the approved task inside the selected repo only. Scope is locked to the brief.",
    isGate: false,
    minimumLevel: 3,
  },
  {
    id: "result-summarized",
    step: 9,
    title: "Result summarized",
    description:
      "The agent returns a structured summary of what changed, what worked, and what risks were found.",
    isGate: false,
    minimumLevel: 3,
  },
  {
    id: "memory-updated",
    step: 10,
    title: "Memory / tasks / sessions updated",
    description:
      "Builder OS data files are updated: data/sessions.ts, data/memory.ts, data/tasks.ts. Use /update-guide.",
    isGate: false,
    minimumLevel: 3,
    builderOsLink: "/update-guide",
  },
  {
    id: "commit-push",
    step: 11,
    title: "Commit / push approval",
    description:
      "You review all changed files and decide to commit and/or push. This gate never auto-approves.",
    isGate: true,
    minimumLevel: 5,
  },
];

export const APPROVAL_LEVELS: ApprovalLevelDef[] = [
  {
    level: 1,
    name: "Generate plan only",
    description: "Analyze and plan. No files touched.",
    allowedActions: [
      "Read files and analyze project structure",
      "Produce a plan or task breakdown document",
      "Identify risks, dependencies, and blockers",
    ],
    notAllowed: ["Execute prompts", "Edit any files", "Commit or push"],
    isDefault: false,
    requiresManualApproval: false,
    color: "text-neutral-300",
    border: "border-neutral-800",
    badge: "bg-neutral-800 text-neutral-400",
  },
  {
    level: 2,
    name: "Generate prompts only",
    description: "Plan and prepare execution prompts. Nothing runs yet.",
    allowedActions: [
      "Everything in Level 1",
      "Generate ready-to-use execution prompts",
      "Select project and recommend agent/model",
    ],
    notAllowed: ["Run agent", "Edit any files", "Commit or push"],
    isDefault: true,
    requiresManualApproval: false,
    color: "text-emerald-300",
    border: "border-emerald-900",
    badge: "bg-emerald-900 text-emerald-400",
  },
  {
    level: 3,
    name: "Run read-only repo analysis",
    description: "Agent inspects the repo. No files changed.",
    allowedActions: [
      "Everything in Level 2",
      "Run Claude Code / Ruflo in inspect mode",
      "Read files, report findings, suggest changes",
    ],
    notAllowed: ["Edit any files", "Commit or push"],
    isDefault: true,
    requiresManualApproval: false,
    color: "text-emerald-300",
    border: "border-emerald-900",
    badge: "bg-emerald-900 text-emerald-400",
  },
  {
    level: 4,
    name: "Allow file edits",
    description: "Agent may create and modify files after you approve the plan.",
    allowedActions: [
      "Everything in Level 3",
      "Create and modify files",
      "Run build and typecheck after changes",
    ],
    notAllowed: ["Stage or commit files", "Push to remote", "Deploy"],
    isDefault: false,
    requiresManualApproval: true,
    color: "text-yellow-300",
    border: "border-yellow-900",
    badge: "bg-yellow-900 text-yellow-400",
  },
  {
    level: 5,
    name: "Allow commit",
    description: "You manually stage and commit after reviewing every diff.",
    allowedActions: [
      "Everything in Level 4",
      "Stage specific files you have reviewed",
      "Commit with a descriptive message",
    ],
    notAllowed: ["Push to remote", "Deploy to any environment"],
    isDefault: false,
    requiresManualApproval: true,
    color: "text-orange-300",
    border: "border-orange-900",
    badge: "bg-orange-900 text-orange-400",
  },
  {
    level: 6,
    name: "Allow push / deploy",
    description:
      "Push to remote or deploy. Always manual — this level never auto-approves.",
    allowedActions: [
      "Everything in Level 5",
      "Push to remote repository (manual only)",
      "Deploy to staging or production (manual only)",
    ],
    notAllowed: ["Automatic push", "Automatic deploy — Level 6 is always manual"],
    isDefault: false,
    requiresManualApproval: true,
    color: "text-red-300",
    border: "border-red-900",
    badge: "bg-red-900 text-red-400",
  },
];

export const AUTOMATION_SAFETY_RULES: string[] = [
  "Never touch private notes unless the project is eternalnotes-private",
  "Never push automatically — Level 6 always requires manual approval",
  "Never deploy automatically — deploy requires explicit human sign-off",
  "Never delete files without explicit approval at Level 4 or higher",
  "Never modify unrelated repos — one repo per task, always",
  "Always summarize changes back into Builder OS data files after execution",
  "Default approval level is 2 (prompts only) or 3 (read-only analysis)",
  "Agent scope is locked to the approved brief — no scope expansion",
];

export const DEFAULT_APPROVAL_LEVEL: ApprovalLevel = 2;
