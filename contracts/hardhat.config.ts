import path from "node:path";
import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

if (!RELAYER_PRIVATE_KEY) {
  throw new Error("RELAYER_PRIVATE_KEY is missing in app/.env");
}

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    besuLocal: {
      url: process.env.BESU_RPC_URL ?? "http://127.0.0.1:8545",
      chainId: Number(process.env.CHAIN_ID ?? "1337"),
      accounts: [RELAYER_PRIVATE_KEY],
    },
  },
};

export default config;
