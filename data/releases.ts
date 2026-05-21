export type PublicStatus =
  | "private-only"
  | "preparing-public"
  | "public-ready"
  | "listed-on-hub"
  | "needs-review";

export type ChecklistItem = {
  label: string;
  done: boolean;
};

export type ReleaseItem = {
  id: string;
  projectId: string;
  publicStatus: PublicStatus;
  checklist: ChecklistItem[];
  publicRepo: string | null;
  hubPage: string | null;
  notes: string;
  nextAction: string;
};

const PUBLIC_CHECKLIST = (overrides: Partial<Record<string, boolean>> = {}): ChecklistItem[] => [
  { label: "No private data in repo",        done: overrides["no-private-data"]     ?? false },
  { label: "No .env files tracked",          done: overrides["no-env"]              ?? false },
  { label: "README updated and accurate",    done: overrides["readme"]              ?? false },
  { label: "Install instructions work",      done: overrides["install"]             ?? false },
  { label: "Sample data only (no real data)",done: overrides["sample-data"]         ?? false },
  { label: "Screenshots added",              done: overrides["screenshots"]         ?? false },
  { label: "Linked from Builder Hub",        done: overrides["linked-from-hub"]     ?? false },
];

export const RELEASES: ReleaseItem[] = [
  {
    id: "builder-os-release",
    projectId: "builder-os",
    publicStatus: "private-only",
    checklist: [],
    publicRepo: null,
    hubPage: null,
    notes:
      "Builder OS is intentionally private. Contains project memory, task data, and session logs. Never make public.",
    nextAction: "No action needed — keep private.",
  },
  {
    id: "eternalnotes-private-release",
    projectId: "eternalnotes-private",
    publicStatus: "private-only",
    checklist: [],
    publicRepo: null,
    hubPage: null,
    notes:
      "Personal EternalNotes setup with real notes. Intentionally private forever. Never push to public.",
    nextAction: "No action needed — keep private. Verify .gitignore periodically.",
  },
  {
    id: "eternalnotes-public-release",
    projectId: "eternalnotes-public",
    publicStatus: "needs-review",
    checklist: PUBLIC_CHECKLIST({
      "no-private-data": false,
      "no-env": false,
      "readme": false,
      "install": false,
      "sample-data": false,
      "screenshots": false,
      "linked-from-hub": false,
    }),
    publicRepo: "https://github.com/William-Papps/obsidian-like-rag-system",
    hubPage: null,
    notes:
      "Repo exists but still contains auth/billing code and possibly private data. Not safe for public distribution yet.",
    nextAction: "Run 'Prepare Public Release' prompt. Remove auth/billing. Add sample notes. Rewrite README.",
  },
  {
    id: "builder-hub-release",
    projectId: "builder-hub",
    publicStatus: "preparing-public",
    checklist: [
      { label: "No private data in repo",          done: true  },
      { label: "No .env files tracked",            done: true  },
      { label: "Homepage written",                 done: false },
      { label: "EternalNotes page added",          done: false },
      { label: "Install instructions written",     done: false },
      { label: "Screenshots added",               done: false },
      { label: "Custom domain or deploy set up",  done: false },
    ],
    publicRepo: "https://github.com/William-Papps/builder-hub",
    hubPage: null,
    notes:
      "Repo exists and is clean. Homepage needs content. Waiting on EternalNotes public cleanup before adding install guide.",
    nextAction: "Finish homepage hero. Add EternalNotes card. Add install guide once EN public repo is clean.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const RELEASE_MAP: Record<string, ReleaseItem> = Object.fromEntries(
  RELEASES.map((r) => [r.projectId, r])
);

export const STATUS_ORDER: PublicStatus[] = [
  "needs-review",
  "preparing-public",
  "public-ready",
  "listed-on-hub",
  "private-only",
];

export const STATUS_LABEL: Record<PublicStatus, string> = {
  "private-only":      "Private Only",
  "preparing-public":  "Preparing for Public",
  "public-ready":      "Public Ready",
  "listed-on-hub":     "Listed on Hub",
  "needs-review":      "Needs Review",
};

export const STATUS_COLOR: Record<PublicStatus, string> = {
  "private-only":      "bg-neutral-800 text-neutral-400",
  "preparing-public":  "bg-blue-900 text-blue-300",
  "public-ready":      "bg-emerald-900 text-emerald-300",
  "listed-on-hub":     "bg-violet-900 text-violet-300",
  "needs-review":      "bg-yellow-900 text-yellow-300",
};

export const STATUS_BORDER: Record<PublicStatus, string> = {
  "private-only":      "border-neutral-800",
  "preparing-public":  "border-blue-900",
  "public-ready":      "border-emerald-900",
  "listed-on-hub":     "border-violet-900",
  "needs-review":      "border-yellow-900",
};
