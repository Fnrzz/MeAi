/**
 * GET /api/v1/models
 * Returns available LLM models from on-chain registry or fallback list.
 */
import { NextResponse } from "next/server";
import { suiClient, MODEL_REGISTRY_ID } from "../../_lib/sui";
import { FALLBACK_MODELS } from "../../_lib/constants";

export async function GET() {
  try {
    const fields = await suiClient.getDynamicFields({
      parentId: MODEL_REGISTRY_ID,
      limit: 50,
    });
    const models = [];

    for (const field of fields.data) {
      try {
        const obj = await suiClient.getObject({
          id: field.objectId,
          options: { showContent: true },
        });
        if (obj.data?.content?.dataType === "moveObject") {
          const f = obj.data.content.fields as Record<string, unknown>;
          models.push({
            id: f.model_id || field.name,
            provider: f.provider || "unknown",
            input_price: f.input_price_per_1k,
            output_price: f.output_price_per_1k,
            object: "model",
          });
        }
      } catch {
        /* skip invalid entries */
      }
    }

    if (models.length === 0) {
      return NextResponse.json({ object: "list", data: FALLBACK_MODELS });
    }

    return NextResponse.json({ object: "list", data: models });
  } catch {
    return NextResponse.json({ object: "list", data: FALLBACK_MODELS });
  }
}
