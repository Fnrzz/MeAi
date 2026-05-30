/**
 * SumoPod LLM Client
 *
 * Single OpenAI-compatible client that replaces 5 individual provider
 * implementations. All models accessible through one API key via SumoPod.
 *
 * Base URL: https://ai.sumopod.com/v1
 */
import OpenAI from "openai";
import { SUMOPOD_API_KEY, SUMOPOD_BASE_URL, estimateTokenCount } from "./constants";

const client = new OpenAI({
  apiKey: SUMOPOD_API_KEY,
  baseURL: SUMOPOD_BASE_URL,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResponse {
  response: Response;
  usage: TokenUsage;
}

/**
 * Route a chat request through SumoPod.
 * Supports streaming (SSE) and non-streaming responses.
 */
export async function chatCompletion(req: ChatRequest): Promise<LLMResponse> {
  const promptTokens = req.messages.reduce(
    (sum, m) => sum + estimateTokenCount(m.content),
    0,
  );

  const stream = await client.chat.completions.create({
    model: req.model,
    messages: req.messages,
    stream: req.stream ?? true,
    max_tokens: req.max_tokens,
    temperature: req.temperature ?? 0.7,
  });

  if (req.stream) {
    let completionTokens = 0;

    const body = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
          const delta = chunk.choices?.[0]?.delta?.content || "";
          completionTokens += estimateTokenCount(delta);
          const data = JSON.stringify(chunk);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    const response = new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-MeAi-Prompt-Tokens": String(promptTokens),
        "X-MeAi-Completion-Tokens": String(completionTokens),
      },
    });

    return {
      response,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  // Non-streaming
  const result = stream as unknown as OpenAI.Chat.Completions.ChatCompletion;
  const completionTokens =
    result.usage?.completion_tokens ||
    estimateTokenCount(result.choices?.[0]?.message?.content || "");

  return {
    response: Response.json(result),
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
}

export { client as sumopodClient };
