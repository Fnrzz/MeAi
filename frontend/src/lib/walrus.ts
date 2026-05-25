const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

export interface WalrusBlobResult {
  blobId: string;
  endEpoch: number;
  suiRef: string;
  alreadyCertified: boolean;
}

export async function storeBlob(file: File): Promise<WalrusBlobResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Walrus store failed: ${error}`);
  }

  return response.json();
}

export async function storeBlobFromUrl(url: string): Promise<WalrusBlobResult> {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], "media-file", { type: blob.type });
  return storeBlob(file);
}

export function getBlobUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
}

export async function readBlob(blobId: string): Promise<Response> {
  return fetch(getBlobUrl(blobId));
}
