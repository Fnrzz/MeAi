import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

const SUI_RPC_URL = process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io:443";
export const client = new SuiJsonRpcClient({ url: SUI_RPC_URL, network: "testnet" });

export const PACKAGE_ID = process.env.PACKAGE_ID || "0xef9ef5c62c35d57fc9655459a409e37cec26a40b927f5ebcadcb3988a7e90f80";
export const API_KEY_REGISTRY_ID = process.env.API_KEY_REGISTRY_ID || "0x70567b3e9d22692d3eb12f7988cd589a39805f201f23e7ddef7b84a7866d93f0";
export const MODEL_REGISTRY_ID = process.env.MODEL_REGISTRY_ID || "0xc2872266c4aabbb2fb26222239d7a1774d6e9edeef578dadacabb42e2d53aa37";
