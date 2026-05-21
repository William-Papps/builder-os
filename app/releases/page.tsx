import {
  RELEASES,
  STATUS_ORDER,
  STATUS_LABEL,
  STATUS_COLOR,
  STATUS_BORDER,
  type ReleaseItem,
  type PublicStatus,
} from "@/data/releases";
import { PROJECT_MAP } from "@/data/projects";

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
          done
            ? "border-emerald-600 bg-emerald-900 text-emerald-400"
            : "border-neutral-700 text-transparent"
        }`}
      >
        ✓
      </span>
      <span className={`text-sm ${done ? "text-neutral-400 line-through" : "text-neutral-300"}`}>
        {label}
      </span>
    </li>
  );
}

function ReleaseCard({ item }: { item: ReleaseItem }) {
  const project = PROJECT_MAP[item.projectId];
  const doneCount = item.checklist.filter((c) => c.done).length;
  const totalCount = item.checklist.length;

  return (
    <div className={`rounded-2xl border bg-neutral-900 p-6 ${STATUS_BORDER[item.publicStatus]}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {project?.name ?? item.projectId}
          </h2>
          {project && (
            <p className="mt-0.5 font-mono text-xs text-neutral-700">
              {project.localPath}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLOR[item.publicStatus]}`}
        >
          {STATUS_LABEL[item.publicStatus]}
        </span>
      </div>

      {/* Notes */}
      <p className="mt-3 text-sm text-neutral-400">{item.notes}</p>

      {/* Repo / Hub links */}
      {(item.publicRepo || item.hubPage) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {item.publicRepo && (
            <a
              href={item.publicRepo}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              GitHub ↗
            </a>
          )}
          {item.hubPage && (
            <a
              href={item.hubPage}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Builder Hub ↗
            </a>
          )}
        </div>
      )}

      {/* Checklist */}
      {item.checklist.length > 0 && (
        <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
              Release checklist
            </p>
            <span className="text-xs text-neutral-600">
              {doneCount}/{totalCount}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-800">
            <div
              className="h-1.5 rounded-full bg-emerald-700 transition-all"
              style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
          <ul className="mt-4 space-y-2">
            {item.checklist.map((c) => (
              <ChecklistRow key={c.label} label={c.label} done={c.done} />
            ))}
          </ul>
        </div>
      )}

      {/* Next action */}
      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
          Next action
        </p>
        <p className="mt-1.5 text-sm text-neutral-300">{item.nextAction}</p>
      </div>

      {/* Links */}
      <div className="mt-4 flex flex-wrap gap-2">
        {project && (
          <a
            href={`/projects/${item.projectId}`}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors"
          >
            Project details →
          </a>
        )}
        <a
          href="/prompt-builder"
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:border-emerald-700 hover:text-emerald-400 transition-colors"
        >
          Build release prompt →
        </a>
      </div>
    </div>
  );
}

export default function ReleasesPage() {
  const grouped = STATUS_ORDER.reduce<Partial<Record<PublicStatus, ReleaseItem[]>>>(
    (acc, s) => {
      const items = RELEASES.filter((r) => r.publicStatus === s);
      if (items.length > 0) acc[s] = items;
      return acc;
    },
    {}
  );

  const needsAttention = RELEASES.filter(
    (r) => r.publicStatus === "needs-review" || r.publicStatus === "preparing-public"
  ).length;

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Release Pipeline</h1>
        <p className="mt-3 text-neutral-400">
          Track which projects are private, preparing for public, or ready to list on Builder Hub.
          Update{" "}
          <code className="rounded bg-neutral-800 px-1 text-xs">data/releases.ts</code> as
          checklist items are completed.
        </p>

        {needsAttention > 0 && (
          <div className="mt-5 rounded-xl border border-yellow-900 bg-yellow-950/30 px-4 py-3">
            <p className="text-sm text-yellow-300">
              {needsAttention} project{needsAttention > 1 ? "s" : ""} need attention before
              going public.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-10">
          {STATUS_ORDER.map((status) => {
            const items = grouped[status];
            if (!items) return null;
            return (
              <div key={status}>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-600">
                  {STATUS_LABEL[status]}
                </h2>
                <div className="mt-4 space-y-5">
                  {items.map((item) => (
                    <ReleaseCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
