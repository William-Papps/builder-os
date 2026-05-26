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

interface ParsedRequirement {
  id: string;
  text: string;
}

interface ParsedRisk {
  level: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  mitigation: string;
}

interface ParsedPhase {
  name: string;
  goal: string;
  tasks: string[];
}

interface ParsedTaskPacket {
  id: string;
  goal: string;
  agent: string;
  approvalLevel: string;
  scope: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  expectedOutput: string;
  rollback: string;
  executionPrompt: string;
}

interface ParsedFinalPlan {
  problemStatement: string;
  goals: string[];
  targetUsers: string;
  functionalRequirements: ParsedRequirement[];
  nonFunctionalRequirements: ParsedRequirement[];
  constraints: string[];
  assumptions: string[];
  risks: ParsedRisk[];
  architectureDirection: string;
  phases: ParsedPhase[];
  taskPackets: ParsedTaskPacket[];
  executionPrompt: string;
  raw: string;
}

type PacketStatus = "draft" | "needs-review" | "approved" | "sandbox-created";

type SandboxReviewStatus = "sandbox-ready" | "claude-running" | "awaiting-review" | "review-complete";

interface ParsedSandboxSummary {
  filesChanged: string[];
  architectureDecisions: string[];
  buildResult: "PASS" | "FAIL" | "unknown";
  errors: string[];
  risks: string[];
  nextTask: string;
  raw: string;
}

// ── Plan parser ───────────────────────────────────────────────────────────────

function extractSection(raw: string, name: string): string {
  const re = new RegExp(`^## ${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`, "im");
  const m = raw.match(re);
  return m ? m[1].trim() : "";
}

function parseList(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => /^[-*•]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim()))
    .map((l) => l.replace(/^[-*•]|\d+\.\s/, "").replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function parseRequirements(text: string, prefix: string): ParsedRequirement[] {
  return text
    .split("\n")
    .filter((l) => new RegExp(`^${prefix}-\\d+:`).test(l.trim()))
    .map((l) => {
      const m = l.match(new RegExp(`^(${prefix}-\\d+):\\s*(.+)`));
      return m ? { id: m[1].trim(), text: m[2].trim() } : null;
    })
    .filter((x): x is ParsedRequirement => x !== null);
}

function parseRisks(text: string): ParsedRisk[] {
  const risks: ParsedRisk[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^(HIGH|MEDIUM|LOW)[:\s]\s*(.+)/i);
    if (m) {
      const rest = m[2];
      const mitIdx = rest.toLowerCase().indexOf("mitigation:");
      const slashIdx = rest.lastIndexOf("/");
      const splitAt = mitIdx >= 0 ? (slashIdx > 0 ? slashIdx : mitIdx) : -1;
      risks.push({
        level: m[1].toUpperCase() as "HIGH" | "MEDIUM" | "LOW",
        description: splitAt >= 0 ? rest.slice(0, splitAt).trim() : rest.trim(),
        mitigation: mitIdx >= 0 ? rest.slice(mitIdx + "mitigation:".length).trim() : "",
      });
    }
  }
  return risks;
}

function parsePhases(text: string): ParsedPhase[] {
  const phases: ParsedPhase[] = [];
  const blocks = text.split(/^### /m).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split("\n");
    const name = lines[0]?.trim() ?? "";
    const goalLine = lines.find((l) => /^goal:/i.test(l.trim()));
    const goal = goalLine ? goalLine.replace(/^goal:\s*/i, "").trim() : "";
    const tasks = lines
      .filter((l) => /^[-•]\s/.test(l.trim()))
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
    if (name) phases.push({ name, goal, tasks });
  }
  return phases;
}

