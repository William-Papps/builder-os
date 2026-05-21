import { PROJECTS } from "@/data/projects";
import { PromptsClient } from "@/app/_components/PromptsClient";

export default function PromptsPage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Prompt Library</h1>
            <p className="mt-3 max-w-xl text-neutral-400">
              Select a project, then copy a prompt into Claude Code, Codex, or Ruflo.
            </p>
          </div>
          <a
            href="/prompt-builder"
            className="shrink-0 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            Try Prompt Builder →
          </a>
        </div>

        <PromptsClient projects={PROJECTS} />
      </section>
    </main>
  );
}
