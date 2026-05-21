"use client";

import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { PROJECTS } from "@/data/projects";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

// ─── Types ────────────────────────────────────────────────────────────────────

type Intent = "new-project" | "existing-project" | "public-release" | "execution-task" | "unclear";
type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
type PagePhase = "input" | "planning";

interface TaskPacketData {
  id: string;
  agent: string;
  approvalLevel: string;
  scope: string;
  allowed: string[];
  forbidden: string[];
  output: string;
}

interface GeneratedPlan {
  intent: Intent;
  goal: string;
  projectType: string;
  questions: string[];
  frs: string[];
  nfrs: string[];
  constraints: string[];
  risks: { level: RiskLevel; text: string }[];
  sdlcOutline: string[];
  phases: { name: string; tasks: string[] }[];
  taskPacket: TaskPacketData;
  recommendedTool: string;
  executionPrompt: string;
  releaseChecklist: string[];
  publicSafetyRules: string[];
  suggestedProjectId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INTENT_LABELS: Record<Intent, string> = {
  "new-project":      "Create a new project",
  "existing-project": "Improve an existing project",
  "public-release":   "Prepare a public release",
  "execution-task":   "Execute an approved task",
  "unclear":          "Explore an idea",
};

const INTENT_COLOR: Record<Intent, string> = {
  "new-project":      "border-emerald-800 bg-emerald-950/30 text-emerald-300",
  "existing-project": "border-blue-800 bg-blue-950/30 text-blue-300",
  "public-release":   "border-purple-800 bg-purple-950/30 text-purple-300",
  "execution-task":   "border-orange-800 bg-orange-950/30 text-orange-300",
  "unclear":          "border-neutral-700 bg-neutral-900 text-neutral-400",
};

const RISK_COLOR: Record<RiskLevel, string> = {
  HIGH:   "text-red-400 bg-red-950/40 border-red-900",
  MEDIUM: "text-yellow-400 bg-yellow-950/40 border-yellow-900",
  LOW:    "text-emerald-400 bg-emerald-950/40 border-emerald-900",
};

const CHIPS = [
  { label: "New project idea",        text: "I want to build a new " },
  { label: "Improve existing project", text: "I want to improve my " },
  { label: "Prepare public release",  text: "I want to release " },
  { label: "Execute approved task",   text: "Execute approved task for " },
];

// ─── Intent detection ─────────────────────────────────────────────────────────

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/\b(execute|run task|approved task|dispatch|task packet|run the task)\b/.test(t)) return "execution-task";
  if (/\b(release|publish|make public|launch|ship|go public|deploy to hub)\b/.test(t)) return "public-release";
  if (/\b(improve|edit|change|refactor|fix|update|modify|add to|enhance|upgrade|rewrite|clean up)\b/.test(t)) return "existing-project";
  if (/\b(new|build|create|make|start|develop|i want to build|i want to create|idea for)\b/.test(t)) return "new-project";
  return "unclear";
}

function detectKeywords(t: string) {
  return {
    isAI:    /\b(ai|llm|gpt|claude|openai|anthropic|ai.powered|machine learning)\b/.test(t),
    isHabit: /\b(habit|tracker|streak|daily|routine|goal tracking)\b/.test(t),
    isNotes: /\b(note|notes|markdown|obsidian|writing|journal|knowledge base)\b/.test(t),
    isDash:  /\b(dashboard|analytics|metrics|chart|stats|monitor|reporting)\b/.test(t),
    isPDF:   /\b(pdf|paper|research|extract|document|citation|reader)\b/.test(t),
    isRoblox:/\b(roblox|game|balancing|open.cloud|lua|game economy)\b/.test(t),
    isLocal: /\b(local|offline|local.first|self.hosted|on.device|no cloud)\b/.test(t),
    isAPI:   /\b(api|backend|endpoint|server|rest|graphql|service)\b/.test(t),
    isBHub:  /\b(builder hub|public hub|builderhub)\b/.test(t),
    isETN:   /\b(eternalnotes|eternal notes|rag app|obsidian.like)\b/.test(t),
  };
}

// ─── Plan generator ───────────────────────────────────────────────────────────

