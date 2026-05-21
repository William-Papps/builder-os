import { PROJECTS } from "@/data/projects";
import { PromptBuilder } from "@/app/_components/PromptBuilder";

export default function PromptBuilderPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-emerald-400">Builder OS</p>
        <h1 className="mt-2 text-4xl font-bold">Prompt Builder</h1>
        <p className="mt-3 max-w-2xl text-neutral-400">
          Select a project and task type to generate a ready-to-use prompt.
          Copy it into Claude Code, Codex, or Ruflo while inside that repo.
        </p>

        <div className="mt-10">
          <PromptBuilder projects={PROJECTS} />
        </div>
      </section>
    </main>
  );
}
