import { PROJECTS } from "@/data/projects";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

const SAFETY_NOTES = [
  "Builder OS is private only — never push its content publicly",
  "Builder Hub is public only — no private controls or data",
  "Private notes and .env files never go public",
  "Agents work on one repo at a time — never cross-repo",
  "No automatic push or deploy yet — you approve every commit",
];

const FLOW_STEPS = [
  {
    label: "Builder OS",
    sublabel: "Source of truth — private",
    color: "border-emerald-800 bg-emerald-950/30 text-emerald-300",
    badge: "Private",
    badgeColor: "bg-emerald-900 text-emerald-400",
  },
  {
    label: "Generates prompts & tasks",
    sublabel: "You clarify the goal here first",
    color: "border-neutral-800 bg-neutral-900 text-neutral-400",
    badge: null,
    badgeColor: "",
  },
  {
    label: "Claude Code / Codex / Ruflo",
    sublabel: "Workers — execute one task, one repo",
    color: "border-violet-900 bg-violet-950/20 text-violet-300",
    badge: "Workers",
    badgeColor: "bg-violet-900 text-violet-400",
  },
  {
    label: "You review, test, commit",
    sublabel: "Human approval — every time",
    color: "border-yellow-900 bg-yellow-950/20 text-yellow-300",
    badge: "Approval",
    badgeColor: "bg-yellow-900 text-yellow-500",
  },
  {
    label: "Public-safe projects on Builder Hub",
    sublabel: "Only after release checklist passes",
    color: "border-blue-900 bg-blue-950/20 text-blue-300",
    badge: "Public",
    badgeColor: "bg-blue-900 text-blue-400",
  },
];

type LayerItem = { name: string; note: string };

type Layer = {
  number: string;
  title: string;
  description: string;
  privacy: "private" | "workers" | "repos" | "public";
  borderColor: string;
  headerColor: string;
  badgeColor: string;
  badge: string;
  items: LayerItem[];
};

const STATIC_LAYERS: Omit<Layer, "items">[] = [
  {
    number: "01",
    title: "Private Control",
    description:
      "Builder OS is the single source of truth. All project goals, decisions, memory, tasks, and release status live here. Nothing here is public.",
    privacy: "private",
    borderColor: "border-emerald-900",
    headerColor: "text-emerald-300",
    badgeColor: "bg-emerald-900 text-emerald-400",
    badge: "Private only",
  },
  {
    number: "02",
    title: "Worker Tools",
    description:
      "These tools execute work inside a repo. They are workers — not the source of truth. Builder OS decides what they work on.",
    privacy: "workers",
    borderColor: "border-violet-900",
    headerColor: "text-violet-300",
    badgeColor: "bg-violet-900 text-violet-400",
    badge: "Workers",
  },
  {
    number: "03",
    title: "Project Repos",
    description:
      "The actual codebases. Each repo is either private-only or being prepared for public release. Workers operate inside one repo at a time.",
    privacy: "repos",
    borderColor: "border-neutral-700",
    headerColor: "text-neutral-200",
    badgeColor: "bg-neutral-800 text-neutral-400",
    badge: "Repos",
  },
  {
    number: "04",
    title: "Public Display",
    description:
      "Builder Hub is the only public-facing layer. Projects only appear here after passing the release checklist. No private data ever reaches this layer.",
    privacy: "public",
    borderColor: "border-blue-900",
    headerColor: "text-blue-300",
    badgeColor: "bg-blue-900 text-blue-400",
    badge: "Public only",
  },
];

