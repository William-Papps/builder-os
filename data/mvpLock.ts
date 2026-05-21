// ─── Types ───────────────────────────────────────────────────────────────────

export type V1CheckItem = {
  id: string;
  label: string;
  route: string;
  done: boolean;
  note?: string;
};

export type NotV1Item = {
  id: string;
  label: string;
  reason: string;
};

// ─── v1 goal ─────────────────────────────────────────────────────────────────

export const V1_GOAL =
  "A private local command center that helps me plan projects, generate prompts, track tasks, record sessions, and prepare safe agent work.";

export const V1_DONE_SIGNAL =
  "When every item below is checked, stop building pages and start using Builder OS for real project work.";

// ─── v1 required checklist ────────────────────────────────────────────────────

export const V1_CHECKLIST: V1CheckItem[] = [
  {
    id: "projects",
    label: "Projects registry works",
    route: "/projects",
    done: true,
    note: "Project cards, detail pages, local paths, status labels.",
  },
  {
    id: "prompt-builder",
    label: "Prompt builder works",
    route: "/prompt-builder",
    done: true,
    note: "Project selector, 20+ task types, generated prompt, copy button.",
  },
  {
    id: "tasks",
    label: "Task board works",
    route: "/tasks",
    done: true,
    note: "Kanban-style view, priority sorting, status columns.",
  },
  {
    id: "memory",
    label: "Memory pages work",
    route: "/memory",
    done: true,
    note: "Per-project memory with decisions, risks, next actions.",
  },
  {
    id: "sessions",
    label: "Session logs work",
    route: "/sessions",
    done: true,
    note: "Session list with goal, summary, status, tool used.",
  },
  {
    id: "releases",
    label: "Release pipeline works",
    route: "/releases",
    done: true,
    note: "Public/private status per project, safety checklist.",
  },
  {
    id: "command",
    label: "Daily command page works",
    route: "/command",
    done: true,
    note: "Top recommended task, suggested prompt, last session, quick nav.",
  },
  {
    id: "task-packets",
    label: "Task packets work",
    route: "/task-packets",
    done: true,
    note: "Approved work units with scope, allowed/forbidden actions, execution prompt.",
  },
  {
    id: "planner",
    label: "Planner workflow works",
    route: "/planner",
    done: true,
    note: "Stages, clarifying questions, brief template, task packet handoff checklist.",
  },
  {
    id: "agent-readiness",
    label: "Agent readiness checklist works",
    route: "/agent-readiness",
    done: true,
    note: "11-item pre-execution checklist, readiness levels, block rules.",
  },
  {
    id: "system-health",
    label: "System health page works",
    route: "/system-health",
    done: true,
    note: "Derived health across projects, tasks, memory, sessions, releases, packets.",
  },
  {
    id: "mvp-lock",
    label: "MVP lock page works",
    route: "/mvp-lock",
    done: true,
    note: "This page. Defines v1 scope and signals when to stop building.",
  },
];

// ─── NOT v1 ──────────────────────────────────────────────────────────────────

export const NOT_V1: NotV1Item[] = [
  {
    id: "live-agents",
    label: "Live agent execution",
    reason:
      "Agents run manually via copy-paste prompts. Automatic execution requires more safety infrastructure than v1 needs.",
  },
  {
    id: "auto-commit",
    label: "Automatic commits",
    reason: "Commits are always a human decision. No agent stages or commits without explicit approval.",
  },
  {
    id: "auto-push",
    label: "Automatic pushes",
    reason: "Push is always Level 6 — maximum approval required. Never automated in v1.",
  },
  {
    id: "auto-deploy",
    label: "Automatic deploys",
    reason:
      "Deploy requires a complete approval pipeline that doesn't exist yet. Future execution engine work.",
  },
  {
    id: "user-accounts",
    label: "Public user accounts",
    reason: "Builder OS is private and local. No auth, no public access, no multi-tenant anything.",
  },
  {
    id: "db-editing",
    label: "Database-backed editing",
    reason:
      "All data lives in TypeScript files. UI editing of data files is a v2 quality-of-life feature, not v1.",
  },
  {
    id: "multi-user",
    label: "Multi-user collaboration",
    reason: "This is a personal command center. One user, one machine, one set of repos.",
  },
];

// ─── Scope creep warnings ─────────────────────────────────────────────────────

export const SCOPE_CREEP_RULES: string[] = [
  "Do not add another planning page until all v1 checklist items are used in real work",
  "Do not add a new data file for a feature that is already covered by an existing page",
  "Do not add a UI editor for data files — manual edits are acceptable for v1",
  "Do not design v2 features inside Builder OS until v1 is fully exercised",
  "The next work after v1 is complete: use it — run real tasks, record real sessions, track real releases",
];
