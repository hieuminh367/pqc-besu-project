
import { Copy, Download, ExternalLink } from "lucide-react";
import type { HistoryItem } from "../types";
import { MetricCard } from "./MetricCard";
import { Panel } from "./Panel";
import { StatusBadge } from "./StatusBadge";

type ResultPanelProps = {
  item?: HistoryItem;
};

async function copyText(value?: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

function exportEvidence(item: HistoryItem) {
  const blob = new Blob([JSON.stringify(item, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pqc-demo-evidence-${item.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultPanel({ item }: ResultPanelProps) {
  if (!item) {
    return (
      <Panel
        title="Execution Result"
        subtitle="Run a demo action to see parsed evidence and raw output."
      >
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">
          No execution result yet.
        </div>
      </Panel>
    );
  }

  const parsed = item.parsed;
  const gateway = parsed.gateway;
  const relay = gateway?.relay;

  const successTone = parsed.ok ? "green" : "red";

  return (
    <Panel
      title="Execution Result"
      subtitle={`${parsed.title} · ${item.createdAt}`}
      right={<StatusBadge tone={successTone}>{parsed.statusLabel}</StatusBadge>}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {parsed.algorithm && (
          <MetricCard label="Algorithm" value={parsed.algorithm} />
        )}
        {parsed.sender && <MetricCard label="PQC Sender" value={parsed.sender} />}
        {parsed.pqNonce && <MetricCard label="pqNonce" value={parsed.pqNonce} />}
        {parsed.txDigest && (
          <MetricCard label="txDigest" value={parsed.txDigest} />
        )}
        {relay?.txHash && <MetricCard label="txHash" value={relay.txHash} />}
        {relay?.receiptStatus !== undefined && (
          <MetricCard label="Receipt status" value={String(relay.receiptStatus)} />
        )}
        {relay?.blockNumber !== undefined && (
          <MetricCard label="Block number" value={String(relay.blockNumber)} />
        )}
        {relay?.counterAfter && (
          <MetricCard label="Counter after" value={relay.counterAfter} />
        )}
        {parsed.pqPublicKeyBytes && (
          <MetricCard label="pqPublicKey bytes" value={parsed.pqPublicKeyBytes} />
        )}
        {parsed.pqSignatureBytes && (
          <MetricCard label="pqSignature bytes" value={parsed.pqSignatureBytes} />
        )}
        {parsed.clientVersion && (
          <MetricCard label="Besu client" value={parsed.clientVersion} />
        )}
        {parsed.peerCountHex && (
          <MetricCard label="Peer count" value={parsed.peerCountHex} />
        )}
      </div>

      {(parsed.originalTxDigest || parsed.tamperedTxDigest) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {parsed.originalTxDigest && (
            <MetricCard label="Original digest" value={parsed.originalTxDigest} />
          )}
          {parsed.tamperedTxDigest && (
            <MetricCard label="Tampered digest" value={parsed.tamperedTxDigest} />
          )}
        </div>
      )}

      {gateway && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Gateway response</h3>
              <p className="text-sm text-slate-500">
                Parsed response returned by PQC Gateway.
              </p>
            </div>
            <StatusBadge tone={gateway.accepted ? "green" : "red"}>
              {gateway.accepted ? "accepted" : "rejected"}
            </StatusBadge>
          </div>

          <pre className="code-scroll max-h-64 overflow-auto rounded-xl bg-black/35 p-4 text-xs leading-6 text-slate-300">
            {JSON.stringify(gateway, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => copyText(relay?.txHash)}
          disabled={!relay?.txHash}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy className="h-4 w-4" />
          Copy txHash
        </button>

        <button
          type="button"
          onClick={() => copyText(parsed.txDigest)}
          disabled={!parsed.txDigest}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy className="h-4 w-4" />
          Copy txDigest
        </button>

        <button
          type="button"
          onClick={() => exportEvidence(item)}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15"
        >
          <Download className="h-4 w-4" />
          Export evidence JSON
        </button>

        {relay?.txHash && (
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-500">
            <ExternalLink className="h-4 w-4" />
            Private Besu tx
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 font-semibold text-white">Raw stdout</h3>
        <pre className="code-scroll max-h-96 overflow-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-xs leading-6 text-slate-300">
          {item.response.stdout || "(empty stdout)"}
        </pre>
        {item.response.stderr && (
          <>
            <h3 className="mb-2 mt-4 font-semibold text-rose-200">stderr</h3>
            <pre className="code-scroll max-h-48 overflow-auto rounded-2xl border border-rose-400/20 bg-rose-950/30 p-4 text-xs leading-6 text-rose-100">
              {item.response.stderr}
            </pre>
          </>
        )}
      </div>
    </Panel>
  );
}
