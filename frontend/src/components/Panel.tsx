type PanelProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
};

export function Panel({ title, subtitle, children, right }: PanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      {(title || subtitle || right) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
