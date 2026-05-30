import OpenAI from "openai";

export interface LLMRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMProviderResponse {
  response: Response;
  usage: TokenUsage;
}

const CLAUDE_KEY = process.env.CLAUDE_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || "";
const ATOMA_KEY = process.env.ATOMA_API_KEY || "";

const openai = new OpenAI({ apiKey: OPENAI_KEY });

const openaiModels = ["gpt-4o", "gpt-4o-mini"];
const claudeModels = ["claude-sonnet-4", "claude-opus-4"];
const geminiModels = ["gemini-2.0-flash"];
const atomaModels = ["llama-3-70b"];
const mistralModels = ["mistral-large"];

export function getProvider(model: string): string {
  if (openaiModels.includes(model)) return "openai";
  if (claudeModels.includes(model)) return "anthropic";
  if (geminiModels.includes(model)) return "google";
  if (atomaModels.includes(model)) return "atoma";
  if (mistralModels.includes(model)) return "mistral";
  return "openai";
}

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

function countStreamChunks(chunks: string[]): number {
  return chunks.reduce((sum, c) => sum + Math.ceil(c.length / 4), 0);
}

export async function routeRequest(req: LLMRequest): Promise<LLMProviderResponse> {
  const provider = getProvider(req.model);
  const promptTokens = req.messages.reduce((sum, m) => sum + estimateTokenCount(m.content), 0);

  switch (provider) {
    case "openai":
      return routeOpenAI(req, promptTokens);
    case "anthropic":
      return routeClaude(req, promptTokens);
    case "google":
      return routeGemini(req, promptTokens);
    case "atoma":
      return routeAtoma(req, promptTokens);
    case "mistral":
      return routeMistral(req, promptTokens);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function routeOpenAI(req: LLMRequest, promptTokens: number): Promise<LLMProviderResponse> {
  const stream = await openai.chat.completions.create({
    model: req.model,
    messages: req.messages as any,
    stream: req.stream ?? true,
    max_tokens: req.max_tokens,
    temperature: req.temperature ?? 0.7,
  });

  if (req.stream) {
    let completionTokens = 0;

    const body = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream as any) {
          const delta = chunk.choices?.[0]?.delta?.content || "";
          completionTokens += estimateTokenCount(delta);
          const data = JSON.stringify(chunk);
          controller.enqueue(`data: ${data}\n\n`);
        }
        controller.enqueue("data: [DONE]\n\n");
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

    return { response, usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens } };
  }

  const result = await (stream as any);
  const completionTokens = result.usage?.completion_tokens || estimateTokenCount(result.choices?.[0]?.message?.content || "");

  return {
    response: Response.json(result),
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
}

async function routeClaude(req: LLMRequest, promptTokens: number): Promise<LLMProviderResponse> {
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
    let completionTokens = 0;
    let buffer = "";

    const body = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          buffer += text;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  completionTokens += estimateTokenCount(parsed.delta.text);
                }
              } catch {}
            }
          }
          controller.enqueue(text);
        }
        controller.enqueue("\n");
        controller.close();
      },
    });

    const proxyResponse = new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-MeAi-Prompt-Tokens": String(promptTokens),
        "X-MeAi-Completion-Tokens": String(completionTokens),
      },
    });

    return { response: proxyResponse, usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens } };
  }

  return {
    response,
    usage: { promptTokens, completionTokens: 0, totalTokens: promptTokens },
  };
}

async function routeGemini(req: LLMRequest, promptTokens: number): Promise<LLMProviderResponse> {
  const geminiModel = req.model === "gemini-2.0-flash" ? "gemini-2.0-flash" : "gemini-2.0-flash";

  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : m.role,
    parts: [{ text: m.content }],
  }));

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error: ${error}`);
  }

  let completionTokens = 0;

  const body = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        try {
          for (const line of text.split("\n").filter((l) => l.startsWith("data: "))) {
            const parsed = JSON.parse(line.slice(6));
            const candidateText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            completionTokens += estimateTokenCount(candidateText);
          }
        } catch {}
        controller.enqueue(text);
      }
      controller.close();
    },
  });

  const proxyResponse = new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-MeAi-Prompt-Tokens": String(promptTokens),
      "X-MeAi-Completion-Tokens": String(completionTokens),
    },
  });

  return { response: proxyResponse, usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens } };
}

async function routeAtoma(req: LLMRequest, promptTokens: number): Promise<LLMProviderResponse> {
  const response = await fetch("https://api.atoma.network/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ATOMA_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages: req.messages,
      stream: req.stream ?? true,
      max_tokens: req.max_tokens || 1024,
      temperature: req.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Atoma error: ${error}`);
  }

  if (req.stream) {
    let completionTokens = 0;

    const body = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          for (const line of text.split("\n").filter((l) => l.startsWith("data: "))) {
            if (line === "data: [DONE]") continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || "";
              completionTokens += estimateTokenCount(delta);
            } catch {}
          }
          controller.enqueue(text);
        }
        controller.close();
      },
    });

    const proxyResponse = new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-MeAi-Prompt-Tokens": String(promptTokens),
        "X-MeAi-Completion-Tokens": String(completionTokens),
      },
    });

    return { response: proxyResponse, usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens } };
  }

  const result = await response.json();
  const completionTokens = result.usage?.completion_tokens || 0;

  return {
    response: Response.json(result),
    usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
  };
}

async function routeMistral(req: LLMRequest, promptTokens: number): Promise<LLMProviderResponse> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: req.messages,
      stream: req.stream ?? true,
      max_tokens: req.max_tokens || 1024,
      temperature: req.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral error: ${error}`);
  }

  if (req.stream) {
    let completionTokens = 0;

    const body = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          for (const line of text.split("\n").filter((l) => l.startsWith("data: "))) {
            if (line === "data: [DONE]") continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || "";
              completionTokens += estimateTokenCount(delta);
            } catch {}
          }
          controller.enqueue(text);
        }
        controller.close();
      },
    });

    const proxyResponse = new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-MeAi-Prompt-Tokens": String(promptTokens),
        "X-MeAi-Completion-Tokens": String(completionTokens),
      },
    });

    return { response: proxyResponse, usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens } };
  }

  const result = await response.json();
  const completionTokens = result.usage?.completion_tokens || 0;

  return {
    response: Response.json(result),
    usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
  };
}
