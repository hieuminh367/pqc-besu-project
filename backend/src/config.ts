import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "../..");
const ENV_PATH = path.join(APP_ROOT, ".env");

dotenv.config({ path: ENV_PATH });

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const config = {
  appRoot: APP_ROOT,
  envPath: ENV_PATH,
  backendPort: Number(env("BACKEND_PORT", "4000")),
  gatewayUrl: env("GATEWAY_URL", "http://127.0.0.1:3001"),
  besuRpcUrl: env("BESU_RPC_URL"),
  chainId: env("CHAIN_ID"),
  businessContractAddress: env("BUSINESS_CONTRACT_ADDRESS")
};
