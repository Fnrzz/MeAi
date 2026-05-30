/**
 * POST /api/v1/chat/completions
 * OpenAI-compatible chat completion endpoint with Sui wallet authentication.
 * Routes through SumoPod for all models.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyCapability } from "../../../_lib/auth";
import { chatCompletion } from "../../../_lib/sumopod";
import { settleDeduction } from "../../../_lib/settlement";
import { writeAuditLog } from "../../../_lib/walrus";

export async function POST(request: NextRequest) {
  try {
    const objectId = request.headers.get("x-sui-object-id");
    const signature = request.headers.get("x-sui-signature");
    const timestamp = request.headers.get("x-sui-timestamp");

    if (!objectId || !signature || !timestamp) {
      return NextResponse.json(
        {
          error: {
            message:
              "Missing Sui authentication headers. Set X-Sui-Object-Id, X-Sui-Signature, X-Sui-Timestamp.",
            type: "auth_error",
          },
        },
        { status: 401 },
      );
    }

    const quotaId = request.headers.get("x-sui-quota-id") || objectId;
    const body = await request.json();
    const model = body.model || "gpt-4o-mini";

    const auth = await verifyCapability(objectId, signature, timestamp, model);
    if (!auth.valid) {
      return NextResponse.json(
        { error: { message: auth.error, type: "auth_error" } },
        { status: 403 },
      );
    }

    const { response: llmResponse, usage } = await chatCompletion({
      model,
      messages: body.messages || [],
      stream: body.stream ?? true,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
    });

    const requestId = crypto.randomUUID();
    const cost = usage.promptTokens + usage.completionTokens;

    // Fire-and-forget: audit + settlement
    writeAuditLog({
      capId: objectId,
      model,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      cost,
      timestamp: Date.now(),
      requestId,
    });

    settleDeduction(quotaId, cost, model);

    const newHeaders = new Headers(llmResponse.headers);
    newHeaders.set("X-MeAi-Request-Id", requestId);
    newHeaders.set("X-MeAi-Cost", String(cost));

    return new Response(llmResponse.body, {
      status: llmResponse.status,
      statusText: llmResponse.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    console.error("Chat completion error:", err);
    return NextResponse.json(
      { error: { message: (err as Error).message, type: "server_error" } },
      { status: 500 },
    );
  }
}
