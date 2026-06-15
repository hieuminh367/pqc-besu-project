process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { JsonRpcProvider } from "ethers";
import { getExplorerOverview, getTxDump } from "./explorer.js";
import { readNativePqcCounter } from "./contracts/native-pqc-contract.js";
import { sendNativePqcTransaction } from "./native-pqc-service.js";

const app = express();
async function besuRpc(method: string, params: unknown[] = []) {
  const rpcUrl = process.env.BESU_RPC_URL ?? "http://127.0.0.1:8545";

  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: 1,
      }),
    });

    return await res.json();
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32000,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

async function waitForReceipt(txHash: string, tries = 20, delayMs = 1000) {
  for (let i = 0; i < tries; i++) {
    const receiptResp = await besuRpc("eth_getTransactionReceipt", [txHash]);

    if (receiptResp?.error) {
      return null;
    }

    if (receiptResp?.result) {
      return receiptResp.result;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}


app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pqc-besu-backend",
    envPath: config.envPath,
    besuRpcUrl: config.besuRpcUrl,
    chainId: config.chainId,
    businessContractAddress: config.businessContractAddress,
    nativePqcContractAddress: config.nativePqcContractAddress
  });
});



app.get("/explorer/overview", async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? "8");
    const result = await getExplorerOverview(limit);
    res.json({
      ok: true,
      result
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

app.get("/explorer/tx/:hash", async (req, res) => {
  try {
    const result = await getTxDump(req.params.hash);
    res.json({
      ok: true,
      result
    });
  } catch (err) {
    res.status(404).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});



app.post("/plan-b/native-buy", async (req, res) => {
  try {
    const nativePqcContractAddress =
      req.body?.nativePqcContractAddress ??
      process.env.NATIVE_PQC_CONTRACT_ADDRESS ??
      process.env.BUSINESS_CONTRACT_ADDRESS;

    if (!nativePqcContractAddress) {
    return res.status(400).json({
        ok: false,
        mode: "plan-b-native",
        error:
          "NATIVE_PQC_CONTRACT_ADDRESS is missing. Pass nativePqcContractAddress in body or set it in .env.",
      });
    }

    const pqNonce =
      req.body?.pqNonce === undefined || String(req.body?.pqNonce).trim() === ""
        ? "auto"
        : String(req.body?.pqNonce);
    const contractValue = String(req.body?.value ?? "7");
    const result = await sendNativePqcTransaction({
      nativePqcContractAddress,
      pqNonce,
      contractValue,
      gasPrice: String(req.body?.gasPrice ?? "1000"),
      debug: req.body?.debug === true
    });

    const shouldWaitReceipt = req.body?.waitReceipt === true;
    const receipt =
      result.txHash && shouldWaitReceipt ? await waitForReceipt(result.txHash, 5, 500) : null;
    const latestBlock = await besuRpc("eth_blockNumber", []);

    return res.status(result.ok ? 200 : 500).json({
      ok: result.ok,
      mode: "plan-b-native",
      nonceMode: result.nonceMode,
      abiFunction: "executeNativePQC(uint256)",
      rpcMethod: "eth_sendRawTransaction",
      nativeTransactionType: "0x05",
      nativePqcContractAddress,
      pqNonce: result.pqNonce,
      accountNonce: result.accountNonce,
      pendingAccountNonce: result.pendingAccountNonce,
      contractValue,
      txHash: result.txHash,
      pqcSender: result.pqcSender,
      txDigest: result.txDigest,
      localVerification: result.localVerification,
      rawPqcTransaction: result.rawPqcTransaction,
      rawNativePqcTransaction: result.rawNativePqcTransaction,
      pqcDump: {
        nativeTransactionType: result.pqcDump.nativeTransactionType,
        algorithm: result.pqcDump.algorithm,
        abiFunction: "executeNativePQC(uint256)",
        pqcSender: result.pqcSender,
        txDigest: result.txDigest,
        chainId: result.pqcDump.chainId,
        accountNonce: result.pqcDump.accountNonce,
        to: result.pqcDump.to,
        gasPrice: result.pqcDump.gasPrice,
        gasLimit: result.pqcDump.gasLimit,
        contractCall: result.pqcDump.contractCall,
        abiCalldata: result.pqcDump.abiCalldata,
        contractValue,
        canonicalTxBytes: result.pqcDump.canonicalTxBytes,
        rawNativePqcTransaction: result.rawNativePqcTransaction,
        rawNativePqcTransactionBytes: result.pqcDump.rawNativePqcTransactionBytes,
        pqPublicKeyBytes: result.pqcDump.pqPublicKeyBytes,
        pqSignatureBytes: result.pqcDump.pqSignatureBytes,
        pqPublicKey: result.pqcDump.pqPublicKey,
        pqSignature: result.pqcDump.pqSignature,
        fundingTxHash: result.pqcDump.fundingTxHash,
        receiptStatus: receipt?.status ?? null,
        receiptType: receipt?.type ?? null,
        blockNumber: receipt?.blockNumber ?? null,
        transactionHash: result.txHash,
      },
      receipt,
      latestBlock: latestBlock?.result ?? null,
      stdout: "",
      stderr: result.ok ? "" : result.error ?? result.rpcResponseBody,
      error: result.error,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      mode: "plan-b-native",
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

app.get("/plan-b/native-counter/:sender", async (req, res) => {
  try {
    const sender = req.params.sender;
    const contractAddress =
      String(req.query.contractAddress ?? "") ||
      config.nativePqcContractAddress;

    const provider = new JsonRpcProvider(config.besuRpcUrl);
    const counter = await readNativePqcCounter(provider, contractAddress, sender);

    return res.json({
      ok: true,
      contractAddress,
      sender,
      counter: counter.toString()
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});


app.listen(config.backendPort, () => {
  console.log(`Backend listening on http://127.0.0.1:${config.backendPort}`);
});
