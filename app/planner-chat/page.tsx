"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = "intake" | "clarifying" | "scope-lock" | "sdlc" | "done";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  provider?: "openai" | "claude";
  model?: string;
  error?: boolean;
  local?: boolean;
}

interface ScopeLock {
  projectType: "new" | "existing";
  projectName: string;
  targetUser: string;
  problem: string;
  coreOutcome: string;
  v1Scope: string[];
  outOfScope: string[];
  platform: string;
  isPublic: boolean;
  isLocalFirst: boolean;
  existingRepo: string | null;
  constraints: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskReason: string;
}

// ── Local fallback responses ───────────────────────────────────────────────────

const LOCAL_RESPONSES = [
  `Got it. Before designing anything, I need to understand the context.

**First questions:**

1. Is this a **new project** from scratch, or are you **improving an existing one**?
2. Who will actually use this — just you, or other people too?
3. What specific problem does this solve? What does the person do *today* without this tool?`,

  `Good context. Let's lock the scope boundaries:

4. What is the **smallest version** that would genuinely be useful — not impressive, just functional and complete?
5. What **platform** should this run on? Web app, CLI tool, desktop app, or something else?
6. Does this need to work **offline** or stay completely **local-first** (nothing to the cloud)?`,

  `Almost ready. Final questions before we lock scope:

7. Name **3 things** you're tempted to add that should be **cut from v1** entirely.
8. Should this ever be **public on Builder Hub**, or is it private to you forever?
9. Any hard **constraints** I should know? (TypeScript only, no auth, no database, specific frameworks, etc.)`,

  `I think I have enough to propose a solid scope.

Based on our conversation, you're building something specific for a defined user on a specific platform. We've agreed on what's in v1 and what's deferred.

This is the right moment to lock the scope before any spec is written.

[SCOPE_READY]`,
];

// ── Keyword detection (for local scope extraction) ────────────────────────────

function detectKeywords(t: string) {
  return {
    isNew:    /\b(new|build|create|make|start|develop|from scratch)\b/.test(t),
    isExist:  /\b(existing|improve|edit|fix|update|refactor|change|add to)\b/.test(t),
    isAI:     /\b(ai|llm|gpt|claude|openai|ai.powered)\b/.test(t),
    isHabit:  /\b(habit|tracker|streak|daily|routine|goal)\b/.test(t),
    isNotes:  /\b(note|notes|markdown|obsidian|writing|journal)\b/.test(t),
    isDash:   /\b(dashboard|analytics|metrics|chart|stats|monitor)\b/.test(t),
    isPDF:    /\b(pdf|paper|research|document|citation)\b/.test(t),
    isLocal:  /\b(local|offline|local.first|no.cloud|on.device)\b/.test(t),
    isPublic: /\b(public|hub|open.source|release|publish)\b/.test(t),
  };
}

// ── Local scope extraction (fallback when no API) ─────────────────────────────

function extractLocalScope(messages: ChatMessage[], idea: string): ScopeLock {
  const allText = [idea, ...messages.map((m) => m.content)].join(" ").toLowerCase();
  const d = detectKeywords(allText);
  const name = idea.trim().split(/\s+/).slice(0, 6).join(" ");

  return {
    projectType: d.isExist && !d.isNew ? "existing" : "new",
    projectName: name,
    targetUser: /just me|only me|solo|myself|just you/.test(allText)
      ? "Solo developer (just you)"
      : "Solo developer (primary)",
    problem:
      d.isHabit ? "No simple local habit tracker with insight — existing apps require subscriptions or cloud."
      : d.isNotes ? "Note apps sync to cloud or require accounts. No fast, local, private alternative."
      : d.isDash  ? "Metrics are scattered across tools. No single focused view."
      : d.isPDF   ? "Finding information across PDFs is manual and slow."
      : "The target workflow is currently manual or fragmented across multiple tools.",
    coreOutcome:
      d.isHabit ? "User can create habits, log completions, and view streaks — locally, with no account."
      : d.isNotes ? "User can create, edit, and search notes stored as local Markdown files."
      : d.isDash  ? "Dashboard shows key metrics from the configured data source."
      : "Working v1 that covers the core feature end-to-end.",
    v1Scope: [
      d.isHabit ? "Create and name daily habits" : d.isNotes ? "Create, edit, and delete notes" : "Core feature works end-to-end",
      d.isHabit ? "Log daily completions and view streaks" : d.isNotes ? "Full-text search across all notes" : "Data persists across page refreshes",
      d.isLocal || d.isNotes || d.isHabit ? "Local storage — data survives page refresh with no account" : "Basic UI without unnecessary polish",
    ],
    outOfScope: [
      d.isAI ? "AI features → Phase 2" : "AI integration → Phase 2",
      "Cloud sync → Phase 3",
      "Multi-user / sharing → Phase 3",
    ],
    platform:
      d.isDash ? "Web app (dashboard)"
      : d.isLocal ? "Local app (Next.js, no cloud dependency)"
      : "Web app (Next.js)",
    isPublic: d.isPublic,
    isLocalFirst: d.isLocal || d.isHabit || d.isNotes,
    existingRepo: d.isExist ? "Identified in conversation above" : null,
    constraints: [
      "TypeScript strict mode — zero type errors",
      "No auth in v1",
      "No database in v1 (localStorage or flat files only)",
      "npm run build must pass before any commit",
    ],
    riskLevel: "MEDIUM",
    riskReason: "Scope creep before v1 ships is the primary risk.",
  };
}