const LAYER_ITEMS: Record<Layer["privacy"], LayerItem[]> = {
  private: [
    { name: "Builder OS dashboard", note: "this app — never push publicly" },
    { name: "Project memory", note: "data/memory.ts" },
    { name: "Task board", note: "data/tasks.ts" },
    { name: "Prompt library", note: "app/_components/PromptBuilder.tsx" },
    { name: "Session log", note: "data/sessions.ts" },
    { name: "Release pipeline", note: "data/releases.ts" },
    { name: "Project briefs", note: "data/briefs.ts" },
  ],
  workers: [
    { name: "Claude Code", note: "repo inspection and safe implementation" },
    { name: "Codex", note: "focused code generation and fixes" },
    { name: "Ruflo (claude-flow)", note: "multi-step orchestration and subagents" },
    { name: "ChatGPT", note: "planning, strategy, and concept work" },
    { name: "Local models", note: "brainstorming and cheap tasks — coming later" },
  ],
  repos: [],
  public: [
    { name: "Builder Hub website", note: "builder-hub repo — public display layer" },
    { name: "EternalNotes public page", note: "download and install guide" },
    { name: "GitHub / download links", note: "links to public repos only" },
    { name: "Future project pages", note: "added after release checklist passes" },
  ],
};

const explainSystemPrompt = `Summarize the current state of my development system.

Review all repos and return:

1. Repo inventory
   - What does each repo do?
   - What is its current status (active / paused / needs work)?
   - Is it private or public?

2. What to work on next
   - Which project has the highest-priority incomplete work?
   - What is the single safest next task?

3. Privacy map
   - What must stay private? Why?
   - What is safe to make public?
   - Are there any accidental exposures to fix?

4. System health
   - Are any repos stale or drifting from their purpose?
   - Is any project memory or task list likely out of date?
   - Are there any obvious gaps between what Builder OS tracks and what actually exists?

Do NOT edit any files. This is a read-only system review.
Do not push to GitHub automatically.`;

export default function SystemMapPage() {
  const repoItems: LayerItem[] = PROJECTS.map((p) => ({
    name: p.name,
    note: `${p.localPath} — ${p.type === "private-tool" || p.id.includes("private") ? "private" : "public or preparing"}`,
  }));

  const layers: Layer[] = STATIC_LAYERS.map((l) => ({
    ...l,
    items: l.privacy === "repos" ? repoItems : LAYER_ITEMS[l.privacy],
  }));

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">System Map</h1>
        <p className="mt-3 text-neutral-400">
          How the whole ecosystem connects — Builder OS, the worker tools, the project repos, and
          the public display layer. Use this as a reference when deciding where work should happen.
        </p>

        {/* Flow diagram */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Data flow
          </p>
          <div className="mt-4 flex flex-col items-center gap-0">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex w-full max-w-md flex-col items-center">
                <div
                  className={`w-full rounded-xl border px-5 py-3 text-center ${step.color}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-semibold">{step.label}</span>
                    {step.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${step.badgeColor}`}>
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs opacity-70">{step.sublabel}</p>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="py-1 text-lg text-neutral-700">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div className="mt-12 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            System layers
          </p>
          {layers.map((layer) => (
            <div
              key={layer.number}
              className={`rounded-2xl border bg-neutral-900 p-6 ${layer.borderColor}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-neutral-700">{layer.number}</span>
                  <h2 className={`text-lg font-semibold ${layer.headerColor}`}>
                    {layer.title}
                  </h2>
                </div>
                <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${layer.badgeColor}`}>
                  {layer.badge}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-400">{layer.description}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {layer.items.map((item) => (
                  <li key={item.name} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" />
                    <div>
                      <span className="text-sm text-neutral-300">{item.name}</span>
                      {item.note && (
                        <span className="ml-1 text-xs text-neutral-600">— {item.note}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Safety notes */}
        <div className="mt-8 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-300">Safety boundaries</h2>
          <ul className="mt-4 space-y-2">
            {SAFETY_NOTES.map((note) => (
              <li key={note} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 shrink-0 text-red-600">✕</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* Explain system prompt */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Prompt: Explain Current System State
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Paste this into Claude Code inside any project repo for a full system review.
          </p>
          <div className="mt-3">
            <CopyPrompt text={explainSystemPrompt} customizeLink />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-neutral-800 pt-8">
          {[
            { href: "/projects", label: "Projects" },
            { href: "/releases", label: "Releases" },
            { href: "/ruflo", label: "Ruflo Setup" },
            { href: "/model-router", label: "Model Router" },
            { href: "/workflow", label: "Workflow" },
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
