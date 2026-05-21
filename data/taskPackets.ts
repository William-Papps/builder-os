import { PROJECT_MAP } from "./projects";

export type PacketStatus =
  | "draft"
  | "approved"
  | "running-later"
  | "completed"
  | "blocked";

export type PacketApprovalLevel =
  | "plan-only"
  | "prompt-only"
  | "read-only"
  | "edit-approved"
  | "commit-approved"
  | "push-approved";

export type TaskPacket = {
  id: string;
  title: string;
  projectId: string;
  repoPath: string;
  status: PacketStatus;
  approvalLevel: PacketApprovalLevel;
  goal: string;
  scope: string;
  allowedActions: string[];
  forbiddenActions: string[];
  executionPrompt: string;
  expectedOutput: string;
  rollbackPlan: string;
  createdAt: string;
};

export const TASK_PACKETS: TaskPacket[] = [
  {
    id: "improve-prompt-builder",
    title: "Improve Builder OS prompt builder",
    projectId: "builder-os",
    repoPath: PROJECT_MAP["builder-os"]?.localPath ?? "unknown",
    status: "approved",
    approvalLevel: "edit-approved",
    goal: "Add more task types to PromptBuilder.tsx and improve the generated prompt quality with richer project context.",
    scope: "app/_components/PromptBuilder.tsx only. No other files unless a type import is required.",
    allowedActions: [
      "Read and analyze app/_components/PromptBuilder.tsx",
      "Add new task type entries to the TASK_TYPES array",
      "Improve existing build() function output quality",
      "Run build and typecheck after changes",
    ],
    forbiddenActions: [
      "Modify data/projects.ts or any data file",
      "Touch other components or pages",
      "Push or commit automatically",
      "Add external dependencies",
    ],
    executionPrompt: `You are improving the prompt builder in Builder OS.

Project: Builder OS
Repo: C:\\Users\\willi\\Projects\\builder-os
File to edit: app/_components/PromptBuilder.tsx

Task: Improve the generated prompt quality and add any missing task types.

Before editing:
1. Read PromptBuilder.tsx and list the current TASK_TYPES
2. Identify which task types have weak or generic build() output
3. List exactly what you plan to change and why

After approval:
- Improve the build() functions to include richer project context
- Add any task types that are clearly missing
- Run: npm run build
- Summarize every change made

Rules:
- Only edit app/_components/PromptBuilder.tsx
- Do not push or commit automatically
- Do not add external packages`,
    expectedOutput:
      "Updated PromptBuilder.tsx with improved build() functions and any added task types. Build passes. Summary of every change.",
    rollbackPlan:
      "git restore app/_components/PromptBuilder.tsx — no other files touched.",
    createdAt: "2026-05-21",
  },
  {
    id: "add-hub-install-instructions",
    title: "Add install instructions to Builder Hub",
    projectId: "builder-hub",
    repoPath: PROJECT_MAP["builder-hub"]?.localPath ?? "unknown",
    status: "approved",
    approvalLevel: "edit-approved",
    goal: "Write a step-by-step EternalNotes install guide on the Builder Hub website so visitors can download and run the app locally.",
    scope: "Builder Hub repo only. Write or update the EternalNotes page with setup instructions. Do not touch Builder OS or the EternalNotes repos.",
    allowedActions: [
      "Read the existing Builder Hub project structure",
      "Create or update the EternalNotes page",
      "Add install instructions referencing the public EN repo",
      "Run build and typecheck after changes",
    ],
    forbiddenActions: [
      "Modify the EternalNotes repos (public or private)",
      "Touch Builder OS",
      "Push or deploy automatically",
      "Add private data or internal links",
    ],
    executionPrompt: `You are adding install instructions to Builder Hub.

Project: Builder Hub
Repo: C:\\Users\\willi\\Projects\\builder-hub
Public EternalNotes repo: https://github.com/William-Papps/obsidian-like-rag-system

Task: Create a clear, step-by-step install guide for EternalNotes on the Builder Hub website.

Before editing:
1. Read the current Builder Hub project structure
2. Find the EternalNotes page or identify where to add it
3. List every file you plan to change

Install guide should cover:
- Prerequisites (Node.js version, etc.)
- Clone the repo
- Install dependencies
- Set up environment
- Run locally

Rules:
- Only work in the builder-hub repo
- Do not modify EternalNotes repos
- Do not add private data or internal links
- Do not push or deploy automatically
- Run build after changes`,
    expectedOutput:
      "EternalNotes install guide page created or updated in Builder Hub. Step-by-step instructions are accurate. Build passes.",
    rollbackPlan:
      "git restore the created/modified page file in builder-hub repo. No other repos touched.",
    createdAt: "2026-05-21",
  },
  {
    id: "review-en-readme",
    title: "Review public EternalNotes README",
    projectId: "eternalnotes-public",
    repoPath: PROJECT_MAP["eternalnotes-public"]?.localPath ?? "unknown",
    status: "approved",
    approvalLevel: "read-only",
    goal: "Audit the README for accuracy, clarity, and alignment with the current codebase. Report gaps and recommend specific improvements.",
    scope: "Read-only pass of the eternalnotes-public repo. Report only — no file edits in this packet.",
    allowedActions: [
      "Read README.md",
      "Read package.json and main entry points",
      "Compare README instructions against actual project structure",
      "Report gaps, inaccuracies, and missing sections",
    ],
    forbiddenActions: [
      "Edit any files",
      "Touch private notes or .env files",
      "Modify other repos",
      "Commit or push anything",
    ],
    executionPrompt: `You are auditing the public EternalNotes README.

Project: EternalNotes (Public)
Repo: C:\\Users\\willi\\Projects\\obsidian-like-rag-system

Task: Read-only audit of the README. Do NOT edit any files.

Review:
1. Read README.md completely
2. Read package.json and identify the actual run commands
3. Check if install instructions match the real project structure
4. Check if any private or internal references exist in the README
5. Check if screenshots are mentioned but missing

Return:
1. Summary of the README's current state
2. Inaccuracies found — label each HIGH / MEDIUM / LOW
3. Missing sections (install steps, prerequisites, etc.)
4. Any private or internal references to remove
5. Recommended rewrite sections in priority order

Do NOT edit any files. This is a read-only review.`,
    expectedOutput:
      "A structured audit report: current README state, inaccuracies labeled by severity, missing sections, and a prioritized rewrite plan.",
    rollbackPlan: "No files are changed in this packet — nothing to roll back.",
    createdAt: "2026-05-21",
  },
];