function generatePlan(idea: string, intent: Intent): GeneratedPlan {
  const t = idea.toLowerCase();
  const d = detectKeywords(t);

  let projectType = "Private Tool";
  if (d.isAPI)   projectType = "API / Backend Service";
  if (d.isDash)  projectType = "Dashboard";
  if (d.isLocal) projectType = "Local-First App";
  if (d.isNotes) projectType = "Local-First Note App";
  if (d.isPDF)   projectType = "Document Research Tool";
  if (intent === "public-release") projectType = "Public Release";
  if (intent === "execution-task") projectType = "Agent Task Execution";

  const questions: string[] = (() => {
    if (intent === "execution-task") return [
      "Do you have an approved task packet ID?",
      "Which agent should receive it? (Claude Code / Ruflo / Codex)",
      "Is sandbox mode enabled?",
      "Have all safety conditions been confirmed?",
    ];
    if (intent === "public-release") return [
      "Which project is being released publicly?",
      "Has the repo been cleaned of all private data?",
      "Is there a README with clear install instructions?",
      "Have you tested it on a clean machine?",
      "Is sample data ready — no real personal content?",
    ];
    if (intent === "existing-project") return [
      "Which project needs this change?",
      "What is the specific problem or goal?",
      "Are there uncommitted changes in the repo right now?",
      "Can this be sandboxed first before touching the real repo?",
      "What does success look like after this change?",
    ];
    return [
      "Who is the primary user?",
      d.isAI  ? "Which AI model/API will power it? (Claude, OpenAI, local?)" : "What is the core data model?",
      d.isLocal ? "What local storage format? (SQLite, JSON, flat files?)" : "Where will data live? (local, cloud, in-memory?)",
      "What is the minimum working version (v0.1)?",
      "What should NOT be built in v1?",
      "Should this be public or stay private?",
    ];
  })();

  const frs: string[] = (() => {
    if (d.isHabit) return [
      "User can create and name daily habits",
      "Each habit shows current streak and last 7 days",
      "User can mark a habit complete for today",
      "Data persists locally without an account",
      d.isAI ? "AI suggests habit improvements based on patterns" : "Habits can be archived or deleted",
    ];
    if (d.isNotes) return [
      "User can create, edit, and delete notes",
      "Notes are stored as Markdown files locally",
      "Full-text search works across all notes",
      "Notes never leave the local machine",
      d.isAI ? "AI can answer questions about note content (RAG)" : "Notes can be tagged and filtered",
    ];
    if (d.isDash) return [
      "Dashboard shows key metrics at a glance",
      "Data refreshes on a configurable interval",
      "User can filter and drill into any chart",
      "Charts render correctly on mobile and desktop",
      d.isRoblox ? "Pulls live data from Roblox Open Cloud API" : "Metrics can be exported as CSV",
    ];
    if (d.isPDF) return [
      "User can upload and parse PDF documents",
      "Text is extracted and indexed for search",
      "User can ask questions about document content",
      "Answers include source page number citations",
      "Multiple PDFs can be compared side by side",
    ];
    return [
      "Core feature works end-to-end without errors",
      "User completes the primary action in under 3 steps",
      "Data persists across sessions",
      "Error states are handled with clear messages",
      "Works without an internet connection",
    ];
  })();

  const nfrs = [
    "No user accounts required in v1",
    "Cold start time under 3 seconds",
    "Zero data sent to third-party servers without consent",
    d.isAI ? "AI calls are rate-limited and use a secure API key" : "No external API dependencies in v1",
    "Runs on Windows 11 without Docker or admin rights",
  ];

  const constraints = [
    "No database in v1 — local files only",
    "No auth system in v1",
    "No automatic git commit or push",
    "All agent runs must be sandboxed first",
    d.isRoblox ? "Must respect Roblox Open Cloud API rate limits" : "Must pass TypeScript strict mode with zero errors",
  ];

  const risks: { level: RiskLevel; text: string }[] = [
    { level: "HIGH",   text: d.isAI ? "LLM API costs if calls are not rate-limited" : "Scope creep beyond the v1 spec" },
    { level: "HIGH",   text: "Real data accidentally included in sandbox or public repo" },
    { level: "MEDIUM", text: d.isLocal ? "File conflicts if app opened in multiple windows" : "Data loss if app crashes during a write" },
    { level: "MEDIUM", text: "Feature added without an approved task packet" },
    { level: "LOW",    text: "Build passes but the feature feels incomplete or confusing" },
  ];

  const sdlcOutline = [
    "Spec: Define FRs, NFRs, architecture, data model",
    "Design: Wireframe core screens, define state shape",
    "Task Packet: Create locked, scoped agent instruction",
    "Sandbox: Run agent in isolation, review the diff",
    "Review: Apply patch to real repo on a review branch",
    "Ship: Commit, tag, update changelog",
  ];

  const phases = [
    {
      name: "Phase 1 — Core",
      tasks: [
        frs[0] ?? "Implement core feature",
        "Set up data storage structure",
        "Build main UI component",
      ],
    },
    {
      name: "Phase 2 — Polish",
      tasks: [
        frs[1] ?? "Add secondary feature",
        "Handle all error and empty states",
        "Add loading and transition states",
      ],
    },
    {
      name: "Phase 3 — Release",
      tasks: [
        "Write or update README",
        "Test on a clean machine",
        "Commit and tag as v1.0",
      ],
    },
  ];

  const packetId = `PKT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const taskPacket: TaskPacketData = {
    id: packetId,
    agent: d.isAI ? "Claude Code (claude-opus-4-7)" : "Claude Code",
    approvalLevel: "Human approval required before execution",
    scope: idea.slice(0, 100),
    allowed: [
      "Create new files in the designated project folder",
      "Read existing source files",
      "Run npm run build or npm run dev",
      "Write to .builder-os/sandboxes/ only",
    ],
    forbidden: [
      "Do NOT push to GitHub",
      "Do NOT modify files outside the designated project",
      "Do NOT add authentication or billing",
      "Do NOT exceed Phase 1 scope",
    ],
    output: "Changed file list + build result + diff summary + next recommended task",
  };

  const recommendedTool = d.isAI
    ? "Claude Code (claude-opus-4-7)"
    : d.isDash ? "Claude Code + Next.js"
    : "Claude Code";

  const executionPrompt = `ROLE: You are an AI agent executing a locked task packet inside a sandbox.

TASK PACKET ID: ${packetId}
GOAL: ${idea}

INTENT: ${INTENT_LABELS[intent]}
PROJECT TYPE: ${projectType}

FUNCTIONAL REQUIREMENTS:
${frs.map((f, i) => `${i + 1}. ${f}`).join("\n")}

NON-FUNCTIONAL REQUIREMENTS:
${nfrs.map((n, i) => `${i + 1}. ${n}`).join("\n")}

CONSTRAINTS:
${constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

ALLOWED:
${taskPacket.allowed.map((a) => `- ${a}`).join("\n")}

FORBIDDEN:
${taskPacket.forbidden.map((f) => `- ${f}`).join("\n")}

EXPECTED OUTPUT:
${taskPacket.output}

SANDBOX MODE: ON — Real repo is NOT modified.
APPROVAL REQUIRED before any commit or push.
RECOMMENDED AGENT: ${recommendedTool}

SAFETY REMINDER:
- Do NOT push to GitHub
- Do NOT modify external repos
- Do NOT expand scope beyond this packet
- Run inside .builder-os/sandboxes/${packetId}
- Return a SANDBOX EXECUTION SUMMARY when done`;

  const releaseChecklist = [
    "Repo cleaned — no private notes, .env, or database files",
    "README explains what the tool does and how to install it",
    "Installation tested on a clean machine",
    "No hardcoded API keys or credentials in any file",
    "All private branches removed or merged",
    "GitHub repo visibility set to public",
    "Builder Hub page drafted and ready",
    "Sample data only — no real personal content",
  ];

  const publicSafetyRules = [
    "Never include real personal notes in a public repo",
    "Never push .env files — audit .gitignore before release",
    "Use sample data only — replace all real content",
    "Run: git log --all -- '*.env' to audit history before going public",
  ];

  let suggestedProjectId = "";
  for (const p of PROJECTS) {
    if (t.includes(p.name.toLowerCase()) || t.includes(p.id.replace(/-/g, " "))) {
      suggestedProjectId = p.id;
      break;
    }
  }
  if (!suggestedProjectId) {
    if (d.isETN)  suggestedProjectId = "eternalnotes-public";
    if (d.isBHub) suggestedProjectId = "builder-hub";
  }

  return {
    intent, goal: idea, projectType, questions,
    frs, nfrs, constraints, risks, sdlcOutline, phases,
    taskPacket, recommendedTool, executionPrompt,
    releaseChecklist, publicSafetyRules, suggestedProjectId,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{title}</h3>
        {badge && <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-600">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
          <span className="mt-0.5 shrink-0 text-emerald-700">◦</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [pagePhase, setPagePhase] = useState<PagePhase>("input");
  const [idea, setIdea] = useState("");
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [selectedProjId, setSelectedProjId] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = idea.trim();
    if (trimmed.length < 5) return;
    const intent = detectIntent(trimmed);
    const generated = generatePlan(trimmed, intent);
    setPlan(generated);
    setSelectedProjId(generated.suggestedProjectId || PROJECTS[0].id);
    setPagePhase("planning");
  }, [idea]);

  const handleReset = useCallback(() => {
    setPagePhase("input");
    setIdea("");
    setPlan(null);
    setSelectedProjId("");
  }, []);

  // ── INPUT ──────────────────────────────────────────────────────────────────

  if (pagePhase === "input") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-700">Builder OS — Private</p>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">
          What do you want to<br />build or change today?
        </h1>
        <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
          Describe your idea or goal. Builder OS detects what you want and guides you through planning, scoping, and execution — no navigation required.
        </p>

        {/* Starter chips */}
        <div className="mt-8 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => setIdea(chip.text)}
              className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-1.5 text-xs text-neutral-500 hover:border-neutral-700 hover:text-white transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="mt-4">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            placeholder="e.g. I want to build an AI habit tracker that works locally without an account..."
            rows={5}
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4 text-sm text-white placeholder-neutral-800 focus:border-emerald-800 focus:outline-none resize-none leading-relaxed"
          />
          <p className="mt-1.5 text-right text-xs text-neutral-800">{idea.length} chars — Ctrl+Enter to submit</p>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={idea.trim().length < 5}
            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Planning →
          </button>
          <p className="text-xs text-neutral-700">Local intent detection — no AI API calls</p>
        </div>

        {/* Secondary links */}
        <div className="mt-16 border-t border-neutral-900 pt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-800 mb-3">Quick access</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/projects",       label: "Projects" },
              { href: "/task-packets",   label: "Task Packets" },
              { href: "/sessions",       label: "Sessions" },
              { href: "/planner-chat",   label: "Planner Chat" },
              { href: "/execute",        label: "Execute" },
              { href: "/sandbox-review", label: "Patch Review" },
              { href: "/releases",       label: "Releases" },
              { href: "/command",        label: "Command" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg border border-neutral-900 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-700 hover:border-neutral-800 hover:text-neutral-500 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── PLANNING ───────────────────────────────────────────────────────────────

  if (!plan) return null;
  const { intent } = plan;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-5">

      {/* Back */}
      <div className="flex items-center gap-4">
        <button onClick={handleReset} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
          ← Start over
        </button>
        <p className="text-xs text-neutral-800 truncate max-w-lg">{plan.goal}</p>
      </div>

      {/* Intent banner */}
      <div className={`rounded-2xl border px-6 py-5 ${INTENT_COLOR[intent]}`}>
        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">I think you want to...</p>
        <p className="text-xl font-bold">{INTENT_LABELS[intent]}</p>
        {intent === "unclear" && (
          <p className="mt-1 text-xs opacity-60">
            No strong keywords detected — treating this as a new project. Adjust below if needed.
          </p>
        )}
      </div>

      {/* ── NEW / UNCLEAR: questions + SDLC outline ── */}
      {(intent === "new-project" || intent === "unclear") && (
        <SectionCard title="Before building, answer these..." badge="Planning">
          <BulletList items={plan.questions} />
          <div className="mt-5 border-t border-neutral-800 pt-5">
            <p className="text-xs text-neutral-600 mb-3">SDLC Outline</p>
            <ol className="space-y-2">
              {plan.sdlcOutline.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-400">
                  <span className="shrink-0 text-xs text-neutral-700 mt-0.5 font-mono">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-5 text-xs text-neutral-700 italic">When approved, this becomes a task packet.</p>
        </SectionCard>
      )}

      {/* ── EXISTING PROJECT: project selector + questions + risks ── */}
      {intent === "existing-project" && (
        <SectionCard title="Here is the first safe plan..." badge="Existing Project">
          <p className="text-xs text-neutral-600 mb-3">Select the project to change</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROJECTS.filter((p) => p.type !== "private-notes").map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjId(p.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selectedProjId === p.id
                    ? "border-blue-700 bg-blue-950/30"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                }`}
              >
                <p className="text-sm font-semibold text-neutral-200">{p.name}</p>
                <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed line-clamp-2">{p.purpose}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-neutral-800 pt-5">
            <p className="text-xs text-neutral-600 mb-3">Before building, answer these...</p>
            <BulletList items={plan.questions} />
          </div>
          <div className="mt-5 rounded-xl border border-yellow-900 bg-yellow-950/20 p-4">
            <p className="text-xs font-semibold text-yellow-400 mb-2">Risks for existing project changes</p>
            <ul className="space-y-1">
              {plan.risks.slice(0, 3).map((r, i) => (
                <li key={i} className="text-xs text-yellow-200/70">• {r.text}</li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-xs text-neutral-700 italic">When approved, this becomes a task packet.</p>
        </SectionCard>
      )}

      {/* ── PUBLIC RELEASE: checklist + safety ── */}
      {intent === "public-release" && (
        <SectionCard title="Public release checklist" badge="Release">
          <p className="text-xs text-neutral-600 mb-3">Before building, answer these...</p>
          <BulletList items={plan.questions} />
          <div className="mt-5 border-t border-neutral-800 pt-5">
            <p className="text-xs text-neutral-600 mb-3">Release Checklist</p>
            <ul className="space-y-2">
              {plan.releaseChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-300">
                  <span className="shrink-0 text-neutral-700 mt-0.5">☐</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 border-t border-neutral-800 pt-5">
            <p className="text-xs font-semibold text-red-400 mb-2">Public safety rules</p>
            <ul className="space-y-1.5">
              {plan.publicSafetyRules.map((rule, i) => (
                <li key={i} className="text-xs text-red-300/70">⚠ {rule}</li>
              ))}
            </ul>
          </div>
          <div className="mt-5 flex gap-3">
            <a href="/projects" className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors">
              Open Projects →
            </a>
            <a href="/releases" className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-600 transition-colors">
              Releases
            </a>
          </div>
        </SectionCard>
      )}

      {/* ── EXECUTION TASK: packet + agent warning ── */}
      {intent === "execution-task" && (
        <SectionCard title="Execute approved task" badge="Execution">
          <div className="rounded-xl border border-orange-800 bg-orange-950/20 p-4 mb-5">
            <p className="text-xs font-bold text-orange-400 mb-1">⚠ Agent execution warning</p>
            <p className="text-xs text-orange-200/80 leading-relaxed">
              Real agent execution is not enabled yet. This generates the approved prompt and packet for Claude Code or Ruflo. You paste it manually into your agent.
            </p>
          </div>
          <p className="text-xs text-neutral-600 mb-3">Before building, answer these...</p>
          <BulletList items={plan.questions} />
          <div className="mt-5 border-t border-neutral-800 pt-5 space-y-2 text-sm">
            <p><span className="text-neutral-600">Approval level:</span> <span className="text-neutral-300">{plan.taskPacket.approvalLevel}</span></p>
            <p><span className="text-neutral-600">Recommended agent:</span> <span className="text-neutral-300">{plan.recommendedTool}</span></p>
            <p><span className="text-neutral-600">Sandbox mode:</span> <span className="text-neutral-300">Required before any real run</span></p>
          </div>
          <div className="mt-5 flex gap-3">
            <a href="/execute" className="rounded-xl bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
              Open Execute →
            </a>
            <a href="/task-packets" className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-600 transition-colors">
              Task Packets
            </a>
          </div>
        </SectionCard>
      )}

      {/* ── GENERATED PLAN: goal, FRs, NFRs, constraints, risks, phases ── */}
      {intent !== "execution-task" && (
        <>
          {/* Goal + project type */}
          <SectionCard title="Generated Plan" badge="Here is the first safe plan...">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-600 mb-1">Goal</p>
                <p className="text-sm text-neutral-200 leading-relaxed">{plan.goal}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 mb-1">Project type</p>
                <p className="text-sm text-neutral-200">{plan.projectType}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 mb-1">Recommended agent / tool</p>
                <p className="text-sm text-neutral-200">{plan.recommendedTool}</p>
              </div>
            </div>
          </SectionCard>

          {/* FRs + NFRs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Functional Requirements" badge="FRs">
              <BulletList items={plan.frs} />
            </SectionCard>
            <SectionCard title="Non-Functional Requirements" badge="NFRs">
              <BulletList items={plan.nfrs} />
            </SectionCard>
          </div>

          {/* Constraints */}
          <SectionCard title="Constraints">
            <BulletList items={plan.constraints} />
          </SectionCard>

          {/* Risks */}
          <SectionCard title="Risks">
            <div className="space-y-2">
              {plan.risks.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${RISK_COLOR[r.level]}`}>
                  <span className="shrink-0 text-xs font-bold mt-0.5 w-14">{r.level}</span>
                  <p className="text-sm">{r.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Implementation phases */}
          <SectionCard title="Implementation Phases">
            <div className="space-y-5">
              {plan.phases.map((ph, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-neutral-400 mb-2">{ph.name}</p>
                  <ul className="space-y-1.5">
                    {ph.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-neutral-300">
                        <span className="shrink-0 text-neutral-700 mt-0.5">·</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Task packet preview */}
          <SectionCard title="Task Packet" badge="When approved, this becomes a task packet.">
            <div className="space-y-3 text-sm mb-5">
              <p>
                <span className="text-neutral-600">ID </span>
                <span className="font-mono text-xs text-neutral-300">{plan.taskPacket.id}</span>
              </p>
              <p>
                <span className="text-neutral-600">Scope </span>
                <span className="text-neutral-300">{plan.taskPacket.scope}</span>
              </p>
              <p>
                <span className="text-neutral-600">Agent </span>
                <span className="text-neutral-300">{plan.taskPacket.agent}</span>
              </p>
              <p>
                <span className="text-neutral-600">Approval </span>
                <span className="text-neutral-300">{plan.taskPacket.approvalLevel}</span>
              </p>
              <div>
                <p className="text-neutral-600 mb-1.5">Allowed</p>
                <ul className="space-y-1">
                  {plan.taskPacket.allowed.map((a, i) => (
                    <li key={i} className="text-xs text-emerald-300/70">✓ {a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-neutral-600 mb-1.5">Forbidden</p>
                <ul className="space-y-1">
                  {plan.taskPacket.forbidden.map((f, i) => (
                    <li key={i} className="text-xs text-red-300/70">✗ {f}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/task-packets" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
                Create Task Packet →
              </a>
              <a href="/execute" className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-600 transition-colors">
                Execute in Sandbox →
              </a>
            </div>
          </SectionCard>
        </>
      )}

      {/* ── COPY EXECUTION PROMPT ── */}
      <SectionCard title="Copy Execution Prompt">
        <div className="mb-4 rounded-xl border border-yellow-900 bg-yellow-950/20 px-4 py-3">
          <p className="text-xs text-yellow-300/90 leading-relaxed">
            ⚠ Real agent execution is not enabled yet. This generates the approved prompt and packet for Claude Code or Ruflo. Paste it manually into your agent.
          </p>
        </div>
        <CopyPrompt
          text={plan.executionPrompt}
          description="Paste into Claude Code, Ruflo, or your preferred agent."
        />
      </SectionCard>

      {/* Footer nav */}
      <div className="border-t border-neutral-900 pt-6 pb-10">
        <p className="text-xs text-neutral-700 mb-3">Next steps</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/task-packets",   label: "Task Packets" },
            { href: "/execute",        label: "Execute (Sandbox)" },
            { href: "/sandbox-review", label: "Patch Review" },
            { href: "/planner-chat",   label: "Planner Chat" },
            { href: "/sessions",       label: "Sessions" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
        <button
          onClick={handleReset}
          className="mt-5 text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
        >
          ← Start a new conversation
        </button>
      </div>

    </main>
  );
}
