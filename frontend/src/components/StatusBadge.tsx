type StatusBadgeProps = {
  tone: "green" | "red" | "yellow" | "blue" | "slate";
  children: React.ReactNode;
};

const toneClass = {
  green: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  red: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  yellow: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  blue: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  slate: "border-slate-400/30 bg-slate-400/10 text-slate-200"
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
