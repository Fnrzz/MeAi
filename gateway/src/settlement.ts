import { client, PACKAGE_ID } from "./sui.js";
import { Transaction } from "@mysten/sui/transactions";

interface UsageRecord {
  capId: string;
  tokens: number;
  model: string;
  timestamp: number;
}

const pendingQueue: Map<string, UsageRecord[]> = new Map();
let settlementTimer: ReturnType<typeof setInterval> | null = null;

export function queueDeduction(capId: string, tokens: number, model: string) {
  if (!pendingQueue.has(capId)) {
    pendingQueue.set(capId, []);
  }
  pendingQueue.get(capId)!.push({ capId, tokens, model, timestamp: Date.now() });
}

export async function processBatch(): Promise<void> {
  if (pendingQueue.size === 0) return;

  console.log(`[Settlement] Processing ${pendingQueue.size} queue(s)...`);

  const tx = new Transaction();

  pendingQueue.forEach((records, capId) => {
    const totalTokens = records.reduce((sum, r) => sum + r.tokens, 0);
    const lastModel = records[records.length - 1].model;

    tx.moveCall({
      target: `${PACKAGE_ID}::quota_module::deduct`,
      arguments: [
        tx.object(capId),
        tx.pure.u64(totalTokens),
        tx.pure.string(lastModel),
        tx.object("0x6"),
      ],
    });
  });

  try {
    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: "0x0000000000000000000000000000000000000000",
    });

    console.log(`[Settlement] Batch result:`, result.effects?.status);
    pendingQueue.clear();
  } catch (err) {
    console.error(`[Settlement] Error:`, (err as Error).message);
  }
}

export function startSettlementLoop(intervalMs = 60_000) {
  if (settlementTimer) clearInterval(settlementTimer);
  settlementTimer = setInterval(processBatch, intervalMs);
  console.log(`[Settlement] Loop started every ${intervalMs / 1000}s`);
}

export function stopSettlementLoop() {
  if (settlementTimer) {
    clearInterval(settlementTimer);
    settlementTimer = null;
  }
}