// ── Local plan generation (fallback) ─────────────────────────────────────────

function buildLocalFinalPlan(scope: ScopeLock): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const slug = scope.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 18);

  return `# Final Plan — ${scope.projectName}
Generated locally (no API key). Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local for AI-generated plans.

## Problem Statement
${scope.problem} ${scope.targetUser} currently lacks a focused tool for this. The v1 goal: ${scope.coreOutcome}

## Goals
1. Ship a working v1 that delivers: ${scope.coreOutcome}
2. Keep scope locked — no additions without an approved task packet
3. Pass npm run build with zero TypeScript errors before any commit
4. Verify the full user flow manually before calling v1 done

## Target Users
${scope.targetUser}. ${scope.isLocalFirst ? "Privacy-first: no cloud dependency required." : "Comfortable with web apps."}

## Functional Requirements
FR-01: ${scope.v1Scope[0]}
FR-02: ${scope.v1Scope[1]}
FR-03: ${scope.v1Scope[2]}
FR-04: User completes the primary action in under 3 steps
FR-05: Error states are handled with clear, actionable messages
FR-06: Works without an internet connection${scope.isLocalFirst ? " (required)" : ""}

## Non-Functional Requirements
NFR-01: Cold start time under 3 seconds
NFR-02: Zero TypeScript errors — npm run build passes clean
NFR-03: No user data sent to external services without explicit user action
NFR-04: Works on Windows 11 without Docker or admin rights
NFR-05: All local UI interactions respond in under 200ms

## Constraints
${scope.constraints.map((c) => `- ${c}`).join("\n")}

## Assumptions
- Solo developer is the primary user in v1
- No auth, no billing, no multi-user in v1
- Local state is acceptable — no real-time sync required
- Manual git commit and push — no automatic deployment

## Risks
HIGH: Scope creep before v1 ships.
  Mitigation: This plan is locked. Any addition requires a new task packet.

MEDIUM: Build passes but feature feels incomplete or confusing.
  Mitigation: Test the full user flow manually before calling v1 done.

MEDIUM: Feature works in dev but breaks in production build (SSR/CSR mismatch).
  Mitigation: Run npm run build and test in production mode after every change.

## Architecture Direction
- Tech: Next.js 16.2.6, TypeScript strict, Tailwind CSS v4, React 19
- Data: ${scope.isLocalFirst ? "localStorage (small data) or flat files — no database in v1" : "TypeScript data files (data/*.ts) — no database in v1"}
- Auth: None in v1
- Deployment: Local only — npm run build + manual review before any commit

## Implementation Phases

### Phase 1 — Ship Now (MVP)
Goal: ${scope.coreOutcome}
Tasks:
- Set up project with TypeScript strict, Tailwind v4
- Implement FR-01: ${scope.v1Scope[0]}
- Implement FR-02: ${scope.v1Scope[1]}
- Implement FR-03: ${scope.v1Scope[2]}
- Run npm run build — zero TypeScript errors
- Manual test: complete the primary flow without errors

### Phase 2 — Polish
Goal: Usability improvements and first optional enhancement
Tasks:
- Add error and empty state handling for all views
- Export functionality (CSV or JSON)
- Keyboard shortcuts for common actions

### Phase 3 — Extend
Goal: ${scope.outOfScope[0] ?? "First deferred feature — decided after Phase 2 ships"}
Tasks:
- Evaluate what Phase 1 users actually need
- Implement one deferred feature if validated by usage

## Task Packets

═══════════════════════════════════════════════════

PACKET ID: PKT-${date}-${slug}-001
GOAL: Project structure is created and builds successfully with zero TypeScript errors.
AGENT: Claude Code
APPROVAL LEVEL: edit-approved

SCOPE:
- package.json
- tsconfig.json
- app/layout.tsx
- app/globals.css
- app/page.tsx (skeleton only)

ALLOWED ACTIONS:
- Create project files and directory structure
- Install exact packages listed in this packet
- npm run build to verify

FORBIDDEN ACTIONS:
- Do NOT push to GitHub
- Do NOT add auth, billing, or external APIs not listed here
- Do NOT exceed this scope

EXPECTED OUTPUT:
Changed files: package.json, tsconfig.json, app/layout.tsx, app/globals.css, app/page.tsx
Build result: PASS / FAIL
Ready for human review: YES / NO

ROLLBACK: git checkout -- .

═══════════════════════════════════════════════════

PACKET ID: PKT-${date}-${slug}-002
GOAL: ${scope.v1Scope[0]} — works end-to-end in the browser.
AGENT: Claude Code
APPROVAL LEVEL: edit-approved

SCOPE:
- app/(feature)/page.tsx
- app/_components/(Feature)*.tsx
- data/(feature).ts (if needed)

ALLOWED ACTIONS:
- Create new pages and components within defined scope only
- Create or update data/ files
- npm run build and npm run dev
- Use localStorage for v1 persistence${scope.isLocalFirst ? " (required — local-first)" : ""}

FORBIDDEN ACTIONS:
- Do NOT push to GitHub
- Do NOT modify files outside the defined scope
- Do NOT add Phase 2 features
- Do NOT add auth, database, or external APIs

EXPECTED OUTPUT:
Changed files: app/(feature)/page.tsx, app/_components/...
Build result: PASS / FAIL
Ready for human review: YES / NO

ROLLBACK: git checkout -- app/ data/

═══════════════════════════════════════════════════

## Execution Prompt
You are implementing Phase 1 of "${scope.projectName}" for Builder OS. Start with PKT-${date}-${slug}-001. The project is a ${scope.platform} — ${scope.problem} Key constraints: ${scope.constraints.slice(0, 2).join("; ")}. Do not add anything beyond what is in the task packet. When done, output: Changed files, Build result (PASS/FAIL), and Ready for human review (YES/NO).`;
}

