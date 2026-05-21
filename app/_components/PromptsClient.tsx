"use client";

import { useState } from "react";
import type { Project } from "@/data/projects";
import { CopyPrompt } from "./CopyPrompt";

type PromptTemplate = {
  title: string;
  description: string;
  build: (p: Project) => string;
};

const TEMPLATES: PromptTemplate[] = [
  {
    title: "Analyze Project Status",
    description: "Get a full read on where the project stands before doing anything.",
    build: (p) => `Analyze the current state of this project.

Project: ${p.name}
Path: ${p.localPath}
Current goal: ${p.currentGoal}

Do not edit any files.

Return:
1. Current project health (structure, dependencies, obvious issues)
2. Progress toward the current goal
3. Any risks or blockers you notice
4. The single most important thing to fix or improve next
5. What NOT to touch yet`,
  },
  {
    title: "Plan Next Small Task",
    description: "Get a safe, concrete task plan for the next session.",
    build: (p) => `Create a task plan for the next work session on this project.

Project: ${p.name}
Path: ${p.localPath}
Current goal: ${p.currentGoal}

Do not edit any files yet.

Return:
1. The next 3–5 small, safe tasks in order
2. The recommended first task (smallest safe change)
3. What should NOT be touched yet
4. A commit message for each task
5. Any risks to watch for`,
  },
  {
    title: "Implement Safe Small Change",
    description: "Make a single small change with full explanation before editing.",
    build: (p) => `Implement a safe small change in this project.

Project: ${p.name}
Path: ${p.localPath}
Current goal: ${p.currentGoal}

Task:
[DESCRIBE THE SPECIFIC TASK HERE]

Rules:
- Make the smallest safe change possible.
- Explain which files you will change BEFORE editing anything.
- Do not touch unrelated files.
- Do not delete data.
- Do not expose .env or secrets.
- After editing, summarize changed files.
- Run typecheck or build if available.
- Do not push to GitHub automatically.`,
  },
  {
    title: "Review Repo Safety",
    description: "Audit the repo for data leaks, secrets, and exposure risks.",
    build: (p) => `Review this repository for safety and data exposure risks.

Project: ${p.name}
Path: ${p.localPath}

Do not edit any files.

Check for:
- .env files or secrets that could be tracked by git
- Private data or notes that should not be in the repo
- Sensitive file paths in .gitignore gaps
- Any data that could be accidentally pushed publicly
- Database files or uploads that should be excluded

Return:
1. Safety risks found (severity: high / medium / low)
2. Files that need to be added to .gitignore
3. Anything that should be backed up before changes
4. One safe first fix recommendation`,
  },
  {
    title: "Summarize Current Project State",
    description: "Get a plain-language summary to update memory files.",
    build: (p) => `Summarize the current state of this project in plain language.

Project: ${p.name}
Path: ${p.localPath}
Current goal: ${p.currentGoal}

Do not edit any files.

Return:
1. What the project currently is and does
2. What is working well
3. What is incomplete or broken
4. What the next priority should be
5. A one-paragraph summary I can paste into my memory file`,
  },
  {
    title: "Prepare Public Release Notes",
    description: "Summarize recent changes for a public-facing changelog or README.",
    build: (p) => `Review recent changes in this project and prepare release notes.

Project: ${p.name}
Path: ${p.localPath}

Do not edit any files.

Steps:
1. Run: git log --oneline -20
2. Review changed files in the last few commits
3. Identify user-facing changes (new features, fixes, removals)

Return:
1. A short changelog section (markdown format)
2. Any changes that are NOT safe to mention publicly
3. README sections that need updating
4. Recommended version bump (patch / minor / major)`,
  },
];

type Props = {
  projects: Project[];
};

export function PromptsClient({ projects }: Props) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  return (
    <div>
      {/* Project selector */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="text-sm text-neutral-500">Generating prompts for:</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-white focus:border-emerald-600 focus:outline-none"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <p className="mt-2 font-mono text-xs text-neutral-700">
          {selected.localPath}
        </p>
      )}

      {/* Prompt cards */}
      <div className="mt-8 space-y-6">
        {TEMPLATES.map((t) => {
          const text = selected ? t.build(selected) : "";
          return (
            <div
              key={t.title}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <h2 className="text-lg font-semibold">{t.title}</h2>
              <p className="mt-1 text-xs text-neutral-600">{t.description}</p>

              <div className="mt-4">
                <CopyPrompt text={text} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
