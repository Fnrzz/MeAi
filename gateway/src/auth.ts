import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { client } from "./sui.js";

export interface AuthResult {
  valid: boolean;
  owner?: string;
  tier?: number;
  error?: string;
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
    const value = (fields as any).value || fields;
    const innerFields = value.fields || value;

    const owner = innerFields.owner as string | undefined;
    if (!owner) {
      return { valid: false, error: "Invalid capability object: no owner" };
    }

    const tier = (innerFields.tier as number) || 1;
    const isActive = innerFields.is_active as boolean | undefined;
    if (isActive === false) {
      return { valid: false, error: "Capability is revoked" };
    }

    const message = new TextEncoder().encode(`meai-${ts}`);

    let publicKey;
    try {
      publicKey = await verifyPersonalMessageSignature(message, signature);
    } catch {
      return { valid: false, error: "Signature verification failed" };
    }

    const signerAddress = publicKey.toSuiAddress();

    if (signerAddress !== owner) {
      return {
        valid: false,
        error: `Signer ${signerAddress} does not match capability owner ${owner}`,
      };
    }

    return { valid: true, owner, tier };
  } catch (err) {
    return { valid: false, error: `RPC error: ${(err as Error).message}` };
  }
}
