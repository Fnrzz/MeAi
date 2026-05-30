"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient, useSignPersonalMessage } from "@mysten/dapp-kit";
import { Bot, Plus, Loader2, Wallet, Trash2, Radio, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FadeInUp, ScaleIn } from "@/components/animations/Parallax";
import { API_KEY_REGISTRY_ID } from "@/lib/contract";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

const ALL_MODELS = [
  "claude-sonnet-4", "gpt-4o", "gpt-4o-mini",
  "gemini-2.0-flash", "llama-3-70b", "mistral-large",
];

interface ApiCap {
  id: string;
  owner: string;
  tier: number;
  isActive: boolean;
}

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

export default function AgentsPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const { addToast } = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [caps, setCaps] = useState<ApiCap[]>([]);
  const [selectedCap, setSelectedCap] = useState("");
  const [capsLoading, setCapsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    systemPrompt: "You are a helpful AI assistant.",
    dailyBudget: 100000,
    allowedModels: [] as string[],
  });

  async function loadAgents() {
    if (!account) return;
    setLoading(true);
    try {
      const res = await fetch(`${GATEWAY_URL}/v1/agents?owner=${account.address}`);
      if (!res.ok) throw new Error("Failed to load agents");
      const data = await res.json();
      setAgents(data.data || []);
    } catch (err) {
      console.error("Load agents error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCaps() {
    if (!account) return;
    setCapsLoading(true);
    try {
      const fields = await suiClient.getDynamicFields({ parentId: API_KEY_REGISTRY_ID, limit: 50 });
      const list: ApiCap[] = [];
      for (const f of fields.data) {
        try {
          const obj = await suiClient.getObject({ id: f.objectId, options: { showContent: true } });
          if (obj.data?.content?.dataType !== "moveObject") continue;
          const ff = obj.data.content.fields as Record<string, unknown>;
          list.push({ id: f.objectId, owner: String(ff.owner || ""), tier: Number(ff.tier || 0), isActive: Boolean(ff.is_active as boolean) });
        } catch { /* skip */ }
      }
      setCaps(list.filter((c) => c.owner === account.address && c.isActive));
    } catch (err) {
      console.error("Load caps error:", err);
    } finally {
      setCapsLoading(false);
    }
  }

  useEffect(() => {
    if (account) loadAgents();
    else setLoading(false);
  }, [account]);

  async function createAgent() {
    if (!form.name.trim() || !selectedCap || !account) return;
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = new TextEncoder().encode(`meai-${timestamp}`);
      const result = await signMessage({ message });

      const res = await fetch(`${GATEWAY_URL}/v1/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sui-Object-Id": selectedCap,
          "X-Sui-Signature": result.signature,
          "X-Sui-Timestamp": timestamp,
          "X-Sui-Owner": account.address,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to create agent");
      }

      addToast({ type: "success", title: "Agent created!", message: `${form.name} is ready.` });
      setShowCreate(false);
      setForm({ name: "", systemPrompt: "You are a helpful AI assistant.", dailyBudget: 100000, allowedModels: [] });
      loadAgents();
    } catch (err) {
      addToast({ type: "error", title: "Error", message: (err as Error).message });
    }
  }

  async function deleteAgent(agentId: string) {
    if (!account) return;
    try {
      const res = await fetch(`${GATEWAY_URL}/v1/agents/${agentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      addToast({ type: "success", title: "Deleted", message: "Agent removed." });
      loadAgents();
    } catch (err) {
      addToast({ type: "error", title: "Error", message: (err as Error).message });
    }
  }

  function toggleModel(model: string) {
    setForm((f) => ({
      ...f,
      allowedModels: f.allowedModels.includes(model)
        ? f.allowedModels.filter((m) => m !== model)
        : [...f.allowedModels, model],
    }));
  }

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <FadeInUp>
          <div className="p-12 rounded-xl border border-gray-200 bg-white text-center">
            <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Connect your wallet to create and manage AI agents.</p>
          </div>
        </FadeInUp>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <FadeInUp>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
            <p className="text-gray-500 mt-1">Create autonomous AI agents that choose the best model for each task.</p>
          </div>
          <Button onClick={() => { loadCaps(); setShowCreate(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            New Agent
          </Button>
        </div>
      </FadeInUp>

      {/* Create Agent Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <h2 className="text-xl font-semibold text-gray-900">Create Agent</h2>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Research Agent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">System Prompt</label>
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">
                  Daily Budget (tokens)
                </label>
                <input
                  type="number"
                  value={form.dailyBudget}
                  onChange={(e) => setForm((f) => ({ ...f, dailyBudget: Number(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                  Allowed Models (empty = all)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_MODELS.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleModel(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.allowedModels.includes(m)
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                  API Key (for auth)
                </label>
                {capsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>
                ) : caps.length === 0 ? (
                  <p className="text-sm text-gray-400">No active API keys.<a href="/api-keys" className="text-blue-600 hover:underline ml-1">Mint one</a></p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {caps.map((cap) => (
                      <label key={cap.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm ${selectedCap === cap.id ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name="create-cap" value={cap.id} checked={selectedCap === cap.id} onChange={(e) => setSelectedCap(e.target.value)} className="text-blue-600" />
                        <Key className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-xs truncate">{cap.id.slice(0, 16)}...</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setShowCreate(false)} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={createAgent} disabled={!form.name.trim() || !selectedCap} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : agents.length === 0 ? (
        <ScaleIn delay={0.2}>
          <div className="p-16 rounded-2xl border border-dashed border-gray-200 bg-white/50 text-center">
            <Bot className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No agents yet</h3>
            <p className="text-sm text-gray-400 mb-6">Create your first autonomous AI agent.</p>
            <Button onClick={() => { loadCaps(); setShowCreate(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Create Agent
            </Button>
          </div>
        </ScaleIn>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <ScaleIn key={agent.id} delay={0.1}>
              <div className="group p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                      <span className={`text-xs ${agent.isActive ? "text-green-500" : "text-red-400"}`}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteAgent(agent.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Budget</span>
                    <span className="font-mono text-gray-700">{agent.spentToday.toLocaleString()} / {agent.dailyBudget.toLocaleString()} tokens</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (agent.spentToday / agent.dailyBudget) * 100)}%` }} />
                  </div>
                  <p className="text-gray-400 mt-2 line-clamp-2">{agent.systemPrompt}</p>
                  {agent.allowedModels.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {agent.allowedModels.map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">{m}</span>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={`/agents/${agent.id}`}
                  className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors border border-gray-200 hover:border-blue-200"
                >
                  <Radio className="w-3.5 h-3.5" />
                  Chat with Agent
                </a>
              </div>
            </ScaleIn>
          ))}
        </div>
      )}
    </div>
  );
}
