import OpenAI from "openai";

export interface LLMRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

const CLAUDE_KEY = process.env.CLAUDE_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

const openai = new OpenAI({ apiKey: OPENAI_KEY });

const openaiModels = ["gpt-4o", "gpt-4o-mini"];
const claudeModels = ["claude-sonnet-4", "claude-opus-4"];
const geminiModels = ["gemini-2.0-flash"];
const openSource = ["llama-3-70b", "mistral-large"];

export function getProvider(model: string): string {
  if (openaiModels.includes(model)) return "openai";
  if (claudeModels.includes(model)) return "anthropic";
  if (geminiModels.includes(model)) return "google";
  if (openSource.includes(model)) return "atoma";
  return "openai";
}

export async function routeRequest(req: LLMRequest): Promise<Response> {
  const provider = getProvider(req.model);

  if (provider === "openai") {
    return routeOpenAI(req);
  }

  if (provider === "anthropic") {
    return routeClaude(req);
  }

  throw new Error(`Provider ${provider} not yet implemented in MVP`);
}

async function routeOpenAI(req: LLMRequest): Promise<Response> {
  const stream = await openai.chat.completions.create({
    model: req.model,
    messages: req.messages as any,
    stream: req.stream ?? true,
    max_tokens: req.max_tokens,
    temperature: req.temperature ?? 0.7,
  });

  if (req.stream) {
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream as any) {
            const data = JSON.stringify(chunk);
            controller.enqueue(`data: ${data}\n\n`);
          }
          controller.enqueue("data: [DONE]\n\n");
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  }

  const result = await stream as any;
  return Response.json(result);
}

async function routeClaude(req: LLMRequest): Promise<Response> {
  const systemMsg = req.messages.find((m) => m.role === "system");
  const userMsgs = req.messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: req.model,
      messages: userMsgs,
      system: systemMsg?.content,
      max_tokens: req.max_tokens || 1024,
      stream: req.stream ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude error: ${error}`);
  }

  if (req.stream) {
    return new Response(
      new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            controller.enqueue(text);
          }
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  }

  return response;
}
