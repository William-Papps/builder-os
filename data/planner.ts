// ─── Types ───────────────────────────────────────────────────────────────────

export type PlannerStage = {
  id: string;
  step: number;
  title: string;
  description: string;
  goal: string;
  isGate?: boolean;
};

export type ClarifyingQuestion = {
  id: string;
  question: string;
  why: string;
};

export type BriefTemplateField = {
  id: string;
  label: string;
  placeholder: string;
  note?: string;
};

export type HandoffChecklistItem = {
  id: string;
  item: string;
  detail: string;
};

// ─── Planner stages ──────────────────────────────────────────────────────────

export const PLANNER_STAGES: PlannerStage[] = [
  {
    id: "messy-idea",
    step: 1,
    title: "Start with a messy idea",
    description: "Dump the raw idea without worrying about structure. No filtering yet.",
    goal: "Get the idea out of your head in plain language.",
  },
  {
    id: "clarify",
    step: 2,
    title: "Ask clarifying questions",
    description:
      "The AI asks only the necessary questions — nothing more. Weak assumptions get challenged here.",
    goal: "Identify gaps, unstated constraints, and weak assumptions before committing.",
    isGate: true,
  },
  {
    id: "target-project",
    step: 3,
    title: "Define target project",
    description: "Pick which repo this belongs to. One project per brief — no cross-repo tasks.",
    goal: "Lock in the project before scoping the work.",
  },
  {
    id: "desired-outcome",
    step: 4,
    title: "Define desired outcome",
    description: "What does success look like concretely? Not features — the outcome you actually want.",
    goal: "Make sure the outcome is measurable and specific.",
  },
  {
    id: "out-of-scope",
    step: 5,
    title: "Define what NOT to build",
    description:
      "Explicitly rule out scope creep. Name the things that sound tempting but aren't needed for this brief.",
    goal: "Prevent overbuilding before it starts.",
    isGate: true,
  },
  {
    id: "risks",
    step: 6,
    title: "Define risks",
    description:
      "Name every risk: privacy exposure, breaking changes, over-engineering, maintenance burden.",
    goal: "Surface risks early so they shape the brief, not the rollback plan.",
  },
  {
    id: "final-brief",
    step: 7,
    title: "Create final brief",
    description:
      "Produce the structured brief: raw idea, problem, target user, outcome, MVP scope, out of scope, risks, first task, approval level.",
    goal: "A final brief that can be converted to a task packet with no further clarification.",
    isGate: true,
  },
  {
    id: "task-packet",
    step: 8,
    title: "Convert to approved task packet",
    description:
      "Turn the final brief into an Approved Task Packet: allowed actions, forbidden actions, execution prompt, expected output, rollback plan.",
    goal: "A ready-to-paste entry for data/taskPackets.ts.",
  },
];

// ─── Clarifying questions ─────────────────────────────────────────────────────

export const CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "q-problem",
    question: "What specific problem are you solving — and for whom?",
    why: "Ideas often start as solutions. Naming the problem first prevents building the wrong thing.",
  },
  {
    id: "q-success",
    question: "What does success look like in concrete terms — not features, but outcome?",
    why: "Features can be cut. The outcome can't. Locking this in prevents scope creep.",
  },
  {
    id: "q-smallest",
    question: "What is the absolute smallest version of this that would still be useful?",
    why: "Finds the MVP before the full spec. The answer is almost always smaller than you think.",
  },
  {
    id: "q-not-build",
    question: "What are you explicitly NOT building in this version?",
    why: "Naming what's out of scope is as important as naming what's in scope.",
  },
  {
    id: "q-project",
    question: "Which project does this belong to — and does it need to touch any other repo?",
    why: "Cross-repo work is always higher risk. One brief = one repo.",
  },
  {
    id: "q-approval",
    question: "What is the minimum approval level needed — read-only, file edits, or commit?",
    why: "This determines whether an agent can do it safely or if it needs manual sign-off.",
  },
  {
    id: "q-risk",
    question: "What could go wrong — and what is the rollback plan if it does?",
    why: "Every task should have a known undo path before execution begins.",
  },
  {
    id: "q-defer",
    question: "What sounds tempting to add but should be deferred to a future brief?",
    why: "Scope creep starts as good ideas. Naming them explicitly keeps the MVP small.",
  },
];

// ─── Final brief template fields ─────────────────────────────────────────────

export const BRIEF_TEMPLATE_FIELDS: BriefTemplateField[] = [
  {
    id: "raw-idea",
    label: "rawIdea",
    placeholder: "One clear sentence summarizing the idea.",
  },
  {
    id: "project-id",
    label: "projectId",
    placeholder: "builder-os / builder-hub / eternalnotes-public / eternalnotes-private",
    note: "One project only.",
  },
  {
    id: "repo-path",
    label: "repoPath",
    placeholder: "Local path to the selected repo.",
  },
  {
    id: "problem",
    label: "problem",
    placeholder: "What specific problem does this solve? Be concrete.",
  },
  {
    id: "target-user",
    label: "targetUser",
    placeholder: "Who is this for? (It's usually just you.)",
  },
  {
    id: "desired-outcome",
    label: "desiredOutcome",
    placeholder: "What does success look like in measurable terms?",
  },
  {
    id: "mvp-scope",
    label: "mvpScope",
    placeholder: "What features are included in this brief — only what is needed.",
  },
  {
    id: "out-of-scope",
    label: "outOfScope",
    placeholder: "What is explicitly deferred — name it to prevent scope creep.",
  },
  {
    id: "risks",
    label: "risks",
    placeholder: "Privacy exposure, breaking changes, over-engineering, maintenance burden.",
  },
  {
    id: "first-task",
    label: "firstTask",
    placeholder: "One small, safe, reversible first task — specific enough to implement in one session.",
  },
  {
    id: "approval-level",
    label: "approvalLevel",
    placeholder: "plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved",
    note: "Default to read-only unless file edits are clearly required.",
  },
];

// ─── Task packet handoff checklist ───────────────────────────────────────────

export const HANDOFF_CHECKLIST: HandoffChecklistItem[] = [
  {
    id: "hc-brief-approved",
    item: "Brief is approved",
    detail: "The final brief has been reviewed and all clarifying questions are resolved.",
  },
  {
    id: "hc-project-locked",
    item: "Project is locked",
    detail: "One project only. No cross-repo work in this task packet.",
  },
  {
    id: "hc-scope-written",
    item: "Scope is written explicitly",
    detail: "The scope field names exact files and directories — not just 'the codebase'.",
  },
  {
    id: "hc-allowed-actions",
    item: "Allowed actions are listed",
    detail: "Every action the agent may take is named explicitly.",
  },
  {
    id: "hc-forbidden-actions",
    item: "Forbidden actions are listed",
    detail: "Includes: no automatic push, no commit without approval, no touching other repos.",
  },
  {
    id: "hc-execution-prompt",
    item: "Execution prompt is written",
    detail:
      "A complete, ready-to-paste prompt for Claude Code or Ruflo. Includes the pre-edit list-files step and no-push rule.",
  },
  {
    id: "hc-expected-output",
    item: "Expected output is defined",
    detail: "What the agent should return when the task is done — used to verify completion.",
  },
  {
    id: "hc-rollback",
    item: "Rollback plan is written",
    detail: "How to undo the changes if something goes wrong.",
  },
  {
    id: "hc-approval-level",
    item: "Approval level is set",
    detail: "Minimum level required. Default to read-only unless edits are clearly required.",
  },
];
