import { useState } from "react";
import {
  api,
  type NativePqcTransactionResponse
} from "../api/client";

const DEFAULT_NATIVE_CONTRACT =
  import.meta.env.VITE_NATIVE_PQC_CONTRACT_ADDRESS ??
  "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA";

type PlanBNativePqcCardProps = {
  defaultValue?: string;
  defaultContractAddress?: string;
  onSubmitted?: (result: NativePqcTransactionResponse) => Promise<void> | void;
};

function shortText(value?: string | null, head = 18, tail = 14) {
  if (!value) return "null";
  if (value.length <= head + tail + 8) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export default function PlanBNativePqcCard({
  defaultValue = "7",
  defaultContractAddress = DEFAULT_NATIVE_CONTRACT,
  onSubmitted
}: PlanBNativePqcCardProps) {
  const [contractAddress, setContractAddress] = useState(defaultContractAddress);
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NativePqcTransactionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendNativePqcTx() {
    setLoading(true);
    setError(null);

    try {
      const body = await api.sendNativePqc({
        contractAddress,
        value
      });

      setResult(body);

      if (!body.ok) {
        setError(body.error ?? body.stderr ?? "Plan B native transaction failed");
        return;
      }

      await onSubmitted?.(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">
        Send Native PQC Transaction
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Frontend calls the backend native endpoint. Backend ABI-encodes
        <code> executeNativePQC(uint256) </code>
        , signs a native typed transaction <code>0x05</code> with ML-DSA-65,
        then sends it directly to Besu with <code>eth_sendRawTransaction</code>.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            pqNonce
          </div>
          <input
            value="auto (resolved from pending account nonce)"
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

      <label className="mt-4 block">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Native PQC contract
        </div>
        <input
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs outline-none focus:border-violet-400"
        />
      </label>

      <button
        disabled={loading}
        onClick={sendNativePqcTx}
        className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-5 py-4 text-base font-black text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {loading ? "Sending native PQC transaction..." : "Send Native PQC Transaction"}
      </button>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {result?.ok && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div>
            <span className="font-semibold">nonceMode:</span> {result.nonceMode ?? "auto"}
          </div>
          <div>
            <span className="font-semibold">pqNonce:</span> {result.pqNonce}
          </div>
          <div>
            <span className="font-semibold">accountNonce:</span> {result.accountNonce ?? "n/a"}
          </div>
          <div>
            <span className="font-semibold">txHash:</span> {shortText(result.txHash)}
          </div>
          <div>
            <span className="font-semibold">receipt:</span> {result.receipt?.status ?? "pending"}
          </div>
        </div>
      )}
    </section>
  );
}
