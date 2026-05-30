/**
 * Sui blockchain client configuration.
 */
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { SUI_RPC_URL, PACKAGE_ID, API_KEY_REGISTRY_ID, MODEL_REGISTRY_ID } from "./constants";

export const suiClient = new SuiJsonRpcClient({ url: SUI_RPC_URL, network: "testnet" });

export { PACKAGE_ID, API_KEY_REGISTRY_ID, MODEL_REGISTRY_ID };
