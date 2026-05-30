/**
 * Agent Runtime — In-memory agent management and autonomous decision engine.
 *
 * Agents autonomously pick the cheapest model from their allowed list,
 * call SumoPod, track spending, log to Walrus, and settle on-chain.
 */
import { chatCompletion, type ChatMessage } from "./sumopod";
import { writeAuditLog } from "./walrus";
import { settleDeduction } from "./settlement";
import { MODELS, estimateTokenCount } from "./constants";

// ─── Types ──────────────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name: string;
  owner: string;
  systemPrompt: string;
  allowedModels: string[];
  dailyBudget: number;
  spentToday: number;
  isActive: boolean;
  createdAt: number;
}

export interface AgentDecision {
  model: string;
  provider: string;
  reason: string;
  inputPrice: number;
  outputPrice: number;
  estimatedCost: number;
  promptTokens: number;
  completionTokens: number;
}

export interface AgentChatResult {
  response: Response;
  decision: AgentDecision;
  requestId: string;
}

// ─── In-Memory Store ────────────────────────────────────────────

const agents = new Map<string, AgentConfig>();

export function createAgent(config: AgentConfig): AgentConfig {
  agents.set(config.id, config);
  return config;
}

export function getAgent(id: string): AgentConfig | undefined {
  return agents.get(id);
}

export function listAgents(owner?: string): AgentConfig[] {
  const all = Array.from(agents.values());
  if (owner) return all.filter((a) => a.owner === owner);
  return all;
}

export function updateAgent(id: string, updates: Partial<AgentConfig>): AgentConfig | undefined {
  const agent = agents.get(id);
  if (!agent) return undefined;
  Object.assign(agent, updates);
  return agent;
}

export function deleteAgent(id: string): boolean {
  return agents.delete(id);
}

// ─── Decision Engine ────────────────────────────────────────────

function pickCheapestModel(
  allowedModels: string[],
  inputTokens: number,
  outputTokens: number,
): AgentDecision {
  const available =
    allowedModels.length > 0
      ? MODELS.filter((m) => allowedModels.includes(m.id))
      : [...MODELS];

  if (available.length === 0) {
    const fallback = MODELS.find((m) => m.id === "gpt-4o-mini") || MODELS[0];
    return {
      model: fallback.id,
      provider: fallback.provider,
      reason: "No allowed models matched, fell back to default",
      inputPrice: fallback.inputPrice,
      outputPrice: fallback.outputPrice,
      estimatedCost: 0,
      promptTokens: 0,
      completionTokens: 0,
    };
  }

  available.sort(
    (a, b) => a.inputPrice + a.outputPrice - (b.inputPrice + b.outputPrice),
  );
  const best = available[0];
  const estimatedCost =
    (inputTokens * best.inputPrice + outputTokens * best.outputPrice) /
    1_000_000;

  const reason =
    available.length > 1
      ? `Cheapest model among ${available.length} allowed options`
      : `Only available model (${available.length} allowed)`;

  return {
    model: best.id,
    provider: best.provider,
    reason,
    inputPrice: best.inputPrice,
    outputPrice: best.outputPrice,
    estimatedCost,
    promptTokens: inputTokens,
    completionTokens: outputTokens,
  };
}

// ─── Agent Chat ─────────────────────────────────────────────────

export async function agentChat(
  agentId: string,
  messages: { role: string; content: string }[],
  quotaId: string,
  capId: string,
): Promise<AgentChatResult> {
  const agent = agents.get(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);
  if (!agent.isActive) throw new Error(`Agent ${agentId} is deactivated`);
  const agentName = agent.name;

  const inputTokens = messages.reduce(
    (sum, m) => sum + estimateTokenCount(m.content),
    0,
  );

  const decision = pickCheapestModel(agent.allowedModels, inputTokens, 256);

  const fullMessages: ChatMessage[] = [
    { role: "system", content: agent.systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const { response: llmResponse, usage } = await chatCompletion({
    model: decision.model,
    messages: fullMessages,
    stream: true,
    max_tokens: 4096,
    temperature: 0.7,
  });

  decision.promptTokens = usage.promptTokens;
  decision.completionTokens = usage.completionTokens;

  const requestId = crypto.randomUUID();
  const cost = usage.promptTokens + usage.completionTokens;

  // Fire-and-forget: audit log + settlement
  writeAuditLog({
    capId,
    model: decision.model,
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    cost,
    timestamp: Date.now(),
    requestId,
  });

  settleDeduction(quotaId, cost, decision.model);

  agent.spentToday += cost;

  // Prepend agent decision event to SSE stream
  const newHeaders = new Headers(llmResponse.headers);
  newHeaders.set("X-MeAi-Request-Id", requestId);
  newHeaders.set("X-MeAi-Agent-Id", agentId);
  newHeaders.set("X-MeAi-Agent-Decision", JSON.stringify(decision));
  newHeaders.set("X-MeAi-Agent-Spent", String(agent.spentToday));
  newHeaders.set("X-MeAi-Agent-Budget", String(agent.dailyBudget));

  const body = llmResponse.body
    ? new ReadableStream({
        start(controller) {
          const reader = llmResponse.body!.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          let started = false;
          async function push() {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!started) {
                started = true;
                const preamble = `data: ${JSON.stringify({ type: "agent_decision", decision, agent: agentName })}\n\n`;
                controller.enqueue(encoder.encode(preamble));
              }
              controller.enqueue(value);
            }
            controller.close();
          }
          push();
        },
      })
    : llmResponse.body;

  const finalResponse = new Response(body, {
    status: llmResponse.status,
    statusText: llmResponse.statusText,
    headers: newHeaders,
  });

  return { response: finalResponse, decision, requestId };
}
