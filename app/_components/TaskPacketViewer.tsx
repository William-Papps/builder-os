"use client";

import type { TaskPacket, PacketApprovalLevel } from "@/data/taskPackets";
import { LEVEL_LABEL } from "@/data/taskPackets";
import { CopyPrompt } from "./CopyPrompt";

const RISK: Record<PacketApprovalLevel, { label: string; color: string; bg: string; border: string }> = {
  "plan-only":       { label: "Minimal", color: "#4ade80", bg: "rgba(6,78,59,0.2)",   border: "#064e3b" },
  "prompt-only":     { label: "Minimal", color: "#4ade80", bg: "rgba(6,78,59,0.2)",   border: "#064e3b" },
  "read-only":       { label: "Low",     color: "#60a5fa", bg: "rgba(30,58,138,0.2)", border: "#1e3a8a" },
  "edit-approved":   { label: "Medium",  color: "#fb923c", bg: "rgba(124,45,18,0.2)", border: "#7c2d12" },
  "commit-approved": { label: "High",    color: "#f87171", bg: "rgba(127,29,29,0.25)","border": "#7f1d1d" },
  "push-approved":   { label: "Critical",color: "#e11d48", bg: "rgba(136,19,55,0.3)", border: "#881337" },
};

const LEVEL_COLOR: Record<PacketApprovalLevel, { text: string; bg: string; border: string }> = {
  "plan-only":       { text: "#a3a3a3", bg: "#111",            border: "#1f1f1f" },
  "prompt-only":     { text: "#93c5fd", bg: "rgba(30,58,138,0.2)", border: "#1e3a8a" },
  "read-only":       { text: "#4ade80", bg: "rgba(6,78,59,0.2)",   border: "#064e3b" },
  "edit-approved":   { text: "#fbbf24", bg: "rgba(120,53,15,0.2)", border: "#78350f" },
  "commit-approved": { text: "#fb923c", bg: "rgba(124,45,18,0.25)","border": "#7c2d12" },
  "push-approved":   { text: "#f87171", bg: "rgba(127,29,29,0.25)","border": "#7f1d1d" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, borderBottom: "1px solid #141414", padding: "12px 0" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a", textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: 2 }}>
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function ActionList({ items, variant }: { items: string[]; variant: "allowed" | "forbidden" }) {
  const color = variant === "allowed" ? "#4ade80" : "#f87171";
  const icon = variant === "allowed" ? "✓" : "✕";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color, fontSize: 11, marginTop: 3, flexShrink: 0 }}>{icon}</span>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, margin: 0 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

type Props = {
  packet: TaskPacket;
  showPrompt?: boolean;
};

export function TaskPacketViewer({ packet, showPrompt = true }: Props) {
  const risk = RISK[packet.approvalLevel];
  const levelColors = LEVEL_COLOR[packet.approvalLevel];

  return (
    <div style={{ borderRadius: 14, border: "1px solid #1a1a1a", background: "#080808", overflow: "hidden" }}>

      {/* Packet header */}
      <div style={{
        padding: "16px 22px", borderBottom: "1px solid #1a1a1a",
        background: "#0d0d0d",
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <code style={{ fontSize: 11, color: "#333", fontFamily: "monospace", display: "block", marginBottom: 4 }}>
            {packet.id}
          </code>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#e5e5e5", margin: 0, lineHeight: 1.3 }}>
            {packet.title}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 600,
            background: levelColors.bg, border: `1px solid ${levelColors.border}`, color: levelColors.text,
          }}>
            {LEVEL_LABEL[packet.approvalLevel]}
          </span>
          <span style={{
            fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 600,
            background: risk.bg, border: `1px solid ${risk.border}`, color: risk.color,
          }}>
            Risk: {risk.label}
          </span>
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: "#111", border: "1px solid #1f1f1f", color: "#555" }}>
            {packet.status}
          </span>
        </div>
      </div>

      {/* Packet fields */}
      <div style={{ padding: "0 22px" }}>

        <Row label="Project">
          <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>{packet.projectId}</p>
        </Row>

        <Row label="Repo Path">
          <code style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{packet.repoPath}</code>
        </Row>

        <Row label="Goal">
          <p style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6, margin: 0 }}>{packet.goal}</p>
        </Row>

        <Row label="Scope">
          <code style={{ fontSize: 12, color: "#888", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
            {packet.scope}
          </code>
        </Row>

        <Row label="Allowed Actions">
          <ActionList items={packet.allowedActions} variant="allowed" />
        </Row>

        <Row label="Forbidden Actions">
          <ActionList items={packet.forbiddenActions} variant="forbidden" />
        </Row>

        <Row label="Expected Output">
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, margin: 0 }}>{packet.expectedOutput}</p>
        </Row>

        <Row label="Rollback Plan">
          <code style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{packet.rollbackPlan}</code>
        </Row>

        <Row label="Created">
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{packet.createdAt}</p>
        </Row>

      </div>

      {/* Execution prompt */}
      {showPrompt && (
        <div style={{ padding: "20px 22px", borderTop: "1px solid #141414" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Execution Prompt
          </p>
          <CopyPrompt text={packet.executionPrompt} />
        </div>
      )}

    </div>
  );
}
