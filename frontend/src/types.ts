export type BackendHealth = {
  ok: boolean;
  service: string;
  envPath: string;
  gatewayUrl: string;
  besuRpcUrl: string;
  chainId: string;
  businessContractAddress: string;
};

export type ScriptResponse = {
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
};

export type DemoAction =
  | "check-besu"
  | "valid-mldsa"
  | "invalid-signature"
  | "tampered-calldata";

export type GatewayRelay = {
  txHash?: string;
  receiptStatus?: number;
  blockNumber?: number;
  counterAfter?: string;
};

export type GatewayResponse = {
  accepted?: boolean;
  signatureValid?: boolean;
  pqNonceValid?: boolean;
  derivedSender?: string;
  txDigest?: string;
  stage?: string;
  reason?: string;
  relay?: GatewayRelay;
};

export type ParsedDemoResult = {
  action: DemoAction;
  title: string;
  ok: boolean;
  statusLabel: string;
  gatewayHttpStatus?: number;
  clientVersion?: string;
  blockNumberHex?: string;
  peerCountHex?: string;
  algorithm?: string;
  localSignatureValid?: boolean;
  originalSignatureValid?: boolean;
  signatureValidAfterTamper?: boolean;
  sender?: string;
  pqNonce?: string;
  txDigest?: string;
  originalTxDigest?: string;
  tamperedTxDigest?: string;
  pqPublicKeyBytes?: string;
  pqSignatureBytes?: string;
  gateway?: GatewayResponse;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  action: DemoAction;
  parsed: ParsedDemoResult;
  response: ScriptResponse;
};
