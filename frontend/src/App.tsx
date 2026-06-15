import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Blocks,
  CheckCircle2,
  Copy,
  Database,
  FileJson,
  Gauge,
  Home,
  Layers3,
  Network,
  Search,
  ShieldCheck,
  Wallet,
  XCircle
} from "lucide-react";
import {
  api,
  type ExplorerBlock,
  type NativePqcTransactionResponse
} from "./api/client";
import PlanBNativePqcCard from "./components/PlanBNativePqcCard";
import { buildNativeTransactionDump } from "./utils/nativeTransactionDump";

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

function hexToNumber(value?: string | null): number | null {
  if (!value) return null;
  return Number.parseInt(value, 16);
}

function parseCounterAfterFromReceipt(result: NativePqcTransactionResponse): string {
  const data = result.receipt?.logs?.[0]?.data;

  if (typeof data !== "string" || !data.startsWith("0x") || data.length < 130) {
    return result.contractValue;
  }

  return BigInt(`0x${data.slice(66, 130)}`).toString();
}

function Sidebar() {
  const items = [
    ["Home", Home],
    ["Network", Network],
    ["Blocks", Blocks],
    ["Transactions", Activity],
    ["Wallet", Wallet],
    ["Native PQC", ShieldCheck],
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
        <div className="text-sm font-semibold">Plan B Native</div>
        <div className="mt-2 text-xs leading-5 text-violet-100">
          ML-DSA-65 signed native PQC transactions sent directly to Besu.
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
  const [lastTx, setLastTx] = useState<NativePqcTransactionResponse | null>(null);
  const [txDump, setTxDump] = useState<any>(null);
  const [counterAfter, setCounterAfter] = useState<string | null>(null);
  const [logs, setLogs] = useState<RunLog[]>([]);

  const latestBlocks: ExplorerBlock[] = overview?.result?.blocks ?? [];

  const latestTxHash = lastTx?.txHash;

  const pqcTransactionDump = useMemo(() => {
    if (!lastTx) return null;
    return buildNativeTransactionDump(lastTx, {
      backendUrl: api.backendUrl,
      counterAfter,
      health,
      txDump
    });
  }, [counterAfter, lastTx, txDump, health]);

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

  async function handleNativeSubmitted(result: NativePqcTransactionResponse) {
    setLastTx(result);
    setTxDump(null);
    setCounterAfter(null);

    if (result.txHash) {
      try {
        setTxDump(await api.txDump(result.txHash));
      } catch (err) {
        pushLog(
          "Native explorer lookup failed",
          "error",
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    if (result.pqcSender) {
      try {
        const counter = await api.nativeCounter(
          result.pqcSender,
          health?.nativePqcContractAddress ?? result.nativePqcContractAddress
        );
        setCounterAfter(counter.counter);
      } catch (err) {
        pushLog(
          "Native counter readback failed",
          "error",
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    pushLog(
      "Native PQC transaction submitted",
      "success",
      `pqNonce ${result.pqNonce} txHash ${shortHash(result.txHash)} receipt ${
        result.receipt?.status ?? "pending"
      } block ${result.receipt?.blockNumber ?? result.latestBlock ?? "pending"}`
    );

    await refresh();
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
                    ML-DSA-65, submits it directly to Besu, and shows the mined
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

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatCard
              label="Besu RPC"
              value={health?.besuRpcUrl ?? "-"}
              icon={<Network className="h-5 w-5" />}
            />
            <StatCard
              label="Contract"
              value={shortHash(health?.nativePqcContractAddress, 12, 10)}
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
              <PlanBNativePqcCard onSubmitted={handleNativeSubmitted} />

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
                  Latest Native PQC Transaction
                </h2>

                {!lastTx ? (
                  <div className="mt-5 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
                    No native PQC transaction yet. Submit a transaction to generate receipt and explorer evidence.
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <StatCard
                        label="Status"
                        value={lastTx.ok ? "Accepted" : "Rejected"}
                        icon={
                          lastTx.ok ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-600" />
                          )
                        }
                      />
                      <StatCard
                        label="Receipt"
                        value={lastTx.receipt?.status ?? "pending"}
                        icon={<Gauge className="h-5 w-5" />}
                      />
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-5">
                      <div className="mb-2 text-sm font-bold text-slate-500">
                        Native Besu Transaction Hash
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1 break-all font-mono text-sm">
                          {latestTxHash}
                        </div>
                        <button
                          onClick={() => copy(latestTxHash ?? undefined)}
                          className="rounded-xl border border-slate-200 bg-white p-2"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <StatCard
                        label="PQC sender"
                        value={shortHash(lastTx.pqcSender, 12, 10)}
                        icon={<Wallet className="h-5 w-5" />}
                      />
                      <StatCard
                        label="Block"
                        value={`#${hexToNumber(lastTx.receipt?.blockNumber ?? lastTx.latestBlock) ?? "-"}`}
                        icon={<Blocks className="h-5 w-5" />}
                      />
                      <StatCard
                        label="txDigest"
                        value={shortHash(lastTx.txDigest, 12, 10)}
                        icon={<Activity className="h-5 w-5" />}
                      />
                      <StatCard
                        label="Signature"
                        value={`${lastTx.localVerification?.pqSignatureBytes ?? 0} bytes`}
                        icon={<ShieldCheck className="h-5 w-5" />}
                      />
                      <StatCard
                        label="pqNonce"
                        value={lastTx.pqNonce}
                        icon={<Gauge className="h-5 w-5" />}
                      />
                      <StatCard
                        label="On-chain counter"
                        value={counterAfter ?? parseCounterAfterFromReceipt(lastTx)}
                        icon={<Database className="h-5 w-5" />}
                      />
                    </div>
                  </div>
                )}
              </div>

              {pqcTransactionDump && (
                <JsonDump
                  title="Native PQC Transaction Dump"
                  data={pqcTransactionDump}
                />
              )}

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">
                  Latest Native PQC Transactions
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
