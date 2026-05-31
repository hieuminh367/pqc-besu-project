import express from "express";
import cors from "cors";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { config } from "./config.js";
import { sendValidMldsaDirect } from "./direct-pqc.js";
import { getExplorerOverview, getTxDump } from "./explorer.js";

const execFileAsync = promisify(execFile);

const app = express();
app.use(cors());
app.use(express.json());

async function runScript(scriptName: string, env: NodeJS.ProcessEnv = {}) {
  const scriptPath = path.join(config.appRoot, "scripts", scriptName);
  const gatewaySubmitUrl = `${config.gatewayUrl}/submit-pqc-tx`;

  try {
    const { stdout, stderr } = await execFileAsync(scriptPath, {
      cwd: config.appRoot,
      env: {
        ...process.env,
        GATEWAY_URL: gatewaySubmitUrl,
        ...env
      },
      timeout: 120_000,
      maxBuffer: 1024 * 1024 * 10
    });

    return {
      ok: true,
      stdout,
      stderr
    };
  } catch (err: any) {
    return {
      ok: false,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
      error: err.message ?? String(err)
    };
  }
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pqc-besu-backend",
    envPath: config.envPath,
    gatewayUrl: config.gatewayUrl,
    besuRpcUrl: config.besuRpcUrl,
    chainId: config.chainId,
    businessContractAddress: config.businessContractAddress
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

app.post("/direct/send-valid-mldsa", async (req, res) => {
  try {
    const result = await sendValidMldsaDirect({
      pqNonce: req.body?.pqNonce ?? "auto",
      value: req.body?.value ?? "7"
    });

    res.json({
      ok: true,
      mode: "backend-direct",
      description:
        "Backend built ABI calldata, canonical raw PQC transaction, signed with ML-DSA-65, and submitted to PQC Gateway.",
      result
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      mode: "backend-direct",
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

app.post("/demo/check-besu", async (_req, res) => {
  const result = await runScript("check-besu-rpc.sh");
  res.status(result.ok ? 200 : 500).json(result);
});

app.post("/demo/send-valid-mldsa", async (req, res) => {
  const pqNonce = String(req.body?.pqNonce ?? "1");

  const result = await runScript("send-valid-mldsa-tx.sh", {
    PQ_NONCE: pqNonce
  });

  res.status(result.ok ? 200 : 500).json(result);
});

app.post("/demo/send-invalid-signature", async (_req, res) => {
  const result = await runScript("send-invalid-signature.sh");
  res.status(result.ok ? 200 : 500).json(result);
});

app.post("/demo/send-tampered-calldata", async (_req, res) => {
  const result = await runScript("send-tampered-calldata.sh");
  res.status(result.ok ? 200 : 500).json(result);
});

app.listen(config.backendPort, () => {
  console.log(`Backend listening on http://127.0.0.1:${config.backendPort}`);
});
