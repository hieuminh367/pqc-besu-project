import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const DEV_PRIVATE_KEY =
  "0x8f2a5594902c714a57ab680a8d9c98b74c169fb7634f33a3e02de2c0e39f1a4e";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    besuLocal: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: [DEV_PRIVATE_KEY],
    },
  },
};

export default config;
