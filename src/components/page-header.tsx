export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[color:var(--gold-ink)]">
            {kicker}
          </p>
        ) : null}
        <h1 className="mt-1 text-[1.65rem] font-bold leading-tight text-[color:var(--navy)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
