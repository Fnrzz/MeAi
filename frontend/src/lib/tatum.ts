export const TATUM_RPC = {
  mainnet: "https://sui-mainnet.gateway.tatum.io",
  testnet: "https://sui-testnet.gateway.tatum.io",
  devnet: "https://sui-devnet.gateway.tatum.io",
};

export function getTatumUrl(network: "testnet" | "mainnet" = "testnet"): string {
  return TATUM_RPC[network];
}
