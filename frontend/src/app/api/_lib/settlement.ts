/**
 * On-chain settlement — batches token deductions into PTB transactions.
 *
 * In Next.js serverless, we use per-request settlement instead of setInterval.
 * An optional cron endpoint can be added for batch processing.
 */
import { suiClient, PACKAGE_ID } from "./sui";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

interface UsageRecord {
  capId: string;
  quotaId: string;
  tokens: number;
  model: string;
  timestamp: number;
}

let adminKeypair: Ed25519Keypair | null = null;

function getAdminKeypair(): Ed25519Keypair | null {
  if (adminKeypair) return adminKeypair;
  const key = process.env.ADMIN_PRIVATE_KEY;
  if (!key) {
    console.warn("[Settlement] No ADMIN_PRIVATE_KEY — settlement disabled");
    return null;
  }
  try {
    adminKeypair = Ed25519Keypair.fromSecretKey(key);
    return adminKeypair;
  } catch (err) {
    console.error("[Settlement] Failed to init admin keypair:", (err as Error).message);
    return null;
  }
}

/**
 * Settle a single deduction immediately (per-request).
 * Used instead of batched setInterval in serverless environment.
 */
export async function settleDeduction(
  quotaId: string,
  tokens: number,
  model: string,
): Promise<void> {
  const keypair = getAdminKeypair();

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::quota_module::deduct`,
    arguments: [
      tx.object(quotaId),
      tx.pure.u64(tokens),
      tx.pure.string(model),
      tx.object("0x6"),
    ],
  });

  try {
    if (keypair) {
      const result = await suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: { showEffects: true },
      });
      console.log(`[Settlement] Executed:`, result.effects?.status);
    } else {
      // Simulation only when no admin key
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000",
      });
      console.log(`[Settlement] DevInspect:`, result.effects?.status);
    }
  } catch (err) {
    console.error(`[Settlement] Error:`, (err as Error).message);
  }
}
