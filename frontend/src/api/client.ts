import type { BackendHealth, ScriptResponse } from "../types";

// Always call backend through Vite proxy.
// Browser -> Vite dev server :5173 -> Backend :4000
const BACKEND_URL = "/api";

async function requestJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const text = await response.text();

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON response from ${url}: ${text}`);
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} from ${url}: ${JSON.stringify(data)}`
    );
  }

  return data as T;
}

export const api = {
  backendUrl: BACKEND_URL,

  health(): Promise<BackendHealth> {
    return requestJson<BackendHealth>("/health");
  },

  checkBesu(): Promise<ScriptResponse> {
    return requestJson<ScriptResponse>("/demo/check-besu", {
      method: "POST"
    });
  },

  sendValidMldsa(pqNonce: string): Promise<ScriptResponse> {
    return requestJson<ScriptResponse>("/demo/send-valid-mldsa", {
      method: "POST",
      body: JSON.stringify({ pqNonce })
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
