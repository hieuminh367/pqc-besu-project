import express from "express";
import cors from "cors";
import { Interface } from "ethers";
import { config } from "./config.js";
import { NonceStore } from "./nonce-store.js";
import {
  verifyRawPqcTransaction,
  type RawPqcTransaction
} from "./verifier.js";
import { relayToBesu } from "./relayer.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const nonceStore = new NonceStore();

const businessIface = new Interface([
  "function executeFromPQC(address pqcSender, uint256 value)"
]);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pqc-gateway",
    envPath: config.envPath,
    rpc: config.besuRpcUrl,
    chainId: config.chainId.toString(),
    contract: config.businessContractAddress,
    trustedGatewayRelayer: config.trustedGatewayRelayer
  });
});

app.post("/submit-pqc-tx", async (req, res) => {
  try {
    const rawTx = req.body as RawPqcTransaction;

    const verification = verifyRawPqcTransaction(rawTx);

    if (!verification.accepted || !verification.derivedSender) {
      return res.status(400).json({
        accepted: false,
        stage: "signature-verification",
        reason: verification.reason,
        derivedSender: verification.derivedSender,
        txDigest: verification.txDigest
      });
    }

    if (BigInt(rawTx.chainId) !== config.chainId) {
      return res.status(400).json({
        accepted: false,
        stage: "chain-check",
        reason: "invalid chainId",
        expectedChainId: config.chainId.toString(),
        receivedChainId: rawTx.chainId
      });
    }

    if (rawTx.to.toLowerCase() !== config.businessContractAddress.toLowerCase()) {
      return res.status(400).json({
        accepted: false,
        stage: "target-check",
        reason: "invalid target contract",
        expectedTo: config.businessContractAddress,
        receivedTo: rawTx.to
      });
    }

    const pqNonce = BigInt(rawTx.pqNonce);
    const nonceOk = nonceStore.isValid(
      verification.derivedSender,
      pqNonce
    );

    if (!nonceOk) {
      return res.status(400).json({
        accepted: false,
        stage: "nonce-check",
        reason: "invalid or reused pqNonce",
        expectedNonce: nonceStore
          .getExpectedNonce(verification.derivedSender)
          .toString()
      });
    }

    const decoded = businessIface.decodeFunctionData(
      "executeFromPQC",
      rawTx.data
    );

    const decodedPqcSender = String(decoded[0]);
    const decodedValue = BigInt(decoded[1].toString());

    if (
      decodedPqcSender.toLowerCase() !==
      verification.derivedSender.toLowerCase()
    ) {
      return res.status(400).json({
        accepted: false,
        stage: "calldata-check",
        reason: "calldata pqcSender does not match derived sender",
        derivedSender: verification.derivedSender,
        decodedPqcSender
      });
    }

    const relayResult = await relayToBesu({
      rpcUrl: config.besuRpcUrl,
      relayerPrivateKey: config.relayerPrivateKey,
      contractAddress: config.businessContractAddress,
      pqcSender: verification.derivedSender,
      value: decodedValue
    });

    nonceStore.commit(verification.derivedSender);

    return res.json({
      accepted: true,
      signatureValid: true,
      pqNonceValid: true,
      derivedSender: verification.derivedSender,
      txDigest: verification.txDigest,
      relay: relayResult
    });
  } catch (err) {
    return res.status(500).json({
      accepted: false,
      reason: err instanceof Error ? err.message : String(err)
    });
  }
});

app.listen(config.gatewayPort, () => {
  console.log(`PQC Gateway listening on http://127.0.0.1:${config.gatewayPort}`);
  console.log(`Loaded env from: ${config.envPath}`);
});
