export type TaskStatus = "backlog" | "ready" | "in-progress" | "review" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type PromptType =
  | "analyze"
  | "plan"
  | "implement"
  | "safety"
  | "summarize"
  | "release";

export type Task = {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
  suggestedPromptType: PromptType;
  nextAction: string;
};

export const TASKS: Task[] = [
  // ── In Progress ──────────────────────────────────────────────
  {
    id: "builder-hub-homepage",
    title: "Finish Builder Hub homepage",
    projectId: "builder-hub",
    status: "in-progress",
    priority: "high",
    description: "Public landing page for free tools. Needs a clear hero and EternalNotes card.",
    suggestedPromptType: "implement",
    nextAction: "Add clear hero section and EternalNotes download card",
  },
  {
    id: "improve-prompt-builder",
    title: "Improve Builder OS prompt builder",
    projectId: "builder-os",
    status: "in-progress",
    priority: "medium",
    description: "Add more context to generated prompts, refine task types.",
    suggestedPromptType: "implement",
    nextAction: "Refine generated prompt output and add context fields",
  },

  // ── Ready ─────────────────────────────────────────────────────
  {
    id: "builder-hub-install-instructions",
    title: "Add EternalNotes install instructions to Builder Hub",
    projectId: "builder-hub",
    status: "ready",
    priority: "high",
    description: "Step-by-step setup guide so visitors can download and run EternalNotes.",
    suggestedPromptType: "implement",
    nextAction: "Write step-by-step install guide for the Builder Hub EternalNotes page",
  },
  {
    id: "review-public-en-readme",
    title: "Review public EternalNotes README",
    projectId: "eternalnotes-public",
    status: "ready",
    priority: "high",
    description: "Audit the README for accuracy, clarity, and alignment with current code.",
    suggestedPromptType: "analyze",
    nextAction: "Open repo, read README, compare against actual project structure",
  },
  {
    id: "remove-en-auth",
    title: "Remove accounts/signup from public EternalNotes",
    projectId: "eternalnotes-public",
    status: "ready",
    priority: "high",
    description: "Public repo should have no auth/signup code.",
    suggestedPromptType: "implement",
    nextAction: "Use Implement Safe Small Change prompt in the public EN repo",
  },
  {
    id: "verify-private-gitignore",
    title: "Verify private EternalNotes .gitignore",
    projectId: "eternalnotes-private",
    status: "ready",
    priority: "high",
    description: "Confirm the notes folder, .env, and database files are all ignored.",
    suggestedPromptType: "safety",
    nextAction: "Run the Review Repo Safety prompt in the private EN repo",
  },

  // ── Backlog ───────────────────────────────────────────────────
  {
    id: "remove-en-billing",
    title: "Remove billing/Stripe from public EternalNotes",
    projectId: "eternalnotes-public",
    status: "backlog",
    priority: "high",
    description: "Remove all Stripe/billing code from the public repo.",
    suggestedPromptType: "implement",
    nextAction: "Do after auth removal is complete",
  },
  {
    id: "builder-hub-screenshots",
    title: "Add screenshots to Builder Hub",
    projectId: "builder-hub",
    status: "backlog",
    priority: "medium",
    description: "Screenshots of EternalNotes running locally.",
    suggestedPromptType: "implement",
    nextAction: "Wait for public EN cleanup first, then take screenshots",
  },
  {
    id: "ruflo-setup-notes",
    title: "Add Ruflo setup notes to Builder OS",
    projectId: "builder-os",
    status: "backlog",
    priority: "low",
    description: "Document how Ruflo will be integrated into Builder OS later.",
    suggestedPromptType: "plan",
    nextAction: "Decide what Ruflo should automate in the Builder OS workflow",
  },
  {
    id: "en-sample-notes",
    title: "Add sample notes to public EternalNotes",
    projectId: "eternalnotes-public",
    status: "backlog",
    priority: "medium",
    description: "Replace any real or placeholder notes with a clean sample set.",
    suggestedPromptType: "implement",
    nextAction: "Do after auth and billing removal",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const STATUS_ORDER: TaskStatus[] = [
  "backlog",
  "ready",
  "in-progress",
  "review",
  "done",
];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  ready: "Ready",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: "bg-red-900 text-red-300",
  medium: "bg-yellow-900 text-yellow-300",
  low: "bg-neutral-800 text-neutral-400",
};

export const PROMPT_TYPE_LABEL: Record<PromptType, string> = {
  analyze: "Analyze status",
  plan: "Plan next task",
  implement: "Implement change",
  safety: "Safety review",
  summarize: "Summarize state",
  release: "Release notes",
};

export function getActiveTasks(limit?: number): Task[] {
  const active = TASKS.filter((t) => t.status !== "done").sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
  return limit ? active.slice(0, limit) : active;
}
