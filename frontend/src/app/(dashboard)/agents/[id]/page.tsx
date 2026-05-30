"use client";

import { useState, useEffect, use } from "react";
import { useCurrentAccount, useSuiClient, useSignPersonalMessage } from "@mysten/dapp-kit";
import { Bot, Send, Loader2, Wallet, Key, ArrowLeft, Brain, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FadeInUp } from "@/components/animations/Parallax";
import { API_KEY_REGISTRY_ID } from "@/lib/contract";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

interface Agent {
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

interface AgentDecision {
  model: string;
  provider: string;
  reason: string;
  inputPrice: number;
  outputPrice: number;
  estimatedCost: number;
  promptTokens: number;
  completionTokens: number;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const { addToast } = useToast();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastDecision, setLastDecision] = useState<AgentDecision | null>(null);
  const [caps, setCaps] = useState<{ id: string }[]>([]);
  const [selectedCap, setSelectedCap] = useState("");
  const [capsLoading, setCapsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${GATEWAY_URL}/v1/agents/${id}`);
        if (!res.ok) throw new Error("Agent not found");
        const data = await res.json();
        setAgent(data);
      } catch (err) {
        addToast({ type: "error", title: "Error", message: (err as Error).message });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id]);

  useEffect(() => {
    async function loadCaps() {
      if (!account) { setCapsLoading(false); return; }
      try {
        const fields = await suiClient.getDynamicFields({ parentId: API_KEY_REGISTRY_ID, limit: 50 });
        const list: { id: string; owner: string; isActive: boolean }[] = [];
        for (const f of fields.data) {
          try {
            const obj = await suiClient.getObject({ id: f.objectId, options: { showContent: true } });
            if (obj.data?.content?.dataType !== "moveObject") continue;
            const ff = obj.data.content.fields as Record<string, unknown>;
            list.push({ id: f.objectId, owner: String(ff.owner || ""), isActive: Boolean(ff.is_active as boolean) });
          } catch { /* skip */ }
        }
        const userCaps = list.filter((c) => c.owner === account.address && c.isActive);
        setCaps(userCaps);
        if (userCaps.length > 0) setSelectedCap(userCaps[0].id);
      } catch { /* ignore */ } finally {
        setCapsLoading(false);
      }
    }
    loadCaps();
  }, [account]);

  async function sendMessage() {
    if (!input.trim() || !selectedCap || !account || !agent) return;
    setSending(true);
    setLastDecision(null);

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const streamMessages = [...messages, userMsg];
    let fullContent = "";

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = new TextEncoder().encode(`meai-${timestamp}`);
      const result = await signMessage({ message });

      const response = await fetch(`${GATEWAY_URL}/v1/agents/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sui-Object-Id": selectedCap,
          "X-Sui-Signature": result.signature,
          "X-Sui-Timestamp": timestamp,
        },
        body: JSON.stringify({ messages: streamMessages }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "agent_decision") {
              setLastDecision(parsed.decision);
              continue;
            }

            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: fullContent };
                return copy;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      addToast({ type: "error", title: "Chat error", message: (err as Error).message });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        <Bot className="w-16 h-16 mx-auto text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Agent not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <FadeInUp>
        {/* Agent Header */}
        <div className="flex items-center gap-4 mb-6">
          <a href="/agents" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-sm text-gray-400 line-clamp-1">{agent.systemPrompt}</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div className="font-mono text-gray-600">{agent.spentToday.toLocaleString()} / {agent.dailyBudget.toLocaleString()}</div>
            <div className="text-gray-400">tokens used</div>
          </div>
        </div>

        {/* Decision Panel */}
        {lastDecision && (
          <div className="mb-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Agent Decision</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs block">Model</span>
                <span className="font-semibold text-gray-800">{lastDecision.model}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Provider</span>
                <span className="font-medium text-gray-600">{lastDecision.provider}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Tokens</span>
                <span className="font-mono text-gray-700">{lastDecision.promptTokens} in / {lastDecision.completionTokens} out</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Cost</span>
                <span className="font-mono text-gray-700">{lastDecision.estimatedCost.toFixed(4)} SUI</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {lastDecision.reason}
            </p>
          </div>
        )}

        {/* API Key Selector */}
        {!capsLoading && caps.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedCap}
              onChange={(e) => setSelectedCap(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            >
              {caps.map((cap) => (
                <option key={cap.id} value={cap.id}>{cap.id.slice(0, 16)}...</option>
              ))}
            </select>
            <a href="/api-keys" className="text-xs text-blue-600 hover:underline">Manage</a>
          </div>
        )}

        {!selectedCap && (
          <div className="mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-700 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Select an API key above or mint one in API Keys.
          </div>
        )}

        {/* Chat Messages */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="h-[50vh] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Gauge className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">Send a message to chat with {agent.name}.</p>
                <p className="text-gray-300 text-xs mt-1">The agent will autonomously choose the best model.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "order-1" : ""}`}>
                    <div className={`p-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-md"
                        : "bg-gray-100 text-gray-800 rounded-tl-md"
                    }`}>
                      {msg.content || <span className="text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin inline" /> Thinking...</span>}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-500">U</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={`Message ${agent.name}...`}
                disabled={sending || !selectedCap}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || sending || !selectedCap}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </FadeInUp>
    </div>
  );
}