export const PACKET_MAP: Record<string, TaskPacket> = Object.fromEntries(
  TASK_PACKETS.map((p) => [p.id, p])
);

// ── Display helpers ───────────────────────────────────────────────────────────

export const STATUS_ORDER: PacketStatus[] = [
  "approved",
  "running-later",
  "draft",
  "blocked",
  "completed",
];

export const STATUS_LABEL: Record<PacketStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  "running-later": "Running Later",
  completed: "Completed",
  blocked: "Blocked",
};

export const STATUS_COLOR: Record<PacketStatus, string> = {
  draft: "bg-neutral-800 text-neutral-400",
  approved: "bg-emerald-900 text-emerald-300",
  "running-later": "bg-blue-900 text-blue-300",
  completed: "bg-violet-900 text-violet-300",
  blocked: "bg-red-900 text-red-300",
};

export const STATUS_BORDER: Record<PacketStatus, string> = {
  draft: "border-neutral-800",
  approved: "border-emerald-900",
  "running-later": "border-blue-900",
  completed: "border-violet-900",
  blocked: "border-red-900",
};

export const LEVEL_LABEL: Record<PacketApprovalLevel, string> = {
  "plan-only": "Plan only",
  "prompt-only": "Prompt only",
  "read-only": "Read only",
  "edit-approved": "Edit approved",
  "commit-approved": "Commit approved",
  "push-approved": "Push approved",
};

export const LEVEL_COLOR: Record<PacketApprovalLevel, string> = {
  "plan-only": "bg-neutral-800 text-neutral-400",
  "prompt-only": "bg-blue-900 text-blue-400",
  "read-only": "bg-emerald-900 text-emerald-400",
  "edit-approved": "bg-yellow-900 text-yellow-400",
  "commit-approved": "bg-orange-900 text-orange-400",
  "push-approved": "bg-red-900 text-red-400",
};
