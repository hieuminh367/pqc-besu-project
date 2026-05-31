import type {
  DemoAction,
  GatewayResponse,
  ParsedDemoResult,
  ScriptResponse
} from "../types";

function matchFirst(text: string, regex: RegExp): string | undefined {
  const match = text.match(regex);
  return match?.[1];
}

function matchBoolean(text: string, label: string): boolean | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = matchFirst(text, new RegExp(`${escaped}:\\s*(true|false)`, "i"));
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseGatewayResponse(stdout: string): GatewayResponse | undefined {
  const marker = "Gateway response:";
  const index = stdout.lastIndexOf(marker);

  if (index === -1) return undefined;

  const after = stdout.slice(index + marker.length).trim();
  const firstLine = after.split("\n").find((line) => line.trim().length > 0);

  if (!firstLine) return undefined;

  try {
    return JSON.parse(firstLine.trim()) as GatewayResponse;
  } catch {
    return undefined;
  }
}

function parseBesuCheck(stdout: string) {
  const resultMatches = [...stdout.matchAll(/"result":\s*"([^"]+)"/g)].map(
    (m) => m[1]
  );

  return {
    clientVersion: resultMatches.find((x) => x.includes("besu/")),
    blockNumberHex: resultMatches.find((x) => /^0x[0-9a-fA-F]+$/.test(x)),
    peerCountHex: resultMatches
      .filter((x) => /^0x[0-9a-fA-F]+$/.test(x))
      .at(-1)
  };
}

function actionTitle(action: DemoAction): string {
  switch (action) {
    case "check-besu":
      return "Besu RPC Check";
    case "valid-mldsa":
      return "Valid ML-DSA-65 Transaction";
    case "invalid-signature":
      return "Invalid Signature Rejection";
    case "tampered-calldata":
      return "Tampered Calldata Rejection";
  }
}

export function parseDemoResult(
  action: DemoAction,
  response: ScriptResponse
): ParsedDemoResult {
  const stdout = response.stdout ?? "";
  const gateway = parseGatewayResponse(stdout);
  const besu = parseBesuCheck(stdout);

  const gatewayHttpStatusRaw = matchFirst(
    stdout,
    /Gateway HTTP status:\s*(\d+)/i
  );

  const gatewayHttpStatus = gatewayHttpStatusRaw
    ? Number(gatewayHttpStatusRaw)
    : undefined;

  const ok =
    action === "check-besu"
      ? response.ok && Boolean(besu.clientVersion)
      : response.ok && Boolean(gateway?.accepted);

  let statusLabel = "Unknown";

  if (action === "check-besu") {
    statusLabel = ok ? "Besu RPC reachable" : "Besu RPC failed";
  } else if (gateway?.accepted) {
    statusLabel = "Accepted and relayed";
  } else if (gateway?.reason) {
    statusLabel = `Rejected: ${gateway.reason}`;
  } else if (!response.ok) {
    statusLabel = response.error ?? "Execution failed";
  }

  return {
    action,
    title: actionTitle(action),
    ok,
    statusLabel,
    gatewayHttpStatus,
    clientVersion: besu.clientVersion,
    blockNumberHex: besu.blockNumberHex,
    peerCountHex: besu.peerCountHex,
    algorithm: matchFirst(stdout, /Algorithm:\s*([^\n]+)/i),
    localSignatureValid: matchBoolean(stdout, "Local signatureValid"),
    originalSignatureValid: matchBoolean(stdout, "Original signature valid"),
    signatureValidAfterTamper: matchBoolean(
      stdout,
      "Signature valid after calldata tamper"
    ),
    sender: matchFirst(stdout, /^Sender:\s*(0x[a-fA-F0-9]{40})/m),
    pqNonce: matchFirst(stdout, /pqNonce:\s*([0-9]+)/i),
    txDigest:
      gateway?.txDigest ??
      matchFirst(stdout, /^txDigest:\s*(0x[a-fA-F0-9]{64})/m),
    originalTxDigest: matchFirst(
      stdout,
      /Original txDigest:\s*(0x[a-fA-F0-9]{64})/i
    ),
    tamperedTxDigest: matchFirst(
      stdout,
      /Tampered txDigest:\s*(0x[a-fA-F0-9]{64})/i
    ),
    pqPublicKeyBytes: matchFirst(stdout, /pqPublicKeyBytes:\s*([0-9]+)/i),
    pqSignatureBytes: matchFirst(stdout, /pqSignatureBytes:\s*([0-9]+)/i),
    gateway
  };
}
