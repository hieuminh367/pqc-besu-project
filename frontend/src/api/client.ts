import type { BackendHealth, ScriptResponse } from "../types";

const BACKEND_URL = "/api";

async function requestJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return data as T;
}

export type ExplorerBlock = {
  number: number;
  hash: string | null;
  timestamp: number;
  txCount: number;
  gasUsed: string;
  parentHash: string;
};

export type ExplorerOverview = {
  ok: boolean;
  result: {
    chainId: string;
    latestBlockNumber: number;
    blocks: ExplorerBlock[];
  };
};

export type DirectMldsaResponse = {
  ok: boolean;
  mode: string;
  description: string;
  result: {
    wallet?: {
      sender: string;
      nonceMode: string;
      nextAutoNonce: string;
    };
    rawPqcTransaction: Record<string, unknown>;
    localVerification: {
      txDigest: string;
      signatureValid: boolean;
      pqPublicKeyBytes: number;
      pqSignatureBytes: number;
    };
    gateway: {
      accepted: boolean;
      signatureValid: boolean;
      pqNonceValid: boolean;
      derivedSender: string;
      txDigest: string;
      relay: {
        txHash: string;
        receiptStatus: number;
        blockNumber: number;
        counterAfter: string;
      };
    };
  };
};

export const api = {
  backendUrl: BACKEND_URL,

  health(): Promise<BackendHealth> {
    return requestJson<BackendHealth>("/health");
  },

  overview(): Promise<ExplorerOverview> {
    return requestJson<ExplorerOverview>("/explorer/overview?limit=8");
  },

  txDump(txHash: string): Promise<any> {
    return requestJson<any>(`/explorer/tx/${txHash}`);
  },

  sendDirectMldsa(value: string): Promise<DirectMldsaResponse> {
    return requestJson<DirectMldsaResponse>("/direct/send-valid-mldsa", {
      method: "POST",
      body: JSON.stringify({ value })
    });
  },

  checkBesu(): Promise<ScriptResponse> {
    return requestJson<ScriptResponse>("/demo/check-besu", {
      method: "POST"
    });
  },

  sendInvalidSignature(): Promise<ScriptResponse> {
    return requestJson<ScriptResponse>("/demo/send-invalid-signature", {
      method: "POST"
    });
  },

  sendTamperedCalldata(): Promise<ScriptResponse> {
    return requestJson<ScriptResponse>("/demo/send-tampered-calldata", {
      method: "POST"
    });
  }
};
