const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";

export interface AuditEntry {
  capId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
  requestId: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<string | null> {
  try {
    const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      console.warn(`[Walrus] Write failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const blobId = result.blobId || result.newlyCreated?.blobObject?.blobId;
    console.log(`[Walrus] Audit log written: ${blobId}`);
    return blobId;
  } catch (err) {
    console.error(`[Walrus] Error:`, (err as Error).message);
    return null;
  }
}
