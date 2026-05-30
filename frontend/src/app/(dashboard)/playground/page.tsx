"use client";

import { useState } from "react";
import { useCurrentAccount, useSuiClient, useSignPersonalMessage } from "@mysten/dapp-kit";
import { Send, Terminal, Loader2, Wallet, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { chatCompletions } from "@/lib/gateway";
import { API_KEY_REGISTRY_ID } from "@/lib/contract";
import { FadeInUp, ScaleIn } from "@/components/animations/Parallax";

interface ApiCap {
  id: string;
  owner: string;
  tier: number;
  isActive: boolean;
}

const MODELS = [
  "claude-sonnet-4",
  "gpt-4o",
  "gpt-4o-mini",
  "gemini-2.0-flash",
  "llama-3-70b",
  "mistral-large",
];

export default function PlaygroundPage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const { addToast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [caps, setCaps] = useState<ApiCap[]>([]);
  const [selectedCap, setSelectedCap] = useState<string>("");
  const [capsLoading, setCapsLoading] = useState(false);
  const [showCaps, setShowCaps] = useState(false);

  async function loadCaps() {
    if (!account) return;
    setCapsLoading(true);
    try {
      const fields = await client.getDynamicFields({ parentId: API_KEY_REGISTRY_ID, limit: 50 });
      const list: ApiCap[] = [];
      for (const f of fields.data) {
        try {
          const obj = await client.getObject({ id: f.objectId, options: { showContent: true } });
          if (obj.data?.content?.dataType !== "moveObject") continue;
          const ff = obj.data.content.fields as Record<string, unknown>;
          list.push({ id: f.objectId, owner: String(ff.owner || ""), tier: Number(ff.tier || 0), isActive: Boolean(ff.is_active as boolean) });
        } catch { /* skip */ }
      }
      const userCaps = list.filter((c) => c.owner === account.address && c.isActive);
      setCaps(userCaps);
      if (userCaps.length > 0 && !selectedCap) {
        setSelectedCap(userCaps[0].id);
      }
      setShowCaps(true);
    } catch (err) {
      console.error("Load caps error:", err);
    } finally {
      setCapsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!prompt.trim() || !selectedCap || !account) return;
    setLoading(true);
    setResponse("");

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = new TextEncoder().encode(`meai-${timestamp}`);

      const result = await signMessage({ message });

      await chatCompletions(
        {
          model,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        },
        {
          objectId: selectedCap,
          signature: result.signature,
          timestamp,
        },
        (fullText) => setResponse(fullText),
      );
    } catch (err) {
      addToast({ type: "error", title: "Request failed", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <FadeInUp>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Playground</h1>
        <p className="text-gray-500 mb-8">Test LLM models via the MeAi gateway with your Sui wallet.</p>

        {!account && (
          <div className="p-12 rounded-xl border border-gray-200 bg-white text-center">
            <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Connect your wallet to use the playground.</p>
          </div>
        )}

        {account && (
          <>
            {/* API Key Selector */}
            <div className="mb-6">
              <button
                onClick={loadCaps}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
              >
                <Key className="w-4 h-4" />
                {showCaps ? "Hide" : "Select"} API Key
              </button>

              {showCaps && (
                <ScaleIn delay={0.2} className="p-4 rounded-xl border border-gray-200 bg-white">
                  {capsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading API keys...
                    </div>
                  ) : caps.length === 0 ? (
                    <div className="text-sm text-gray-400">
                      No active API keys found.{""}
                      <a href="/api-keys" className="text-blue-600 hover:underline ml-1">
                        Mint one here
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your API Capability Objects
                      </p>
                      {caps.map((cap) => (
                        <label
                          key={cap.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCap === cap.id
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="cap"
                            value={cap.id}
                            checked={selectedCap === cap.id}
                            onChange={(e) => setSelectedCap(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono text-gray-700 truncate">{cap.id}</p>
                            <p className="text-xs text-gray-400">Tier {cap.tier}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </ScaleIn>
              )}
            </div>

            {!selectedCap && !capsLoading && (
              <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-700">
                Please select an API key above before sending prompts.
              </div>
            )}

            {/* Chat Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Type your prompt here..."
                  />
                  <div className="flex items-center justify-between mt-3">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {MODELS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <Button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || !selectedCap || loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Response</span>
                  </div>
                  {response ? (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {response}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 py-8 text-center">
                      {loading ? "Thinking..." : "Send a prompt to see the response."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </FadeInUp>
    </div>
  );
}
