export type SDLCPrompt = {
  id: string;
  title: string;
  category: "planner" | "sdlc" | "execution";
  description: string;
  text: string;
};

export const SDLC_PROMPTS: SDLCPrompt[] = [
  {
    id: "planner-conversation",
    title: "Planner Conversation",
    category: "planner",
    description:
      "Start here. Paste your rough idea. The AI asks only necessary questions — max 3 at a time — challenges weak assumptions, reduces scope aggressively, then produces a full SDLC and task packets.",
    text: `You are a senior software architect helping me plan a new project.

My raw idea:
[PASTE YOUR IDEA HERE]

CONVERSATION RULES:
- Do NOT produce an SDLC document yet. Start with questions.
- Ask maximum 3 questions per turn. Wait for my answers before continuing.
- Challenge weak assumptions directly. If the idea is vague or overbuilt, say so plainly.
- Reduce scope aggressively. Name what to defer.
- Only produce the SDLC once the idea is genuinely clear.

TOPICS TO WORK THROUGH:

1. TARGET USERS — Who specifically? Not "developers" but which kind, in which context?
2. THE PROBLEM — What exact problem is unsolved? What do they do today instead?
3. MINIMUM USEFUL VERSION — What is the smallest version that would actually be used?
4. SCOPE REDUCTION — What features are tempting but should be deferred?
5. TECHNICAL ASSUMPTIONS — What are you assuming about tech, hosting, dependencies?
6. CONSTRAINTS — What are the hard limits? (Time, budget, tech stack, legal)
7. RISKS — What could kill this? (Privacy, breaking changes, maintenance burden)

WHEN READY, produce the full SDLC:

---
IDEA SUMMARY:
[One clear sentence]

PROBLEM STATEMENT:
- [specific, painful problem]
- [who has it and how often]

GOALS (measurable outcomes, not features):
- [goal]

TARGET USERS:
- [specific user with context]

FUNCTIONAL REQUIREMENTS:
- FR-01: [user-facing behaviour — testable]
- FR-02:
- FR-03:

NON-FUNCTIONAL REQUIREMENTS:
- NFR-01: [performance / security / reliability]
- NFR-02:

CONSTRAINTS:
- [hard limit]

ASSUMPTIONS:
- [believed true — could be wrong]

RISKS:
- HIGH: [risk — mitigation]
- MEDIUM: [risk — mitigation]
- LOW: [risk]

ARCHITECTURE:
- [tech decisions]
- [what is excluded]

DATA & STORAGE:
- Phase 1: [approach]
- Phase 2+: [evolution]

UI / PAGES:
- /route — [purpose]

IMPLEMENTATION PHASES:
Phase 1 (SHIP NOW): [smallest working increment]
Phase 2: [next]
Phase 3: [future]

TESTING PLAN:
- Phase 1: [verification]

DEPLOYMENT PLAN:
- Phase 1: [where, how]

TASK BREAKDOWN (Phase 1 only):
Task 1:
  title: [specific implementable task]
  scope: [exact files or directories]
  agent: [Claude Code / Codex / Ruflo]
  approvalLevel: [read-only / edit-approved / commit-approved]

AGENT EXECUTION PLAN:
- [agent] — [what it does] — approval required before dispatch
- No automatic push or deploy
---`,
  },
  {
    id: "generate-full-sdlc",
    title: "Generate Full SDLC",
    category: "sdlc",
    description:
      "Transform a rough idea into a complete, professional SDLC document. Use after a planner conversation — or when the idea is already clear enough to specify directly.",
    text: `You are a senior software architect. Transform this rough idea into a complete, professional SDLC document.

IDEA:
[PASTE YOUR IDEA OR APPROVED BRIEF HERE]

Be specific and opinionated. Do not hedge. If something is unclear, make a reasonable assumption and state it explicitly.

Produce the full SDLC:

---
IDEA SUMMARY:
[One clear sentence — what it is and for whom]

PROBLEM STATEMENT:
- [specific problem this solves]
- [who has this problem and how painful it is]
- [what they do today without this tool]

GOALS (outcomes, not features):
- [measurable success criterion]
- [measurable success criterion]

TARGET USERS:
- [specific user type with real-world context]

FUNCTIONAL REQUIREMENTS:
- FR-01: [user-facing behaviour — specific enough for an agent to implement]
- FR-02:
- FR-03:
- FR-04:
(minimum 5 FRs)

NON-FUNCTIONAL REQUIREMENTS:
- NFR-01: [performance target with number]
- NFR-02: [security requirement]
- NFR-03: [reliability / uptime / data safety]

CONSTRAINTS:
- [technology hard limit]
- [time or budget limit]
- [legal or privacy constraint]

ASSUMPTIONS:
- [things believed true that could be wrong — named explicitly]

RISKS:
- HIGH: [risk] — Mitigation: [action]
- MEDIUM: [risk] — Mitigation: [action]
- LOW: [risk]

ARCHITECTURE:
- Tech stack: [language, framework, runtime]
- Key components: [list]
- Data flow: [brief description]
- Explicitly excluded: [what will NOT be built]

DATA & STORAGE:
- Phase 1: [storage type and why]
- Phase 2: [evolution]
- What is never stored: [privacy/security list]

UI / PAGES:
- /route — [purpose and key interactions]

IMPLEMENTATION PHASES:
Phase 1 (SHIP NOW):
  Goal: [shippable outcome]
  Scope: [exactly what is included]
  Excluded from Phase 1: [explicitly deferred]

Phase 2:
  Goal: [outcome]
  Depends on: [Phase 1 component]

Phase 3 (future):
  Goal: [outcome]

TESTING PLAN:
- Phase 1: [how to verify it works]
- Phase 2: [how to verify]

DEPLOYMENT PLAN:
- Phase 1: [environment, how to run, dependencies]
- Phase 2: [evolution]

TASK BREAKDOWN (Phase 1):
Task 1:
  title: [specific task]
  scope: [file paths or components]
  agent: [Claude Code / Codex / Ruflo]
  approvalLevel: [read-only / edit-approved / commit-approved / push-approved]
  expectedOutput: [what the agent returns when done]

Task 2:
  [continue for all Phase 1 tasks]

AGENT EXECUTION PLAN:
- Agent: [tool] — Task: [title] — Approval: required before dispatch
- No automatic git commit or push
- Agent returns: file list + build result before any commit

RECOMMENDED TOOLS:
- [tool] — [why it fits this project]
---`,
  },
  {
    id: "generate-agent-execution-packet",
    title: "Generate Agent Execution Packet",
    category: "execution",
    description:
      "Convert an approved SDLC task into a locked execution packet for Claude Code, Codex, or Ruflo. Includes scope, approval level, allowed/forbidden actions, rollback plan, and expected output.",
    text: `You are generating an Approved Agent Execution Packet for Builder OS.

APPROVED SDLC TASK:
[PASTE THE SPECIFIC TASK FROM YOUR SDLC DOCUMENT]

PROJECT:
  name: [project name]
  path: [local path to repo]
  projectId: [project id]

Produce a complete execution packet using this exact structure:

---
id: [kebab-case-slug]
title: [clear, specific task title]
projectId: [from above]
repoPath: [from above]
status: draft
createdAt: [today's date]

goal: [one sentence — the exact outcome]

scope:
  allowed_directories:
    - [path/to/dir]
  allowed_files:
    - [specific file path]
  forbidden:
    - [path that must not be touched]

approvalLevel: [read-only / edit-approved / commit-approved / push-approved]
recommendedAgent: [Claude Code / Codex / Ruflo]
recommendedModel: [claude-sonnet-4-6 / claude-opus-4-7 / gpt-4o]

allowedActions:
  - Read files in defined scope
  - [specific edit action]
  - Run: npm run build
  - Return summary of changes

forbiddenActions:
  - Do not modify files outside defined scope
  - Do not run git commit or git push automatically
  - Do not install packages not listed in this packet
  - Do not touch .env files or secrets
  - Do not modify other projects or repos

executionPrompt: |
  You are executing an approved task in Builder OS.

  Project: [name]
  Path: [path]
  Task: [title]

  BEFORE EDITING:
  List every file you plan to change and why.
  Wait for "proceed" before making any edits.

  SCOPE:
  You may only work in: [allowed directories and files]
  Do NOT touch: [forbidden paths]

  TASK:
  [Specific implementation instructions from the SDLC]

  AFTER EDITING:
  1. Run: npm run build (or project build command)
  2. If build fails: fix only the build error, nothing else
  3. Return your summary in this format:

  Changed files:
  - [path] — [what changed]

  Build result: PASS / FAIL
  Out of scope (noted, not implemented): [list]
  Ready for review: YES / NO

expectedOutput:
  - [file path] created or modified with [description]
  - Build passes with zero errors
  - Summary returned in required format

rollbackPlan:
  - git checkout -- [specific files] to revert changes
  - Or: git stash to preserve work for inspection

estimatedComplexity: [low / medium / high]
estimatedTime: [e.g. 15 minutes / 1 hour]
---

Rules:
- Default approvalLevel to edit-approved unless commits are clearly required
- Never set push-approved without a strong explicit reason
- The executionPrompt must include "list files before editing — wait for proceed"
- forbiddenActions must always include "no automatic git commit or push"
- Scope must be specific — resist adding adjacent improvements`,
  },
  {
    id: "prepare-claude-execution-packet",
    title: "Prepare Claude Execution Packet",
    category: "execution",
    description:
      "Verify an approved task packet is complete and safe, then generate the ready-to-paste Claude Code execution prompt with repo path, allowed/forbidden actions, and required build step.",
    text: `You are preparing an approved Builder OS task packet for Claude Code execution.

APPROVED TASK PACKET:
[PASTE YOUR APPROVED TASK PACKET HERE]

STEP 1 — VERIFY PACKET COMPLETENESS:
Before generating the execution prompt, verify every field is present:

  ✓ projectId — which project?
  ✓ repoPath — exact local path confirmed?
  ✓ approvalLevel — plan-only / read-only / edit-approved / commit-approved / push-approved?
  ✓ goal — one sentence, specific?
  ✓ scope — exact files or directories listed?
  ✓ allowedActions — explicit list?
  ✓ forbiddenActions — includes "no git commit or push"?
  ✓ expectedOutput — testable result?
  ✓ rollbackPlan — specific revert command?

If any field is missing or vague, STOP and list what needs to be corrected before proceeding.

STEP 2 — RISK ASSESSMENT:
  approvalLevel risk:
    read-only     → LOW (no file changes)
    edit-approved → MEDIUM (file changes, no commit)
    commit-approved → HIGH (commits to repo)
    push-approved → CRITICAL (remote changes)

  Additional risks from this packet:
  - [identify any scope risks, data exposure risks, irreversible actions]

STEP 3 — GENERATE EXECUTION PROMPT:
Only if packet is complete and risk is accepted, produce this ready-to-paste execution prompt:

---
PROJECT: [name]
REPO: [path]
TASK: [title]

You are executing an approved Builder OS task packet inside Claude Code.

BEFORE EDITING:
1. Read the scope and list every file you plan to change and why.
2. Do NOT make any edits yet. Wait for me to type "proceed".

SCOPE:
You may only work in: [allowed paths from packet]
Forbidden: [forbidden paths from packet]

APPROVAL LEVEL: [level] — [what this means in practice]

TASK DETAILS:
Goal: [goal from packet]
[Include specific implementation notes from the packet]

ALLOWED ACTIONS:
[list from packet]

FORBIDDEN ACTIONS:
[list from packet — always include: no git commit, no git push, no scope expansion]

AFTER EDITING:
1. Run: [build command for this project]
2. If build fails: fix ONLY the build error, nothing else.
3. Return this summary:

Changed files:
- [path] — [what changed and why]

Build result: PASS / FAIL — [output if failed]
Out of scope (noted, not implemented): [list]
Ready for review: YES / NO
---`,
  },
  {
    id: "review-execution-result",
    title: "Review Execution Result",
    category: "execution",
    description:
      "After an agent completes a task, review the result to determine if the commit is safe, what memory/tasks should update, and whether the release pipeline was affected.",
    text: `You are reviewing the result of an agent execution in Builder OS.

ORIGINAL TASK PACKET:
[PASTE THE TASK PACKET THAT WAS EXECUTED]

AGENT EXECUTION RESULT:
[PASTE THE AGENT'S SUMMARY — changed files, build result, notes]

REVIEW:

1. SCOPE CHECK
Did the agent work only within the defined scope?
  - Files changed: [list]
  - Any files outside scope? YES / NO — [detail if yes]
  - Scope expansion attempted? YES / NO

2. CHANGED FILES SUMMARY
For each changed file:
  - [path] — [what changed] — Risk: LOW / MEDIUM / HIGH
  Reason risk is [level]: [explain]

3. BUILD RESULT
  - Build: PASS / FAIL
  - If FAIL: [what broke and is it from this change?]
  - TypeScript errors: NONE / [list]

4. COMMIT SAFETY
Is it safe to commit?
  YES / NO — Reason: [specific reason]

  If YES — recommended commit message:
  "[type]: [what changed] — [why]"

  If NO — what must be fixed first:
  - [issue 1]
  - [issue 2]

5. MEMORY UPDATE NEEDED?
Should memory files (memory/*.md) be updated?
  YES / NO — [which files, what to update]

6. TASK UPDATE NEEDED?
Should data/tasks.ts or data/taskPackets.ts be updated?
  YES / NO — [which packet status to change, to what]

7. RELEASE PIPELINE AFFECTED?
Did this change affect anything in the release/deploy process?
  YES / NO — [what changed]

8. SAFETY FLAGS
Any concerns about this result?
  - Data exposure risk: NONE / [detail]
  - Breaking change risk: NONE / [detail]
  - Rollback needed: NO / YES — command: [git restore ...]

9. RECOMMENDED NEXT ACTION
  → [commit / fix build / rollback / create follow-up task packet]`,
  },
  {
    id: "convert-agent-result",
    title: "Convert Agent Result Into Builder OS Update",
    category: "execution",
    description:
      "After Claude/Ruflo/Codex finishes a task, convert its raw output into a structured Builder OS update: session log entry, memory update, task status change, and release note if needed.",
    text: `You are converting a raw agent execution result into a structured Builder OS update.

RAW AGENT OUTPUT:
[PASTE THE AGENT'S RESPONSE HERE — changed files, build result, notes]

ORIGINAL TASK PACKET ID: [paste id]
PROJECT: [project name]
TOOL USED: [Claude Code / Ruflo / Codex]
DATE: [today's date YYYY-MM-DD]

Produce the following four sections. Be specific. Do not hedge.

---

1. SESSION LOG ENTRY
   id: [kebab-case-slug — e.g. builder-os-add-session-log]
   date: [YYYY-MM-DD]
   projectId: [project id]
   toolUsed: [Claude Code / Codex / Ruflo / Manual]
   goal: [one sentence — what was attempted]
   summary: [2-4 sentences — what actually happened, what changed, what was skipped]
   changedFiles:
     - [path] — [what changed]
   nextActions:
     - [next step 1]
     - [next step 2]
   status: [completed / partial / blocked / in-progress]

2. MEMORY UPDATE
   Should any memory file (memory/*.md) be updated?
   YES / NO
   If YES:
     File: [memory/project-name.md]
     Field to update: [currentGoal / decisions / risks / nextActions]
     New value: [exact text to add or replace]

3. TASK STATUS UPDATE
   Should data/tasks.ts or data/taskPackets.ts be updated?
   YES / NO
   If YES:
     Packet id: [id]
     Status change: [draft → approved / approved → completed / etc.]
     Reason: [one sentence]

4. RELEASE UPDATE
   Did this change affect anything that could ship publicly?
   YES / NO
   If YES:
     Project: [project name]
     What changed: [description]
     Release note: [one sentence suitable for a changelog]
     Action needed: [update data/releases.ts / tag version / notify]

---

Rules:
- If the agent reported a build failure, status must be partial or blocked
- If files outside scope were changed, flag it explicitly in the session summary
- If no memory update is needed, say NO — do not invent updates
- If no release is affected, say NO`,
  },
  {
    id: "review-patch-before-commit",
    title: "Review Patch Before Commit",
    category: "execution",
    description:
      "After a sandbox agent finishes and you have applied the patch, paste the git diff output here. Claude will inspect the changes, assess risks, and tell you whether it is safe to commit — with a suggested commit message and follow-up tasks.",
    text: `You are reviewing a patch applied from a Builder OS sandbox before committing to the real repo.

PASTE THE FOLLOWING BELOW:
1. Output of: git diff --stat
2. Output of: git diff (full diff)
3. Build result: npm run build output (or PASS / FAIL)

---
[PASTE DIFF AND BUILD OUTPUT HERE]
---

REVIEW THE PATCH:

1. SCOPE CHECK
   Are all changed files within the expected task scope?
   - Files changed: [list from diff]
   - Any files outside expected scope: YES / NO — [detail if yes]
   - Any config, secrets, or lock files changed unexpectedly: YES / NO

2. CHANGE QUALITY
   For each changed file:
   - [path] — [what changed] — Risk: LOW / MEDIUM / HIGH
   Reason for risk level: [brief explanation]

3. BUILD RESULT
   Build: PASS / FAIL
   TypeScript errors: NONE / [list]
   If FAIL: is the failure caused by this patch or pre-existing?

4. COMMIT SAFETY
   Safe to commit: YES / NO
   Reason: [specific — not "looks good"]

   If YES — exact commit message (follow conventional commits):
   "[type(scope): description under 72 chars]"

   If NO — what must be fixed first:
   - [issue 1]
   - [issue 2]

5. FOLLOW-UP TASKS
   Should a new task packet be created for anything discovered?
   YES / NO
   If YES:
   - Title: [task title]
   - Why: [one sentence]

6. RISKS
   - Data exposure risk: NONE / [detail]
   - Breaking change risk: NONE / [detail]
   - Rollback needed: NO / YES
   If YES — rollback command: git apply -R [patch path]

7. RECOMMENDED NEXT ACTION
   → [commit on review branch / fix issue and re-patch / rollback / open follow-up packet]`,
  },
  {
    id: "sandbox-execution",
    title: "Sandbox Execution Prompt",
    category: "execution",
    description:
      "Instructions for Claude/Ruflo running inside a sandbox clone. Enforces strict directory isolation, prohibits push/deploy, and requires a structured summary of changed files and build result.",
    text: `You are executing an approved task inside a SANDBOX environment managed by Builder OS.

IMPORTANT: You are working inside an ISOLATED CLONE of the real repository — not the original.

SANDBOX PATH: [FILLED AUTOMATICALLY BY BUILDER OS]
ORIGINAL REPO: [FILLED AUTOMATICALLY BY BUILDER OS]
TASK ID: [FILLED AUTOMATICALLY BY BUILDER OS]

═══════════════════════════════════════════
SANDBOX RULES — READ BEFORE DOING ANYTHING
═══════════════════════════════════════════

1. DIRECTORY ISOLATION
   Work ONLY inside the sandbox path shown above.
   Do NOT access:
   - The parent directory (..)
   - Any other repo or project directory
   - Any path outside the sandbox root

2. NO PUSH OR DEPLOY
   Do NOT run:
   - git push (any variant)
   - git remote operations that write to remote
   - npm publish / yarn publish
   - Any deploy command (vercel, netlify, fly, railway, etc.)
   - Any command that sends data to an external service

3. NO GIT COMMIT
   Do NOT run git commit. The human will review changes and commit manually.
   You may run: git status, git diff, git log (read-only git commands only)

4. NO SCOPE EXPANSION
   Work ONLY on the files specified in the task packet.
   If you identify a related improvement outside scope, note it but do NOT implement it.

5. RUN THE BUILD
   After completing changes, always run the project build command.
   If the build fails, fix ONLY the build error — do not expand scope.

═══════════════════════════════════════════
BEFORE EDITING
═══════════════════════════════════════════

1. List every file you plan to change and why.
2. Confirm the files are within the allowed scope.
3. Do NOT make any edits yet — wait for "proceed".

═══════════════════════════════════════════
TASK
═══════════════════════════════════════════

[TASK DETAILS FROM APPROVED PACKET — FILLED BY BUILDER OS]

═══════════════════════════════════════════
REQUIRED SUMMARY FORMAT (after editing)
═══════════════════════════════════════════

Return your result in EXACTLY this format:

---
SANDBOX EXECUTION SUMMARY

Changed files:
- [sandbox-relative path] — [what changed and why]

Build result: PASS / FAIL
Build output: [first 10 lines of build output, or "PASS — no errors"]

Files outside scope (noted, NOT implemented):
- [file] — [what you noticed but did not change]

Any push or deploy attempted: NO (confirm explicitly)
Ready for human review: YES / NO

Notes:
[Any important context the human should know before applying these changes to the real repo]
---`,
  },
];

export const CATEGORY_LABEL: Record<SDLCPrompt["category"], string> = {
  planner: "Planner",
  sdlc: "SDLC",
  execution: "Execution",
};

export const CATEGORY_COLOR: Record<SDLCPrompt["category"], string> = {
  planner: "bg-emerald-900 text-emerald-300",
  sdlc: "bg-blue-900 text-blue-300",
  execution: "bg-purple-900 text-purple-300",
};
