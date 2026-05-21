"use client";

import { useState } from "react";
import type { Project } from "@/data/projects";
import { STATUS_LABEL, STATUS_COLOR } from "@/data/projects";

// ─── Task types ──────────────────────────────────────────────────────────────

type TaskType = {
  id: string;
  label: string;
  description: string;
  needsDetail: boolean;
  detailLabel?: string;
  detailPlaceholder?: string;
  build: (p: Project, detail: string) => string;
};

const universalRules = `Universal rules:
- Do not edit files unless I explicitly say to proceed.
- Before any edits, list every file you plan to change and why.
- After editing, summarize all changed files.
- Run build or typecheck if one is available.
- Do not push to GitHub automatically.`;

function projectContext(p: Project): string {
  return `Project: ${p.name}
Local path: ${p.localPath}
GitHub: ${p.repoUrl ?? "N/A"}
Current goal: ${p.currentGoal}

Safety rules for this project:
${p.safetyRules.map((r) => `- ${r}`).join("\n")}`;
}

const TASK_TYPES: TaskType[] = [
  {
    id: "analyze",
    label: "Analyze project status",
    description: "Get a full health check before doing any work.",
    needsDetail: false,
    build: (p) => `You are helping me understand the current state of a project.

${projectContext(p)}

Task: Analyze the current state of this project.

Do NOT edit any files.

Find and report:
1. Current structure and health of the codebase
2. Progress toward the current goal
3. Obvious issues, blockers, or tech debt
4. The single most important next step
5. What should NOT be touched yet

${universalRules}`,
  },
  {
    id: "plan",
    label: "Plan next small task",
    description: "Get a prioritized, safe task plan for the next session.",
    needsDetail: false,
    build: (p) => `You are helping me plan the next work session on a project.

${projectContext(p)}

Task: Create a safe, concrete task plan for the next coding session.

Do NOT edit any files.

Return:
1. The next 3–5 small safe tasks in priority order
2. The single recommended first task (smallest safe change)
3. What should NOT be touched yet
4. A proposed commit message for each task
5. Any risks or dependencies to watch for

Be specific — use file names and line numbers where relevant.

${universalRules}`,
  },
  {
    id: "implement",
    label: "Implement safe small change",
    description: "Make one specific change with full explanation first.",
    needsDetail: true,
    detailLabel: "What is the specific change you want to make?",
    detailPlaceholder:
      "Example: Remove the /api/auth/signup route and its UI form. Do not touch anything else.",
    build: (p, detail) => `You are helping me implement a specific change safely.

${projectContext(p)}

The specific task:
${detail || "[Describe the specific change you want to make]"}

Before editing anything:
1. List every file you plan to change and explain why.
2. Confirm there are no unintended side effects.
3. Wait for me to say "proceed" before making any edits.

After editing:
- Summarize all changed files with a brief note on what changed.
- Run build or typecheck if available.
- Do not push to GitHub automatically.

${universalRules}`,
  },
  {
    id: "safety",
    label: "Review repo safety",
    description: "Audit for secrets, private data, and .gitignore gaps.",
    needsDetail: false,
    build: (p) => `You are auditing a repository for data exposure and safety risks.

${projectContext(p)}

Task: Review this repository for safety risks.

Do NOT edit any files.

Check for:
- .env files or secrets that could be tracked by git
- Private data, notes, or credentials that should not be in the repo
- Gaps in .gitignore (databases, uploads, notes folders)
- Any files that could be accidentally pushed publicly
- Sensitive strings in source code (API keys, tokens, passwords)

Return:
1. Safety risks found — label each: HIGH / MEDIUM / LOW
2. Files or patterns to add to .gitignore
3. Anything to back up before making changes
4. One safe first fix recommendation

${universalRules}`,
  },
  {
    id: "summarize",
    label: "Summarize project state",
    description: "Generate a plain-language summary for your memory files.",
    needsDetail: false,
    build: (p) => `Summarize the current state of this project for my records.

${projectContext(p)}

Do NOT edit any files.

Return:
1. What the project currently is and does
2. What is working well
3. What is incomplete or broken
4. What the next priority should be
5. A one-paragraph summary I can paste into my notes

Keep it plain and factual. No fluff.

${universalRules}`,
  },
  {
    id: "release",
    label: "Prepare public release notes",
    description: "Summarize recent changes for a changelog or README.",
    needsDetail: false,
    build: (p) => `Review recent changes in this project and prepare release notes.

${projectContext(p)}

Do NOT edit any files.

Steps:
1. Run: git log --oneline -20
2. Review recently changed files
3. Identify user-facing changes (new features, bug fixes, removals)

Return:
1. A short changelog entry (markdown format, suitable for CHANGELOG.md or README)
2. Any changes that are NOT safe to mention publicly
3. README sections that need updating to reflect the changes
4. Recommended version bump: patch / minor / major — and why

${universalRules}`,
  },
  {
    id: "create-task-packet",
    label: "Create Approved Task Packet",
    description: "Turn a final brief into a structured task packet ready to paste into data/taskPackets.ts.",
    needsDetail: true,
    detailLabel: "Paste your final approved brief here.",
    detailPlaceholder:
      "Example: Add step-by-step EternalNotes install instructions to the Builder Hub website.",
    build: (p, detail) => `Turn this final brief into an Approved Task Packet for Builder OS.

${projectContext(p)}

Final brief:
${detail || "[Paste your final brief here]"}

Return a task packet using this exact structure — I will paste it into data/taskPackets.ts.

---
id: [kebab-case-slug]
title: [clear task title]
projectId: ${p.id}
repoPath: ${p.localPath}
status: draft
approvalLevel: [plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved]
goal: [one sentence — the exact outcome]
scope: [what files and areas the agent may work in — be specific]

allowedActions:
- [action 1]
- [action 2]
- [action 3]

forbiddenActions:
- [what must not be touched]
- [no push or commit unless level is commit-approved or push-approved]

executionPrompt: |
  [A complete ready-to-paste prompt for Claude Code or Ruflo.
   Must include: project name, repo path, task, pre-edit checklist,
   post-edit summary format, build/test step, no-push rule.]

expectedOutput: [what the agent should return when done]
rollbackPlan: [how to undo the changes if something goes wrong]
createdAt: ${new Date().toISOString().split("T")[0]}
---

Rules:
- Default approvalLevel to read-only or prompt-only unless edits are clearly required
- Never recommend push-approved without a strong reason
- The executionPrompt must include a "list files before editing" step
- The forbiddenActions must include "no automatic push or commit"

${universalRules}`,
  },
  {
    id: "run-task-packet",
    label: "Run Approved Task Packet",
    description: "Tell Claude/Ruflo/Codex to execute an approved task packet with strict constraints.",
    needsDetail: true,
    detailLabel: "Paste the full task packet (goal, scope, allowed actions, approval level).",
    detailPlaceholder:
      "Paste the relevant fields from your task packet in data/taskPackets.ts.",
    build: (p, detail) => `You are executing an Approved Task Packet from Builder OS.

${projectContext(p)}

Task packet:
${detail || "[Paste the task packet details here]"}

EXECUTION RULES — follow exactly, do not deviate:

1. Scope lock
   - Read the scope field in the task packet above
   - Only work in the listed files and directories
   - Do not touch anything outside the approved scope
   - If you discover adjacent work, stop and report — do not do it

2. Approval level
   - Read the approvalLevel field
   - Only perform actions allowed at that level
   - If the level is read-only: do not edit any files
   - If the level is edit-approved: list files before editing, wait for "proceed"
   - Never commit or push unless the level is commit-approved or push-approved

3. Before any edits
   - List every file you plan to change and why
   - Confirm no side effects outside the approved scope
   - Wait for explicit approval before editing

4. After completing the task
   - Summarize every file changed (path + what changed)
   - Run build or typecheck if available — report the result
   - Do not stage, commit, or push unless explicitly told to

5. Return this exact result format:

   status: [completed / partial / blocked]
   filesChanged:
   - [path] — [what changed]
   buildResult: [passed / failed / skipped]
   risks: [any new risks discovered]
   nextActions:
   - [what to do next]
   sessionLogEntry: [2-sentence summary for data/sessions.ts]
   memoryUpdates: [what to update in data/memory.ts]
   taskUpdates: [which tasks to mark done in data/tasks.ts]

${universalRules}`,
  },
  {
    id: "check-readiness",
    label: "Check Agent Execution Readiness",
    description: "Review a task packet and get a readiness level, risks, and block decision before running any agent.",
    needsDetail: true,
    detailLabel: "Paste your task packet here (goal, scope, allowedActions, forbiddenActions, approvalLevel, rollbackPlan, expectedOutput).",
    detailPlaceholder:
      "Paste the relevant fields from your task packet in data/taskPackets.ts.",
    build: (p, detail) => `Review this task packet and return an agent execution readiness assessment.

${projectContext(p)}

Task packet:
${detail || "[Paste your task packet here]"}

Return the following — I will use this to decide whether to proceed with execution.

---
readinessLevel: [Not ready / Ready for read-only analysis / Ready for approved edits / Ready for commit review / Not safe for automation]

missingInformation:
- [anything that is undefined, vague, or missing from the task packet]
- [or: none — all required fields are present]

risks:
- [risk 1 — label HIGH / MEDIUM / LOW]
- [risk 2]
- [or: none identified]

approvalLevelRequired: [minimum level needed for this specific task — plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved]

safestNextAction: [one sentence — the safest thing to do right now before running any agent]

blockExecution: [yes / no]

blockReason: [if yes — why is execution blocked? Be specific.]

checklist:
- [ ] Final brief exists
- [ ] Project is selected
- [ ] Repo path is confirmed
- [ ] Task packet is created
- [ ] Approval level is selected
- [ ] Allowed actions are defined
- [ ] Forbidden actions are defined
- [ ] Rollback plan is written
- [ ] Private data risk is checked
- [ ] Build/test command is known
- [ ] Expected output is defined
---

Rules:
- Block execution if any HIGH risk is present
- Block execution if rollback plan is missing
- Block execution if private data risk has not been confirmed clear
- Default to the more restrictive readiness level when in doubt
- Never recommend automatic push or deploy
- Do not edit any files — this is an assessment only

${universalRules}`,
  },
  {
    id: "prepare-execution",
    label: "Prepare Task Packet For Execution",
    description: "Verify a task packet, choose an agent, and produce ready-to-use execution instructions.",
    needsDetail: true,
    detailLabel: "Paste your approved task packet here.",
    detailPlaceholder:
      "Paste the fields from your task packet: goal, scope, allowedActions, forbiddenActions, approvalLevel, rollbackPlan, expectedOutput.",
    build: (p, detail) => `Prepare this task packet for agent execution.

${projectContext(p)}

Task packet:
${detail || "[Paste your approved task packet here]"}

Review and return the following before any agent runs.

---
packetVerification:
  briefExists: [yes / no]
  projectSelected: [yes / no — name the project]
  repoPathConfirmed: [yes / no — state the path: ${p.localPath}]
  approvalLevelSet: [yes / no — state the level]
  allowedActionsDefined: [yes / no]
  forbiddenActionsDefined: [yes / no]
  rollbackPlanPresent: [yes / no]
  expectedOutputDefined: [yes / no]

repoVerification:
  repoExists: [yes / no — confirm the path is valid]
  cleanWorkingTree: [yes / no — any uncommitted changes?]
  buildCommandKnown: [yes / no — what is the build command?]

recommendedAgent: [Claude Code / Codex / Ruflo — and why]

executionInstructions: |
  [A complete, ready-to-paste execution prompt for the recommended agent.
   Must include:
   - Project name and repo path
   - The specific approved task
   - "Before editing: list every file you plan to change and why"
   - "Wait for me to say proceed before making any edits"
   - Scope boundaries
   - Post-edit summary format
   - Build/typecheck step
   - No automatic push rule]

expectedOutput: [what the agent should return when the task is complete]

rollbackSteps:
1. [specific step to undo change 1]
2. [specific step to undo change 2]
3. [git reset or revert command if needed]

readinessVerdict: [ready to execute / blocked — reason]
---

Rules:
- Do not proceed if any verification item is "no" without explanation
- Do not suggest automatic push or deploy
- Do not edit any files — this is preparation only

${universalRules}`,
  },
  {
    id: "review-result",
    label: "Review Agent Execution Result",
    description: "Summarize agent output into structured Builder OS data: sessions, tasks, memory, releases.",
    needsDetail: true,
    detailLabel: "Paste the agent's output here.",
    detailPlaceholder:
      "Paste everything the agent returned after execution — file changes, build result, risks, next actions.",
    build: (p, detail) => `Review the result of this agent execution and summarize it for Builder OS.

${projectContext(p)}

Agent result:
${detail || "[Paste the agent's output here]"}

Return the following — I will paste each section into Builder OS data files.

---
changesSummary: [2–3 sentences summarizing what actually happened]

filesChanged:
- [file path] — [what changed and why]

buildResult: [passed / failed / not run — and the output]

risksIdentified:
- [risk 1 — label HIGH / MEDIUM / LOW]
- [or: none]

commitSafe: [yes / no]
commitBlockReason: [if no — what must be resolved before committing?]

releasePipelineChanged: [yes / no — did any public-facing files change?]
releaseNote: [if yes — what needs updating in the release pipeline?]

nextActions:
- [specific next step 1]
- [specific next step 2]
- [specific next step 3]

sessionLogEntry:
  goal: [one sentence — what was the objective?]
  summary: [2–3 sentences — what happened?]
  status: [completed / partial / blocked]

memoryUpdates:
- [what to update in data/memory.ts for ${p.name}]

taskUpdates:
- [tasks to mark done in data/tasks.ts]
- [new tasks to add if discovered]
---

Rules:
- Do not recommend commit if build failed
- Do not recommend push — commit review is always the final human step
- Be factual — report what happened, not what was intended

${universalRules}`,
  },
  {
    id: "automation-plan",
    label: "Finalize Idea Into Automation Plan",
    description: "Turn an approved brief into a structured plan with tasks, agent, prompts, and risks.",
    needsDetail: true,
    detailLabel: "Paste your approved brief or idea.",
    detailPlaceholder:
      "Example: Build a /command page that shows the top recommended task and a ready-to-copy prompt.",
    build: (p, detail) => `Turn this idea into a complete automation plan for Builder OS.

${projectContext(p)}

My idea / brief:
${detail || "[Paste your approved brief here]"}

Return the following — I will paste this into Builder OS to prepare execution.

---
finalBrief: [one clear sentence describing the complete goal]

selectedProject: ${p.id}

repoPath: ${p.localPath}

taskList:
1. [first task — small, specific, reversible]
2. [second task]
3. [third task]
4. [fourth task — if needed]
5. [fifth task — if needed]

agentRecommendation: [Claude Code / Codex / Ruflo / ChatGPT — and why]

requiredApprovalLevel: [1–6 — what is the minimum level needed for this work?]

executionPrompts:
- Task 1 prompt: [ready-to-paste prompt for the first task]
- Task 2 prompt: [if different agent or context needed]

risks:
- [risk 1 — label HIGH / MEDIUM / LOW]
- [risk 2]

rollbackPlan: [how to undo the changes if something goes wrong]
---

Rules:
- Keep tasks small and reversible
- Do not recommend Level 4+ unless file edits are truly required
- Default to Level 2 (generate prompts) or Level 3 (read-only analysis)
- Never recommend automatic push or deploy
- One repo only — no cross-repo work

${universalRules}`,
  },
  {
    id: "execute-safe",
    label: "Execute Approved Task Safely",
    description: "Tell Claude/Ruflo to execute an approved task with strict scope and safety constraints.",
    needsDetail: true,
    detailLabel: "Paste the approved task from your automation plan.",
    detailPlaceholder:
      "Example: Add /command page to Builder OS with static recommendation logic from data/tasks.ts.",
    build: (p, detail) => `You are executing an approved task from Builder OS.

${projectContext(p)}

Approved task:
${detail || "[Paste approved task here]"}

STRICT EXECUTION RULES — do not deviate:

1. Scope lock
   - Work inside this repo only: ${p.localPath}
   - Do not touch other repos
   - Do not expand scope beyond the approved task above
   - If you discover adjacent work, report it — do not do it

2. Before editing anything
   - List every file you plan to change and why
   - Confirm there are no unintended side effects
   - Wait for me to say "proceed" before making any edits

3. While working
   - Make the smallest safe change that achieves the task
   - Do not delete files without explicit approval
   - Do not touch private notes or .env files

4. After editing
   - Summarize every file changed (path + what changed + why)
   - Run build or typecheck if available — report the result
   - Do not stage or commit anything unless I explicitly say to

5. Result format — return this exactly:

   filesChanged:
   - [file path] — [what changed]

   buildResult: [passed / failed / not available]

   risks: [any new risks discovered]

   nextActions:
   - [what I should do next]

   memoryUpdates: [what to update in data/memory.ts]

   taskUpdates: [which tasks to mark done or update in data/tasks.ts]

${universalRules}`,
  },
  {
    id: "system-state",
    label: "Explain Current System State",
    description: "Get a full read-only review of repo structure, priorities, and privacy.",
    needsDetail: false,
    build: (p) => `Summarize the current state of my development system.

${projectContext(p)}

Review this repo and the broader system context, then return:

1. Repo inventory
   - What does this repo currently do?
   - What is its status (active / paused / needs work)?
   - Is it private or public?

2. What to work on next
   - What is the highest-priority incomplete work in this repo?
   - What is the single safest next task?
   - Are there any blockers?

3. Privacy assessment
   - What must stay private in this repo?
   - Is anything at risk of accidental public exposure?
   - Are .gitignore rules complete?

4. System health
   - Is there anything in this repo that looks stale or drifting from its purpose?
   - Are there any obvious gaps, risks, or tech debt worth flagging?

Do NOT edit any files. This is a read-only review.
Do not push to GitHub automatically.

${universalRules}`,
  },
  {
    id: "session-update",
    label: "Summarize This Session For Builder OS",
    description: "Generate a structured summary to paste back into Builder OS data files.",
    needsDetail: true,
    detailLabel: "Briefly describe what you just did (optional — the AI will fill in details).",
    detailPlaceholder:
      "Example: Removed the /api/auth routes and their UI forms. Build still passes.",
    build: (p, detail) => `Summarize this AI/code session for Builder OS.

Project: ${p.name}
Local path: ${p.localPath}
${detail ? `\nWhat happened (my note):\n${detail}\n` : ""}
Return the following — I will paste each section into the appropriate data/ file.

---
project: ${p.id}

toolUsed: [Claude Code / Codex / Ruflo / Manual / other]

goal: [one sentence — what was the original objective?]

result: [2–3 sentences — what actually happened? Was the goal achieved?]

status: [completed / partial / blocked / in-progress]

changedFiles:
- [every file created or modified, one per line]

commands: [important commands run — git, npm, builds, typecheck]

risks: [any new risks or concerns discovered during this session]

decisions:
- [any decisions made that should be recorded in project memory]

nextActions:
- [3–5 specific next steps in priority order]

taskUpdates:
- [tasks that should be marked done or have status changed]
- [new tasks to add to data/tasks.ts]

memoryUpdates:
- [what in data/memory.ts should change for ${p.name}?]

releaseUpdates: [only if public-facing work happened — which checklist items are now done?]
---

Be factual and concise. I will paste each section directly into Builder OS.`,
  },
  {
    id: "ruflo-task",
    label: "Safe Ruflo Repo Task",
    description: "Inspect and plan a task safely before letting Ruflo make any edits.",
    needsDetail: true,
    detailLabel: "What specific task do you want Ruflo to work on?",
    detailPlaceholder:
      "Example: Find all files that import the old auth middleware and propose a safe removal plan.",
    build: (p, detail) => `You are a Ruflo agent working inside a single repository. You have been given a specific task to complete safely.

${projectContext(p)}

Task:
${detail || "[Describe the specific task here]"}

Step 1 — Inspect first (do not edit anything yet):
- Review the project structure relevant to this task
- Identify every file you would need to change
- Check for dependencies, imports, or side effects
- Note any risks or blockers

Step 2 — Report before editing:
Return:
1. Every file you plan to change and exactly what change is needed
2. Any files you plan to create or delete
3. Risks — label each HIGH / MEDIUM / LOW
4. Dependencies or side effects to watch for
5. The smallest safe version of this task (MVP change only)

Step 3 — Wait for approval:
Do not edit any files until I say "proceed".
Do not commit or push anything automatically.
Do not touch other repositories.

After I approve:
- Make only the changes listed in your report
- Summarize every file changed after editing
- Run build or typecheck if available
- Stop and wait — do not push

${universalRules}`,
  },
  {
    id: "choose-model",
    label: "Choose Best Agent / Model",
    description: "Classify a task and get the cheapest safe tool recommendation.",
    needsDetail: true,
    detailLabel: "Describe the task you want to do.",
    detailPlaceholder:
      "Example: Remove the /api/auth/signup route and its UI form from the public EternalNotes repo.",
    build: (p, detail) => `Classify the following task and recommend the best tool or model to use.

${projectContext(p)}

Task I want to do:
${detail || "[Describe the task here]"}

Classify this task and return:

1. Best tool/model — choose one: Cheap/Local Model, ChatGPT, Claude Code, Codex, or Ruflo
2. Why — one sentence explaining the choice
3. Cheapest safe option — if a cheaper tool can handle this safely, name it
4. Human approval required — yes or no, and what specifically needs sign-off before proceeding
5. Exact prompt — write a ready-to-use prompt for the recommended tool, pre-filled with the task and the project context above

Routing rules:
- Cheap/local model: brainstorming, summarizing, rewriting prompts, creating task lists
- ChatGPT: planning, strategy, explaining concepts, improving prompts
- Claude Code: repo inspection, code changes, refactoring, summarizing changed files
- Codex: focused implementation, tests, bug fixes
- Ruflo: multi-step repo work, subagent planning, larger coordinated tasks
- Human approval always required for: deleting files, changing auth/security, touching private notes, committing, pushing, deploying

Do not suggest an expensive model if a cheaper one is safe for this task.

${universalRules}`,
  },
  {
    id: "planner-conversation",
    label: "Planner Conversation",
    description: "Discuss a raw idea, resolve clarifying questions, and produce a final brief.",
    needsDetail: true,
    detailLabel: "Paste your raw idea here.",
    detailPlaceholder:
      "Example: I want to add a way to track which prompts I've used most often across sessions.",
    build: (p, detail) => `You are helping me plan a new idea using the Builder OS planning workflow.

${projectContext(p)}

My raw idea:
${detail || "[Paste your raw idea here]"}

Work through the following stages with me:

1. Ask only the necessary clarifying questions — maximum 3 at a time. Do not ask questions with obvious answers.
2. Challenge weak assumptions directly. If the idea is underspecified or likely to overbuild, say so.
3. Help me define what NOT to build. Explicitly name scope that sounds tempting but should be deferred.
4. Help me identify risks: privacy exposure, breaking changes, over-engineering, maintenance burden.
5. Do NOT produce a final brief until the above are resolved. Ask first, brief later.

When we're ready, produce a final brief using this exact structure:

---
rawIdea: [one clear sentence]
projectId: ${p.id}
repoPath: ${p.localPath}
problem: [specific problem this solves]
targetUser: [who is this for?]
desiredOutcome: [success in concrete terms — not features, but outcome]
mvpScope: [what is included in this brief only]
outOfScope: [what is explicitly deferred — name it]
risks:
- [risk 1 — label HIGH / MEDIUM / LOW]
- [risk 2]
firstTask: [one small, safe, reversible task — specific enough to implement in one session]
approvalLevel: [plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved]
---

Rules:
- Keep the MVP as small as possible
- One project only — no cross-repo work in a single brief
- Do not suggest a database, auth, or external services unless strictly required
- Do not suggest live agent execution
- Do not produce the brief until clarifying questions are resolved

${universalRules}`,
  },
  {
    id: "brief-to-packet",
    label: "Final Brief To Task Packet",
    description: "Convert an approved final brief into a structured task packet for data/taskPackets.ts.",
    needsDetail: true,
    detailLabel: "Paste your approved final brief here.",
    detailPlaceholder:
      "Paste the final brief produced by the Planner Conversation prompt.",
    build: (p, detail) => `Convert this approved final brief into an Approved Task Packet for Builder OS.

${projectContext(p)}

My approved brief:
${detail || "[Paste your final brief here]"}

Return a task packet using this exact structure — I will paste it into data/taskPackets.ts.

---
id: [kebab-case-slug]
title: [clear task title]
projectId: ${p.id}
repoPath: ${p.localPath}
status: draft
approvalLevel: [from the brief — plan-only / prompt-only / read-only / edit-approved / commit-approved / push-approved]
goal: [one sentence — the exact outcome from the brief]
scope: [exact files and directories the agent may work in — be specific]

allowedActions:
- [action 1 — matched to the approval level]
- [action 2]
- [action 3]

forbiddenActions:
- No automatic commit or push
- No touching files outside the defined scope
- [additional forbidden action specific to this task]

executionPrompt: |
  [A complete, ready-to-paste prompt for Claude Code or Ruflo.
   Must include:
   - Project name and repo path
   - The specific approved task
   - "Before editing: list every file you plan to change and why"
   - "Wait for me to say proceed before making any edits"
   - Post-edit summary format (file path + what changed)
   - Build/typecheck step
   - No automatic push or commit]

expectedOutput: [what the agent should return when done — used to verify completion]
rollbackPlan: [how to undo the changes if something goes wrong]
createdAt: ${new Date().toISOString().split("T")[0]}
---

Rules:
- Default approvalLevel to read-only unless file edits are clearly required
- Never recommend push-approved without a strong reason
- The executionPrompt must include the "list files before editing" step
- The forbiddenActions must include "no automatic push or commit"
- Keep the scope narrow — resist adding adjacent improvements

${universalRules}`,
  },
  {
    id: "idea-to-brief",
    label: "Turn Idea Into Project Brief",
    description: "Clarify a rough idea into a structured brief before writing any code.",
    needsDetail: true,
    detailLabel: "Paste your raw idea here.",
    detailPlaceholder:
      "Example: I want to add a way to track which AI sessions were successful so I can see patterns over time.",
    build: (p, detail) => `You are helping me turn a rough idea into a structured project brief.

${projectContext(p)}

My raw idea:
${detail || "[Paste your raw idea here]"}

Before writing the brief, ask me up to 3 clarifying questions if the idea is ambiguous. Then produce a brief using this exact structure:

rawIdea: [one clear sentence summarizing the idea]

problem: [what problem does this solve? be specific]

targetUser: [who is this for?]

desiredOutcome: [what does success look like in concrete terms?]

featuresWanted:
- [feature 1]
- [feature 2]
- [feature 3]

featuresNotYet:
- [thing to defer — and why]
- [thing to defer]

projectId: [which project does this belong to? Use the project listed above unless the idea clearly belongs elsewhere]

risks:
- [risk 1]
- [risk 2]

firstTask: [one small, safe, reversible first task — specific enough to implement in one session]

tasks:
1. [task 1 — small and concrete]
2. [task 2]
3. [task 3]
4. [task 4]
5. [task 5]

claudePrompt: [a single ready-to-use Claude Code prompt for the first task — includes project name, local path, the specific task, lists files before editing, and does not push automatically]

Rules:
- Keep the MVP small. Defer anything not needed for the first working version.
- Do NOT suggest a database, auth, or external services unless the idea requires them.
- Do NOT suggest live agent execution.
- The first task must be implementable in one session without touching other repos.

${universalRules}`,
  },
  {
    id: "v1-check",
    label: "Check If Builder OS v1 Is Done",
    description: "Get an honest v1 assessment — what's complete, missing, unnecessary, and the next 3 actions.",
    needsDetail: false,
    build: (p) => `Review the current state of Builder OS and return a v1 completion assessment.

${projectContext(p)}

Builder OS v1 goal:
A private local command center that helps me plan projects, generate prompts, track tasks, record sessions, and prepare safe agent work.

v1 required features:
- Projects registry (/projects)
- Prompt builder (/prompt-builder)
- Task board (/tasks)
- Memory pages (/memory)
- Session logs (/sessions)
- Release pipeline (/releases)
- Daily command page (/command)
- Task packets (/task-packets)
- Planner workflow (/planner)
- Agent readiness checklist (/agent-readiness)
- System health page (/system-health)
- MVP lock page (/mvp-lock)

Review the current state of this project and return:

---
v1Complete:
- [feature name] — [yes / partial / missing] — [one sentence on state]

missingFromV1:
- [what is not yet usable or not yet built]
- [or: none — all v1 features are present]

unnecessary:
- [pages or features that exist but are not needed for v1]
- [or: none]

shouldCut:
- [anything that adds complexity without adding v1 value]
- [or: nothing]

nextThreeActions:
1. [most important thing to finish or fix for v1]
2. [second most important]
3. [third most important]

v1ReadyToUse: [yes / not yet — reason]
---

Do NOT edit any files. This is a read-only assessment.

${universalRules}`,
  },
  {
    id: "health-review",
    label: "Review Builder OS Health",
    description: "Get a structured health report across all projects, tasks, sessions, memory, releases, and packets.",
    needsDetail: false,
    build: (p) => `Review the current state of Builder OS and return a structured health report.

${projectContext(p)}

Review the following areas:

1. Projects (data/projects.ts)
   - Are all projects still active and relevant?
   - Does each project have a memory entry in data/memory.ts?
   - Is any project stale or abandoned?

2. Tasks (data/tasks.ts)
   - What tasks are in-progress, ready, or backlog?
   - Are any tasks stale or should be marked done?
   - Are there tasks that should be added for recent work?

3. Sessions (data/sessions.ts)
   - When was the last session for each project?
   - Are any sessions marked partial or blocked with outstanding follow-ups?
   - Is the session log missing entries for recent work?

4. Memory (data/memory.ts)
   - Is each project's memory current and accurate?
   - Are the risks and next actions still relevant?
   - Has the memory drifted from the actual project state?

5. Releases (data/releases.ts)
   - Are any projects marked needs-review or preparing-public?
   - Are there incomplete checklist items for public projects?

6. Task Packets (data/taskPackets.ts)
   - Are any packets in draft — waiting for approval?
   - Are any packets blocked — waiting for a decision?
   - Are approved packets ready to execute?

Return the following:

---
staleItems:
- [item that needs updating — and why]
- [or: none]

riskyItems:
- [item that poses a risk — label HIGH / MEDIUM / LOW]
- [or: none]

suggestedUpdates:
- [specific data file change needed]
- [another specific update]

nextBestAction: [one sentence — the single most important thing to do right now]

overallHealth: [healthy / needs-attention / stale / risky]
---

Do NOT edit any files. This is a read-only review.

${universalRules}`,
  },
  {
    id: "daily-review",
    label: "Daily Builder OS Review",
    description: "Review all tasks, sessions, releases, and memory. Get the safest next action.",
    needsDetail: false,
    build: (p) => `Review the current state of my Builder OS projects and recommend the safest next action for today's session.

${projectContext(p)}

Review the following areas in order:

1. Current tasks
   - What tasks are in-progress, ready, or backlog?
   - Which task is the highest priority right now?
   - Are any tasks blocked or waiting on something?

2. Latest session results
   - What was accomplished in the last session?
   - Were there any incomplete items or known issues left open?
   - Are there any follow-up actions from the last session I should address first?

3. Release pipeline
   - Are any projects flagged as "needs-review" or "preparing-public"?
   - Are there outstanding checklist items that should be resolved before new features are added?

4. Project memory
   - Are there open risks or constraints that affect what I should work on?
   - Are there decisions already made that I should not revisit?
   - Does the project memory need updating after recent sessions?

Based on the above, return:

1. The single safest next action for today — specific, small, reversible
2. Any blockers or risks to address before starting
3. What should NOT be touched in this session
4. A one-sentence session goal I can use as a commit message prefix

Do NOT edit any files. This is a planning review only.

${universalRules}`,
  },
  {
    id: "prepare-release",
    label: "Prepare public release",
    description: "Audit safety, README, sample data, and checklist before going public.",
    needsDetail: false,
    build: (p) => `You are helping me prepare this project for safe public release.

${projectContext(p)}

Task: Audit this project for public release readiness.

Do NOT edit any files yet. Give me a full report first. Wait for me to say "proceed" before making any changes.

Check each of the following and report HIGH / MEDIUM / LOW risk for any issues found:

1. Safety audit
   - Are there any .env files or secrets that could be tracked by git?
   - Any private data, personal notes, credentials, or API keys in source code?
   - Are .gitignore rules complete? (check for databases, uploads, .env, notes folders)
   - Any files that could accidentally be pushed publicly?

2. README and documentation
   - Does a README exist and is it accurate?
   - Do install instructions exist and are they complete?
   - Are there any references to private infrastructure, internal tooling, or personal details?

3. Sample data
   - Does the project use real data that should be replaced with sample/mock data?
   - Are there any real notes, real API responses, or personal records in the repo?

4. Screenshots and assets
   - Are screenshots present or needed?
   - Are any images or assets private or personally identifiable?

5. Release checklist gaps
   - Which checklist items are incomplete?
   - What is the minimum required before this can go public?

Return:
1. Safety issues found — label each: HIGH / MEDIUM / LOW
2. Documentation gaps
3. Sample data issues
4. A prioritized list of changes needed before public release
5. Files to add to .gitignore if any
6. Estimated effort: small / medium / large

${universalRules}`,
  },
  {
    id: "session-log",
    label: "Summarize AI session",
    description: "Generate a structured session record to paste into data/sessions.ts.",
    needsDetail: true,
    detailLabel: "Briefly describe what you just did in this session (optional — the prompt will ask the AI to fill this in).",
    detailPlaceholder: "Example: Removed the /api/auth routes and their UI. Build still passes.",
    build: (p, detail) => `You just completed a coding or AI-assisted session. Please provide a structured summary I can save to my session log.

Project: ${p.name}
Local path: ${p.localPath}
${detail ? `\nWhat happened (my note):\n${detail}\n` : ""}
Summarize the session using this exact structure:

goal: [One sentence — what was the main objective of this session?]

summary: [2–3 sentences — what actually happened? What was achieved or not achieved?]

changedFiles:
- [list every file created or modified, one per line]

commands: [Any important commands run — git, npm, builds, etc.]

risks: [Any new risks or concerns discovered during this session]

nextActions:
- [3–5 specific next steps, in priority order]

status: [completed / partial / blocked / in-progress]

Be concise and factual. I will paste this directly into data/sessions.ts in Builder OS.`,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  projects: Project[];
};

export function PromptBuilder({ projects }: Props) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [taskId, setTaskId] = useState(TASK_TYPES[0].id);
  const [detail, setDetail] = useState("");
  const [copied, setCopied] = useState(false);

  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const task = TASK_TYPES.find((t) => t.id === taskId) ?? TASK_TYPES[0];
  const generatedPrompt = project ? task.build(project, detail) : "";

  function handleCopy() {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-10">

      {/* Step 1: Select project */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Step 1
        </p>
        <h2 className="mt-1 text-xl font-semibold">Select project</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setProjectId(p.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                projectId === p.id
                  ? "border-emerald-600 bg-emerald-950/40"
                  : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{p.name}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-neutral-600 truncate">
                {p.localPath}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select task */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Step 2
        </p>
        <h2 className="mt-1 text-xl font-semibold">Select task type</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TASK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTaskId(t.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                taskId === t.id
                  ? "border-emerald-600 bg-emerald-950/40"
                  : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
              }`}
            >
              <span className="font-medium">{t.label}</span>
              <p className="mt-1 text-xs text-neutral-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Task detail (only for "implement") */}
      {task.needsDetail && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Step 3
          </p>
          <h2 className="mt-1 text-xl font-semibold">{task.detailLabel}</h2>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={task.detailPlaceholder}
            rows={4}
            className="mt-4 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-emerald-600 focus:outline-none resize-none"
          />
        </div>
      )}

      {/* Generated prompt */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
          {task.needsDetail ? "Step 4" : "Step 3"}
        </p>
        <h2 className="mt-1 text-xl font-semibold">Generated prompt</h2>

        {/* Instruction banner */}
        <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3">
          <p className="text-sm text-emerald-300">
            Copy this into{" "}
            <strong>Claude Code, Codex, or Ruflo</strong> while inside the{" "}
            <strong>{project?.name ?? "selected"}</strong> repo.
          </p>
          {project && (
            <p className="mt-1 font-mono text-xs text-emerald-700">
              {project.localPath}
            </p>
          )}
        </div>

        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black p-5 text-sm leading-relaxed text-neutral-200">
          {generatedPrompt}
        </pre>

        <button
          onClick={handleCopy}
          className={`mt-4 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
            copied
              ? "bg-emerald-700 text-white"
              : "border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          }`}
        >
          {copied ? "Copied to clipboard!" : "Copy prompt"}
        </button>
      </div>
    </div>
  );
}
