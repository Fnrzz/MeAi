"use client";

import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { FadeInUp, ScaleIn } from "@/components/animations/Parallax";
import { API_KEY_REGISTRY_ID, mintApiCapTx, revokeApiCapTx } from "@/lib/contract";
import { Key, Loader2, Plus, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiCap {
  id: string;
  owner: string;
  tier: number;
  isActive: boolean;
}

const MODELS = ["claude-sonnet-4", "gpt-4o", "gemini-2.0-flash", "llama-3-70b"];

export default function ApiKeysPage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [caps, setCaps] = useState<ApiCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMint, setShowMint] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    const addr = account.address;
    async function load() {
      try {
        const fields = await client.getDynamicFields({ parentId: API_KEY_REGISTRY_ID, limit: 50 });
        const list: ApiCap[] = [];
        for (const f of fields.data) {
          try {
            const obj = await client.getObject({ id: f.objectId, options: { showContent: true } });
            if (obj.data?.content?.dataType !== "moveObject") continue;
            const ff = obj.data.content.fields as Record<string, unknown>;
            list.push({ id: f.objectId, owner: String(ff.owner || ""), tier: Number(ff.tier || 0), isActive: Boolean(ff.is_active) });
          } catch { /* skip */ }
        }
        setCaps(list.filter((c) => c.owner === addr));
      } catch (err) {
        console.error("Load caps error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account, client]);

  function handleMint() {
    if (!account) return;
    setCreating(true);
    setCreatedId(null);
    const tx = mintApiCapTx(account.address, 1, MODELS);
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (res) => {
          setCreatedId(res.digest);
          setTimeout(() => {
            setShowMint(false);
            setCreatedId(null);
            window.location.reload();
          }, 2000);
        },
        onError: (err) => console.error("Mint failed:", err),
        onSettled: () => setCreating(false),
      },
    );
  }

  function handleRevoke(capId: string) {
    const tx = revokeApiCapTx(capId);
    signAndExecute({ transaction: tx }, { onSuccess: () => window.location.reload() });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <FadeInUp>
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-500">Your MeAi capability objects.</p>
          </div>
          <Button
            onClick={() => setShowMint(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            New Key
          </Button>
        </div>

        {showMint && (
          <div className="mb-8 p-6 rounded-xl border border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Generate API Key</h2>
              <button onClick={() => setShowMint(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This will mint a new ApiCapObject for your wallet. Tier 1 with access to all models.
            </p>
            <Button
              onClick={handleMint}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? "Minting..." : "Mint API Key"}
            </Button>
            {createdId && (
              <div className="flex items-center gap-2 text-blue-700 text-sm mt-3">
                <CheckCircle className="w-4 h-4" />
                API key minted!
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading...
          </div>
        ) : caps.length === 0 ? (
          <div className="text-center py-24">
            <Key className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No API keys yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {caps.map((cap) => (
              <div key={cap.id} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${cap.isActive ? "bg-blue-500" : "bg-red-400"}`} />
                  <div>
                    <p className="text-sm font-mono text-gray-800">{cap.id}</p>
                    <p className="text-xs text-gray-400">Tier {cap.tier} · {cap.isActive ? "Active" : "Revoked"}</p>
                  </div>
                </div>
                {cap.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(cap.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </FadeInUp>
    </div>
  );
}
