import {
  EXECUTION_FLOW,
  EXECUTION_MODES,
  SUPPORTED_AGENTS,
  ARCHITECTURE_NOTES,
} from "@/data/executionEngine";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const preparePacketPrompt = `Prepare this task packet for agent execution.

Task packet:
[PASTE YOUR APPROVED TASK PACKET HERE]

Review and return the following before any agent runs.

---
packetVerification:
  briefExists: [yes / no]
  projectSelected: [yes / no — name the project]
  repoPathConfirmed: [yes / no — state the path]
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
- Do not edit any files — this is preparation only`;

const reviewResultPrompt = `Review the result of this agent execution and summarize it for Builder OS.

Project: [PROJECT NAME]
Repo path: [REPO PATH]
Task that was executed: [PASTE TASK DESCRIPTION]

Agent result:
[PASTE THE AGENT'S OUTPUT HERE]

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
- [what to update in data/memory.ts for this project]

taskUpdates:
- [tasks to mark done in data/tasks.ts]
- [new tasks to add if discovered]
---

Rules:
- Do not recommend commit if build failed
- Do not recommend push — commit review is always the final human step
- Be factual — report what happened, not what was intended`;

export default function ExecutionEnginePage() {
  const gates = EXECUTION_FLOW.filter((s) => s.isGate);

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Execution Engine</h1>
        <p className="mt-3 text-neutral-400">
          The future approved automation architecture for Builder OS. Agents receive scoped task
          packets, execute within defined boundaries, and return structured results — with human
          approval gates at every critical step.
        </p>

        {/* Status callout */}
        <div className="mt-6 rounded-xl border border-yellow-900 bg-yellow-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-yellow-300">
            Planning mode — not yet live.
          </p>
          <p className="mt-1 text-xs text-yellow-800">
            This page documents the intended architecture. Steps marked "future" require additional
            tooling before they can run. Use the prompts at the bottom to operate manually in the
            meantime.
          </p>
        </div>

        {/* Approval gate count */}
        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3">
          <p className="text-sm text-neutral-400">
            <span className="font-semibold text-white">{gates.length} human approval gates</span>{" "}
            in the execution flow. No agent advances past a gate without explicit sign-off.
          </p>
        </div>

        {/* Execution flow */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Execution flow
          </p>
          <div className="mt-4 space-y-1">
            {EXECUTION_FLOW.map((step, i) => (
              <div key={step.id} className="flex flex-col items-stretch">
                {step.isGate ? (
                  <div className="rounded-xl border border-yellow-900 bg-yellow-950/30 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-yellow-800 text-xs font-bold text-yellow-600">
                          {step.step}
                        </span>
                        <p className="font-semibold text-yellow-300">{step.title}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        <span className="rounded-full bg-yellow-900 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                          Approval gate
                        </span>
                        {step.isFuture && (
                          <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                            Future
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-yellow-400/80">{step.description}</p>
                    {step.builderOsLink && (
                      <a
                        href={step.builderOsLink}
                        className="mt-1.5 inline-block text-xs text-yellow-700 hover:text-yellow-500 transition-colors"
                      >
                        {step.builderOsLink} →
                      </a>
                    )}
                  </div>
                ) : (
                  <div
                    className={`rounded-xl border px-5 py-4 ${
                      step.isFuture
                        ? "border-neutral-800/50 bg-neutral-900/50"
                        : "border-neutral-800 bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          step.isFuture
                            ? "border-neutral-800 text-neutral-700"
                            : "border-neutral-700 text-neutral-600"
                        }`}
                      >
                        {step.step}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`font-medium ${
                              step.isFuture ? "text-neutral-600" : "text-neutral-200"
                            }`}
                          >
                            {step.title}
                          </p>
                          {step.isFuture && (
                            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-600">
                              Future
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-sm ${
                            step.isFuture ? "text-neutral-700" : "text-neutral-500"
                          }`}
                        >
                          {step.description}
                        </p>
                        {step.builderOsLink && (
                          <a
                            href={step.builderOsLink}
                            className="mt-1 inline-block text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
                          >
                            {step.builderOsLink} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {i < EXECUTION_FLOW.length - 1 && (
                  <div className="flex justify-center py-0.5 text-base text-neutral-800">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Execution modes */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Execution modes
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            The execution mode is determined by the task packet's approval level.
          </p>
          <div className="mt-4 space-y-3">
            {EXECUTION_MODES.map((mode) => (
              <div
                key={mode.id}
                className={`rounded-xl border p-5 ${mode.border} ${
                  mode.available === "future" ? "opacity-60" : "bg-neutral-900"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${mode.badge}`}
                  >
                    {mode.name}
                  </span>
                  {mode.available === "future" && (
                    <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-600">
                      Future
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${mode.color}`}>{mode.description}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-neutral-700">Allowed</p>
                    <ul className="mt-2 space-y-1">
                      {mode.allowedActions.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-xs text-neutral-400">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-700">Not allowed</p>
                    <ul className="mt-2 space-y-1">
                      {mode.notAllowed.map((n) => (
                        <li key={n} className="flex items-start gap-2 text-xs text-neutral-600">
                          <span className="mt-0.5 shrink-0 text-neutral-800">✕</span>
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supported agents */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Supported agents
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SUPPORTED_AGENTS.map((agent) => (
              <div
                key={agent.id}
                className={`rounded-xl border border-neutral-800 p-5 ${
                  agent.available === "future" ? "opacity-50" : "bg-neutral-900"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-neutral-200">{agent.name}</p>
                  {agent.available === "future" && (
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-600">
                      Future
                    </span>
                  )}
                  {agent.available === "now" && (
                    <span className="rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-emerald-400">
                      Available
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-neutral-500">{agent.description}</p>
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-700">Best for</p>
                  <ul className="mt-1.5 space-y-1">
                    {agent.bestFor.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-neutral-400">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                {agent.limitations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-neutral-700">Limitations</p>
                    <ul className="mt-1.5 space-y-1">
                      {agent.limitations.map((l) => (
                        <li key={l} className="flex items-start gap-2 text-xs text-neutral-600">
                          <span className="mt-0.5 shrink-0 text-neutral-800">–</span>
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Architecture notes */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Architecture principles
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            These constraints apply to all future automation — regardless of agent or mode.
          </p>
          <div className="mt-4 space-y-3">
            {ARCHITECTURE_NOTES.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4"
              >
                <p className="text-sm font-semibold text-neutral-200">{note.principle}</p>
                <p className="mt-1 text-xs text-neutral-500">{note.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Prompts */}
        <div className="mt-12 space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Prompt: Prepare Task Packet For Execution</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Paste an approved task packet and get a verified execution plan with agent
              recommendation, instructions, expected output, and rollback steps.
            </p>
            <div className="mt-3">
              <CopyPrompt text={preparePacketPrompt} customizeLink />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Prompt: Review Agent Execution Result</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Paste an agent's output after execution. Returns a structured summary ready to paste
              into Builder OS data files: sessions, tasks, memory, release pipeline.
            </p>
            <div className="mt-3">
              <CopyPrompt text={reviewResultPrompt} customizeLink />
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/planner", label: "Idea Planner" },
            { href: "/task-packets", label: "Task Packets" },
            { href: "/agent-readiness", label: "Agent Readiness" },
            { href: "/automation", label: "Automation Plan" },
            { href: "/model-router", label: "Model Router" },
            { href: "/prompt-builder", label: "Prompt Builder" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
            >
              {link.label} →
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