function parseTaskPackets(text: string): ParsedTaskPacket[] {
  const packets: ParsedTaskPacket[] = [];
  const blocks = text.split(/═+/).filter((s) => /PACKET ID:/i.test(s));

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());

    const getField = (prefix: string): string => {
      const l = lines.find((l) => l.toUpperCase().startsWith(prefix.toUpperCase() + ":"));
      return l ? l.slice(prefix.length + 1).trim() : "";
    };

    const getBlock = (startMark: string, endMarks: string[]): string[] => {
      const si = lines.findIndex((l) => l.toUpperCase().includes(startMark.toUpperCase()));
      if (si < 0) return [];
      let ei = lines.length;
      for (const end of endMarks) {
        const idx = lines.findIndex((l, i) => i > si && l.toUpperCase().includes(end.toUpperCase()));
        if (idx > 0 && idx < ei) ei = idx;
      }
      return lines
        .slice(si + 1, ei)
        .filter((l) => /^[-•]/.test(l))
        .map((l) => l.slice(1).trim())
        .filter(Boolean);
    };

    const id = getField("PACKET ID");
    const goal = getField("GOAL");
    const agent = getField("AGENT");
    const approvalLevel = getField("APPROVAL LEVEL");
    const scope = getBlock("SCOPE", ["ALLOWED", "FORBIDDEN", "EXPECTED"]);
    const allowedActions = getBlock("ALLOWED ACTIONS", ["FORBIDDEN", "EXPECTED"]);
    const forbiddenActions = getBlock("FORBIDDEN ACTIONS", ["EXPECTED", "ROLLBACK"]);

    const expectedIdx = lines.findIndex((l) => /EXPECTED OUTPUT/i.test(l));
    const rollbackIdx = lines.findIndex((l) => /^ROLLBACK/i.test(l));
    const expectedOutput =
      expectedIdx >= 0
        ? lines.slice(expectedIdx + 1, rollbackIdx > 0 ? rollbackIdx : undefined).filter(Boolean).join("\n")
        : "";
    const rollback =
      rollbackIdx >= 0
        ? lines
            .slice(rollbackIdx)
            .map((l) => l.replace(/^ROLLBACK:\s*/i, ""))
            .join(" ")
            .trim()
        : "";

    if (!id && !goal) continue;

    const executionPrompt = [
      `You are executing task packet ${id || "UNNAMED"} inside Builder OS. Stay within the defined scope — no additions.`,
      ``,
      `GOAL: ${goal}`,
      agent ? `AGENT: ${agent}` : "",
      approvalLevel ? `APPROVAL LEVEL: ${approvalLevel}` : "",
      scope.length > 0 ? `\nSCOPE (touch ONLY these files):\n${scope.map((s) => `- ${s}`).join("\n")}` : "",
      allowedActions.length > 0 ? `\nALLOWED ACTIONS:\n${allowedActions.map((a) => `- ${a}`).join("\n")}` : "",
      forbiddenActions.length > 0 ? `\nFORBIDDEN ACTIONS:\n${forbiddenActions.map((f) => `- ${f}`).join("\n")}` : "",
      `\nWhen complete, output exactly:\nChanged files: [list]\nBuild result: PASS / FAIL\nReady for human review: YES / NO`,
      rollback ? `\nROLLBACK: ${rollback}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    packets.push({ id, goal, agent, approvalLevel, scope, allowedActions, forbiddenActions, expectedOutput, rollback, executionPrompt });
  }
  return packets;
}

function parseFinalPlan(raw: string): ParsedFinalPlan | null {
  if (!raw || raw.length < 80) return null;
  try {
    return {
      problemStatement: extractSection(raw, "Problem Statement"),
      goals: parseList(extractSection(raw, "Goals")),
      targetUsers: extractSection(raw, "Target Users"),
      functionalRequirements: parseRequirements(extractSection(raw, "Functional Requirements"), "FR"),
      nonFunctionalRequirements: parseRequirements(extractSection(raw, "Non-Functional Requirements"), "NFR"),
      constraints: parseList(extractSection(raw, "Constraints")),
      assumptions: parseList(extractSection(raw, "Assumptions")),
      risks: parseRisks(extractSection(raw, "Risks")),
      architectureDirection: extractSection(raw, "Architecture Direction"),
      phases: parsePhases(extractSection(raw, "Implementation Phases")),
      taskPackets: parseTaskPackets(extractSection(raw, "Task Packets")),
      executionPrompt: extractSection(raw, "Execution Prompt"),
      raw,
    };
  } catch {
    return null;
  }
}

// ── Sandbox summary parser ────────────────────────────────────────────────────

function parseSandboxSummary(text: string): ParsedSandboxSummary | null {
  if (!text.trim()) return null;
  const upper = text.toUpperCase();
  const hasAny = upper.includes("FILES CHANGED") || upper.includes("BUILD RESULT") || upper.includes("RISKS") || upper.includes("NEXT TASK") || upper.includes("NEXT RECOMMENDED");
  if (!hasAny) return null;

  const extractLines = (re: RegExp): string[] => {
    const m = text.match(re);
    if (!m) return [];
    return m[1].split("\n").map((l) => l.replace(/^[-•*\d.]+\s*/, "").trim()).filter(Boolean);
  };
  const extractText = (re: RegExp): string => {
    const m = text.match(re);
    return m ? m[1].replace(/^[-•*\s]+/, "").trim() : "";
  };

  const filesChanged = extractLines(/FILES CHANGED[:\s]*\n([\s\S]*?)(?=\n##|\nARCHITECTURE|\nBUILD|\nERRORS|\nRISKS|\nNEXT|$)/i);
  const architectureDecisions = extractLines(/ARCHITECTURE DECISIONS?[:\s]*\n([\s\S]*?)(?=\n##|\nFILES|\nBUILD|\nERRORS|\nRISKS|\nNEXT|$)/i);
  const buildLine = extractText(/BUILD RESULT[:\s]*([\s\S]*?)(?=\n##|\nFILES|\nARCH|\nERRORS|\nRISKS|\nNEXT|$)/i);
  const buildResult: "PASS" | "FAIL" | "unknown" = /\bPASS\b/i.test(buildLine) ? "PASS" : /\bFAIL\b/i.test(buildLine) ? "FAIL" : "unknown";
  const errors = extractLines(/ERRORS?[:\s]*\n([\s\S]*?)(?=\n##|\nFILES|\nBUILD|\nARCH|\nRISKS|\nNEXT|$)/i);
  const risks = extractLines(/RISKS?[:\s]*\n([\s\S]*?)(?=\n##|\nFILES|\nBUILD|\nARCH|\nERRORS|\nNEXT|$)/i);
  const nextTask = extractText(/NEXT(?:\s+RECOMMENDED)?\s+TASK[:\s]*([\s\S]*?)(?=\n##|\nFILES|\nBUILD|\nARCH|\nERRORS|\nRISKS|$)/i);

  return { filesChanged, architectureDecisions, buildResult, errors, risks, nextTask, raw: text };
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

// ── Keyword detection ─────────────────────────────────────────────────────────

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

// ── Local scope extraction ────────────────────────────────────────────────────

function extractLocalScope(messages: ChatMessage[], idea: string): ScopeLock {
  const allText = [idea, ...messages.map((m) => m.content)].join(" ").toLowerCase();
  const d = detectKeywords(allText);
  const name = idea.trim().split(/\s+/).slice(0, 6).join(" ");
  return {
    projectType: d.isExist && !d.isNew ? "existing" : "new",
    projectName: name,
    targetUser: /just me|only me|solo|myself|just you/.test(allText) ? "Solo developer (just you)" : "Solo developer (primary)",
    problem: d.isHabit ? "No simple local habit tracker — existing apps require subscriptions."
      : d.isNotes ? "Note apps sync to cloud or require accounts."
      : d.isDash ? "Metrics are scattered across tools."
      : "The target workflow is currently manual or fragmented.",
    coreOutcome: d.isHabit ? "User can create habits, log completions, and view streaks locally."
      : d.isNotes ? "User can create, edit, and search notes stored as local Markdown files."
      : d.isDash ? "Dashboard shows key metrics from the configured data source."
      : "Working v1 that covers the core feature end-to-end.",
    v1Scope: [
      d.isHabit ? "Create and name daily habits" : d.isNotes ? "Create, edit, and delete notes" : "Core feature works end-to-end",
      d.isHabit ? "Log daily completions and view streaks" : d.isNotes ? "Full-text search across all notes" : "Data persists across page refreshes",
      d.isLocal || d.isNotes || d.isHabit ? "Local storage — data survives refresh with no account" : "Basic UI without unnecessary polish",
    ],
    outOfScope: [d.isAI ? "AI features → Phase 2" : "AI integration → Phase 2", "Cloud sync → Phase 3", "Multi-user / sharing → Phase 3"],
    platform: d.isDash ? "Web app (dashboard)" : d.isLocal ? "Local app (Next.js)" : "Web app (Next.js)",
    isPublic: d.isPublic,
    isLocalFirst: d.isLocal || d.isHabit || d.isNotes,
    existingRepo: d.isExist ? "Identified in conversation above" : null,
    constraints: ["TypeScript strict mode — zero type errors", "No auth in v1", "No database in v1", "npm run build must pass before any commit"],
    riskLevel: "MEDIUM",
    riskReason: "Scope creep before v1 ships is the primary risk.",
  };
}

// ── Local plan generation ─────────────────────────────────────────────────────

function buildLocalFinalPlan(scope: ScopeLock): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const slug = scope.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 18);
  return `## Problem Statement
${scope.problem} ${scope.targetUser} currently lacks a focused tool for this. The v1 goal: ${scope.coreOutcome}

## Goals
1. Ship a working v1 that delivers: ${scope.coreOutcome}
2. Keep scope locked — no additions without an approved task packet
3. Pass npm run build with zero TypeScript errors before any commit
4. Verify the full user flow manually before calling v1 done

## Target Users
${scope.targetUser}. ${scope.isLocalFirst ? "Privacy-first — no cloud dependency required." : "Comfortable with web apps."}

## Functional Requirements
FR-01: ${scope.v1Scope[0]}
FR-02: ${scope.v1Scope[1]}
FR-03: ${scope.v1Scope[2]}
FR-04: User completes the primary action in under 3 steps
FR-05: Error states are handled with clear, actionable messages

## Non-Functional Requirements
NFR-01: Cold start time under 3 seconds
NFR-02: Zero TypeScript errors — npm run build passes clean
NFR-03: No user data sent to external services without explicit action
NFR-04: All local UI interactions respond in under 200ms

## Constraints
- TypeScript strict mode — zero type errors
- No auth in v1
- No database in v1 (localStorage or flat files only)
- npm run build must pass before any commit

## Assumptions
- Solo developer is the primary user in v1
- No auth, billing, or multi-user in v1
- Manual git commit and push — no automatic deployment

## Risks
HIGH: Scope creep before v1 ships / Mitigation: This plan is locked. Any addition requires a new task packet.
MEDIUM: Build passes but feature feels incomplete / Mitigation: Test the full flow manually before calling v1 done.
MEDIUM: SSR/CSR mismatch in production build / Mitigation: Run npm run build after every change.

## Architecture Direction
Tech: Next.js 16.2.6, TypeScript strict, Tailwind CSS v4, React 19
Data: ${scope.isLocalFirst ? "localStorage — no database in v1" : "TypeScript data files (data/*.ts)"}
Auth: None in v1

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
Goal: Usability improvements
Tasks:
- Add error and empty state handling for all views
- Export functionality (CSV or JSON)
- Keyboard shortcuts for common actions

### Phase 3 — Extend
Goal: ${scope.outOfScope[0] ?? "First deferred feature"}
Tasks:
- Evaluate what Phase 1 users actually need
- Implement one deferred feature if validated

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
- app/page.tsx

ALLOWED ACTIONS:
- Create project files and directory structure
- Install exact packages listed in this packet
- npm run build to verify

FORBIDDEN ACTIONS:
- Do NOT push to GitHub
- Do NOT add auth or external APIs not listed here
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
- data/(feature).ts

ALLOWED ACTIONS:
- Create new pages and components within defined scope
- Create or update data/ files
- npm run build and npm run dev
- Use localStorage for v1 persistence

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
            {i < STAGES.length - 1 && <span style={{ fontSize: 10, color: "#1e1e1e", margin: "0 3px" }}>→</span>}
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
          <span style={{ fontSize: 10, color: "#333", padding: "1px 7px", borderRadius: 20, border: "1px solid #1a1a1a", background: "#080808" }}>local</span>
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
        <button onClick={onRetry} style={{ marginTop: 6, fontSize: 11, color: "#ef4444", background: "none", border: "1px solid #7f1d1d", borderRadius: 8, padding: "3px 12px", cursor: "pointer" }}>
          Retry →
        </button>
      )}
    </div>
  );
}

