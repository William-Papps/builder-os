// ─── Types ───────────────────────────────────────────────────────────────────

export type ChecklistCategory = "brief" | "scope" | "safety" | "execution";

export type ReadinessCheckItem = {
  id: string;
  label: string;
  detail: string;
  category: ChecklistCategory;
  blocksExecution: boolean;
};

export type ReadinessLevel = {
  id: string;
  label: string;
  description: string;
  minChecksRequired: number;
  color: string;
  border: string;
  badge: string;
  bgColor: string;
};

// ─── Checklist items ─────────────────────────────────────────────────────────

export const READINESS_CHECKLIST: ReadinessCheckItem[] = [
  {
    id: "final-brief",
    label: "Final brief exists",
    detail:
      "A structured brief has been produced by the Planner and approved — not just a raw idea.",
    category: "brief",
    blocksExecution: true,
  },
  {
    id: "project-selected",
    label: "Project is selected",
    detail: "One specific project has been identified. No cross-repo tasks.",
    category: "brief",
    blocksExecution: true,
  },
  {
    id: "repo-path",
    label: "Repo path is confirmed",
    detail: "The local repo path has been verified and is accessible on this machine.",
    category: "brief",
    blocksExecution: true,
  },
  {
    id: "task-packet",
    label: "Task packet is created",
    detail:
      "An entry exists in data/taskPackets.ts with status 'approved' or 'draft' ready for review.",
    category: "scope",
    blocksExecution: true,
  },
  {
    id: "approval-level",
    label: "Approval level is selected",
    detail:
      "A specific approval level has been set: plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved.",
    category: "scope",
    blocksExecution: true,
  },
  {
    id: "allowed-actions",
    label: "Allowed actions are defined",
    detail: "Every action the agent may take is listed explicitly — no open-ended permissions.",
    category: "scope",
    blocksExecution: true,
  },
  {
    id: "forbidden-actions",
    label: "Forbidden actions are defined",
    detail:
      'The task packet explicitly forbids: automatic commit, automatic push, touching other repos, and modifying private data.',
    category: "scope",
    blocksExecution: true,
  },
  {
    id: "rollback-plan",
    label: "Rollback plan is written",
    detail: "There is a specific, actionable plan to undo the changes if something goes wrong.",
    category: "safety",
    blocksExecution: true,
  },
  {
    id: "private-data-check",
    label: "Private data risk is checked",
    detail:
      "The task has been reviewed for private notes, .env files, credentials, and personal data exposure.",
    category: "safety",
    blocksExecution: true,
  },
  {
    id: "build-command",
    label: "Build or test command is known",
    detail:
      "There is a known build or typecheck command (e.g., npm run build) to run after changes.",
    category: "execution",
    blocksExecution: false,
  },
  {
    id: "expected-output",
    label: "Expected output is defined",
    detail:
      "The task packet has an expectedOutput field that describes exactly what the agent should return when done.",
    category: "execution",
    blocksExecution: false,
  },
];

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  brief: "Brief & project",
  scope: "Scope & permissions",
  safety: "Safety",
  execution: "Execution",
};

export const CATEGORY_ORDER: ChecklistCategory[] = ["brief", "scope", "safety", "execution"];

// ─── Readiness levels ─────────────────────────────────────────────────────────

export const READINESS_LEVELS: ReadinessLevel[] = [
  {
    id: "not-ready",
    label: "Not ready",
    description:
      "One or more blocking checks are incomplete. Do not run any agent until these are resolved.",
    minChecksRequired: 0,
    color: "text-red-300",
    border: "border-red-900",
    badge: "bg-red-900 text-red-300",
    bgColor: "bg-red-950/30",
  },
  {
    id: "read-only",
    label: "Ready for read-only analysis",
    description:
      "All blocking checks are complete. Agent may inspect, read, and report — no file edits.",
    minChecksRequired: 9,
    color: "text-blue-300",
    border: "border-blue-900",
    badge: "bg-blue-900 text-blue-300",
    bgColor: "bg-blue-950/30",
  },
  {
    id: "approved-edits",
    label: "Ready for approved edits",
    description:
      "All checks are complete, approval level is edit-approved or higher, and all 11 items are confirmed.",
    minChecksRequired: 11,
    color: "text-emerald-300",
    border: "border-emerald-900",
    badge: "bg-emerald-900 text-emerald-300",
    bgColor: "bg-emerald-950/20",
  },
  {
    id: "commit-review",
    label: "Ready for commit review",
    description:
      "All checks are complete. Edits are done and may be staged for manual review before commit.",
    minChecksRequired: 11,
    color: "text-yellow-300",
    border: "border-yellow-900",
    badge: "bg-yellow-900 text-yellow-400",
    bgColor: "bg-yellow-950/20",
  },
  {
    id: "not-safe",
    label: "Not safe for automation",
    description:
      "The task touches private data, requires cross-repo work, or lacks a rollback plan. Block execution until resolved.",
    minChecksRequired: 0,
    color: "text-red-400",
    border: "border-red-900",
    badge: "bg-red-950 text-red-400",
    bgColor: "bg-red-950/40",
  },
];

// ─── Blocking rules ───────────────────────────────────────────────────────────

export const AUTOMATION_BLOCK_RULES: string[] = [
  "Automatic push or deploy is never allowed from a task packet",
  "An agent must not run if the rollback plan is missing",
  "An agent must not run if private data risk has not been checked",
  "An agent must not touch files outside the defined scope",
  "An agent must list every file it plans to change before editing",
  "An agent must wait for explicit approval before any file edits",
  "No cross-repo tasks — one task packet = one repo",
];
