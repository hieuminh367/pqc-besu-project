import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ActionCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  tone: "cyan" | "emerald" | "rose" | "amber";
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
};

const toneClass = {
  cyan: "from-cyan-500/20 to-blue-500/10 border-cyan-400/20 hover:border-cyan-300/50",
  emerald:
    "from-emerald-500/20 to-teal-500/10 border-emerald-400/20 hover:border-emerald-300/50",
  rose: "from-rose-500/20 to-pink-500/10 border-rose-400/20 hover:border-rose-300/50",
  amber: "from-amber-500/20 to-orange-500/10 border-amber-400/20 hover:border-amber-300/50"
};

export function ActionCard({
  title,
  description,
  icon,
  tone,
  loading,
  disabled,
  onClick,
  children
}: ActionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`group w-full rounded-3xl border bg-gradient-to-br p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60 ${toneClass[tone]}`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {description}
          </p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </button>
  );
}