// ── Stage bar ─────────────────────────────────────────────────────────────────

const STAGES: { id: Stage; label: string }[] = [
  { id: "intake",     label: "1 · Idea" },
  { id: "clarifying", label: "2 · Questions" },
  { id: "scope-lock", label: "3 · Scope Lock" },
  { id: "sdlc",       label: "4 · Final Plan" },
  { id: "done",       label: "5 · Ready" },
];

function StageBar({ current }: { current: Stage }) {
  const idx = STAGES.findIndex((s) => s.id === current);
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0, marginTop: 20 }}>
      {STAGES.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <span key={s.id} style={{ display: "flex", alignItems: "center" }}>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: active ? 700 : 400,
              border: active ? "1px solid #064e3b" : done ? "1px solid #1e3a8a" : "1px solid #1a1a1a",
              background: active ? "rgba(6,78,59,0.25)" : done ? "rgba(30,58,138,0.15)" : "#0a0a0a",
              color: active ? "#4ade80" : done ? "#60a5fa" : "#333",
            }}>
              {s.label}
            </span>
            {i < STAGES.length - 1 && (
              <span style={{ fontSize: 10, color: "#1e1e1e", margin: "0 3px" }}>→</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, onRetry }: { msg: ChatMessage; onRetry?: () => void }) {
  const isUser = msg.role === "user";
  const display = msg.content.replace(/\[SCOPE_READY\]/g, "").trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {!isUser && msg.provider && !msg.local && (
          <span style={{ fontSize: 10, color: "#2d6a4f", padding: "1px 7px", borderRadius: 20, border: "1px solid #064e3b", background: "rgba(6,78,59,0.12)" }}>
            {msg.provider === "claude" ? "Claude" : "OpenAI"} · {msg.model}
          </span>
        )}
        {!isUser && msg.local && (
          <span style={{ fontSize: 10, color: "#333", padding: "1px 7px", borderRadius: 20, border: "1px solid #1a1a1a", background: "#080808" }}>
            local
          </span>
        )}
        <span style={{ fontSize: 10, fontWeight: 700, color: isUser ? "#34d399" : "#555", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {isUser ? "You" : "Planner"}
        </span>
      </div>
      <div style={{
        maxWidth: "90%", padding: "12px 16px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
        border: isUser ? "1px solid #064e3b" : msg.error ? "1px solid #7f1d1d" : "1px solid #1a1a1a",
        background: isUser ? "rgba(6,78,59,0.12)" : msg.error ? "rgba(127,29,29,0.08)" : "#080808",
        color: msg.error ? "#f87171" : isUser ? "#d4d4d4" : "#b8b8b8",
        fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit",
      }}>
        {display}
      </div>
      {msg.error && onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: 6, fontSize: 11, color: "#ef4444", background: "none", border: "1px solid #7f1d1d", borderRadius: 8, padding: "3px 12px", cursor: "pointer" }}
        >
          Retry →
        </button>
      )}
    </div>
  );
}

