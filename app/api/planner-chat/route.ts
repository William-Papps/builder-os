import { NextRequest, NextResponse } from "next/server";
import { routePlanner, PlannerMode } from "@/lib/ai/router";

const VALID_MODES = new Set<string>([
  "brainstorm",
  "sdlc",
  "task-packet",
  "review",
  "scope-extract",
  "final-plan",
]);

interface BrainstormStructured {
  assistantMessage?: string;
  detectedIntent?: string;
  currentStage?: string;
  missingInfo?: string[];
  readyForScopeLock?: boolean;
  readyForFinalPlan?: boolean;
  suggestedNextQuestions?: string[];
  confidence?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, mode, stage, projectContext } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!mode || !VALID_MODES.has(mode)) {
      return NextResponse.json(
        { error: `mode must be one of: ${[...VALID_MODES].join(", ")}` },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json(
          { error: "message role must be 'user' or 'assistant'" },
          { status: 400 }
        );
      }
      if (!msg.content || typeof msg.content !== "string" || !msg.content.trim()) {
        return NextResponse.json(
          { error: "each message must have non-empty string content" },
          { status: 400 }
        );
      }
    }

    const trimmed = messages.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content.trim(),
    }));

    // final-plan: prepend approved scope context as the primary user message
    const finalMessages =
      mode === "final-plan" && projectContext
        ? [
            {
              role: "user" as const,
              content: `Approved project scope:\n\n${projectContext}\n\nGenerate the complete final plan now.`,
            },
          ]
        : trimmed;

    const result = await routePlanner(finalMessages, mode as PlannerMode);

    // For brainstorm mode the AI returns JSON — parse it into structured fields
    if (mode === "brainstorm") {
      const cleaned = result.content
        .replace(/^```[a-z]*\n?/gm, "")
        .replace(/^```$/gm, "")
        .trim();

      try {
        const parsed = JSON.parse(cleaned) as BrainstormStructured;
        return NextResponse.json({
          assistantMessage: parsed.assistantMessage ?? result.content,
          detectedIntent: parsed.detectedIntent ?? "unclear",
          currentStage: parsed.currentStage ?? stage ?? "clarifying",
          missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : [],
          readyForScopeLock: Boolean(parsed.readyForScopeLock),
          readyForFinalPlan: Boolean(parsed.readyForFinalPlan),
          suggestedNextQuestions: Array.isArray(parsed.suggestedNextQuestions)
            ? parsed.suggestedNextQuestions
            : [],
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
          provider: result.provider,
          model: result.model,
        });
      } catch {
        // JSON parse failed — return raw content as assistantMessage with neutral metadata
        return NextResponse.json({
          assistantMessage: result.content,
          detectedIntent: "unclear",
          currentStage: stage ?? "clarifying",
          missingInfo: [],
          readyForScopeLock: false,
          readyForFinalPlan: result.content.includes("[SCOPE_READY]"),
          suggestedNextQuestions: [],
          confidence: 0.5,
          provider: result.provider,
          model: result.model,
        });
      }
    }

    // All other modes return plain content
    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const isConfig =
      message.includes("API key") ||
      message.includes("not set") ||
      message.includes("No API keys");
    return NextResponse.json({ error: message }, { status: isConfig ? 503 : 500 });
  }
}