// ── Missing info bar ──────────────────────────────────────────────────────────

function MissingInfoBar({ items, confidence }: { items: string[]; confidence: number }) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#070707", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 4 }}>Still needed:</span>
      {items.map((item, i) => (
        <span key={i} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, border: "1px solid #1f1f1f", background: "#0a0a0a", color: "#555" }}>{item}</span>
      ))}
      <span style={{ marginLeft: "auto", fontSize: 10, color: "#2d2d2d" }}>{Math.round(confidence * 100)}% confident</span>
    </div>
  );
}

// ── Scope lock panel ──────────────────────────────────────────────────────────

const RISK_COLOR: Record<"LOW" | "MEDIUM" | "HIGH", string> = { LOW: "#4ade80", MEDIUM: "#fb923c", HIGH: "#f87171" };

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
          <p style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Scope Lock — {scope.projectName}</p>
          <p style={{ fontSize: 12, color: "#2d6a4f", margin: "3px 0 0" }}>Review carefully. This drives the final plan and task packets.</p>
        </div>
        <button onClick={onApprove} style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", border: "1px solid #4ade80", background: "rgba(6,78,59,0.4)", fontSize: 13, fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" }}>
          Approve & Generate Final Plan →
        </button>
      </div>
      <div style={{ padding: "16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {row("Project type", scope.projectType === "new" ? "New project" : "Existing project improvement")}
        {row("Platform", scope.platform)}
        {row("Target user", scope.targetUser)}
        {row("Problem", scope.problem)}
        {row("Core outcome (v1)", scope.coreOutcome)}
        {scope.existingRepo ? row("Repo", scope.existingRepo) : row("Flags", [scope.isLocalFirst ? "Local-first" : "", scope.isPublic ? "Public (Builder Hub)" : "Private"].filter(Boolean).join(" · ") || "Private")}
        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>v1 scope</p>
          {scope.v1Scope.map((item, i) => <p key={i} style={{ fontSize: 13, color: "#4ade80", margin: "0 0 3px" }}>✓ {item}</p>)}
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>out of scope (v1)</p>
          {scope.outOfScope.map((item, i) => <p key={i} style={{ fontSize: 13, color: "#555", margin: "0 0 3px" }}>✕ {item}</p>)}
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707", gridColumn: "span 2" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>constraints</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {scope.constraints.map((c, i) => <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, border: "1px solid #1a1a1a", background: "#080808", color: "#666" }}>{c}</span>)}
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

// ── Plan section wrapper ──────────────────────────────────────────────────────

function PlanSec({ title, color = "#555", children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <p style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>{title}</p>
      {children}
    </div>
  );
}

// ── Requirement list ──────────────────────────────────────────────────────────

function RequirementList({ items, color }: { items: ParsedRequirement[]; color: string }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((r) => (
        <div key={r.id} style={{ display: "flex", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid #111", background: "#070707", alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: "nowrap", padding: "1px 8px", borderRadius: 12, border: `1px solid ${color}33`, background: `${color}11`, fontFamily: "monospace" }}>
            {r.id}
          </span>
          <span style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{r.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Risk list ─────────────────────────────────────────────────────────────────

const RISK_BADGE: Record<"HIGH" | "MEDIUM" | "LOW", string> = { HIGH: "#f87171", MEDIUM: "#fb923c", LOW: "#4ade80" };

function RiskList({ risks }: { risks: ParsedRisk[] }) {
  if (!risks.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {risks.map((r, i) => (
        <div key={i} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#070707" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: r.mitigation ? 5 : 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: RISK_BADGE[r.level] ?? "#888", whiteSpace: "nowrap" }}>{r.level}</span>
            <span style={{ fontSize: 13, color: "#777" }}>{r.description}</span>
          </div>
          {r.mitigation && <p style={{ fontSize: 12, color: "#444", margin: 0 }}>→ {r.mitigation}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Phase list ────────────────────────────────────────────────────────────────

function PhaseList({ phases }: { phases: ParsedPhase[] }) {
  if (!phases.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {phases.map((ph, i) => (
        <div key={i} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #111", background: "#070707" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", margin: "0 0 4px" }}>{ph.name}</p>
          {ph.goal && <p style={{ fontSize: 12, color: "#555", margin: "0 0 8px" }}>{ph.goal}</p>}
          {ph.tasks.map((t, j) => <p key={j} style={{ fontSize: 13, color: "#666", margin: "0 0 3px" }}>· {t}</p>)}
        </div>
      ))}
    </div>
  );
}

// ── Task packet card (with approval flow) ────────────────────────────────────

const STATUS_LABEL: Record<PacketStatus, string> = {
  "draft": "Draft",
  "needs-review": "Needs Review",
  "approved": "Approved — Ready for Execution",
  "sandbox-created": "Sandbox Created — Ready for Claude",
};

const STATUS_COLOR: Record<PacketStatus, string> = {
  "draft": "#333",
  "needs-review": "#fb923c",
  "approved": "#4ade80",
  "sandbox-created": "#c084fc",
};

interface SandboxInfo {
  path: string;
  copiedCount?: number;
  error?: string;
}

const REVIEW_STATUS_LABELS: Record<SandboxReviewStatus, string> = {
  "sandbox-ready": "Sandbox Ready",
  "claude-running": "Claude Running",
  "awaiting-review": "Awaiting Review",
  "review-complete": "Review Complete",
};

const REVIEW_STATUS_ORDER: SandboxReviewStatus[] = ["sandbox-ready", "claude-running", "awaiting-review", "review-complete"];

const REVIEW_STATUS_COLOR: Record<SandboxReviewStatus, string> = {
  "sandbox-ready": "#60a5fa",
  "claude-running": "#fb923c",
  "awaiting-review": "#fbbf24",
  "review-complete": "#4ade80",
};

function TaskPacketCard({
  packet, idx, status, projectName,
  onReview, onApprove, onRevoke,
  sandboxInfo, sandboxLoading, repoPath, onRepoPathChange,
  onCreateSandbox, onDeleteSandbox,
  reviewStatus, onReviewStatus,
  summaryInput, onSummaryInputChange, onSummarySubmit, parsedSummary,
}: {
  packet: ParsedTaskPacket;
  idx: number;
  status: PacketStatus;
  projectName: string;
  onReview: () => void;
  onApprove: () => void;
  onRevoke: () => void;
  sandboxInfo?: SandboxInfo;
  sandboxLoading?: boolean;
  repoPath: string;
  onRepoPathChange: (v: string) => void;
  onCreateSandbox: () => void;
  onDeleteSandbox: () => void;
  reviewStatus: SandboxReviewStatus;
  onReviewStatus: (s: SandboxReviewStatus) => void;
  summaryInput: string;
  onSummaryInputChange: (v: string) => void;
  onSummarySubmit: () => void;
  parsedSummary?: ParsedSandboxSummary;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(packet.executionPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const pid = packet.id || `PKT-${idx + 1}`;
  const sColor = STATUS_COLOR[status];

  // ── DRAFT ─────────────────────────────────────────────────────────────────
  if (status === "draft") {
    return (
      <div style={{ borderRadius: 10, border: "1px solid #1a1a1a", background: "#070707", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", fontFamily: "monospace" }}>{pid}</span>
          {packet.agent && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 12, border: "1px solid #222", color: "#444" }}>{packet.agent}</span>}
          <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 12, border: `1px solid ${sColor}44`, color: sColor }}>
            {STATUS_LABEL[status]}
          </span>
          <button onClick={onReview} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 8, cursor: "pointer", border: "1px solid #fb923c44", background: "rgba(251,146,60,0.08)", fontSize: 12, fontWeight: 700, color: "#fb923c" }}>
            Review Packet →
          </button>
        </div>
        <div style={{ padding: "8px 14px 12px", borderTop: "1px solid #0d0d0d" }}>
          <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>{packet.goal}</p>
        </div>
      </div>
    );
  }

  // ── NEEDS REVIEW ──────────────────────────────────────────────────────────
  if (status === "needs-review") {
    return (
      <div style={{ borderRadius: 10, border: "1px solid #fb923c55", background: "#070707", overflow: "hidden", marginBottom: 12 }}>
        {/* Header */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #111", background: "rgba(251,146,60,0.05)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", fontFamily: "monospace" }}>{pid}</span>
          {packet.agent && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 12, border: "1px solid #222", color: "#444" }}>{packet.agent}</span>}
          <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 12, border: "1px solid #fb923c44", color: "#fb923c" }}>{STATUS_LABEL["needs-review"]}</span>
          {packet.approvalLevel && <span style={{ marginLeft: "auto", fontSize: 11, color: "#555" }}>{packet.approvalLevel}</span>}
        </div>

        {/* Goal */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Goal</p>
          <p style={{ fontSize: 13, color: "#c0c0c0", margin: 0, lineHeight: 1.5 }}>{packet.goal}</p>
        </div>

        {/* Scope + Allowed */}
        {(packet.scope.length > 0 || packet.allowedActions.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #0d0d0d" }}>
            {packet.scope.length > 0 && (
              <div style={{ padding: "10px 14px", borderRight: "1px solid #0d0d0d" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Scope</p>
                {packet.scope.map((f, i) => <p key={i} style={{ fontSize: 12, color: "#555", margin: "0 0 2px", fontFamily: "monospace" }}>{f}</p>)}
              </div>
            )}
            {packet.allowedActions.length > 0 && (
              <div style={{ padding: "10px 14px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Allowed</p>
                {packet.allowedActions.map((a, i) => <p key={i} style={{ fontSize: 12, color: "#4ade80", margin: "0 0 2px" }}>✓ {a}</p>)}
              </div>
            )}
          </div>
        )}

        {/* Forbidden */}
        {packet.forbiddenActions.length > 0 && (
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #0d0d0d" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Forbidden</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {packet.forbiddenActions.map((f, i) => (
                <span key={i} style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, border: "1px solid #1a1a1a", background: "#080808", color: "#444" }}>✕ {f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Expected + Rollback */}
        {(packet.expectedOutput || packet.rollback) && (
          <div style={{ display: "grid", gridTemplateColumns: packet.rollback ? "1fr 1fr" : "1fr", borderBottom: "1px solid #0d0d0d" }}>
            {packet.expectedOutput && (
              <div style={{ padding: "10px 14px", borderRight: packet.rollback ? "1px solid #0d0d0d" : "none" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Expected Output</p>
                <p style={{ fontSize: 12, color: "#555", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{packet.expectedOutput}</p>
              </div>
            )}
            {packet.rollback && (
              <div style={{ padding: "10px 14px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Rollback</p>
                <code style={{ fontSize: 12, color: "#555", fontFamily: "monospace" }}>{packet.rollback}</code>
              </div>
            )}
          </div>
        )}

        {/* Action row */}
        <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onApprove}
            style={{ padding: "9px 20px", borderRadius: 10, cursor: "pointer", border: "1px solid #4ade80", background: "rgba(6,78,59,0.3)", fontSize: 13, fontWeight: 700, color: "#4ade80" }}>
            Approve Packet ✓
          </button>
          <button onClick={onRevoke}
            style={{ padding: "9px 14px", borderRadius: 10, cursor: "pointer", border: "1px solid #1a1a1a", background: "none", fontSize: 12, color: "#444" }}>
            ← Back to Draft
          </button>
          <span style={{ fontSize: 11, color: "#2a2a2a", marginLeft: "auto" }}>Review all fields before approving</span>
        </div>
      </div>
    );
  }

  // ── SANDBOX CREATED — READY FOR CLAUDE ───────────────────────────────────
  if (status === "sandbox-created" && sandboxInfo) {
    const cdCmd = `cd "${sandboxInfo.path}"`;
    const rColor = REVIEW_STATUS_COLOR[reviewStatus];
    const HELPER_CMDS = [
      { label: "npm run dev", key: "dev" },
      { label: "npm run build", key: "build" },
      { label: "git status", key: "gstatus" },
      { label: "git diff --stat", key: "gdiff" },
    ];
    return (
      <div style={{ borderRadius: 10, border: "1px solid #4c1d95", background: "rgba(76,29,149,0.04)", overflow: "hidden", marginBottom: 12 }}>

        {/* Header */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #4c1d95", background: "rgba(76,29,149,0.1)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", fontFamily: "monospace" }}>{pid}</span>
          <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 12, border: "1px solid #4c1d9544", background: "rgba(76,29,149,0.15)", color: "#c084fc", fontWeight: 700 }}>
            ✓ {STATUS_LABEL["sandbox-created"]}
          </span>
          {sandboxInfo.copiedCount !== undefined && (
            <span style={{ fontSize: 11, color: "#555" }}>{sandboxInfo.copiedCount} files</span>
          )}
          <button onClick={onRevoke} style={{ marginLeft: "auto", fontSize: 11, color: "#333", background: "none", border: "none", cursor: "pointer" }}>← Back to Draft</button>
        </div>

        {/* Safety reminder */}
        <div style={{ padding: "9px 14px", borderBottom: "1px solid #0d0d0d", background: "rgba(76,29,149,0.06)", borderLeft: "3px solid #6d28d9" }}>
          <p style={{ fontSize: 12, color: "#a78bfa", margin: 0, lineHeight: 1.5 }}>
            Sandbox execution is <strong>disposable</strong> until manually applied to the real repo. Your real files are untouched.
          </p>
        </div>

        {/* Review status track */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #0d0d0d", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 4 }}>Status:</span>
          {REVIEW_STATUS_ORDER.map((s, i) => {
            const sc = REVIEW_STATUS_COLOR[s];
            const isActive = s === reviewStatus;
            return (
              <span key={s} style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => onReviewStatus(s)} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, cursor: "pointer", border: isActive ? `1px solid ${sc}` : "1px solid #1a1a1a", background: isActive ? `${sc}22` : "#090909", color: isActive ? sc : "#333", fontWeight: isActive ? 700 : 400 }}>
                  {REVIEW_STATUS_LABELS[s]}
                </button>
                {i < REVIEW_STATUS_ORDER.length - 1 && <span style={{ fontSize: 10, color: "#1e1e1e", margin: "0 2px" }}>→</span>}
              </span>
            );
          })}
        </div>

        {/* Open sandbox in Claude Code */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>Open Sandbox in Claude Code</p>

          {/* Sandbox path */}
          <p style={{ fontSize: 10, fontWeight: 600, color: "#444", margin: "0 0 4px" }}>Sandbox Path</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#040404", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
            <code style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace", flex: 1, wordBreak: "break-all" }}>{sandboxInfo.path}</code>
            <button onClick={() => copyText(sandboxInfo.path, "path")} style={{ fontSize: 11, color: copiedCmd === "path" ? "#c084fc" : "#444", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
              {copiedCmd === "path" ? "Copied ✓" : "Copy"}
            </button>
          </div>

          {/* Step-by-step launch commands */}
          {[
            { step: "1", label: "Open PowerShell and navigate to sandbox", cmd: cdCmd, key: "cd" },
            { step: "2", label: "Start Claude Code", cmd: "claude", key: "claude" },
            { step: "3", label: "Paste the execution prompt below when Claude opens", cmd: null, key: null },
          ].map(({ step, label, cmd, key }) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", minWidth: 20 }}>{step}.</span>
              {cmd && key ? (
                <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 8, background: "#040404", border: "1px solid #1a1a1a", borderRadius: 8, padding: "7px 12px" }}>
                  <code style={{ fontSize: 13, color: "#e2d9f3", fontFamily: "monospace", flex: 1 }}>{cmd}</code>
                  <button onClick={() => copyText(cmd, key)} style={{ fontSize: 11, color: copiedCmd === key ? "#c084fc" : "#444", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {copiedCmd === key ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
              )}
            </div>
          ))}

          <p style={{ fontSize: 11, color: "#333", margin: "6px 0 0", lineHeight: 1.5 }}>
            <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>TASK_PACKET.md</code> and <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>RUN_CLAUDE.ps1</code> are inside the sandbox root.
          </p>
        </div>

        {/* Execution prompt */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Execution Prompt — paste into Claude Code</p>
          <pre style={{ fontSize: 12, color: "#666", lineHeight: 1.65, background: "#040404", border: "1px solid #111", borderRadius: 8, padding: "12px 14px", margin: "0 0 8px", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
            {packet.executionPrompt}
          </pre>
          <button onClick={copy}
            style={{ padding: "8px 18px", borderRadius: 8, cursor: "pointer", border: copied ? "1px solid #4ade80" : "1px solid #064e3b", background: copied ? "rgba(6,78,59,0.25)" : "rgba(6,78,59,0.12)", fontSize: 12, fontWeight: 700, color: copied ? "#4ade80" : "#34d399" }}>
            {copied ? "Copied ✓" : "Copy Execution Prompt →"}
          </button>
        </div>

        {/* Helper commands */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Helper Commands (run inside sandbox)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {HELPER_CMDS.map(({ label, key }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, background: "#040404", border: "1px solid #1a1a1a", borderRadius: 8, padding: "7px 10px" }}>
                <code style={{ fontSize: 12, color: "#888", fontFamily: "monospace", flex: 1 }}>{label}</code>
                <button onClick={() => copyText(label, key)} style={{ fontSize: 10, color: copiedCmd === key ? "#4ade80" : "#333", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {copiedCmd === key ? "✓" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* After Claude finishes */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>After Claude Finishes</p>
          {[
            { n: 1, text: "Run npm run build — must pass before anything is accepted" },
            { n: 2, text: "Run git status — see what changed inside the sandbox" },
            { n: 3, text: "Review the diff: git diff --stat" },
            { n: 4, text: "Fill in SANDBOX_SUMMARY_TEMPLATE.md — Claude can do this for you" },
            { n: 5, text: "Paste the summary into Builder OS below to log the review" },
          ].map(({ n, text }) => (
            <p key={n} style={{ fontSize: 12, color: "#666", margin: "0 0 5px" }}>{n}. {text}</p>
          ))}
        </div>

        {/* Paste Claude summary */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Paste Claude Summary</p>
          <textarea
            value={summaryInput}
            onChange={(e) => onSummaryInputChange(e.target.value)}
            placeholder={"Paste SANDBOX_SUMMARY_TEMPLATE.md contents here after Claude finishes…\n\nFILES CHANGED:\n- ...\n\nBUILD RESULT:\nPASS\n\nRISKS:\n- ..."}
            rows={7}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #1e1e1e", background: "#060606", color: "#b0b0b0", fontSize: 12, lineHeight: 1.65, fontFamily: "monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
          <button onClick={onSummarySubmit} disabled={!summaryInput.trim()}
            style={{ marginTop: 8, padding: "8px 18px", borderRadius: 8, cursor: summaryInput.trim() ? "pointer" : "not-allowed", border: "1px solid #1e3a8a", background: "rgba(30,58,138,0.2)", fontSize: 12, fontWeight: 700, color: summaryInput.trim() ? "#60a5fa" : "#333" }}>
            Parse Summary →
          </button>
        </div>

        {/* Parsed summary cards */}
        {parsedSummary && (
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>Review Summary</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              {/* Build result */}
              <div style={{ padding: "10px 12px", borderRadius: 8, border: parsedSummary.buildResult === "PASS" ? "1px solid #064e3b" : parsedSummary.buildResult === "FAIL" ? "1px solid #7f1d1d" : "1px solid #1a1a1a", background: parsedSummary.buildResult === "PASS" ? "rgba(6,78,59,0.1)" : parsedSummary.buildResult === "FAIL" ? "rgba(127,29,29,0.08)" : "#070707" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Build Result</p>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0, color: parsedSummary.buildResult === "PASS" ? "#4ade80" : parsedSummary.buildResult === "FAIL" ? "#f87171" : "#555" }}>
                  {parsedSummary.buildResult === "unknown" ? "—" : parsedSummary.buildResult}
                </p>
              </div>
              {/* Next task */}
              <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#070707" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Next Recommended Task</p>
                <p style={{ fontSize: 12, color: "#888", margin: 0, lineHeight: 1.4 }}>{parsedSummary.nextTask || "—"}</p>
              </div>
            </div>
            {parsedSummary.filesChanged.length > 0 && (
              <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#070707", marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Files Changed</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {parsedSummary.filesChanged.map((f, i) => <code key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid #1e1e1e", background: "#060606", color: "#60a5fa", fontFamily: "monospace" }}>{f}</code>)}
                </div>
              </div>
            )}
            {parsedSummary.risks.length > 0 && (
              <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #7f1d1d33", background: "rgba(127,29,29,0.04)", marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Risks</p>
                {parsedSummary.risks.map((r, i) => <p key={i} style={{ fontSize: 12, color: "#f87171", margin: "0 0 3px" }}>· {r}</p>)}
              </div>
            )}
            {parsedSummary.errors.length > 0 && (
              <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #7f1d1d33", background: "rgba(127,29,29,0.04)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Errors</p>
                {parsedSummary.errors.map((e, i) => <p key={i} style={{ fontSize: 12, color: "#ef4444", margin: "0 0 3px", fontFamily: "monospace" }}>{e}</p>)}
              </div>
            )}
            <button onClick={() => onReviewStatus("review-complete")} style={{ marginTop: 10, padding: "8px 18px", borderRadius: 8, cursor: "pointer", border: "1px solid #064e3b", background: "rgba(6,78,59,0.2)", fontSize: 12, fontWeight: 700, color: "#4ade80" }}>
              Mark Review Complete ✓
            </button>
          </div>
        )}

        {/* Delete sandbox */}
        <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#2a2a2a", flex: 1 }}>Sandbox is disposable — delete it once you&apos;ve applied changes to the real repo.</span>
          <button onClick={onDeleteSandbox}
            style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", border: "1px solid #7f1d1d44", background: "rgba(127,29,29,0.06)", fontSize: 12, color: "#ef4444", whiteSpace: "nowrap" }}>
            Delete Sandbox
          </button>
        </div>
      </div>
    );
  }

  // ── APPROVED — READY FOR EXECUTION ────────────────────────────────────────
  return (
    <div style={{ borderRadius: 10, border: "1px solid #064e3b", background: "rgba(6,78,59,0.04)", overflow: "hidden", marginBottom: 12 }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #064e3b", background: "rgba(6,78,59,0.1)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", fontFamily: "monospace" }}>{pid}</span>
        {packet.agent && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 12, border: "1px solid #222", color: "#444" }}>{packet.agent}</span>}
        <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 12, border: "1px solid #064e3b", background: "rgba(6,78,59,0.2)", color: "#4ade80", fontWeight: 700 }}>
          ✓ {STATUS_LABEL["approved"]}
        </span>
        <button onClick={onRevoke} style={{ marginLeft: "auto", fontSize: 11, color: "#333", background: "none", border: "none", cursor: "pointer" }}>
          Revoke
        </button>
      </div>

      {/* Goal compact */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #0d0d0d" }}>
        <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>{packet.goal}</p>
      </div>

      {/* Repo + approval level */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #0d0d0d", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>Target Repo</p>
          <p style={{ fontSize: 13, color: "#60a5fa", margin: 0, fontFamily: "monospace" }}>{projectName || "— not specified"}</p>
        </div>
        {packet.approvalLevel && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>Approval Level</p>
            <p style={{ fontSize: 13, color: "#4ade80", margin: 0 }}>{packet.approvalLevel}</p>
          </div>
        )}
      </div>

      {/* Safety warning */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #0d0d0d", background: "rgba(127,29,29,0.06)", borderLeft: "3px solid #7f1d1d" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#f87171", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Safety Rules</p>
        <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 4px" }}>
          Only run this in <strong>{projectName || "the selected repo"}</strong>. Do not push or deploy automatically.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
          {["Do NOT git push", "Do NOT git commit automatically", "Do NOT modify files outside scope", "Sandbox first if available"].map((rule, i) => (
            <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, border: "1px solid #7f1d1d44", background: "rgba(127,29,29,0.08)", color: "#f87171" }}>✕ {rule}</span>
          ))}
        </div>
      </div>

      {/* Sandbox creation */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d", background: "rgba(76,29,149,0.04)" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Create Sandbox (Recommended)</p>
        <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px", lineHeight: 1.5 }}>
          Enter the path to your local repo. Builder OS will copy it into a disposable sandbox so Claude Code never touches your real files.
        </p>
        {sandboxInfo?.error && (
          <div style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7f1d1d44", background: "rgba(127,29,29,0.08)", marginBottom: 8 }}>
            <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{sandboxInfo.error}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            value={repoPath}
            onChange={(e) => onRepoPathChange(e.target.value)}
            placeholder="C:\Users\you\Projects\my-app"
            disabled={sandboxLoading}
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #2a2a2a", background: sandboxLoading ? "#060606" : "#090909", color: "#d4d4d4", fontSize: 13, fontFamily: "monospace", outline: "none", opacity: sandboxLoading ? 0.5 : 1 }}
          />
          <button onClick={onCreateSandbox} disabled={!repoPath.trim() || sandboxLoading}
            style={{ padding: "8px 16px", borderRadius: 8, cursor: !repoPath.trim() || sandboxLoading ? "not-allowed" : "pointer", border: "1px solid #4c1d95", background: !repoPath.trim() || sandboxLoading ? "#0a0a0a" : "rgba(76,29,149,0.3)", fontSize: 13, fontWeight: 700, color: !repoPath.trim() || sandboxLoading ? "#333" : "#a78bfa", whiteSpace: "nowrap" }}>
            {sandboxLoading ? "Creating…" : "Create Sandbox →"}
          </button>
        </div>
      </div>

      {/* Execution prompt */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #0d0d0d" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#2d6a4f", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Execution Prompt</p>
        <pre style={{ fontSize: 12, color: "#666", lineHeight: 1.65, background: "#040404", border: "1px solid #111", borderRadius: 8, padding: "12px 14px", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
          {packet.executionPrompt}
        </pre>
      </div>

      {/* Copy + next steps */}
      <div style={{ padding: "12px 14px" }}>
        <button onClick={copy}
          style={{ padding: "10px 22px", borderRadius: 10, cursor: "pointer", border: copied ? "1px solid #4ade80" : "1px solid #1e3a8a", background: copied ? "rgba(6,78,59,0.25)" : "rgba(30,58,138,0.2)", fontSize: 13, fontWeight: 700, color: copied ? "#4ade80" : "#60a5fa", display: "block", width: "100%", marginBottom: 14 }}>
          {copied ? "Copied ✓" : "Copy Execution Prompt →"}
        </button>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Next Steps</p>
        {[
          "Create a sandbox above (recommended) — or skip and run in your real repo",
          `Open Claude Code inside: ${projectName || "your target repo"}`,
          "Paste the execution prompt and run — stay within scope",
          "Review the diff carefully before approving any commits",
          "Do NOT push — human review required before merge",
        ].map((step, i) => (
          <p key={i} style={{ fontSize: 12, color: "#555", margin: "0 0 4px" }}>{i + 1}. {step}</p>
        ))}
      </div>
    </div>
  );
}

// ── Final plan view ───────────────────────────────────────────────────────────

function FinalPlanView({ plan, packetStatuses, onPacketStatus, projectName, sandboxInfos, sandboxLoadingSet, repoInputs, onRepoInputChange, onCreateSandbox, onDeleteSandbox, reviewStatuses, onReviewStatus, summaryInputs, onSummaryInputChange, onSummarySubmit, parsedSummaries }: {
  plan: ParsedFinalPlan;
  packetStatuses: Record<number, PacketStatus>;
  onPacketStatus: (idx: number, status: PacketStatus) => void;
  projectName: string;
  sandboxInfos: Record<number, SandboxInfo>;
  sandboxLoadingSet: Record<number, boolean>;
  repoInputs: Record<number, string>;
  onRepoInputChange: (idx: number, v: string) => void;
  onCreateSandbox: (idx: number) => void;
  onDeleteSandbox: (idx: number) => void;
  reviewStatuses: Record<number, SandboxReviewStatus>;
  onReviewStatus: (idx: number, s: SandboxReviewStatus) => void;
  summaryInputs: Record<number, string>;
  onSummaryInputChange: (idx: number, v: string) => void;
  onSummarySubmit: (idx: number) => void;
  parsedSummaries: Record<number, ParsedSandboxSummary>;
}) {
  return (
    <div>
      {plan.problemStatement && (
        <PlanSec title="Problem Statement" color="#60a5fa">
          <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75, margin: 0 }}>{plan.problemStatement}</p>
        </PlanSec>
      )}

      {plan.goals.length > 0 && (
        <PlanSec title="Goals" color="#4ade80">
          {plan.goals.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #0d0d0d", alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2d6a4f", minWidth: 18 }}>{i + 1}.</span>
              <span style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{g}</span>
            </div>
          ))}
        </PlanSec>
      )}

      {plan.targetUsers && (
        <PlanSec title="Target Users" color="#c084fc">
          <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>{plan.targetUsers}</p>
        </PlanSec>
      )}

      {plan.functionalRequirements.length > 0 && (
        <PlanSec title="Functional Requirements" color="#60a5fa">
          <RequirementList items={plan.functionalRequirements} color="#60a5fa" />
        </PlanSec>
      )}

      {plan.nonFunctionalRequirements.length > 0 && (
        <PlanSec title="Non-Functional Requirements" color="#c084fc">
          <RequirementList items={plan.nonFunctionalRequirements} color="#c084fc" />
        </PlanSec>
      )}

      {plan.constraints.length > 0 && (
        <PlanSec title="Constraints" color="#fbbf24">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {plan.constraints.map((c, i) => (
              <span key={i} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, border: "1px solid #1a1a1a", background: "#080808", color: "#666" }}>{c}</span>
            ))}
          </div>
        </PlanSec>
      )}

      {plan.assumptions.length > 0 && (
        <PlanSec title="Assumptions" color="#444">
          {plan.assumptions.map((a, i) => <p key={i} style={{ fontSize: 13, color: "#555", margin: "0 0 4px" }}>· {a}</p>)}
        </PlanSec>
      )}

      {plan.risks.length > 0 && (
        <PlanSec title="Risks" color="#f87171">
          <RiskList risks={plan.risks} />
        </PlanSec>
      )}

      {plan.architectureDirection && (
        <PlanSec title="Architecture Direction" color="#34d399">
          <pre style={{ fontSize: 12.5, color: "#666", lineHeight: 1.7, background: "#060606", border: "1px solid #111", borderRadius: 8, padding: "12px 14px", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
            {plan.architectureDirection}
          </pre>
        </PlanSec>
      )}

      {plan.phases.length > 0 && (
        <PlanSec title="Implementation Phases" color="#4ade80">
          <PhaseList phases={plan.phases} />
        </PlanSec>
      )}

      {plan.taskPackets.length > 0 && (
        <PlanSec title={`Task Packets — Phase 1 (${plan.taskPackets.length})`} color="#a78bfa">
          <p style={{ fontSize: 12, color: "#333", margin: "0 0 12px", lineHeight: 1.5 }}>
            Review each packet carefully before approving. Execution prompts are only shown after approval.
          </p>
          {plan.taskPackets.map((pkt, i) => (
            <TaskPacketCard
              key={i}
              packet={pkt}
              idx={i}
              status={packetStatuses[i] ?? "draft"}
              projectName={projectName}
              onReview={() => onPacketStatus(i, "needs-review")}
              onApprove={() => onPacketStatus(i, "approved")}
              onRevoke={() => onPacketStatus(i, "draft")}
              sandboxInfo={sandboxInfos[i]}
              sandboxLoading={sandboxLoadingSet[i] ?? false}
              repoPath={repoInputs[i] ?? ""}
              onRepoPathChange={(v) => onRepoInputChange(i, v)}
              onCreateSandbox={() => onCreateSandbox(i)}
              onDeleteSandbox={() => onDeleteSandbox(i)}
              reviewStatus={reviewStatuses[i] ?? "sandbox-ready"}
              onReviewStatus={(s) => onReviewStatus(i, s)}
              summaryInput={summaryInputs[i] ?? ""}
              onSummaryInputChange={(v) => onSummaryInputChange(i, v)}
              onSummarySubmit={() => onSummarySubmit(i)}
              parsedSummary={parsedSummaries[i]}
            />
          ))}
        </PlanSec>
      )}

      {plan.executionPrompt && (
        <PlanSec title="Execution Prompt" color="#34d399">
          <pre style={{ fontSize: 12.5, color: "#666", lineHeight: 1.7, background: "#060606", border: "1px solid #111", borderRadius: 8, padding: "12px 14px", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
            {plan.executionPrompt}
          </pre>
          <div style={{ marginTop: 8 }}>
            <CopyPrompt text={plan.executionPrompt} description="Copy execution prompt — paste into Claude Code to start Phase 1." />
          </div>
        </PlanSec>
      )}

      <div style={{ marginTop: 20 }}>
        <CopyPrompt text={plan.raw} description="Copy full plan as text." />
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
  const [packetStatuses, setPacketStatuses] = useState<Record<number, PacketStatus>>({});
  const [sandboxInfos, setSandboxInfos] = useState<Record<number, SandboxInfo>>({});
  const [sandboxLoadingSet, setSandboxLoadingSet] = useState<Record<number, boolean>>({});
  const [repoInputs, setRepoInputs] = useState<Record<number, string>>({});
  const [reviewStatuses, setReviewStatuses] = useState<Record<number, SandboxReviewStatus>>({});
  const [summaryInputs, setSummaryInputs] = useState<Record<number, string>>({});
  const [parsedSummaries, setParsedSummaries] = useState<Record<number, ParsedSandboxSummary>>({});

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
        setLastError("No API keys — add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local.");
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

      const useLocal = async () => {
        const raw = LOCAL_RESPONSES[Math.min(localIdx, LOCAL_RESPONSES.length - 1)];
        setLocalIdx((p) => Math.min(p + 1, LOCAL_RESPONSES.length - 1));
        displayContent = raw.replace(/\[SCOPE_READY\]/g, "").trim();
        if (raw.includes("[SCOPE_READY]")) { setReadyForFinalPlan(true); setMissingInfo([]); setConfidence(0.9); }
        local = true;
        await new Promise((r) => setTimeout(r, 650));
      };

      if (localFallback) {
        await useLocal();
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
            displayContent = result.assistantMessage;
            setReadyForFinalPlan(Boolean(result.readyForFinalPlan));
            setMissingInfo(Array.isArray(result.missingInfo) ? result.missingInfo as string[] : []);
            setConfidence(typeof result.confidence === "number" ? result.confidence as number : 0);
          } else if (typeof result.content === "string") {
            displayContent = (result.content as string).replace(/\[SCOPE_READY\]/g, "").trim();
            if ((result.content as string).includes("[SCOPE_READY]")) { setReadyForFinalPlan(true); setMissingInfo([]); }
          }
        } else {
          await useLocal();
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: displayContent, provider, model, local }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}`, error: true }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, stage, loading, localFallback, localIdx]);

  // ── Retry ─────────────────────────────────────────────────────────────────

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
            const cleaned = (result.content as string).replace(/^```[a-z]*\n?/gm, "").replace(/^```$/gm, "").trim();
            setScopeLock(JSON.parse(cleaned) as ScopeLock);
            return;
          } catch { /* fall through */ }
        }
      }
      setScopeLock(extractLocalScope(messages, initialIdea));
    } finally {
      setLoading(false);
    }
  }, [messages, localFallback, initialIdea]);

  // ── Generate final plan ───────────────────────────────────────────────────

  const generateFinalPlan = useCallback(async () => {
    if (!scopeLock) return;
    setStage("sdlc");
    setLoading(true);
    setLoadingLabel("Generating final SDLC plan and task packets…");
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
      setFinalPlanText(result && typeof result.content === "string" ? result.content as string : buildLocalFinalPlan(scopeLock));
      setPacketStatuses({});
      setStage("done");
    } catch {
      setFinalPlanText(buildLocalFinalPlan(scopeLock));
      setStage("done");
    } finally {
      setLoading(false);
    }
  }, [scopeLock, localFallback]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const updatePacketStatus = useCallback((idx: number, status: PacketStatus) => {
    setPacketStatuses((prev) => ({ ...prev, [idx]: status }));
  }, []);

  const updateRepoInput = useCallback((idx: number, v: string) => {
    setRepoInputs((prev) => ({ ...prev, [idx]: v }));
  }, []);

  const createSandboxForPacket = useCallback(async (idx: number, packet: ParsedTaskPacket) => {
    const repoPath = repoInputs[idx]?.trim() ?? "";
    if (!repoPath) return;
    setSandboxLoadingSet((prev) => ({ ...prev, [idx]: true }));
    setSandboxInfos((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    try {
      const packetId = packet.id || `PKT-${idx + 1}`;
      const taskPacketContent = `# Task Packet: ${packetId}\n\n${packet.executionPrompt}`;
      const res = await fetch("/api/create-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskPacketId: packetId, repoPath, taskPacketContent }),
      });
      const data = await res.json() as { success?: boolean; sandboxPath?: string; copied?: number; errors?: string[]; error?: string };
      if (data.success && data.sandboxPath) {
        setSandboxInfos((prev) => ({ ...prev, [idx]: { path: data.sandboxPath!, copiedCount: data.copied } }));
        setPacketStatuses((prev) => ({ ...prev, [idx]: "sandbox-created" }));
      } else {
        const errMsg = data.errors?.[0] ?? data.error ?? "Sandbox creation failed";
        setSandboxInfos((prev) => ({ ...prev, [idx]: { path: "", error: errMsg } }));
      }
    } catch (e) {
      setSandboxInfos((prev) => ({ ...prev, [idx]: { path: "", error: e instanceof Error ? e.message : "Network error" } }));
    } finally {
      setSandboxLoadingSet((prev) => ({ ...prev, [idx]: false }));
    }
  }, [repoInputs]);

  const deleteSandboxForPacket = useCallback(async (idx: number, packet: ParsedTaskPacket) => {
    const packetId = packet.id || `PKT-${idx + 1}`;
    try {
      await fetch("/api/create-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskPacketId: packetId, action: "delete" }),
      });
    } catch { /* ignore */ }
    setSandboxInfos((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setReviewStatuses((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setSummaryInputs((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setParsedSummaries((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setPacketStatuses((prev) => ({ ...prev, [idx]: "approved" }));
  }, []);

  const updateReviewStatus = useCallback((idx: number, s: SandboxReviewStatus) => {
    setReviewStatuses((prev) => ({ ...prev, [idx]: s }));
  }, []);

  const updateSummaryInput = useCallback((idx: number, v: string) => {
    setSummaryInputs((prev) => ({ ...prev, [idx]: v }));
  }, []);

  const submitSummary = useCallback((idx: number) => {
    const text = summaryInputs[idx] ?? "";
    const parsed = parseSandboxSummary(text);
    if (parsed) {
      setParsedSummaries((prev) => ({ ...prev, [idx]: parsed }));
      setReviewStatuses((prev) => ({ ...prev, [idx]: "awaiting-review" }));
    }
  }, [summaryInputs]);

  const reset = useCallback(() => {
    setStage("intake"); setMessages([]); setInput("");
    setReadyForFinalPlan(false); setMissingInfo([]); setConfidence(0);
    setScopeLock(null); setFinalPlanText(null); setPacketStatuses({});
    setSandboxInfos({}); setSandboxLoadingSet({}); setRepoInputs({});
    setReviewStatuses({}); setSummaryInputs({}); setParsedSummaries({});
    setLocalIdx(0); setInitialIdea(""); setLastError(null);
    textareaRef.current?.focus();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const exchangeCount = Math.floor(messages.length / 2);
  const canLockScope = (readyForFinalPlan || exchangeCount >= 3) && !scopeLock;
  const inConversation = stage === "intake" || stage === "clarifying";
  const parsedPlan = finalPlanText ? parseFinalPlan(finalPlanText) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 24px 120px" }}>

        <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399", letterSpacing: "0.1em", textTransform: "uppercase" }}>Builder OS — Planning</p>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginTop: 10, lineHeight: 1.1, letterSpacing: "-0.02em" }}>Planner Chat</h1>
        <p style={{ marginTop: 12, color: "#737373", fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
          You and the planner agree on what to build before any agent touches code. Planning saves ten debugging sessions.
        </p>

        <StageBar current={stage} />

        {/* API / error notices */}
        {localFallback && (
          <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, border: "1px solid #292929", background: "#0a0a0a" }}>
            <p style={{ fontSize: 12, color: "#444", margin: 0 }}>
              ⚠ Local planner active — add{" "}
              <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>OPENAI_API_KEY</code> or{" "}
              <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>ANTHROPIC_API_KEY</code> to{" "}
              <code style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>.env.local</code> and restart.
            </p>
          </div>
        )}
        {lastError && !localFallback && (
          <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.06)" }}>
            <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{lastError}</p>
          </div>
        )}

        {/* Starters */}
        {messages.length === 0 && (
          <div style={{ marginTop: 40 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Start with an idea or goal</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {STARTERS.map((s) => (
                <button key={s.label} onClick={() => { setInput(s.idea); textareaRef.current?.focus(); }}
                  style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, border: input === s.idea ? "1px solid #064e3b" : "1px solid #2a2a2a", background: input === s.idea ? "rgba(6,78,59,0.2)" : "#0a0a0a", color: input === s.idea ? "#4ade80" : "#666" }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #141414", background: "#070707" }}>
              <p style={{ fontSize: 12, color: "#333", margin: 0, lineHeight: 1.6 }}>
                The planner asks 2–4 focused questions at a time. Together you'll define: what to build → who for → v1 scope → constraints → risks. Only then does the final plan get written.
              </p>
            </div>
          </div>
        )}

        {/* Conversation thread */}
        {messages.length > 0 && (
          <div style={{ marginTop: 36 }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} onRetry={msg.error ? retryLast : undefined} />)}
            {loading && inConversation && <LoadingDots label={loadingLabel} />}
          </div>
        )}

        {/* Missing info tags */}
        {inConversation && missingInfo.length > 0 && !loading && (
          <MissingInfoBar items={missingInfo} confidence={confidence} />
        )}

        {/* Scope ready banner */}
        {canLockScope && !loading && inConversation && (
          <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 10, border: "1px solid #064e3b", background: "rgba(6,78,59,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: "0 0 2px" }}>
                {readyForFinalPlan ? "Ready to generate final SDLC plan" : "Enough context to lock scope"}
              </p>
              <p style={{ fontSize: 12, color: "#2d6a4f", margin: 0 }}>
                {readyForFinalPlan ? "The planner has all the information needed." : `${exchangeCount} exchanges complete.`}{" "}
                Review and lock scope, then generate the plan.
              </p>
            </div>
            <button onClick={lockScope} style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", border: "1px solid #4ade80", background: "rgba(6,78,59,0.35)", fontSize: 13, fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" }}>
              {readyForFinalPlan ? "Generate Final SDLC Plan →" : "Lock Scope →"}
            </button>
          </div>
        )}

        {/* Scope lock loading */}
        {loading && stage === "scope-lock" && !scopeLock && <div style={{ marginTop: 20 }}><LoadingDots label={loadingLabel} /></div>}

        {/* Scope lock card */}
        {scopeLock && stage === "scope-lock" && <ScopeLockCard scope={scopeLock} onApprove={generateFinalPlan} />}

        {/* Final plan loading */}
        {loading && stage === "sdlc" && !finalPlanText && <div style={{ marginTop: 20 }}><LoadingDots label={loadingLabel} /></div>}

        {/* Scope locked compact banner */}
        {scopeLock && stage !== "scope-lock" && stage !== "intake" && stage !== "clarifying" && (
          <div style={{ marginTop: 28, padding: "10px 14px", borderRadius: 8, border: "1px solid #064e3b", background: "rgba(6,78,59,0.06)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>Scope locked</p>
            <p style={{ fontSize: 12, color: "#555", margin: 0, flex: 1 }}>
              {scopeLock.projectName} · {scopeLock.platform} · {scopeLock.v1Scope.length} v1 features · Risk: {scopeLock.riskLevel}
            </p>
          </div>
        )}

        {/* Final plan — structured view */}
        {finalPlanText && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Final SDLC Plan</p>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, border: "1px solid #1e3a8a", background: "rgba(30,58,138,0.15)", color: "#60a5fa" }}>
                {parsedPlan ? `${parsedPlan.taskPackets.length} task packet${parsedPlan.taskPackets.length !== 1 ? "s" : ""} · Phase 1` : "Generated"}
              </span>
            </div>

            {parsedPlan ? (
              <FinalPlanView
                plan={parsedPlan}
                packetStatuses={packetStatuses}
                onPacketStatus={updatePacketStatus}
                projectName={scopeLock?.existingRepo ?? scopeLock?.projectName ?? ""}
                sandboxInfos={sandboxInfos}
                sandboxLoadingSet={sandboxLoadingSet}
                repoInputs={repoInputs}
                onRepoInputChange={updateRepoInput}
                onCreateSandbox={(i) => createSandboxForPacket(i, parsedPlan.taskPackets[i])}
                onDeleteSandbox={(i) => deleteSandboxForPacket(i, parsedPlan.taskPackets[i])}
                reviewStatuses={reviewStatuses}
                onReviewStatus={updateReviewStatus}
                summaryInputs={summaryInputs}
                onSummaryInputChange={updateSummaryInput}
                onSummarySubmit={submitSummary}
                parsedSummaries={parsedSummaries}
              />
            ) : (
              // Raw fallback if parser finds nothing to structure
              <>
                <pre style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid #1a1a1a", background: "#060606", fontSize: 12.5, color: "#999", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
                  {finalPlanText}
                </pre>
                <div style={{ marginTop: 10 }}>
                  <CopyPrompt text={finalPlanText} description="Copy full plan." />
                </div>
              </>
            )}
          </div>
        )}

        {/* Done banner */}
        {stage === "done" && finalPlanText && (
          <div style={{ marginTop: 24, padding: "14px 18px", borderRadius: 10, border: "1px solid #064e3b", background: "rgba(6,78,59,0.1)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: "0 0 3px" }}>✓ Planning complete</p>
            <p style={{ fontSize: 12, color: "#2d6a4f", margin: 0 }}>
              Scope locked · SDLC generated · Task packets ready. Copy an execution prompt and paste it into Claude Code.
            </p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <a href="/execute" style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #4c1d95", background: "rgba(76,29,149,0.2)", fontSize: 13, fontWeight: 700, color: "#a78bfa", textDecoration: "none" }}>Execute in Sandbox →</a>
              <a href="/task-packets" style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#080808", fontSize: 13, color: "#555", textDecoration: "none" }}>Task Packets →</a>
            </div>
          </div>
        )}

        {/* Input */}
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
              style={{ width: "100%", padding: "14px 16px", borderRadius: 10, resize: "vertical", border: "1px solid #2a2a2a", background: loading ? "#070707" : "#090909", color: "#d4d4d4", fontSize: 14, lineHeight: 1.7, fontFamily: "inherit", outline: "none", boxSizing: "border-box", opacity: loading ? 0.5 : 1 }}
            />
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <button onClick={send} disabled={!input.trim() || loading}
                style={{ padding: "10px 22px", borderRadius: 10, cursor: !input.trim() || loading ? "not-allowed" : "pointer", border: "1px solid #064e3b", background: !input.trim() || loading ? "#0a0a0a" : "rgba(6,78,59,0.3)", fontSize: 13, fontWeight: 700, color: !input.trim() || loading ? "#2d2d2d" : "#4ade80", opacity: loading ? 0.5 : 1 }}>
                {loading ? "Thinking…" : "Send →"}
              </button>
              {canLockScope && !loading && (
                <button onClick={lockScope}
                  style={{ padding: "10px 18px", borderRadius: 10, cursor: "pointer", border: "1px solid #064e3b", background: "rgba(6,78,59,0.15)", fontSize: 13, fontWeight: 600, color: "#4ade80" }}>
                  {readyForFinalPlan ? "Generate Final SDLC Plan →" : "Lock Scope →"}
                </button>
              )}
              <span style={{ fontSize: 11, color: "#2a2a2a", marginLeft: "auto" }}>{input.length} chars — Ctrl+Enter</span>
            </div>
          </div>
        )}

        {/* Reset */}
        {(messages.length > 0 || scopeLock) && (
          <div style={{ marginTop: 28 }}>
            <button onClick={reset} style={{ fontSize: 12, color: "#444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Start a new conversation</button>
          </div>
        )}

        <div ref={bottomRef} />

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