// ── Missing info tags ─────────────────────────────────────────────────────────

function MissingInfoBar({ items, confidence }: { items: string[]; confidence: number }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#070707", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 4 }}>
        Still needed:
      </span>
      {items.map((item, i) => (
        <span key={i} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, border: "1px solid #1f1f1f", background: "#0a0a0a", color: "#555" }}>
          {item}
        </span>
      ))}
      <span style={{ marginLeft: "auto", fontSize: 10, color: "#2d2d2d" }}>
        {Math.round(confidence * 100)}% confident
      </span>
    </div>
  );
}

// ── Scope lock panel ──────────────────────────────────────────────────────────

const RISK_COLOR: Record<"LOW" | "MEDIUM" | "HIGH", string> = {
  LOW: "#4ade80", MEDIUM: "#fb923c", HIGH: "#f87171",
};

function ScopeLockCard({ scope, onApprove }: { scope: ScopeLock; onApprove: () => void }) {
  const row = (label: string, value: string) => (
    <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 13, color: "#b0b0b0", margin: 0, lineHeight: 1.5 }}>{value}</p>
    </div>
  );

  return (
    <div style={{ marginTop: 28, borderRadius: 12, border: "1px solid #064e3b", background: "rgba(6,78,59,0.06)", overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #064e3b", background: "rgba(6,78,59,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Scope Lock — {scope.projectName}
          </p>
          <p style={{ fontSize: 12, color: "#2d6a4f", margin: "3px 0 0" }}>
            Review carefully. This drives the final plan and task packets.
          </p>
        </div>
        <button
          onClick={onApprove}
          style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", border: "1px solid #4ade80", background: "rgba(6,78,59,0.4)", fontSize: 13, fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" }}
        >
          Approve & Generate Final Plan →
        </button>
      </div>

      <div style={{ padding: "16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {row("Project type", scope.projectType === "new" ? "New project" : "Existing project improvement")}
        {row("Platform", scope.platform)}
        {row("Target user", scope.targetUser)}
        {row("Problem", scope.problem)}
        {row("Core outcome (v1)", scope.coreOutcome)}
        {scope.existingRepo
          ? row("Repo", scope.existingRepo)
          : row("Flags", [scope.isLocalFirst ? "Local-first" : "", scope.isPublic ? "Public (Builder Hub)" : "Private"].filter(Boolean).join(" · ") || "Private · Cloud-optional")}

        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>v1 scope</p>
          {scope.v1Scope.map((item, i) => (
            <p key={i} style={{ fontSize: 13, color: "#4ade80", margin: "0 0 3px" }}>✓ {item}</p>
          ))}
        </div>

        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>out of scope (v1)</p>
          {scope.outOfScope.map((item, i) => (
            <p key={i} style={{ fontSize: 13, color: "#555", margin: "0 0 3px" }}>✕ {item}</p>
          ))}
        </div>

        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707", gridColumn: "span 2" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>constraints</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {scope.constraints.map((c, i) => (
              <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, border: "1px solid #1a1a1a", background: "#080808", color: "#666" }}>{c}</span>
            ))}
          </div>
        </div>

        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707", gridColumn: "span 2" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>risk level</p>
          <span style={{ fontSize: 15, fontWeight: 800, color: RISK_COLOR[scope.riskLevel] }}>{scope.riskLevel}</span>
          <span style={{ fontSize: 13, color: "#555", marginLeft: 10 }}>{scope.riskReason}</span>
        </div>
      </div>
    </div>
  );
}

