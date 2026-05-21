export type Brief = {
  id: string;
  createdDate: string;
  rawIdea: string;
  projectId: string;
  problem: string;
  targetUser: string;
  desiredOutcome: string;
  featuresWanted: string[];
  featuresNotYet: string[];
  risks: string[];
  firstTask: string;
};

export const BRIEFS: Brief[] = [
  {
    id: "builder-os-command-page",
    createdDate: "2026-05-21",
    rawIdea:
      "Improve Builder OS so it can manage my projects and generate prompts without wasting tokens.",
    projectId: "builder-os",
    problem:
      "When starting a work session, I have to manually hunt through projects, tasks, memory, and sessions to figure out what to do next. This wastes time and context window tokens when asking AI for help.",
    targetUser:
      "Me — the solo developer using Builder OS daily to manage AI-assisted project work.",
    desiredOutcome:
      "A single starting page that shows the top recommended task, project context, and a ready-to-copy prompt — so I can start work in under 30 seconds.",
    featuresWanted: [
      "Daily Command page (/command) with top recommended task",
      "Pre-built prompt that includes relevant project context",
      "Release warning if any project needs attention before going public",
      "Quick links to every Builder OS section from one place",
    ],
    featuresNotYet: [
      "Live agent execution from the dashboard",
      "Automatic task updates from AI sessions",
      "Cross-project task dependencies",
      "Notifications or reminders",
      "Multi-user support or sharing",
    ],
    risks: [
      "Dashboard becomes cluttered if too many sections are added",
      "Recommendation logic may surface wrong task if task statuses are stale",
      "data/tasks.ts needs manual updates after each session — easy to forget",
    ],
    firstTask:
      "Build /command page with static recommendation logic derived from data/tasks.ts — no database, no agents, read-only",
  },
];

export const BRIEF_MAP: Record<string, Brief> = Object.fromEntries(
  BRIEFS.map((b) => [b.id, b])
);
