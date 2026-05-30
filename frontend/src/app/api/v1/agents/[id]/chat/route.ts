/**
 * POST /api/v1/agents/[id]/chat
 * Autonomous agent chat — agent picks model, calls SumoPod, pays on-chain.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyCapability } from "../../../../_lib/auth";
import { agentChat } from "../../../../_lib/agents";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: agentId } = await params;
    const objectId = request.headers.get("x-sui-object-id");
    const signature = request.headers.get("x-sui-signature");
    const timestamp = request.headers.get("x-sui-timestamp");

    if (!objectId || !signature || !timestamp) {
      return NextResponse.json(
        { error: { message: "Missing Sui auth headers", type: "auth_error" } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const quotaId = request.headers.get("x-sui-quota-id") || objectId;

    const auth = await verifyCapability(objectId, signature, timestamp, "agent");
    if (!auth.valid) {
      return NextResponse.json(
        { error: { message: auth.error, type: "auth_error" } },
        { status: 403 },
      );
    }

    const { response } = await agentChat(
      agentId,
      body.messages || [],
      quotaId,
      objectId,
    );

    return response;
  } catch (err) {
    console.error("Agent chat error:", err);
    return NextResponse.json(
      { error: { message: (err as Error).message, type: "server_error" } },
      { status: 500 },
    );
  }
}
