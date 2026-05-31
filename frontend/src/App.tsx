
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Blocks,
  CheckCircle2,
  Coins,
  Copy,
  Database,
  FileJson,
  Gauge,
  Home,
  Layers3,
  Network,
  Search,
  Send,
  ShieldCheck,
  Wallet,
  XCircle
} from "lucide-react";
import { api, type DirectMldsaResponse, type ExplorerBlock } from "./api/client";

type RunLog = {
  id: string;
  title: string;
  status: "success" | "error" | "info";
  createdAt: string;
  details: string;
};

function shortHash(value?: string | null, left = 10, right = 8) {
  if (!value) return "null";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function formatTime(ts: number) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleTimeString();
}

async function copy(value?: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

function Sidebar() {
  const items = [
    ["Home", Home],
    ["Network", Network],
    ["Blocks", Blocks],
    ["Transactions", Activity],
    ["Wallet", Wallet],
    ["Gateway", ShieldCheck],
    ["Contract", Database]
  ] as const;

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <Blocks className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-black">PQCChain</div>
          <div className="text-xs text-slate-500">Besu Explorer</div>
        </div>
      </div>

      <nav className="space-y-1 px-4 py-6">
        {items.map(([label, Icon], index) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              index === 0
                ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mx-4 mt-4 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-xl">
        <div className="text-sm font-semibold">Plan A Demo</div>
        <div className="mt-2 text-xs leading-5 text-violet-100">
          ML-DSA-65 Gateway verification before Besu submission.
        </div>
      </div>
    </aside>
  );
}

function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
      <div className="mt-4 break-all text-2xl font-black text-slate-950">
        {value}
      </div>
    </div>
  );
}

function BlockCard({ block }: { block: ExplorerBlock }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        <Blocks className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="font-black text-slate-950">#{block.number}</div>
          <div className="text-xs text-slate-500">{formatTime(block.timestamp)}</div>
        </div>
        <div className="mt-1 truncate font-mono text-xs text-slate-500">
          {block.hash}
        </div>
        <div className="mt-2 text-sm text-slate-600">
          {block.txCount} Txs • Gas {block.gasUsed}
        </div>
      </div>
    </div>
  );
}

