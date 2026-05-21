export type SessionStatus = "completed" | "partial" | "blocked" | "in-progress";
export type ToolUsed =
  | "Claude Code"
  | "Codex"
  | "Ruflo"
  | "ChatGPT"
  | "Manual"
  | "Claude Code + Codex";

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD
  projectId: string;
  toolUsed: ToolUsed;
  goal: string;
  summary: string;
  changedFiles: string[];
  nextActions: string[];
  status: SessionStatus;
};

export const SESSIONS: Session[] = [
  {
    id: "builder-os-execution-bridge",
    date: "2026-05-21",
    projectId: "builder-os",
    toolUsed: "Claude Code",
    goal: "Add /execution page with Task Packet Viewer, export blocks, and Import Execution Result workflow",
    summary:
      "Created /execution as the bridge between planning and agent dispatch. Added TaskPacketViewer component showing all packet fields. Added 5-block Export Execution Packet section (cd command, claude launch, full Claude prompt, Ruflo variant, post-execution review prompt). Added 2 new prompts: Prepare Claude Execution Packet and Review Execution Result. Updated homepage workflow to 6-step clickable flow. Added Execution to nav.",
    changedFiles: [
      "app/execution/page.tsx",
      "app/_components/TaskPacketViewer.tsx",
      "data/sdlcPrompts.ts",
      "app/layout.tsx",
      "app/page.tsx",
    ],
    nextActions: [
      "Add Import Execution Result section to /execution",
      "Create /execution-result-template standalone page",
      "Add Convert Agent Result prompt to data/sdlcPrompts.ts",
      "Update /workflow with AI execution loop steps",
    ],
    status: "completed",
  },
  {
    id: "builder-os-planner-chat-redesign",
    date: "2026-05-21",
    projectId: "builder-os",
    toolUsed: "Claude Code",
    goal: "Rebuild /planner-chat as 11-step workflow center of Builder OS",
    summary:
      "Redesigned /planner-chat with numbered 11-step vertical flow: idea input, planner questions (6 categorized), final clarified brief with Builder OS example, FRs, NFRs, constraints, risks (HIGH/MED/LOW), architecture plan, implementation phases, task packets with full scope/allowed/forbidden/rollback, and 3 per-agent execution prompts. Rebuilt homepage with Builder OS vs Builder Hub two-column section.",
    changedFiles: [
      "app/planner-chat/page.tsx",
      "app/page.tsx",
      "data/sdlcPrompts.ts",
    ],
    nextActions: [
      "Connect /planner-chat live AI in Phase 4",
      "Add in-browser SDLC field editing in Phase 2",
    ],
    status: "completed",
  },
  {
    id: "builder-os-init",
    date: "2026-05-21",
    projectId: "builder-os",
    toolUsed: "Claude Code",
    goal: "Build initial Builder OS MVP dashboard",
    summary:
      "Created Next.js 16 project with Tailwind v4. Built dashboard homepage, projects page, tasks page, prompts page, and memory files. Added nav layout and safety rules section.",
    changedFiles: [
      "app/layout.tsx",
      "app/page.tsx",
      "app/projects/page.tsx",
      "app/projects/eternalnotes/page.tsx",
      "app/tasks/page.tsx",
      "app/prompts/page.tsx",
      "app/_components/CopyButton.tsx",
      "memory/builder-os.md",
      "memory/builder-hub.md",
      "memory/eternalnotes.md",
      "memory/workflow.md",
    ],
    nextActions: [
      "Add project registry data file",
      "Add dynamic project detail pages",
      "Add prompt builder with project selector",
    ],
    status: "completed",
  },
  {
    id: "builder-os-registry",
    date: "2026-05-21",
    projectId: "builder-os",
    toolUsed: "Claude Code",
    goal: "Add project registry and connect EternalNotes as first managed project",
    summary:
      "Created data/projects.ts as the single source of truth for all 4 projects. Added /projects/[id] dynamic route with generateStaticParams. Added /workflow page with 10-step process. Updated all pages to import from the registry.",
    changedFiles: [
      "data/projects.ts",
      "app/projects/page.tsx",
      "app/projects/[id]/page.tsx",
      "app/projects/eternalnotes/page.tsx",
      "app/workflow/page.tsx",
      "app/layout.tsx",
      "app/page.tsx",
    ],
    nextActions: [
      "Add prompt builder with project selector dropdown",
      "Add task board with Kanban columns",
      "Add project memory system",
    ],
    status: "completed",
  },
  {
    id: "builder-os-prompt-builder",
    date: "2026-05-21",
    projectId: "builder-os",
    toolUsed: "Claude Code",
    goal: "Add practical prompt builder flow with project-aware prompts",
    summary:
      "Created /prompt-builder page with 3-step flow: select project, select task type, copy generated prompt. 6 task types covering the full development cycle. Prompts auto-fill project path, goal, and safety rules.",
    changedFiles: [
      "app/prompt-builder/page.tsx",
      "app/_components/PromptBuilder.tsx",
      "app/prompts/page.tsx",
      "app/_components/PromptsClient.tsx",
      "app/layout.tsx",
      "app/page.tsx",
    ],
    nextActions: [
      "Add task board with Kanban columns",
      "Connect task cards to prompt builder",
      "Add project memory pages",
    ],
    status: "completed",
  },
  {
    id: "builder-os-task-board",
    date: "2026-05-21",
    projectId: "builder-os",
    toolUsed: "Claude Code",
    goal: "Add Kanban task board connected to project registry",
    summary:
      "Created data/tasks.ts with 10 starter tasks. Built /tasks as a 5-column Kanban board (Backlog → Ready → In Progress → Review → Done). Task cards link to project pages and prompt builder. Homepage now shows top 3 active tasks.",
    changedFiles: [
      "data/tasks.ts",
      "app/tasks/page.tsx",
      "app/page.tsx",
    ],
    nextActions: [
      "Add project memory pages",
      "Add session log system",
      "Add task editing UI",
    ],
    status: "completed",
  },
  {
    id: "builder-os-memory",
    date: "2026-05-21",
    projectId: "builder-os",
    toolUsed: "Claude Code",
    goal: "Add project memory system with decisions, risks, and next actions",
    summary:
      "Created data/memory.ts with 4 project entries. Built /memory overview page. Updated project detail pages to show full memory: summary, current goal, decisions, risks, next actions. Added 'Update project memory' to workflow step 9.",
    changedFiles: [
      "data/memory.ts",
      "app/memory/page.tsx",
      "app/projects/[id]/page.tsx",
      "app/layout.tsx",
      "app/page.tsx",
      "app/workflow/page.tsx",
    ],
    nextActions: [
      "Add session log system",
      "Add memory editing UI",
      "Wire task status toggle",
    ],
    status: "completed",
  },
  {
    id: "builder-hub-init",
    date: "2026-05-21",
    projectId: "builder-hub",
    toolUsed: "Manual",
    goal: "Set up Builder Hub public website repository",
    summary:
      "Created initial public website repository. Homepage scaffolded but content is incomplete. EternalNotes page not added yet.",
    changedFiles: [
      "README.md",
      "package.json",
    ],
    nextActions: [
      "Write homepage hero section",
      "Add EternalNotes project card",
      "Write install instructions after public EN is cleaned",
    ],
    status: "partial",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const STATUS_COLOR: Record<SessionStatus, string> = {
  completed: "bg-emerald-900 text-emerald-300",
  partial: "bg-yellow-900 text-yellow-300",
  blocked: "bg-red-900 text-red-300",
  "in-progress": "bg-blue-900 text-blue-300",
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  completed: "Completed",
  partial: "Partial",
  blocked: "Blocked",
  "in-progress": "In Progress",
};

export function getRecentSessions(limit?: number): Session[] {
  const sorted = [...SESSIONS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getSessionsForProject(projectId: string, limit?: number): Session[] {
  const filtered = SESSIONS.filter((s) => s.projectId === projectId).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return limit ? filtered.slice(0, limit) : filtered;
}
