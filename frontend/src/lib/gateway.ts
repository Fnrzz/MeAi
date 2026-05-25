const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export async function chatCompletions(
  params: ChatRequest,
  authHeaders: { objectId: string; signature: string; timestamp: string },
  onChunk?: (text: string) => void,
): Promise<string> {
  const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sui-Object-Id": authHeaders.objectId,
      "X-Sui-Signature": authHeaders.signature,
      "X-Sui-Timestamp": authHeaders.timestamp,
    },
    body: JSON.stringify({ ...params, stream: true }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || "";
        if (content) {
          fullText += content;
          onChunk?.(fullText);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

export async function fetchModels(): Promise<string[]> {
  const response = await fetch(`${GATEWAY_URL}/v1/models`);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.data || []).map((m: { id: string }) => m.id);
}
