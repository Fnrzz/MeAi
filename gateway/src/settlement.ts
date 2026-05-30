import { client, PACKAGE_ID } from "./sui.js";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

interface UsageRecord {
  capId: string;
  quotaId: string;
  tokens: number;
  model: string;
  timestamp: number;
}

const pendingQueue: Map<string, UsageRecord[]> = new Map();
let settlementTimer: ReturnType<typeof setInterval> | null = null;

let adminKeypair: Ed25519Keypair | null = null;
let adminAddress: string | null = null;

export function initSettlementAdmin(privateKey?: string) {
  const key = privateKey || process.env.ADMIN_PRIVATE_KEY;
  if (!key) {
    console.warn("[Settlement] No ADMIN_PRIVATE_KEY set — settlement will use devInspect (simulation only)");
    return;
  }
  try {
    adminKeypair = Ed25519Keypair.fromSecretKey(key);
    adminAddress = adminKeypair.getPublicKey().toSuiAddress();
    console.log(`[Settlement] Admin initialized: ${adminAddress}`);
  } catch (err) {
    console.error(`[Settlement] Failed to init admin keypair:`, (err as Error).message);
  }
}

export function queueDeduction(capId: string, quotaId: string, tokens: number, model: string) {
  if (!pendingQueue.has(capId)) {
    pendingQueue.set(capId, []);
  }
  pendingQueue.get(capId)!.push({ capId, quotaId, tokens, model, timestamp: Date.now() });
}

export async function processBatch(): Promise<void> {
  if (pendingQueue.size === 0) return;

  console.log(`[Settlement] Processing ${pendingQueue.size} queue(s)...`);

  const tx = new Transaction();

  pendingQueue.forEach((records, capId) => {
    const totalTokens = records.reduce((sum, r) => sum + r.tokens, 0);
    const lastModel = records[records.length - 1].model;
    const quotaId = records[0].quotaId;

    tx.moveCall({
      target: `${PACKAGE_ID}::quota_module::deduct`,
      arguments: [
        tx.object(quotaId),
        tx.pure.u64(totalTokens),
        tx.pure.string(lastModel),
        tx.object("0x6"),
      ],
    });
  });

  try {
    if (adminKeypair) {
      const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: adminKeypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      console.log(`[Settlement] Batch executed:`, result.effects?.status);
      if (result.effects?.status?.status === "failure") {
        console.error(`[Settlement] Batch failed:`, result.effects.status.error);
      }
    } else {
      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000",
      });
      console.log(`[Settlement] DevInspect result:`, result.effects?.status);
    }

    pendingQueue.clear();
  } catch (err) {
    console.error(`[Settlement] Error:`, (err as Error).message);
  }
}

export function startSettlementLoop(intervalMs = 60_000) {
  if (settlementTimer) clearInterval(settlementTimer);
  initSettlementAdmin();
  settlementTimer = setInterval(processBatch, intervalMs);
  console.log(`[Settlement] Loop started every ${intervalMs / 1000}s`);
}

export function stopSettlementLoop() {
  if (settlementTimer) {
    clearInterval(settlementTimer);
    settlementTimer = null;
  }
}
