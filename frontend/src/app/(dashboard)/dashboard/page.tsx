"use client";

import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useEffect, useState, useCallback, useRef } from "react";
import { TREASURY_ID, API_KEY_REGISTRY_ID, depositTx } from "@/lib/contract";
import { Wallet, Coins, Key, Loader2, ArrowRight, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FadeInUp, ScaleIn } from "@/components/animations/Parallax";
import gsap from "gsap";

interface ApiCap {
  id: string;
  owner: string;
  tier: number;
  isActive: boolean;
}

function StatCard({ icon: Icon, label, value, delay }: { icon: React.ElementType; label: string; value: string; delay: number }) {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!valueRef.current) return;
    gsap.from(valueRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      delay: delay + 0.3,
      ease: "power3.out",
    });
  }, [delay]);

  return (
    <ScaleIn delay={delay} className="p-6 rounded-xl border border-gray-200 bg-white hover-lift">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
          <span ref={valueRef} className="text-lg font-bold text-gray-900">{value}</span>
        </div>
      </div>
    </ScaleIn>
  );
}

export default function DashboardPage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { addToast } = useToast();

  const [caps, setCaps] = useState<ApiCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("1");
  const [depositing, setDepositing] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [suiBalance, setSuiBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    setLoading(true);
    try {
      const bal = await client.getBalance({ owner: account.address });
      setSuiBalance(Number(bal.totalBalance) / 1_000_000_000);

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
      setCaps(list.filter((c) => c.owner === account.address));

      const treasury = await client.getObject({ id: TREASURY_ID, options: { showContent: true } });
      if (treasury.data?.content?.dataType === "moveObject") {
        const f = treasury.data.content.fields as Record<string, unknown>;
        const bal = f.total_deposits as { fields: { value?: string } };
        setTreasuryBalance(Number(bal?.fields?.value || 0));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [account, client]);

  useEffect(() => { load(); }, [load]);

  async function handleDeposit() {
    if (!account) return;
    setDepositing(true);
    try {
      const amount = BigInt(Math.floor(parseFloat(depositAmount) * 1_000_000_000));
      const tx = depositTx(amount);
      await signAndExecute({ transaction: tx });
      addToast({ type: "success", title: "Deposit successful", message: `${depositAmount} SUI deposited to treasury` });
      setTimeout(load, 3000);
    } catch (err) {
      addToast({ type: "error", title: "Deposit failed", message: (err as Error).message });
    } finally {
      setDepositing(false);
    }
  }

  if (!account) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <Wallet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
        <p className="text-gray-500">Connect your Sui wallet to access your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  const fmtSui = (mist: number | null) => mist !== null ? `${(mist / 1_000_000_000).toFixed(4)} SUI` : "—";

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <FadeInUp>
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-500">Manage your MeAi account, quota, and API keys.</p>
          </div>
          <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-all hover:rotate-180 duration-500" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </FadeInUp>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard icon={Wallet} label="Wallet" value={`${account.address.slice(0, 8)}...${account.address.slice(-4)}`} delay={0} />
        <StatCard icon={Coins} label="SUI Balance" value={suiBalance !== null ? `${suiBalance.toFixed(4)} SUI` : "—"} delay={0.1} />
        <StatCard icon={Coins} label="Treasury" value={fmtSui(treasuryBalance)} delay={0.2} />
        <StatCard icon={Key} label="API Keys" value={String(caps.length)} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <FadeInUp delay={0.2}>
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover-lift">
            <h2 className="font-semibold text-gray-900 mb-4">Deposit SUI</h2>
            <p className="text-sm text-gray-500 mb-4">Deposit SUI to the MeAi treasury to fund your inference quota.</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0.1"
                step="0.1"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Amount in SUI"
              />
              <Button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0 magnetic-btn"
              >
                {depositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Deposit
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              {["0.5", "1", "5", "10"].map((v) => (
                <button
                  key={v}
                  onClick={() => setDepositAmount(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    depositAmount === v ? "border-blue-400 bg-blue-50 text-blue-700 scale-105" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {v} SUI
                </button>
              ))}
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.3}>
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover-lift">
            <h2 className="font-semibold text-gray-900 mb-4">Your API Keys</h2>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{caps.length} active capability object(s)</p>
              <a href="/api-keys">
                <Button variant="outline" size="sm" className="border-gray-300 gap-1">
                  <Key className="w-3.5 h-3.5" />
                  Manage
                </Button>
              </a>
            </div>
            {caps.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No API keys yet.{" "}
                <a href="/api-keys" className="text-blue-600 hover:underline">Mint one here</a>.
              </p>
            ) : (
              <div className="space-y-2">
                {caps.map((cap) => (
                  <div key={cap.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cap.isActive ? "bg-blue-500" : "bg-red-400"}`} />
                      <div>
                        <p className="text-sm font-mono text-gray-700">{cap.id.slice(0, 14)}...{cap.id.slice(-4)}</p>
                        <p className="text-xs text-gray-400">Tier {cap.tier}</p>
                      </div>
                    </div>
                    <a
                      href={`https://suiscan.xyz/testnet/object/${cap.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeInUp>
      </div>
    </div>
  );
}
