/**
 * GET    /api/v1/agents/[id] — Get agent details
 * PATCH  /api/v1/agents/[id] — Update agent
 * DELETE /api/v1/agents/[id] — Delete agent
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgent, updateAgent, deleteAgent } from "../../../_lib/agents";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const agent = getAgent(id);
    if (!agent) {
      return NextResponse.json(
        { error: { message: "Agent not found", type: "not_found" } },
        { status: 404 },
      );
    }
    return NextResponse.json(agent);
  } catch (err) {
    return NextResponse.json(
      { error: { message: (err as Error).message, type: "server_error" } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const agent = updateAgent(id, body);
    if (!agent) {
      return NextResponse.json(
        { error: { message: "Agent not found", type: "not_found" } },
        { status: 404 },
      );
    }
    return NextResponse.json(agent);
  } catch (err) {
    return NextResponse.json(
      { error: { message: (err as Error).message, type: "server_error" } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = deleteAgent(id);
    if (!deleted) {
      return NextResponse.json(
        { error: { message: "Agent not found", type: "not_found" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: { message: (err as Error).message, type: "server_error" } },
      { status: 500 },
    );
  }
}
