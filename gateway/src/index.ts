import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { verifyCapability } from "./auth.js";
import { routeRequest, getProvider } from "./llm/router.js";
import { queueDeduction, startSettlementLoop } from "./settlement.js";
import { writeAuditLog } from "./walrus.js";
import { client, MODEL_REGISTRY_ID } from "./sui.js";

const app = new Hono();
app.use("/*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok", service: "meai-gateway", version: "1.0.0" }));

// List available models
const FALLBACK_MODELS = [
  { id: "claude-sonnet-4", provider: "anthropic", input_price: 800, output_price: 4000, object: "model" },
  { id: "gpt-4o", provider: "openai", input_price: 600, output_price: 2500, object: "model" },
  { id: "gpt-4o-mini", provider: "openai", input_price: 150, output_price: 600, object: "model" },
  { id: "gemini-2.0-flash", provider: "google", input_price: 50, output_price: 200, object: "model" },
  { id: "llama-3-70b", provider: "atoma", input_price: 100, output_price: 100, object: "model" },
  { id: "mistral-large", provider: "mistral", input_price: 200, output_price: 600, object: "model" },
];

app.get("/v1/models", async (c) => {
  try {
    const fields = await client.getDynamicFields({ parentId: MODEL_REGISTRY_ID, limit: 50 });
    const models = [];

    for (const field of fields.data) {
      try {
        const obj = await client.getObject({
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
      } catch { /* skip */ }
    }

    if (models.length === 0) {
      return c.json({ object: "list", data: FALLBACK_MODELS });
    }

    return c.json({ object: "list", data: models });
  } catch {
    return c.json({ object: "list", data: FALLBACK_MODELS });
  }
});

// Chat completions
app.post("/v1/chat/completions", async (c) => {
  try {
    const objectId = c.req.header("x-sui-object-id");
    const signature = c.req.header("x-sui-signature");
    const timestamp = c.req.header("x-sui-timestamp");

    if (!objectId || !signature || !timestamp) {
      return c.json({
        error: {
          message: "Missing Sui authentication headers. Set X-Sui-Object-Id, X-Sui-Signature, X-Sui-Timestamp.",
          type: "auth_error",
        },
      }, 401);
    }

    const body = await c.req.json();
    const model = body.model || "claude-sonnet-4";

    const auth = await verifyCapability(objectId, signature, timestamp, model);
    if (!auth.valid) {
      return c.json({ error: { message: auth.error, type: "auth_error" } }, 403);
    }

    const llmResponse = await routeRequest({
      model,
      messages: body.messages || [],
      stream: body.stream ?? true,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
    });

    const requestId = crypto.randomUUID();

    writeAuditLog({
      capId: objectId,
      model,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      timestamp: Date.now(),
      requestId,
    });

    return llmResponse;
  } catch (err) {
    console.error("Request error:", err);
    return c.json({ error: { message: (err as Error).message, type: "server_error" } }, 500);
  }
});

// Embeddings
app.post("/v1/embeddings", async (c) => {
  return c.json({ error: { message: "Embeddings endpoint coming soon", type: "not_implemented" } }, 501);
});

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

startSettlementLoop();

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`\n  🧠 MeAi Gateway`);
  console.log(`  ─────────────────`);
  console.log(`  Local:   http://localhost:${info.port}`);
  console.log(`  Health:  http://localhost:${info.port}/health`);
  console.log(`  Models:  http://localhost:${info.port}/v1/models\n`);
});
