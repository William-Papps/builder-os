import { BRIEFS, type Brief } from "@/data/briefs";
import { PROJECT_MAP } from "@/data/projects";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

function buildBriefPrompt(brief: Brief, projectName: string, repoUrl: string | null): string {
  return `You are helping me implement the first task from a project brief.

Project: ${projectName}
Repo: ${repoUrl ?? "N/A"}

Idea: ${brief.rawIdea}

Problem being solved: ${brief.problem}

Desired outcome: ${brief.desiredOutcome}

First task: ${brief.firstTask}

Features NOT to build yet:
${brief.featuresNotYet.map((f) => `- ${f}`).join("\n")}

Known risks:
${brief.risks.map((r) => `- ${r}`).join("\n")}

Task: Implement the first task only. Do not start work on anything else.

Before editing any files:
1. List every file you plan to change and why.
2. Confirm there are no unintended side effects.
3. Wait for me to say "proceed" before making any edits.

After editing:
- Summarize all changed files.
- Run build or typecheck if available.
- Do not push to GitHub automatically.`;
}

function BriefCard({ brief }: { brief: Brief }) {
  const project = PROJECT_MAP[brief.projectId];

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-neutral-600">{brief.createdDate}</span>
        {project && (
          <a
            href={`/projects/${brief.projectId}`}
            className="text-xs text-emerald-600 hover:text-emerald-400 transition-colors"
          >
            {project.name} →
          </a>
        )}
      </div>

      {/* Raw idea */}
      <div className="rounded-2xl border border-emerald-800 bg-emerald-950/20 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Raw idea
        </p>
        <p className="mt-2 text-lg font-medium text-emerald-200">{brief.rawIdea}</p>
      </div>

      {/* Two-column: Problem + Target user */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Problem being solved
          </p>
          <p className="mt-2 text-sm text-neutral-300">{brief.problem}</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Target user
          </p>
          <p className="mt-2 text-sm text-neutral-300">{brief.targetUser}</p>
        </div>
      </div>

      {/* Desired outcome */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Desired outcome
        </p>
        <p className="mt-2 text-sm text-neutral-300">{brief.desiredOutcome}</p>
      </div>

      {/* Features wanted / not yet */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Features wanted
          </p>
          <ul className="mt-3 space-y-2">
            {brief.featuresWanted.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            NOT building yet
          </p>
          <ul className="mt-3 space-y-2">
            {brief.featuresNotYet.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-500">
                <span className="mt-0.5 shrink-0 text-neutral-700">✕</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Repo */}
      {project && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Repo / project affected
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-200">{project.name}</p>
          <p className="mt-0.5 font-mono text-xs text-neutral-600">{project.localPath}</p>
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-xs text-emerald-600 hover:text-emerald-400 transition-colors"
            >
              {project.repoUrl} ↗
            </a>
          )}
        </div>
      )}

      {/* Risks */}
      <div className="rounded-2xl border border-yellow-900 bg-yellow-950/20 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-800">
          Risks
        </p>
        <ul className="mt-3 space-y-2">
          {brief.risks.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-yellow-300">
              <span className="mt-0.5 shrink-0 text-yellow-700">!</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* First task */}
      <div className="rounded-2xl border border-neutral-700 bg-neutral-900 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
          First small task
        </p>
        <p className="mt-2 text-sm text-neutral-200">{brief.firstTask}</p>
        <a
          href="/prompt-builder"
          className="mt-3 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600 transition-colors"
        >
          Build implementation prompt →
        </a>
      </div>

      {/* Suggested Claude prompt */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Suggested Claude prompt
        </p>
        <p className="mt-1 text-xs text-neutral-600">
          Paste into Claude Code or Codex inside the{" "}
          <span className="text-neutral-500">{project?.name ?? "target"}</span> repo.
        </p>
        <div className="mt-3">
          <CopyPrompt
            text={buildBriefPrompt(brief, project?.name ?? brief.projectId, project?.repoUrl ?? null)}
          />
        </div>
      </div>
    </div>
  );
}

const ideaToBriefPrompt = `You are helping me turn a rough idea into a structured project brief.

I will give you a raw idea. Before writing anything, ask me up to 3 clarifying questions if the idea is ambiguous. Then produce a brief using this exact structure:

rawIdea: [one clear sentence summarizing the idea]

problem: [what problem does this solve? be specific]

targetUser: [who is this for?]

desiredOutcome: [what does success look like?]

featuresWanted:
- [feature 1]
- [feature 2]
- [feature 3]

featuresNotYet:
- [thing to defer — and why]
- [thing to defer]

projectId: [which existing project does this belong to? builder-os / builder-hub / eternalnotes-public / eternalnotes-private]

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

claudePrompt: [a single Claude Code prompt for the first task — includes project name, local path, the task, and asks Claude to list files before editing]

Rules:
- Keep the MVP small. Defer anything not needed for the first working version.
- Do NOT suggest a database, auth, or external services unless the idea requires them.
- Do NOT suggest live agent execution.
- The first task must be implementable in one session without touching other repos.`;

export default function BriefPage() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Project Brief</h1>
        <p className="mt-3 text-neutral-400">
          Turn a rough idea into a structured plan before sending work to agents. Fill out a brief
          for every new idea — it keeps scope small and prompts focused.
        </p>

        {/* How to use */}
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <p className="text-sm font-medium">How to use this page</p>
          <ol className="mt-2 space-y-1">
            {[
              "Copy the 'Turn Idea Into Brief' prompt below.",
              "Paste it into Claude Code with your raw idea.",
              "Claude will return a filled brief — paste it into data/briefs.ts.",
              "Come back here to review the brief before sending any implementation work.",
            ].map((s, i) => (
              <li key={s} className="flex items-start gap-2 text-sm text-neutral-400">
                <span className="shrink-0 text-neutral-700">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* Turn Idea Into Brief prompt */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Prompt: Turn Idea Into Project Brief
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Paste this into any Claude session. Add your raw idea at the end.
          </p>
          <div className="mt-3">
            <CopyPrompt text={ideaToBriefPrompt} customizeLink />
          </div>
        </div>

        {/* Briefs */}
        <div className="mt-12 space-y-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
              Example brief
            </p>
            <p className="mt-1 text-xs text-neutral-700">
              This is a real brief from a completed feature. Add yours to{" "}
              <code className="rounded bg-neutral-800 px-1">data/briefs.ts</code>.
            </p>
          </div>
          {BRIEFS.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
        </div>

        {/* Empty state note */}
        <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <p className="text-sm text-neutral-500">
            Have a new idea?{" "}
            <span className="text-neutral-400">
              Copy the prompt above → paste into Claude → add the result to{" "}
              <code className="rounded bg-neutral-800 px-1 text-xs">data/briefs.ts</code> →
              refresh this page.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
