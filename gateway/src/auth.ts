import { client, API_KEY_REGISTRY_ID } from "./sui.js";

export interface AuthResult {
  valid: boolean;
  owner?: string;
  tier?: number;
  error?: string;
}

interface ApiCapObject {
  owner: string;
  tier: number;
  is_active: boolean;
  allowed_models?: Record<string, boolean>;
}

export async function verifyCapability(
  objectId: string,
  signature: string,
  timestamp: string,
  model: string,
): Promise<AuthResult> {
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);

  if (isNaN(ts) || Math.abs(now - ts) > 30) {
    return { valid: false, error: "Timestamp expired or invalid" };
  }

  try {
    const obj = await client.getObject({
      id: objectId,
      options: { showContent: true },
    });

    if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
      return { valid: false, error: "Object not found" };
    }

    const fields = obj.data.content.fields as Record<string, unknown>;

    if (fields.is_active === false) {
      return { valid: false, error: "Capability is revoked" };
    }

    const owner = fields.owner as string;
    if (!owner) {
      return { valid: false, error: "Invalid capability object" };
    }

    const tier = (fields.tier as number) || 1;

    return { valid: true, owner, tier };
  } catch (err) {
    return { valid: false, error: `RPC error: ${(err as Error).message}` };
  }
}
