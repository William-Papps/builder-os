import { PROJECTS } from "./projects";
import { TASKS } from "./tasks";
import { MEMORY } from "./memory";
import { SESSIONS } from "./sessions";
import { RELEASES } from "./releases";
import { TASK_PACKETS } from "./taskPackets";

// ─── Constants ────────────────────────────────────────────────────────────────

export const STALE_MEMORY_DAYS = 14;
export const STALE_SESSION_DAYS = 7;
export const TODAY = "2026-05-21";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthStatus = "ok" | "warning" | "stale" | "missing";

export type HealthItem = {
  label: string;
  status: HealthStatus;
  detail: string;
  link?: string;
};

export type HealthSection = {
  id: string;
  title: string;
  items: HealthItem[];
  link?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function latestSessionForProject(projectId: string): (typeof SESSIONS)[0] | undefined {
  return [...SESSIONS]
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

// ─── Health derivations ───────────────────────────────────────────────────────

export function getProjectsHealth(): HealthSection {
  const items: HealthItem[] = PROJECTS.map((p) => {
    const mem = MEMORY.find((m) => m.projectId === p.id);
    const lastSession = latestSessionForProject(p.id);

    if (!mem) {
      return {
        label: p.name,
        status: "missing" as HealthStatus,
        detail: "No memory entry — add to data/memory.ts",
        link: "/memory",
      };
    }

    const memAge = daysBetween(mem.lastUpdated, TODAY);
    if (memAge > STALE_MEMORY_DAYS) {
      return {
        label: p.name,
        status: "stale" as HealthStatus,
        detail: `Memory last updated ${memAge} days ago`,
        link: "/memory",
      };
    }

    if (!lastSession) {
      return {
        label: p.name,
        status: "warning" as HealthStatus,
        detail: "No sessions recorded",
        link: "/sessions",
      };
    }

    return {
      label: p.name,
      status: "ok" as HealthStatus,
      detail: `Memory current · last session ${lastSession.date}`,
      link: `/projects/${p.id}`,
    };
  });

  return { id: "projects", title: "Connected Projects", items, link: "/projects" };
}

export function getTasksHealth(): HealthSection {
  const active = TASKS.filter((t) => t.status !== "done");
  const inProgress = active.filter((t) => t.status === "in-progress");

  const items: HealthItem[] = [];

  if (inProgress.length > 0) {
    inProgress.forEach((t) => {
      items.push({
        label: t.title,
        status: "warning",
        detail: `In progress · ${t.priority} priority`,
        link: "/tasks",
      });
    });
  }

  const others = active.filter((t) => t.status !== "in-progress");
  others.slice(0, 3).forEach((t) => {
    items.push({
      label: t.title,
      status: "ok",
      detail: `${t.status} · ${t.priority} priority`,
      link: "/tasks",
    });
  });

  if (others.length > 3) {
    items.push({
      label: `+${others.length - 3} more tasks`,
      status: "ok",
      detail: "See full task board",
      link: "/tasks",
    });
  }

  if (items.length === 0) {
    items.push({ label: "No active tasks", status: "ok", detail: "Task board is clear", link: "/tasks" });
  }

  return { id: "tasks", title: "Active Tasks", items, link: "/tasks" };
}

export function getMemoryHealth(): HealthSection {
  const items: HealthItem[] = MEMORY.map((m) => {
    const age = daysBetween(m.lastUpdated, TODAY);
    const project = PROJECTS.find((p) => p.id === m.projectId);
    const name = project?.name ?? m.projectId;

    if (age > STALE_MEMORY_DAYS) {
      return {
        label: name,
        status: "stale" as HealthStatus,
        detail: `Last updated ${age} days ago — may need refresh`,
        link: "/memory",
      };
    }
    if (m.nextActions.length === 0) {
      return {
        label: name,
        status: "warning" as HealthStatus,
        detail: "No next actions defined",
        link: "/memory",
      };
    }
    return {
      label: name,
      status: "ok" as HealthStatus,
      detail: `Updated ${age === 0 ? "today" : `${age} days ago`} · ${m.nextActions.length} next actions`,
      link: "/memory",
    };
  });

  // Flag projects that have no memory at all
  PROJECTS.forEach((p) => {
    if (!MEMORY.find((m) => m.projectId === p.id)) {
      items.push({
        label: p.name,
        status: "missing",
        detail: "No memory entry",
        link: "/memory",
      });
    }
  });

  return { id: "memory", title: "Project Memory", items, link: "/memory" };
}

export function getPacketsHealth(): HealthSection {
  const items: HealthItem[] = TASK_PACKETS.map((pkt) => {
    if (pkt.status === "draft") {
      return {
        label: pkt.title,
        status: "warning" as HealthStatus,
        detail: "Draft — needs approval before execution",
        link: "/task-packets",
      };
    }
    if (pkt.status === "blocked") {
      return {
        label: pkt.title,
        status: "missing" as HealthStatus,
        detail: "Blocked — resolve before proceeding",
        link: "/task-packets",
      };
    }
    if (pkt.status === "approved") {
      return {
        label: pkt.title,
        status: "ok" as HealthStatus,
        detail: "Approved and ready for execution",
        link: "/task-packets",
      };
    }
    return {
      label: pkt.title,
      status: "ok" as HealthStatus,
      detail: pkt.status,
      link: "/task-packets",
    };
  });

  if (items.length === 0) {
    items.push({ label: "No task packets", status: "ok", detail: "Create one via /planner", link: "/planner" });
  }

  return { id: "packets", title: "Task Packets", items, link: "/task-packets" };
}

export function getReleasesHealth(): HealthSection {
  const items: HealthItem[] = RELEASES.map((r) => {
    const name = PROJECTS.find((p) => p.id === r.projectId)?.name ?? r.projectId;
    if (r.publicStatus === "needs-review") {
      return {
        label: name,
        status: "warning" as HealthStatus,
        detail: "Needs review before going public",
        link: "/releases",
      };
    }
    if (r.publicStatus === "preparing-public") {
      return {
        label: name,
        status: "warning" as HealthStatus,
        detail: "Preparing for public release — checklist may be incomplete",
        link: "/releases",
      };
    }
    if (r.publicStatus === "public-ready" || r.publicStatus === "listed-on-hub") {
      const incomplete = r.checklist.filter((c) => !c.done).length;
      if (incomplete > 0) {
        return {
          label: name,
          status: "warning" as HealthStatus,
          detail: `${r.publicStatus === "listed-on-hub" ? "Listed" : "Public-ready"} but ${incomplete} checklist item${incomplete > 1 ? "s" : ""} incomplete`,
          link: "/releases",
        };
      }
      return {
        label: name,
        status: "ok" as HealthStatus,
        detail: `${r.publicStatus.replace(/-/g, " ")} · checklist complete`,
        link: "/releases",
      };
    }
    return {
      label: name,
      status: "ok" as HealthStatus,
      detail: r.publicStatus.replace(/-/g, " "),
      link: "/releases",
    };
  });

  return { id: "releases", title: "Release Pipeline", items, link: "/releases" };
}

export function getSessionsHealth(): HealthSection {
  const recent = [...SESSIONS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const projectsWithSessions = new Set(SESSIONS.map((s) => s.projectId));

  const items: HealthItem[] = recent.map((s) => {
    const age = daysBetween(s.date, TODAY);
    return {
      label: s.goal,
      status: s.status === "blocked" ? "missing" : age > STALE_SESSION_DAYS ? "stale" : "ok",
      detail: `${s.date} · ${s.toolUsed} · ${s.status}`,
      link: "/sessions",
    };
  });

  // Flag projects with no sessions
  PROJECTS.forEach((p) => {
    if (!projectsWithSessions.has(p.id)) {
      items.push({
        label: p.name,
        status: "missing",
        detail: "No sessions recorded for this project",
        link: "/sessions",
      });
    }
  });

  return { id: "sessions", title: "Recent Sessions", items, link: "/sessions" };
}

export function getMissingUpdates(): HealthSection {
  const missing: HealthItem[] = [];

  // Memory with no next actions
  MEMORY.forEach((m) => {
    if (m.nextActions.length === 0) {
      const name = PROJECTS.find((p) => p.id === m.projectId)?.name ?? m.projectId;
      missing.push({
        label: `${name} — memory has no next actions`,
        status: "warning",
        detail: "Update data/memory.ts with next actions",
        link: "/memory",
      });
    }
  });

  // Stale sessions (partial/blocked with no follow-up)
  SESSIONS.filter((s) => s.status === "partial" || s.status === "blocked").forEach((s) => {
    missing.push({
      label: `${s.goal} — ${s.status} session`,
      status: "warning",
      detail: `${s.date} · follow-up actions may be outstanding`,
      link: "/sessions",
    });
  });

  // Draft packets older than creation (just flag all drafts)
  TASK_PACKETS.filter((p) => p.status === "draft").forEach((p) => {
    missing.push({
      label: `Task packet "${p.title}" is still draft`,
      status: "warning",
      detail: "Review and approve or delete",
      link: "/task-packets",
    });
  });

  if (missing.length === 0) {
    missing.push({ label: "No missing updates found", status: "ok", detail: "Builder OS data is current" });
  }

  return { id: "missing", title: "Missing Updates", items: missing };
}

export function getRecommendedAction(): string {
  // Priority order: blocked packets → release warnings → stale memory → in-progress tasks → draft packets
  const blockedPacket = TASK_PACKETS.find((p) => p.status === "blocked");
  if (blockedPacket) return `Resolve blocked task packet: "${blockedPacket.title}" in /task-packets.`;

  const releaseWarning = RELEASES.find(
    (r) => r.publicStatus === "needs-review" || r.publicStatus === "preparing-public"
  );
  if (releaseWarning) {
    const name = PROJECTS.find((p) => p.id === releaseWarning.projectId)?.name ?? releaseWarning.projectId;
    return `Review release pipeline for ${name} — marked "${releaseWarning.publicStatus.replace(/-/g, " ")}".`;
  }

  const inProgressTask = TASKS.find((t) => t.status === "in-progress");
  if (inProgressTask) return `Finish in-progress task: "${inProgressTask.title}" — check /tasks for next action.`;

  const staleMemory = MEMORY.find((m) => daysBetween(m.lastUpdated, TODAY) > STALE_MEMORY_DAYS);
  if (staleMemory) {
    const name = PROJECTS.find((p) => p.id === staleMemory.projectId)?.name ?? staleMemory.projectId;
    return `Update memory for ${name} — last updated ${daysBetween(staleMemory.lastUpdated, TODAY)} days ago.`;
  }

  const draftPacket = TASK_PACKETS.find((p) => p.status === "draft");
  if (draftPacket) return `Review and approve draft task packet: "${draftPacket.title}" in /task-packets.`;

  const readyTask = TASKS.find((t) => t.status === "ready");
  if (readyTask) return `Start ready task: "${readyTask.title}" — use /prompt-builder to generate an execution prompt.`;

  return "Builder OS looks healthy. Check /tasks for the next backlog item to pick up.";
}

// ─── All sections ─────────────────────────────────────────────────────────────

export function getAllHealthSections(): HealthSection[] {
  return [
    getProjectsHealth(),
    getTasksHealth(),
    getMemoryHealth(),
    getPacketsHealth(),
    getReleasesHealth(),
    getSessionsHealth(),
    getMissingUpdates(),
  ];
}

export function getOverallStatus(): HealthStatus {
  const sections = getAllHealthSections();
  const allItems = sections.flatMap((s) => s.items);
  if (allItems.some((i) => i.status === "missing")) return "missing";
  if (allItems.some((i) => i.status === "warning")) return "warning";
  if (allItems.some((i) => i.status === "stale")) return "stale";
  return "ok";
}
