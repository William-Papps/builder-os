import { NextRequest, NextResponse } from "next/server";
import { createSandbox, getSandboxStatus, deleteSandbox, getSandboxPath } from "@/lib/sandbox";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskPacketId, repoPath, taskPacketContent, action } = body;

    if (!taskPacketId || typeof taskPacketId !== "string" || !taskPacketId.trim()) {
      return NextResponse.json({ error: "taskPacketId is required" }, { status: 400 });
    }

    if (action === "delete") {
      const sandboxPath = getSandboxPath(taskPacketId);
      deleteSandbox(taskPacketId);
      return NextResponse.json({ success: true, sandboxPath });
    }

    if (action === "status") {
      const status = getSandboxStatus(taskPacketId);
      return NextResponse.json(status);
    }

    // Default: create
    if (!repoPath || typeof repoPath !== "string" || !repoPath.trim()) {
      return NextResponse.json({ error: "repoPath is required for sandbox creation" }, { status: 400 });
    }

    const result = createSandbox(
      taskPacketId.trim(),
      repoPath.trim(),
      typeof taskPacketContent === "string" ? taskPacketContent : undefined
    );

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
