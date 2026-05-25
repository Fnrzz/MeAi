"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Shield, Loader2, Plus, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { addModelTx } from "@/lib/contract";

const PRESET_MODELS = [
  { modelId: "claude-sonnet-4", provider: "anthropic", inputPrice: 800, outputPrice: 4000 },
  { modelId: "gpt-4o", provider: "openai", inputPrice: 600, outputPrice: 2500 },
  { modelId: "gpt-4o-mini", provider: "openai", inputPrice: 150, outputPrice: 600 },
  { modelId: "gemini-2.0-flash", provider: "google", inputPrice: 50, outputPrice: 200 },
  { modelId: "llama-3-70b", provider: "atoma", inputPrice: 100, outputPrice: 100 },
  { modelId: "mistral-large", provider: "mistral", inputPrice: 200, outputPrice: 600 },
];

export default function AdminPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { addToast } = useToast();

  const [adding, setAdding] = useState<string | null>(null);
  const [customModel, setCustomModel] = useState({ modelId: "", provider: "", inputPrice: 0, outputPrice: 0 });

  async function handleAddModel(model: (typeof PRESET_MODELS)[0]) {
    setAdding(model.modelId);
    try {
      const tx = addModelTx(model.modelId, model.provider, model.inputPrice, model.outputPrice);
      await signAndExecute({ transaction: tx });
      addToast({ type: "success", title: "Model added", message: `${model.modelId} registered on-chain` });
    } catch (err) {
      addToast({ type: "error", title: "Failed to add model", message: (err as Error).message });
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
        </div>
        <p className="text-gray-500 mb-8">Register and manage models on-chain. Only the package admin can add models.</p>

        {!account && (
          <div className="p-12 rounded-xl border border-gray-200 bg-white text-center">
            <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Connect your wallet to access the admin panel.</p>
          </div>
        )}

        {account && (
          <>
            <div className="p-6 rounded-xl border border-gray-200 bg-white mb-8">
              <h2 className="font-semibold text-gray-900 mb-4">Preset Models</h2>
              <p className="text-sm text-gray-500 mb-4">
                One-click registration for supported LLM models. Prices are in MIST per 1K tokens (1 SUI = 10⁹ MIST).
              </p>
              <div className="space-y-3">
                {PRESET_MODELS.map((m) => (
                  <div key={m.modelId} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{m.modelId}</p>
                      <p className="text-xs text-gray-400">
                        {m.provider} · In: {m.inputPrice} MIST/1K · Out: {m.outputPrice} MIST/1K
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddModel(m)}
                      disabled={adding === m.modelId}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                    >
                      {adding === m.modelId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Register
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 bg-white">
              <h2 className="font-semibold text-gray-900 mb-4">Custom Model</h2>
              <p className="text-sm text-gray-500 mb-4">
                Register a custom model not in the preset list.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  value={customModel.modelId}
                  onChange={(e) => setCustomModel((p) => ({ ...p, modelId: e.target.value }))}
                  placeholder="Model ID (e.g., gpt-4-turbo)"
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={customModel.provider}
                  onChange={(e) => setCustomModel((p) => ({ ...p, provider: e.target.value }))}
                  placeholder="Provider (e.g., openai)"
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={customModel.inputPrice || ""}
                  onChange={(e) => setCustomModel((p) => ({ ...p, inputPrice: parseInt(e.target.value) || 0 }))}
                  placeholder="Input price per 1K (MIST)"
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={customModel.outputPrice || ""}
                  onChange={(e) => setCustomModel((p) => ({ ...p, outputPrice: parseInt(e.target.value) || 0 }))}
                  placeholder="Output price per 1K (MIST)"
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={() => handleAddModel(customModel)}
                disabled={!customModel.modelId || !customModel.provider || adding === "custom"}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {adding === "custom" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Register Custom Model
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
