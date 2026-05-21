export type SDLCSection =
  | "ideaSummary"
  | "problemStatement"
  | "goals"
  | "targetUsers"
  | "functionalRequirements"
  | "nonFunctionalRequirements"
  | "constraints"
  | "assumptions"
  | "risks"
  | "architecture"
  | "dataStorage"
  | "uiPages"
  | "implementationPhases"
  | "testingPlan"
  | "deploymentPlan"
  | "agentExecutionPlan";

export type SDLCSectionMeta = {
  id: SDLCSection;
  title: string;
  description: string;
  exampleItems: string[];
};

export const SDLC_SECTIONS: SDLCSectionMeta[] = [
  {
    id: "ideaSummary",
    title: "Idea Summary",
    description: "One clear sentence describing what you are building and why.",
    exampleItems: [
      "A conversation-first AI planning system that turns rough ideas into structured SDLC documents.",
    ],
  },
  {
    id: "problemStatement",
    title: "Problem Statement",
    description: "The specific problem this solves. Who has it? How painful is it?",
    exampleItems: [
      "Developers lose time translating rough ideas into structured specs.",
      "AI agents need clear task packets to work reliably — not vague verbal briefs.",
    ],
  },
  {
    id: "goals",
    title: "Goals",
    description: "What success looks like in concrete, measurable terms.",
    exampleItems: [
      "A rough idea becomes a full SDLC document in one conversation.",
      "Task packets can be handed to an agent without further clarification.",
      "No feature is built without an approved brief.",
    ],
  },
  {
    id: "targetUsers",
    title: "Target Users",
    description: "Who will use this? Be specific — not 'developers', but which kind.",
    exampleItems: [
      "Solo builders working with Claude Code and Ruflo agents.",
      "Small teams who want structured AI-assisted planning without heavy project management tools.",
    ],
  },
  {
    id: "functionalRequirements",
    title: "Functional Requirements",
    description: "What the system must do. User-facing behaviours.",
    exampleItems: [
      "FR-01: User can input a rough idea in plain text.",
      "FR-02: System asks clarifying questions before producing a spec.",
      "FR-03: System generates a full SDLC document from an approved idea.",
      "FR-04: System creates task packets from an approved SDLC.",
      "FR-05: Task packets can be reviewed and approved before agent execution.",
    ],
  },
  {
    id: "nonFunctionalRequirements",
    title: "Non-Functional Requirements",
    description: "Quality attributes: performance, security, reliability, scalability.",
    exampleItems: [
      "NFR-01: Page load under 1s on local dev.",
      "NFR-02: No private data stored in any external service.",
      "NFR-03: All AI prompts must be copyable without live API calls in MVP.",
      "NFR-04: TypeScript strict mode. No build errors.",
    ],
  },
  {
    id: "constraints",
    title: "Constraints",
    description: "Hard limits that cannot be changed — tech, legal, time, budget.",
    exampleItems: [
      "No external database in MVP.",
      "No auth in MVP.",
      "Must run locally on Next.js with no required cloud dependencies.",
      "No live agent execution in Phase 1.",
    ],
  },
  {
    id: "assumptions",
    title: "Assumptions",
    description: "Things believed to be true that could be wrong. Name them explicitly.",
    exampleItems: [
      "Users have Claude Code or Ruflo already installed.",
      "One user per installation — no multi-tenant needs.",
      "File-based data is acceptable in MVP.",
    ],
  },
  {
    id: "risks",
    title: "Risks",
    description: "What could go wrong? Rate each HIGH / MEDIUM / LOW.",
    exampleItems: [
      "HIGH: Scope creep — feature list grows before core loop is proven.",
      "MEDIUM: SDLC template too rigid — doesn't fit non-standard projects.",
      "LOW: Next.js 16 breaking changes missed by AI agent.",
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "High-level system design. What components exist and how they connect.",
    exampleItems: [
      "Next.js App Router (no API routes in MVP).",
      "Static data files in data/ as source of truth.",
      "Client components only where interactivity is needed.",
      "No backend, no database, no external API in MVP.",
    ],
  },
  {
    id: "dataStorage",
    title: "Data & Storage",
    description: "Where data lives, how it flows, what is persisted.",
    exampleItems: [
      "Phase 1: data/*.ts files (hardcoded).",
      "Phase 2: Local JSON files written by the UI.",
      "Phase 3: SQLite or similar local database.",
      "No external cloud storage.",
    ],
  },
  {
    id: "uiPages",
    title: "UI / Pages",
    description: "Every page or screen that needs to exist.",
    exampleItems: [
      "/ — Homepage with Planner Chat CTA.",
      "/planner-chat — Main idea-to-SDLC workflow.",
      "/sdlc-plans — List of approved SDLC plans.",
      "/sdlc-plans/[id] — Full SDLC plan detail.",
      "/task-packets — Approved task packets ready for agents.",
      "/sessions — History of agent sessions.",
    ],
  },
  {
    id: "implementationPhases",
    title: "Implementation Phases",
    description: "Ordered phases. Each phase must be shippable on its own.",
    exampleItems: [
      "Phase 1: Static planner workspace — idea input, SDLC template display, prompt copy.",
      "Phase 2: Local state — user fills SDLC fields in-browser, saved to localStorage.",
      "Phase 3: File persistence — save SDLC plans to local JSON.",
      "Phase 4: Live AI — connect planner chat to Claude API.",
      "Phase 5: Agent dispatch — send approved task packets to Claude Code/Ruflo.",
    ],
  },
  {
    id: "testingPlan",
    title: "Testing Plan",
    description: "How correctness is verified at each phase.",
    exampleItems: [
      "Phase 1: npm run build passes with zero errors.",
      "Phase 2: Manual walkthrough of full idea → SDLC → task packet flow.",
      "Phase 3: Verify JSON files written correctly after form submission.",
      "Phase 4: Verify AI responses match SDLC template structure.",
    ],
  },
  {
    id: "deploymentPlan",
    title: "Deployment Plan",
    description: "How and where this is deployed. Environment requirements.",
    exampleItems: [
      "MVP: Local only — npm run dev on developer machine.",
      "Phase 2: Private Vercel deployment (no public access).",
      "No Docker required in Phase 1.",
    ],
  },
  {
    id: "agentExecutionPlan",
    title: "Agent Execution Plan",
    description: "Which agents will execute which task packets, and in what order.",
    exampleItems: [
      "Agent: Claude Code — implement UI changes in builder-os.",
      "Agent: Ruflo — run automated tests after each phase.",
      "Approval required before each agent is dispatched.",
      "Agent must return build result before task is marked complete.",
    ],
  },
];

export type SDLCPlan = {
  id: string;
  title: string;
  projectId: string;
  status: "draft" | "approved" | "in-progress" | "complete";
  createdAt: string;
  idea: string;
  sections: Partial<Record<SDLCSection, string[]>>;
};

export const EXAMPLE_SDLC_PLANS: SDLCPlan[] = [
  {
    id: "builder-os-conversation-first",
    title: "Builder OS — Conversation-First Development System",
    projectId: "builder-os",
    status: "approved",
    createdAt: "2026-05-21",
    idea:
      "Rebuild Builder OS so the core workflow is: talk to a Planner AI → get a full SDLC document → create approved task packets → dispatch to agents.",
    sections: {
      ideaSummary: [
        "A private AI planning system where every project starts with a planner conversation, not a blank page.",
      ],
      problemStatement: [
        "Ideas entered directly into Claude Code without structure lead to scope creep and broken implementations.",
        "Agents need precise, approved task packets — not verbal briefs — to work reliably.",
        "There is no single tool that takes a messy idea all the way to an agent-ready task packet.",
      ],
      goals: [
        "A rough idea becomes a structured SDLC document through guided conversation.",
        "Every approved SDLC automatically generates task packets.",
        "No code is written by an agent without an approved task packet.",
        "The system is usable in Phase 1 without any live AI or database.",
      ],
      targetUsers: [
        "William — solo builder using Claude Code, Ruflo, and Codex for all development work.",
        "Future: small builder teams who want AI-assisted planning without heavyweight PM tools.",
      ],
      functionalRequirements: [
        "FR-01: /planner-chat shows idea input placeholder, planner questions, SDLC sections, implementation plan, and task packet preview.",
        "FR-02: /sdlc-plans lists all approved SDLC plans.",
        "FR-03: Each SDLC plan shows all 16 structured sections.",
        "FR-04: Prompts exist for: Planner Conversation, Generate Full SDLC, Execute Task Packet.",
        "FR-05: Homepage CTA is 'Start Planner Chat'.",
        "FR-06: Navigation links: Planner Chat, Projects, SDLC Plans, Task Packets, Agent Execution, Sessions.",
      ],
      nonFunctionalRequirements: [
        "NFR-01: npm run build passes with zero TypeScript errors.",
        "NFR-02: No external API calls in Phase 1.",
        "NFR-03: All prompts are copyable to clipboard.",
        "NFR-04: Pages load under 500ms on localhost.",
      ],
      constraints: [
        "No live AI API in Phase 1.",
        "No database in Phase 1.",
        "No auth at any phase.",
        "All pages in app/ directory (Next.js App Router).",
        "TypeScript only — no JavaScript files.",
      ],
      assumptions: [
        "Single user — no multi-tenant requirements.",
        "Claude Code and Ruflo are available on the local machine.",
        "Data files in data/*.ts are acceptable as the source of truth in Phase 1.",
      ],
      risks: [
        "HIGH: Scope creep — adding live AI before the static workflow is proven.",
        "MEDIUM: SDLC template becomes too rigid for non-software projects.",
        "LOW: Next.js 16 deprecation warnings missed during implementation.",
      ],
      architecture: [
        "Next.js 16 App Router — all pages in app/ directory.",
        "Static TypeScript data files in data/ as source of truth.",
        "No API routes in Phase 1.",
        "Client components only where state or interaction is needed.",
        "Tailwind CSS v4 for styling.",
      ],
      dataStorage: [
        "Phase 1: data/*.ts hardcoded TypeScript files.",
        "Phase 2: localStorage for in-browser SDLC draft state.",
        "Phase 3: Local JSON file persistence.",
        "Phase 4: SQLite via better-sqlite3 (local only).",
      ],
      uiPages: [
        "/ — Homepage with 'Start Planner Chat' as primary CTA.",
        "/planner-chat — Main workflow: idea → SDLC → task packets.",
        "/sdlc-plans — List of SDLC plans.",
        "/projects — Connected project registry.",
        "/task-packets — Approved agent task packets.",
        "/sessions — Agent session history.",
      ],
      implementationPhases: [
        "Phase 1 (NOW): Static planner workspace. Idea input placeholder, SDLC template display, prompt copy buttons. No live AI.",
        "Phase 2: In-browser state. User fills SDLC fields. Saved to localStorage.",
        "Phase 3: File persistence. SDLC plans saved as JSON. Task packets generated from SDLC.",
        "Phase 4: Live AI planner. Connect /planner-chat to Claude API for real conversation.",
        "Phase 5: Agent dispatch. Send approved task packets to Claude Code/Ruflo automatically.",
      ],
      testingPlan: [
        "Phase 1: npm run build passes. All pages render without errors.",
        "Phase 2: Manual flow test — idea → SDLC fields → task packet preview.",
        "Phase 3: Verify JSON written correctly to disk.",
        "Phase 4: Verify AI planner responses match SDLC template structure.",
        "Phase 5: Verify agent receives correct task packet and returns build result.",
      ],
      deploymentPlan: [
        "Phase 1–3: Local only. npm run dev.",
        "Phase 4+: Private Vercel deployment. No public access.",
      ],
      agentExecutionPlan: [
        "Agent: Claude Code — implement Phase 1 UI (builder-os repo).",
        "Agent: Ruflo — run npm run build after each phase.",
        "Dispatch requires: approved task packet + explicit user approval.",
        "Agent returns: list of changed files + build result.",
        "No automatic push or deploy without explicit user instruction.",
      ],
    },
  },
];