// ── Loading dots ──────────────────────────────────────────────────────────────

function LoadingDots({ label = "Planner is thinking…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 10px" }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#2d6a4f", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: "#444", margin: 0 }}>{label}</p>
    </div>
  );
}

// ── Starter chips ─────────────────────────────────────────────────────────────

const STARTERS = [
  { label: "AI habit tracker",           idea: "I want to build an AI-powered habit tracker that logs my daily habits, shows streaks and completion rates, and gives me AI-generated suggestions for improvement. Local-first, no accounts." },
  { label: "Local-first note app",       idea: "I want a simple local-first note-taking app with markdown support that stores everything on my machine. No cloud sync, no accounts. Fast full-text search. Works offline always." },
  { label: "Roblox balancing dashboard", idea: "I want a dashboard for monitoring a Roblox game — showing player counts, economy metrics, and item usage from the Roblox Open Cloud API. I need to identify balance issues and see trends over time." },
  { label: "AI PDF research tool",       idea: "I want an AI-powered PDF research tool where I upload research papers, ask questions about the content, and get answers with specific page citations. Store extracted quotes for reference." },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlannerChatPage() {
  const [stage, setStage] = useState<Stage>("intake");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Planner is thinking…");
  const [readyForFinalPlan, setReadyForFinalPlan] = useState(false);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [scopeLock, setScopeLock] = useState<ScopeLock | null>(null);
  const [finalPlanText, setFinalPlanText] = useState<string | null>(null);
  const [localFallback, setLocalFallback] = useState(false);
  const [localIdx, setLocalIdx] = useState(0);
  const [initialIdea, setInitialIdea] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, scopeLock, finalPlanText]);

  // ── API helper ────────────────────────────────────────────────────────────

  async function callAPI(
    msgs: { role: "user" | "assistant"; content: string }[],
    mode: string,
    extra?: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch("/api/planner-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, mode, ...extra }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 503) {
        setLocalFallback(true);
        setLastError("No API keys found. Using local planner — add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local.");
        return null;
      }
      if (!res.ok) throw new Error((data.error as string) || "API error");
      return data;
    } catch (err) {
      setLocalFallback(true);
      setLastError(err instanceof Error ? err.message : "Connection failed.");
      return null;
    }
  }

  // ── Send message ──────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (messages.length === 0) setInitialIdea(text);
    setLastError(null);

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setLoadingLabel("Planner is thinking…");
    if (stage === "intake") setStage("clarifying");

    try {
      let displayContent = "";
      let provider: "openai" | "claude" | undefined;
      let model: string | undefined;
      let local = false;

      if (localFallback) {
        await new Promise((r) => setTimeout(r, 700));
        const raw = LOCAL_RESPONSES[Math.min(localIdx, LOCAL_RESPONSES.length - 1)];
        setLocalIdx((p) => Math.min(p + 1, LOCAL_RESPONSES.length - 1));
        displayContent = raw.replace(/\[SCOPE_READY\]/g, "").trim();
        if (raw.includes("[SCOPE_READY]")) {
          setReadyForFinalPlan(true);
          setMissingInfo([]);
          setConfidence(0.9);
        }
        local = true;
      } else {
        const result = await callAPI(
          next.map((m) => ({ role: m.role, content: m.content })),
          "brainstorm",
          { stage }
        );

        if (result) {
          provider = result.provider as "openai" | "claude" | undefined;
          model = result.model as string | undefined;

          if (typeof result.assistantMessage === "string") {
            // Structured response — use dedicated fields
            displayContent = result.assistantMessage;
            setReadyForFinalPlan(Boolean(result.readyForFinalPlan));
            setMissingInfo(Array.isArray(result.missingInfo) ? result.missingInfo as string[] : []);
            setConfidence(typeof result.confidence === "number" ? result.confidence as number : 0);
          } else if (typeof result.content === "string") {
            // Plain text fallback (JSON parse failed server-side)
            displayContent = (result.content as string).replace(/\[SCOPE_READY\]/g, "").trim();
            if ((result.content as string).includes("[SCOPE_READY]")) {
              setReadyForFinalPlan(true);
              setMissingInfo([]);
            }
          }
        } else {
          // callAPI returned null → switched to local fallback
          await new Promise((r) => setTimeout(r, 400));
          const raw = LOCAL_RESPONSES[Math.min(localIdx, LOCAL_RESPONSES.length - 1)];
          setLocalIdx((p) => Math.min(p + 1, LOCAL_RESPONSES.length - 1));
          displayContent = raw.replace(/\[SCOPE_READY\]/g, "").trim();
          if (raw.includes("[SCOPE_READY]")) {
            setReadyForFinalPlan(true);
            setMissingInfo([]);
            setConfidence(0.9);
          }
          local = true;
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: displayContent, provider, model, local },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}`, error: true }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, stage, loading, localFallback, localIdx]);

  // ── Retry last failed message ─────────────────────────────────────────────

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => prev.filter((m) => !m.error));
    setInput(lastUser.content);
  }, [messages]);

  // ── Lock scope ────────────────────────────────────────────────────────────

  const lockScope = useCallback(async () => {
    setLoading(true);
    setLoadingLabel("Extracting scope from conversation…");
    setStage("scope-lock");
    setLastError(null);

    try {
      if (!localFallback) {
        const result = await callAPI(
          messages.map((m) => ({ role: m.role, content: m.content })),
          "scope-extract"
        );
        if (result && typeof result.content === "string") {
          try {
            const cleaned = (result.content as string)
              .replace(/^```[a-z]*\n?/gm, "")
              .replace(/^```$/gm, "")
              .trim();
            const parsed = JSON.parse(cleaned) as ScopeLock;
            setScopeLock(parsed);
            return;
          } catch {
            // JSON parse failed — fall through to local extraction
          }
        }
      }
      setScopeLock(extractLocalScope(messages, initialIdea));
    } finally {
      setLoading(false);
    }
  }, [messages, localFallback, initialIdea]);

  // ── Generate final plan (SDLC + task packets in one shot) ─────────────────

  const generateFinalPlan = useCallback(async () => {
    if (!scopeLock) return;
    setStage("sdlc");
    setLoading(true);
    setLoadingLabel("Generating final plan and task packets…");
    setLastError(null);

    const projectContext = `Project: ${scopeLock.projectName}
Type: ${scopeLock.projectType === "new" ? "New project" : "Existing project improvement"}
Target user: ${scopeLock.targetUser}
Problem: ${scopeLock.problem}
Core outcome: ${scopeLock.coreOutcome}
Platform: ${scopeLock.platform}
Local-first: ${scopeLock.isLocalFirst ? "Yes" : "No"}
Public (Builder Hub): ${scopeLock.isPublic ? "Yes" : "No"}
${scopeLock.existingRepo ? `Existing repo: ${scopeLock.existingRepo}` : ""}

v1 Scope:
${scopeLock.v1Scope.map((f) => `- ${f}`).join("\n")}

Out of scope (v1):
${scopeLock.outOfScope.map((f) => `- ${f}`).join("\n")}

Constraints:
${scopeLock.constraints.map((c) => `- ${c}`).join("\n")}

Risk level: ${scopeLock.riskLevel} — ${scopeLock.riskReason}`;

    try {
      const result = await callAPI(
        [{ role: "user", content: projectContext }],
        "final-plan",
        { projectContext }
      );
      if (result && typeof result.content === "string") {
        setFinalPlanText(result.content as string);
      } else {
        setFinalPlanText(buildLocalFinalPlan(scopeLock));
      }
      setStage("done");
    } catch {
      setFinalPlanText(buildLocalFinalPlan(scopeLock));
      setStage("done");
    } finally {
      setLoading(false);
    }
  }, [scopeLock, localFallback]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStage("intake");
    setMessages([]);
    setInput("");
    setReadyForFinalPlan(false);
    setMissingInfo([]);
    setConfidence(0);
    setScopeLock(null);
    setFinalPlanText(null);
    setLocalIdx(0);
    setInitialIdea("");
    setLastError(null);
    textareaRef.current?.focus();
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const exchangeCount = Math.floor(messages.length / 2);
  const canLockScope = (readyForFinalPlan || exchangeCount >= 3) && !scopeLock;
  const inConversation = stage === "intake" || stage === "clarifying";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 24px 120px" }}>

        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Builder OS — Planning
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginTop: 10, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Planner Chat
        </h1>
        <p style={{ marginTop: 12, color: "#737373", fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
          You and the planner agree on what to build before any agent touches code.
          Planning saves ten debugging sessions.
        </p>

        {/* Stage bar */}
        <StageBar current={stage} />

        {/* API key / error notice */}
        {localFallback && (
          <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, border: "1px solid #292929", background: "#0a0a0a" }}>
            <p style={{ fontSize: 12, color: "#444", margin: 0 }}>
              ⚠ Local planner active — no API keys found.
              Add <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>OPENAI_API_KEY</code> or{" "}
              <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>ANTHROPIC_API_KEY</code> to{" "}
              <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>.env.local</code> and restart the dev server.
            </p>
          </div>
        )}
        {lastError && !localFallback && (
          <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.06)" }}>
            <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{lastError}</p>
          </div>
        )}

        {/* ── STARTERS (only before first message) ── */}
        {messages.length === 0 && (
          <div style={{ marginTop: 40 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Start with an idea or goal
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {STARTERS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setInput(s.idea); textareaRef.current?.focus(); }}
                  style={{
                    padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
                    border: input === s.idea ? "1px solid #064e3b" : "1px solid #2a2a2a",
                    background: input === s.idea ? "rgba(6,78,59,0.2)" : "#0a0a0a",
                    color: input === s.idea ? "#4ade80" : "#666",
                    transition: "all 0.1s",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #141414", background: "#070707" }}>
              <p style={{ fontSize: 12, color: "#333", margin: 0, lineHeight: 1.6 }}>
                The planner asks 2–4 focused questions at a time.
                Together you'll define: what to build → who for → v1 scope → constraints → risks.
                Only then does the final plan get written.
              </p>
            </div>
          </div>
        )}

        {/* ── CONVERSATION THREAD ── */}
        {messages.length > 0 && (
          <div style={{ marginTop: 36 }}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onRetry={msg.error ? retryLast : undefined}
              />
            ))}
            {loading && inConversation && <LoadingDots label={loadingLabel} />}
          </div>
        )}

        {/* ── MISSING INFO TAGS ── */}
        {inConversation && missingInfo.length > 0 && !loading && (
          <MissingInfoBar items={missingInfo} confidence={confidence} />
        )}

        {/* ── SCOPE READY BANNER ── */}
        {canLockScope && !loading && inConversation && (
          <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 10, border: "1px solid #064e3b", background: "rgba(6,78,59,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: "0 0 2px" }}>
                Ready to lock scope
              </p>
              <p style={{ fontSize: 12, color: "#2d6a4f", margin: 0 }}>
                {readyForFinalPlan
                  ? "The planner has enough context to generate a complete plan."
                  : `${exchangeCount} exchanges complete.`}{" "}
                Lock scope to proceed.
              </p>
            </div>
            <button
              onClick={lockScope}
              style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", border: "1px solid #4ade80", background: "rgba(6,78,59,0.35)", fontSize: 13, fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" }}
            >
              Lock Scope →
            </button>
          </div>
        )}

        {/* ── SCOPE LOCK LOADING ── */}
        {loading && stage === "scope-lock" && !scopeLock && (
          <div style={{ marginTop: 20 }}>
            <LoadingDots label={loadingLabel} />
          </div>
        )}

        {/* ── SCOPE LOCK CARD ── */}
        {scopeLock && stage === "scope-lock" && (
          <ScopeLockCard scope={scopeLock} onApprove={generateFinalPlan} />
        )}

        {/* ── FINAL PLAN LOADING ── */}
        {loading && stage === "sdlc" && !finalPlanText && (
          <div style={{ marginTop: 20 }}>
            <LoadingDots label={loadingLabel} />
          </div>
        )}

        {/* ── SCOPE LOCKED (compact banner for post-lock stages) ── */}
        {scopeLock && stage !== "scope-lock" && stage !== "intake" && stage !== "clarifying" && (
          <div style={{ marginTop: 28, padding: "10px 14px", borderRadius: 8, border: "1px solid #064e3b", background: "rgba(6,78,59,0.06)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>Scope locked</p>
            <p style={{ fontSize: 12, color: "#555", margin: 0, flex: 1 }}>
              {scopeLock.projectName} · {scopeLock.platform} · {scopeLock.v1Scope.length} v1 features · Risk: {scopeLock.riskLevel}
            </p>
          </div>
        )}

        {/* ── FINAL PLAN ── */}
        {finalPlanText && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Final Plan</p>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, border: "1px solid #1e3a8a", background: "rgba(30,58,138,0.15)", color: "#60a5fa" }}>
                SDLC + Task Packets
              </span>
            </div>
            <pre style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid #1a1a1a", background: "#060606", fontSize: 12.5, color: "#999", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
              {finalPlanText}
            </pre>
            <div style={{ marginTop: 10 }}>
              <CopyPrompt text={finalPlanText} description="Copy final plan — paste into a task packet or Claude Code." />
            </div>
          </div>
        )}

        {/* ── DONE BANNER ── */}
        {stage === "done" && finalPlanText && (
          <div style={{ marginTop: 24, padding: "14px 18px", borderRadius: 10, border: "1px solid #064e3b", background: "rgba(6,78,59,0.1)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: "0 0 3px" }}>
              ✓ Planning complete
            </p>
            <p style={{ fontSize: 12, color: "#2d6a4f", margin: 0 }}>
              Scope locked · Final plan generated · Task packets ready. Copy a packet and run it in Execute (sandbox mode).
            </p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <a href="/execute" style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #4c1d95", background: "rgba(76,29,149,0.2)", fontSize: 13, fontWeight: 700, color: "#a78bfa", textDecoration: "none" }}>
                Execute in Sandbox →
              </a>
              <a href="/task-packets" style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", fontSize: 13, color: "#555", textDecoration: "none" }}>
                Task Packets →
              </a>
            </div>
          </div>
        )}

        {/* ── INPUT (conversation stages only) ── */}
        {inConversation && (
          <div style={{ marginTop: 32 }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
              placeholder={messages.length === 0 ? "Describe your idea or goal in plain language. Messy is fine." : "Reply to the planner…"}
              rows={messages.length === 0 ? 5 : 3}
              disabled={loading}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 10, resize: "vertical",
                border: "1px solid #2a2a2a", background: loading ? "#070707" : "#090909",
                color: "#d4d4d4", fontSize: 14, lineHeight: 1.7, fontFamily: "inherit",
                outline: "none", boxSizing: "border-box", opacity: loading ? 0.5 : 1,
              }}
            />
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  padding: "10px 22px", borderRadius: 10,
                  cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                  border: "1px solid #064e3b",
                  background: !input.trim() || loading ? "#0a0a0a" : "rgba(6,78,59,0.3)",
                  fontSize: 13, fontWeight: 700,
                  color: !input.trim() || loading ? "#2d2d2d" : "#4ade80",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Thinking…" : "Send →"}
              </button>
              {canLockScope && !loading && (
                <button
                  onClick={lockScope}
                  style={{ padding: "10px 18px", borderRadius: 10, cursor: "pointer", border: "1px solid #064e3b", background: "rgba(6,78,59,0.15)", fontSize: 13, fontWeight: 600, color: "#4ade80" }}
                >
                  Lock Scope →
                </button>
              )}
              <span style={{ fontSize: 11, color: "#2a2a2a", marginLeft: "auto" }}>{input.length} chars — Ctrl+Enter</span>
            </div>
          </div>
        )}

        {/* ── RESET ── */}
        {(messages.length > 0 || scopeLock) && (
          <div style={{ marginTop: 28 }}>
            <button
              onClick={reset}
              style={{ fontSize: 12, color: "#444", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ← Start a new conversation
            </button>
          </div>
        )}

        <div ref={bottomRef} />

        {/* Footer */}
        <div style={{ marginTop: 48, borderTop: "1px solid #141414", paddingTop: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { href: "/task-packets",   label: "Task Packets" },
            { href: "/execute",        label: "Execute (Sandbox)" },
            { href: "/sandbox-review", label: "Patch Review" },
            { href: "/sessions",       label: "Sessions" },
          ].map((l) => (
            <a key={l.href} href={l.href} style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", color: "#555", textDecoration: "none" }}>
              {l.label} →
            </a>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1); }
        }
      `}</style>
    </main>
  );
}
