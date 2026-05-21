import {
  TASK_PACKETS,
  STATUS_ORDER,
  STATUS_LABEL,
  STATUS_COLOR,
  STATUS_BORDER,
  LEVEL_LABEL,
  LEVEL_COLOR,
  type TaskPacket,
  type PacketStatus,
} from "@/data/taskPackets";
import { PROJECT_MAP } from "@/data/projects";
import { CopyPrompt } from "@/app/_components/CopyPrompt";

function PacketCard({ packet }: { packet: TaskPacket }) {
  const project = PROJECT_MAP[packet.projectId];

  return (
    <div className={`rounded-2xl border bg-neutral-900 p-6 ${STATUS_BORDER[packet.status]}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{packet.title}</h2>
          {project && (
            <a
              href={`/projects/${packet.projectId}`}
              className="mt-0.5 inline-block text-sm text-emerald-600 hover:text-emerald-400 transition-colors"
            >
              {project.name} →
            </a>
          )}
          <p className="mt-0.5 font-mono text-xs text-neutral-700">{packet.repoPath}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLOR[packet.status]}`}>
            {STATUS_LABEL[packet.status]}
          </span>
          <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${LEVEL_COLOR[packet.approvalLevel]}`}>
            {LEVEL_LABEL[packet.approvalLevel]}
          </span>
        </div>
      </div>

      {/* Goal */}
      <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">Goal</p>
        <p className="mt-1 text-sm text-neutral-300">{packet.goal}</p>
      </div>

      {/* Scope */}
      <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">Scope</p>
        <p className="mt-1 text-sm text-neutral-400">{packet.scope}</p>
      </div>

      {/* Allowed / Forbidden */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-900">
            Allowed
          </p>
          <ul className="mt-2 space-y-1.5">
            {packet.allowedActions.map((a) => (
              <li key={a} className="flex items-start gap-2 text-xs text-neutral-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-800" />
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-red-900">
            Forbidden
          </p>
          <ul className="mt-2 space-y-1.5">
            {packet.forbiddenActions.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="mt-0.5 shrink-0 text-neutral-800">✕</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Execution prompt */}
      <div className="mt-4">
        <CopyPrompt
          title="Execution prompt"
          description="Paste into Claude Code or Ruflo inside the repo path above."
          text={packet.executionPrompt}
        />
      </div>

      {/* Expected output */}
      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
          Expected output
        </p>
        <p className="mt-1 text-sm text-neutral-400">{packet.expectedOutput}</p>
      </div>

      {/* Rollback */}
      <div className="mt-3 rounded-xl border border-yellow-900 bg-yellow-950/20 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-yellow-900">
          Rollback plan
        </p>
        <p className="mt-1 text-sm text-yellow-400">{packet.rollbackPlan}</p>
      </div>

      {/* Footer meta */}
      <p className="mt-4 text-xs text-neutral-700">Created {packet.createdAt} · id: {packet.id}</p>
    </div>
  );
}

export default function TaskPacketsPage() {
  const grouped = STATUS_ORDER.reduce<Partial<Record<PacketStatus, TaskPacket[]>>>(
    (acc, s) => {
      const items = TASK_PACKETS.filter((p) => p.status === s);
      if (items.length > 0) acc[s] = items;
      return acc;
    },
    {}
  );

  const approvedCount = TASK_PACKETS.filter((p) => p.status === "approved").length;

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Task Packets</h1>
        <p className="mt-3 text-neutral-400">
          Approved work units for future automation. Each packet defines exactly what an agent
          is allowed to do, what it must not touch, and what result is expected. Update{" "}
          <code className="rounded bg-neutral-800 px-1 text-xs">data/taskPackets.ts</code> to
          add or update packets.
        </p>

        {approvedCount > 0 && (
          <div className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3">
            <p className="text-sm text-emerald-300">
              {approvedCount} packet{approvedCount > 1 ? "s" : ""} approved and ready to run.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-10">
          {STATUS_ORDER.map((status) => {
            const items = grouped[status];
            if (!items) return null;
            return (
              <div key={status}>
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-600">
                    {STATUS_LABEL[status]}
                  </h2>
                  <span className="text-xs text-neutral-700">{items.length}</span>
                </div>
                <div className="mt-4 space-y-6">
                  {items.map((packet) => (
                    <PacketCard key={packet.id} packet={packet} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <p className="text-sm font-medium">How to add a new task packet</p>
          <ol className="mt-2 space-y-1">
            {[
              "Use the 'Create Approved Task Packet' prompt in Prompt Builder.",
              "Paste the AI output into data/taskPackets.ts as a new TASK_PACKETS entry.",
              "Set status to 'draft' first — review it before changing to 'approved'.",
              "When ready to run, open the packet, copy the execution prompt, and paste into Claude Code or Ruflo.",
              "After the agent finishes, update the packet status to 'completed' and log the session.",
            ].map((s, i) => (
              <li key={s} className="flex items-start gap-2 text-sm text-neutral-400">
                <span className="shrink-0 text-neutral-700">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
