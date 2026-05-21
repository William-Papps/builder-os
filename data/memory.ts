export type ProjectMemory = {
  projectId: string;
  summary: string;
  currentGoal: string;
  decisions: string[];
  risks: string[];
  nextActions: string[];
  lastUpdated: string; // YYYY-MM-DD
};

export const MEMORY: ProjectMemory[] = [
  {
    projectId: "builder-os",
    summary:
      "Private Next.js 16 command center. All data in TypeScript files — no database yet. Contains project registry, task board, prompt builder, and now project memory.",
    currentGoal:
      "Complete the MVP: project registry, task board, prompt builder, and memory system all connected.",
    decisions: [
      "Use Next.js app router with Tailwind v4 — no external UI library",
      "Store all data in TypeScript data files — no database yet",
      "Keep entirely private and local — no auth, no public deployment",
      "app/ directory is the active Next.js root (src/app/ is ignored when app/ exists)",
      "Static pre-rendering for all pages — no server-side fetching needed yet",
      "Prompt builder is the primary tool — links from task cards and project pages",
    ],
    risks: [
      "data files need manual edits — no UI editor yet, easy to forget to update",
      "Memory and task data can go stale after sessions if not updated",
      "No validation on data file edits — a typo breaks the build",
    ],
    nextActions: [
      "Add memory editing UI in a future session",
      "Wire task status changes to a simple toggle UI",
      "Add agent runner UI placeholder for Ruflo integration",
      "Consider adding /journal page for session notes",
    ],
    lastUpdated: "2026-05-21",
  },
  {
    projectId: "builder-hub",
    summary:
      "Public website for free tools. Currently only EternalNotes. No private data, no admin controls.",
    currentGoal:
      "Finish public homepage and add EternalNotes page with clear download and install instructions.",
    decisions: [
      "Public only — no private data, no admin controls, no Ruflo controls",
      "EternalNotes is the first tool — add more tools later once it is clean",
      "Screenshots are deferred until the public EN repo is cleaned up",
    ],
    risks: [
      "Screenshots cannot be added until public EternalNotes is cleaned",
      "Install instructions cannot be finalized until public EN setup is simplified",
      "Risk of accidentally linking to private repo instead of public one",
    ],
    nextActions: [
      "Write and finish the public homepage hero section",
      "Add EternalNotes project card with description",
      "Write step-by-step install guide once EN setup is simplified",
      "Add screenshots after EN public cleanup is done",
    ],
    lastUpdated: "2026-05-21",
  },
  {
    projectId: "eternalnotes-public",
    summary:
      "Open-source local-first RAG note-taking tool. Needs cleanup before it is ready for public download.",
    currentGoal:
      "Remove auth/billing code, add sample notes only, and rewrite README for simple one-command setup.",
    decisions: [
      "No accounts, no billing — pure local tool with no server dependency",
      "Sample notes only in public repo — no real private notes ever",
      "Cleanup happens before Builder Hub screenshots or install guide",
      "Do not restructure the codebase during cleanup — only remove and simplify",
    ],
    risks: [
      "Auth and billing code may be intertwined with core features — removal needs careful review",
      "README may reference features that no longer exist after cleanup",
      "Risk of accidentally committing real notes if working directory is not checked",
      "Build may break after auth removal if other code depends on it",
    ],
    nextActions: [
      "Run 'Review repo safety' prompt to audit current state",
      "Remove accounts/signup code in one focused session",
      "Remove billing/Stripe code in a separate session",
      "Replace placeholder notes with clean sample set",
      "Rewrite README after code cleanup is complete",
    ],
    lastUpdated: "2026-05-21",
  },
  {
    projectId: "eternalnotes-private",
    summary:
      "Personal EternalNotes setup with real notes. Kept private forever. No changes without backup.",
    currentGoal:
      "Verify all safety rules are in place: .gitignore protects notes, .env is excluded, no database files tracked.",
    decisions: [
      "Real notes NEVER go to the public repo under any circumstances",
      "Never merge public repo changes into private without full review",
      "Always backup notes before any code changes",
      "Treat this repo as read-mostly — changes are rare and deliberate",
    ],
    risks: [
      ".gitignore gaps could silently expose notes folder on next push",
      ".env files could be accidentally staged during a git add -A",
      "Database files (SQLite, etc.) may not be in .gitignore",
      "Git history may contain accidentally committed data from early setup",
    ],
    nextActions: [
      "Run 'Review repo safety' prompt to audit .gitignore",
      "Verify notes folder is in .gitignore",
      "Verify .env is in .gitignore",
      "Verify database/upload files are excluded",
      "Audit git log for any accidental data commits",
    ],
    lastUpdated: "2026-05-21",
  },
];

export const MEMORY_MAP: Record<string, ProjectMemory> = Object.fromEntries(
  MEMORY.map((m) => [m.projectId, m])
);
