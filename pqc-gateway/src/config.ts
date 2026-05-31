import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
 * pqc-gateway/src/config.ts
 *
 * Project layout:
 * app/
 * ├── .env
 * └── pqc-gateway/
 *     └── src/
 *
 * __dirname = app/pqc-gateway/src
 * app root  = ../../
 */
const APP_ROOT = path.resolve(__dirname, "../..");
const ENV_PATH = path.join(APP_ROOT, ".env");

dotenv.config({ path: ENV_PATH });

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}. Expected it in ${ENV_PATH}`);
  }

  return value;
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

export const config = {
  appRoot: APP_ROOT,
  envPath: ENV_PATH,
  besuRpcUrl: requireEnv("BESU_RPC_URL"),
  chainId: BigInt(requireEnv("CHAIN_ID")),
  businessContractAddress: requireEnv("BUSINESS_CONTRACT_ADDRESS"),
  trustedGatewayRelayer: requireEnv("TRUSTED_GATEWAY_RELAYER"),
  relayerPrivateKey: requireEnv("RELAYER_PRIVATE_KEY"),
  gatewayPort: Number(optionalEnv("GATEWAY_PORT", "3001"))
};
