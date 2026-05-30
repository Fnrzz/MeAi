/**
 * GET  /api/v1/agents — List agents
 * POST /api/v1/agents — Create agent
 */
import { NextRequest, NextResponse } from "next/server";
import { createAgent, listAgents } from "../../_lib/agents";

export async function GET(request: NextRequest) {
  try {
    const owner = request.nextUrl.searchParams.get("owner") || undefined;
    const result = listAgents(owner);
    return NextResponse.json({ object: "list", data: result });
  } catch (err) {
    return NextResponse.json(
      { error: { message: (err as Error).message, type: "server_error" } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const owner = request.headers.get("x-sui-owner");
    if (!owner) {
      return NextResponse.json(
        { error: { message: "X-Sui-Owner header required", type: "auth_error" } },
        { status: 401 },
      );
    }

    const agent = createAgent({
      id: crypto.randomUUID(),
      name: body.name || "Unnamed Agent",
      owner,
      systemPrompt: body.system_prompt || "You are a helpful AI assistant.",
      allowedModels: body.allowed_models || [],
      dailyBudget: body.daily_budget || 100000,
      spentToday: 0,
      isActive: true,
      createdAt: Date.now(),
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (err) {
    console.error("Create agent error:", err);
    return NextResponse.json(
      { error: { message: (err as Error).message, type: "server_error" } },
      { status: 500 },
    );
  }
}