function JsonDump({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2 font-black text-slate-950">
          <FileJson className="h-5 w-5 text-violet-600" />
          {title}
        </div>
        <button
          onClick={() => copy(JSON.stringify(data, null, 2))}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Copy JSON
        </button>
      </div>
      <pre className="code-scroll max-h-[34rem] overflow-auto p-5 text-xs leading-6 text-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function App() {
  const [overview, setOverview] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [value, setValue] = useState("7");
  const [loading, setLoading] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<DirectMldsaResponse | null>(null);
  const [txDump, setTxDump] = useState<any>(null);
  const [logs, setLogs] = useState<RunLog[]>([]);

  const latestBlocks: ExplorerBlock[] = overview?.result?.blocks ?? [];

  const latestTxHash = lastTx?.result?.gateway?.relay?.txHash;

  const pqcTransactionDump = useMemo(() => {
    if (!lastTx) return null;

    const rawTx = lastTx.result.rawPqcTransaction;
    const local = lastTx.result.localVerification;
    const gateway = lastTx.result.gateway;
    const relay = gateway.relay;

    return {
      title: "PQC Besu Transaction Dump",
      note:
        "This is not a Bitcoin transaction. This dump shows a raw PQC transaction, ML-DSA-65 proof data, gateway verification result, and the relayed Besu transaction.",
      network: {
        chainId: health?.chainId ?? "1337",
        consensus: "QBFT",
        besuRpc: health?.besuRpcUrl,
        gateway: health?.gatewayUrl,
        backend: api.backendUrl
      },
      contractCall: {
        contractAddress: rawTx.to,
        functionName: "executeFromPQC(address pqcSender, uint256 value)",
        pqcSender: rawTx.sender,
        value,
        abiCalldata: rawTx.data
      },
      pqcRawTransaction: {
        type: rawTx.type,
        chainId: rawTx.chainId,
        pqNonce: rawTx.pqNonce,
        to: rawTx.to,
        value: rawTx.value,
        gasLimit: rawTx.gasLimit,
        gasPrice: rawTx.gasPrice,
        data: rawTx.data,
        pqAlgorithm: rawTx.pqAlgorithm,
        sender: rawTx.sender,
        pqPublicKey: rawTx.pqPublicKey,
        pqSignature: rawTx.pqSignature
      },
      canonicalSigning: {
        domainSeparator: "PQC_BESU_TX_V1",
        txDigest: local.txDigest,
        signatureAlgorithm: rawTx.pqAlgorithm,
        signatureValidLocally: local.signatureValid,
        pqPublicKeyBytes: local.pqPublicKeyBytes,
        pqSignatureBytes: local.pqSignatureBytes,
        senderDerivation: "last20Bytes(keccak256(pqPublicKey))"
      },
      gatewayVerification: {
        accepted: gateway.accepted,
        signatureValid: gateway.signatureValid,
        pqNonceValid: gateway.pqNonceValid,
        derivedSender: gateway.derivedSender,
        txDigest: gateway.txDigest
      },
      besuRelay: {
        relayedBy: "trusted gateway relayer",
        besuTxHash: relay.txHash,
        receiptStatus: relay.receiptStatus,
        blockNumber: relay.blockNumber,
        counterAfter: relay.counterAfter
      },
      blockEvidence: txDump?.result?.receipt
        ? {
            blockHash: txDump.result.receipt.blockHash,
            gasUsed: txDump.result.receipt.gasUsed,
            from: txDump.result.receipt.from,
            to: txDump.result.receipt.to,
            logs: txDump.result.receipt.logs
          }
        : null
    };
  }, [lastTx, txDump, value, health]);

  async function refresh() {
    const [h, o] = await Promise.all([api.health(), api.overview()]);
    setHealth(h);
    setOverview(o);
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 3000);
    return () => window.clearInterval(id);
  }, []);

  function pushLog(title: string, status: RunLog["status"], details: string) {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        title,
        status,
        details,
        createdAt: new Date().toLocaleTimeString()
      },
      ...prev
    ].slice(0, 10));
  }

  async function buyTransaction() {
    setLoading("buy");

    try {
      const result = await api.sendDirectMldsa(value);
      setLastTx(result);

      const txHash = result.result.gateway.relay.txHash;
      const dump = await api.txDump(txHash);
      setTxDump(dump);

      pushLog(
        "ML-DSA transaction created",
        "success",
        `txHash ${shortHash(txHash)} mined in block ${result.result.gateway.relay.blockNumber}`
      );

      await refresh();
    } catch (err) {
      pushLog(
        "ML-DSA transaction failed",
        "error",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setLoading(null);
    }
  }

  async function invalidSignature() {
    setLoading("invalid");

    try {
      const result = await api.sendInvalidSignature();
      pushLog("Invalid signature rejected", "success", result.stdout);
    } catch (err) {
      pushLog("Invalid signature test failed", "error", String(err));
    } finally {
      setLoading(null);
    }
  }

  async function tamperedCalldata() {
    setLoading("tampered");

    try {
      const result = await api.sendTamperedCalldata();
      pushLog("Tampered calldata rejected", "success", result.stdout);
    } catch (err) {
      pushLog("Tampered calldata test failed", "error", String(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
          <div className="flex h-20 items-center gap-4 px-6">
            <div className="flex flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3">
              <Search className="mr-3 h-5 w-5 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search PQC transactions, addresses, blocks"
              />
            </div>
            <button className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white">
              Sign In
            </button>
          </div>
        </header>

        <section className="px-6 py-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-200">
                  <ShieldCheck className="h-12 w-12" />
                </div>
                <div>
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-5xl font-black text-slate-950">
                      PQC Besu
                    </h1>
                    <span className="text-3xl font-bold text-violet-400">
                      ML-DSA
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-slate-600">
                    Mini blockchain explorer for a private Besu QBFT network.
                    The buy button creates a raw PQC transaction signed with
                    ML-DSA-65, sends it to the gateway, and shows the mined
                    transaction like an explorer.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="text-sm font-bold text-slate-500">
                  Latest Block
                </div>
                <div className="mt-1 text-4xl font-black text-slate-950">
                  #{overview?.result?.latestBlockNumber ?? "-"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Chain ID {health?.chainId ?? "1337"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard
              label="Besu RPC"
              value={health?.besuRpcUrl ?? "-"}
              icon={<Network className="h-5 w-5" />}
            />
            <StatCard
              label="Gateway"
              value={health?.gatewayUrl ?? "-"}
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Contract"
              value={shortHash(health?.businessContractAddress, 12, 10)}
              icon={<Database className="h-5 w-5" />}
            />
            <StatCard
              label="Consensus"
              value="QBFT"
              icon={<Layers3 className="h-5 w-5" />}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
            <section className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">
                  Buy / Create PQC Transaction
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Simulates a dApp action. Backend builds ABI calldata, signs
                  raw PQC transaction with ML-DSA-65, and submits it to gateway.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      pqNonce
                    </div>
                    <input
                      value="auto"
                      readOnly
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                    />
                  </label>

                  <label>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Contract value
                    </div>
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400"
                    />
                  </label>
                </div>

                <button
                  disabled={loading === "buy"}
                  onClick={buyTransaction}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-5 py-4 text-base font-black text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Coins className="h-5 w-5" />
                  {loading === "buy"
                    ? "Creating transaction..."
                    : "Buy / Send ML-DSA Transaction"}
                  <Send className="h-5 w-5" />
                </button>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    disabled={loading === "invalid"}
                    onClick={invalidSignature}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
                  >
                    Test Invalid Signature
                  </button>
                  <button
                    disabled={loading === "tampered"}
                    onClick={tamperedCalldata}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700"
                  >
                    Test Tampered Calldata
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950">
                    Latest Blocks
                  </h2>
                  <button
                    onClick={refresh}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold"
                  >
                    Refresh
                  </button>
                </div>

                <div className="space-y-3">
                  {latestBlocks.map((block) => (
                    <BlockCard key={block.number} block={block} />
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">
                  Latest PQC Transaction
                </h2>

                {!lastTx ? (
                  <div className="mt-5 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
                    No PQC transaction yet. Press Buy / Send ML-DSA Transaction to generate a raw PQC transaction dump.
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <StatCard
                        label="Status"
                        value={
                          lastTx.result.gateway.accepted
                            ? "Accepted"
                            : "Rejected"
                        }
                        icon={
                          lastTx.result.gateway.accepted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-600" />
                          )
                        }
                      />
                      <StatCard
                        label="Receipt"
                        value={String(lastTx.result.gateway.relay.receiptStatus)}
                        icon={<Gauge className="h-5 w-5" />}
                      />
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-5">
                      <div className="mb-2 text-sm font-bold text-slate-500">
                        Relayed Besu Transaction Hash
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1 break-all font-mono text-sm">
                          {latestTxHash}
                        </div>
                        <button
                          onClick={() => copy(latestTxHash)}
                          className="rounded-xl border border-slate-200 bg-white p-2"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <StatCard
                        label="PQC sender"
                        value={shortHash(lastTx.result.rawPqcTransaction.sender as string, 12, 10)}
                        icon={<Wallet className="h-5 w-5" />}
                      />
                      <StatCard
                        label="Block"
                        value={`#${lastTx.result.gateway.relay.blockNumber}`}
                        icon={<Blocks className="h-5 w-5" />}
                      />
                      <StatCard
                        label="txDigest"
                        value={shortHash(lastTx.result.localVerification.txDigest, 12, 10)}
                        icon={<Activity className="h-5 w-5" />}
                      />
                      <StatCard
                        label="Signature"
                        value={`${lastTx.result.localVerification.pqSignatureBytes} bytes`}
                        icon={<ShieldCheck className="h-5 w-5" />}
                      />
                    </div>
                  </div>
                )}
              </div>

              {pqcTransactionDump && (
                <JsonDump
                  title="PQC Transaction Dump"
                  data={pqcTransactionDump}
                />
              )}

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">
                  Latest PQC Transactions
                </h2>
                <div className="mt-4 space-y-3">
                  {logs.length === 0 ? (
                    <div className="text-sm text-slate-400">
                      No actions yet.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                      >
                        <div
                          className={`mt-1 h-3 w-3 rounded-full ${
                            log.status === "success"
                              ? "bg-emerald-500"
                              : log.status === "error"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <div className="font-bold text-slate-900">
                              {log.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              {log.createdAt}
                            </div>
                          </div>
                          <div className="mt-1 whitespace-pre-wrap break-all text-sm text-slate-500">
                            {log.details}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
