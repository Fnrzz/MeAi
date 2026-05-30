/**
 * Shared constants & configuration for MeAi API.
 * Model definitions, environment variables, and Sui package IDs.
 */

// ─── Sui Configuration ─────────────────────────────────────────
export const SUI_RPC_URL = process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io:443";
export const PACKAGE_ID = process.env.PACKAGE_ID || "0xef9ef5c62c35d57fc9655459a409e37cec26a40b927f5ebcadcb3988a7e90f80";
export const API_KEY_REGISTRY_ID = process.env.API_KEY_REGISTRY_ID || "0x70567b3e9d22692d3eb12f7988cd589a39805f201f23e7ddef7b84a7866d93f0";
export const MODEL_REGISTRY_ID = process.env.MODEL_REGISTRY_ID || "0xc2872266c4aabbb2fb26222239d7a1774d6e9edeef578dadacabb42e2d53aa37";

// ─── SumoPod Configuration ─────────────────────────────────────
export const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY || "";
export const SUMOPOD_BASE_URL = process.env.SUMOPOD_BASE_URL || "https://ai.sumopod.com/v1";

// ─── Model Definitions ─────────────────────────────────────────
export interface ModelInfo {
  id: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
}

export const MODELS: ModelInfo[] = [
  { id: "claude-sonnet-4-20250514", provider: "anthropic", inputPrice: 800, outputPrice: 4000 },
  { id: "gpt-4o", provider: "openai", inputPrice: 600, outputPrice: 2500 },
  { id: "gpt-4o-mini", provider: "openai", inputPrice: 150, outputPrice: 600 },
  { id: "gemini-2.0-flash", provider: "google", inputPrice: 50, outputPrice: 200 },
  { id: "deepseek-chat", provider: "deepseek", inputPrice: 14, outputPrice: 28 },
  { id: "deepseek-reasoner", provider: "deepseek", inputPrice: 55, outputPrice: 219 },
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", provider: "meta", inputPrice: 100, outputPrice: 100 },
  { id: "mistral-large-latest", provider: "mistral", inputPrice: 200, outputPrice: 600 },
];

/** Fallback model list for /v1/models endpoint */
export const FALLBACK_MODELS = MODELS.map((m) => ({
  id: m.id,
  provider: m.provider,
  input_price: m.inputPrice,
  output_price: m.outputPrice,
  object: "model" as const,
}));

/** Estimate token count from text using ~4 chars per token heuristic */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
