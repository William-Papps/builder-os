import { CopyButton } from "@/app/_components/CopyButton";

const prompts = [
  {
    title: "Clean Public EternalNotes Repo",
    description: "Use in: obsidian-like-rag-system",
    text: `Analyze this repository as the public downloadable version of EternalNotes.

Do not edit files yet.

Find:
- auth/signup code
- billing/Stripe code
- private notes or real data risks
- .env or secret risks
- setup friction for new users
- README problems

Return:
1. public safety risks
2. files likely needing changes
3. safest cleanup order
4. what NOT to delete yet
5. one small safe first commit recommendation`,
  },
  {
    title: "Review Private Repo Safety",
    description: "Use in: private-eternalnotes",
    text: `Analyze this private EternalNotes repo.

Do not edit files yet.

Find:
- where real notes/data are stored
- whether private data is gitignored
- whether .env files are protected
- whether databases are tracked
- whether uploads/notes folders are safe
- any risk of accidentally pushing private data

Return:
1. safety risks
2. backup recommendations
3. .gitignore improvements
4. files to avoid touching
5. one safe first commit recommendation`,
  },
  {
    title: "Improve Builder Hub",
    description: "Use in: builder-hub",
    text: `Analyze the builder-hub public website.

Do not edit files yet.

Goal:
Make it a clean public landing page for free tools.
Currently showing only EternalNotes.

Check:
- Is the homepage clear and simple?
- Are there any private controls or data?
- Does the EternalNotes section have clear download/setup instructions?
- Is the README clear?

Return:
1. current homepage quality
2. what is missing
3. suggested improvements
4. one safe first commit
5. what to add after EternalNotes is cleaned up`,
  },
  {
    title: "Generate Next Task Plan",
    description: "Use for any project",
    text: `Based on this project state, create the next task plan.

Project:
[PROJECT NAME]

Current goal:
[CURRENT GOAL]

Known constraints:
[CONSTRAINTS]

Return:
1. the next 5 small safe tasks
2. the safest order to do them
3. what should not be touched yet
4. one recommended first task
5. a commit message for each task`,
  },
  {
    title: "Small Safe Coding Task",
    description: "Use for any repo",
    text: `Work on this repository safely.

Goal:
[WRITE THE GOAL HERE]

Rules:
- Make the smallest safe change.
- Do not touch unrelated files.
- Do not delete data.
- Do not expose secrets.
- Explain what files you will change before editing.
- After editing, summarize changed files.
- Run typecheck or build if available.
- Do not push to GitHub automatically.`,
  },
  {
    title: "Claude / Ruflo Safe Agent Task",
    description: "Use when running an agent inside a repo",
    text: `You are helping with a safe coding task inside one repository.

Repository:
[REPO NAME]

Task:
[DESCRIBE THE TASK]

Safety rules:
- Work inside this single repository only.
- Do not touch other repos.
- Do not push to GitHub automatically.
- Do not delete data files.
- Do not expose .env or secrets.
- Explain each file you plan to change before editing.
- Summarize changes after finishing.
- If unsure about a change, pause and ask.

Constraints:
- No accounts or login yet.
- No live agent deployment yet.
- No external API calls unless explicitly approved.`,
  },
];

export default function PromptsPage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold">Prompt Generator</h1>
        <p className="mt-3 max-w-2xl text-neutral-400">
          Copy these prompts into Claude Code, Codex, ChatGPT, or Ruflo.
          Each prompt is designed to be safe and give a clear starting point.
        </p>

        <div className="mt-10 space-y-6">
          {prompts.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <h2 className="text-xl font-semibold">{p.title}</h2>
              <p className="mt-1 text-xs text-neutral-600">{p.description}</p>

              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black p-4 text-sm text-neutral-200">
                {p.text}
              </pre>

              <CopyButton text={p.text} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
