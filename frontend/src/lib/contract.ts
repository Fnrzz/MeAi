import { Transaction } from "@mysten/sui/transactions";

export const PACKAGE_ID = "0xef9ef5c62c35d57fc9655459a409e37cec26a40b927f5ebcadcb3988a7e90f80";
export const TREASURY_ID = "0x227d3bbf2cce3783c162098f938d0670e66e5ebcc667926cc837310acced0aaf";
export const API_KEY_REGISTRY_ID = "0x70567b3e9d22692d3eb12f7988cd589a39805f201f23e7ddef7b84a7866d93f0";
export const MODEL_REGISTRY_ID = "0xc2872266c4aabbb2fb26222239d7a1774d6e9edeef578dadacabb42e2d53aa37";

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
