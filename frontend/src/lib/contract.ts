import { Transaction } from "@mysten/sui/transactions";

export const PACKAGE_ID = "0x427aef6bd70817454365705d9301776abfa98a96612bbcf09e685851cf9b7166";
export const TREASURY_ID = "0x1b07de87daea129af08e26889935b76b733b098a98ab817907fed7dad28613b0";
export const API_KEY_REGISTRY_ID = "0x73b47d9659840a71de861f86141336565c8b03b5b805a9136b2682ae97531e00";
export const MODEL_REGISTRY_ID = "0x5e0e8c1abe5e86fe5f4ca47cf76107e897ad4b4ecc442350e1a4dda5f7cf80e8";

// --- Payment ---

export function depositTx(amount: bigint) {
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  tx.moveCall({
    target: `${PACKAGE_ID}::payment_module::deposit`,
    arguments: [tx.object(TREASURY_ID), coin, tx.object("0x6")],
  });
  return tx;
}

// --- Access (ApiCapObject) ---

export function mintApiCapTx(
  owner: string,
  tier: number,
  allowedModels: string[],
) {
  const tx = new Transaction();
  const models = tx.pure.vector("string", allowedModels);
  tx.moveCall({
    target: `${PACKAGE_ID}::access_module::mint_cap`,
    arguments: [
      tx.object(API_KEY_REGISTRY_ID),
      tx.pure.address(owner),
      tx.pure.u8(tier),
      models,
      tx.object("0x6"),
    ],
  });
  return tx;
}

export function revokeApiCapTx(capId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::access_module::revoke_cap`,
    arguments: [tx.object(API_KEY_REGISTRY_ID), tx.pure.id(capId), tx.object("0x6")],
  });
  return tx;
}

// --- Models ---

export function addModelTx(
  modelId: string,
  provider: string,
  inputPrice: number,
  outputPrice: number,
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::registry_module::add_model`,
    arguments: [
      tx.object(MODEL_REGISTRY_ID),
      tx.pure.string(modelId),
      tx.pure.string(provider),
      tx.pure.u64(inputPrice),
      tx.pure.u64(outputPrice),
    ],
  });
  return tx;
}

// --- Quota ---

export function createQuotaTx(owner: string, initialTokens: bigint, spendCap: bigint) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::quota_module::create_quota`,
    arguments: [
      tx.pure.address(owner),
      tx.pure.u64(initialTokens),
      tx.pure.u64(spendCap),
    ],
  });
  return tx;
}
