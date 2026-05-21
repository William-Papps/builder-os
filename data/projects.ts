export type ProjectStatus = "active" | "in-progress" | "cleanup-needed" | "safe";
export type ProjectType = "private-tool" | "public-website" | "public-tool" | "private-notes";

export type Project = {
  id: string;
  name: string;
  type: ProjectType;
  localPath: string;
  repoUrl: string | null;
  status: ProjectStatus;
  purpose: string;
  currentGoal: string;
  nextActions: string[];
  safetyRules: string[];
};

export const PROJECTS: Project[] = [
  {
    id: "builder-os",
    name: "Builder OS",
    type: "private-tool",
    localPath: "C:\\Users\\willi\\Projects\\builder-os",
    repoUrl: "https://github.com/William-Papps/builder-os",
    status: "active",
    purpose:
      "Private local dashboard for planning projects, tracking tasks, generating AI prompts, and managing the whole system.",
    currentGoal:
      "Build a working MVP command center with a connected project registry.",
    nextActions: [
      "Add project detail pages for all repos",
      "Improve prompt generator with project selector",
      "Add workflow page",
      "Connect more projects as they are ready",
    ],
    safetyRules: [
      "Private only — never make public",
      "No login or auth needed",
      "No database yet — Markdown files as source of truth",
      "Never expose private notes or .env files",
    ],
  },
  {
    id: "builder-hub",
    name: "Builder Hub",
    type: "public-website",
    localPath: "C:\\Users\\willi\\Projects\\builder-hub",
    repoUrl: "https://github.com/William-Papps/builder-hub",
    status: "in-progress",
    purpose:
      "Public website showing free downloadable tools. Currently only EternalNotes.",
    currentGoal:
      "Finish public homepage and add EternalNotes page with install instructions.",
    nextActions: [
      "Finish public homepage",
      "Add EternalNotes project page",
      "Add install instructions",
      "Add screenshots after EternalNotes public repo is cleaned",
    ],
    safetyRules: [
      "Public website only — no private controls",
      "No private notes or data",
      "No Ruflo or Builder OS controls visible",
    ],
  },
  {
    id: "eternalnotes-public",
    name: "EternalNotes (Public)",
    type: "public-tool",
    localPath: "C:\\Users\\willi\\Projects\\obsidian-like-rag-system",
    repoUrl: "https://github.com/William-Papps/obsidian-like-rag-system",
    status: "cleanup-needed",
    purpose:
      "Open-source local-first RAG note-taking tool. No accounts, no billing, no private data.",
    currentGoal:
      "Clean repo to be a simple, safe, downloadable open-source tool anyone can run locally.",
    nextActions: [
      "Remove accounts/signup code",
      "Remove billing/Stripe code",
      "Add sample notes only",
      "Rewrite README for simple setup",
      "Simplify installation instructions",
    ],
    safetyRules: [
      "Sample notes only — no real private notes ever",
      "No auth, no billing, no private data",
      "Must be clean and simple for anyone to set up",
    ],
  },
  {
    id: "eternalnotes-private",
    name: "EternalNotes (Private)",
    type: "private-notes",
    localPath: "C:\\Users\\willi\\Projects\\private-eternalnotes",
    repoUrl: "https://github.com/William-Papps/private-eternalnotes",
    status: "safe",
    purpose: "Personal setup with real notes. Kept private forever.",
    currentGoal:
      "Verify safety rules are in place and keep real notes protected.",
    nextActions: [
      "Verify .gitignore protects notes folder",
      "Verify .env files are not tracked",
      "Verify database files are not tracked",
      "Backup notes before any future changes",
    ],
    safetyRules: [
      "NEVER push real notes to GitHub",
      "NEVER push .env files",
      "Backup before any changes",
      "Do not merge public repo code without careful review",
      "Audit GitHub history if a data leak is suspected",
    ],
  },
];

export const PROJECT_MAP: Record<string, Project> = Object.fromEntries(
  PROJECTS.map((p) => [p.id, p])
);

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  "in-progress": "In Progress",
  "cleanup-needed": "Cleanup Needed",
  safe: "Safe",
};

export const STATUS_COLOR: Record<ProjectStatus, string> = {
  active: "bg-emerald-900 text-emerald-300",
  "in-progress": "bg-blue-900 text-blue-300",
  "cleanup-needed": "bg-yellow-900 text-yellow-300",
  safe: "bg-neutral-800 text-neutral-300",
};

export const TYPE_LABEL: Record<ProjectType, string> = {
  "private-tool": "Private Tool",
  "public-website": "Public Website",
  "public-tool": "Public Tool",
  "private-notes": "Private Notes",
};
