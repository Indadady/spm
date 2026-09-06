import { formatWon } from "@/lib/format";
import { calcTax } from "@/lib/tax";
import type { Payout } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TaxCard({ payout }: { payout: Payout }) {
  const tax = calcTax({
    method: payout.taxMethod,
    gross: payout.gross,
    days: payout.days,
  });
  const rows = [
    ["지급 총액", tax.gross],
    ["필요경비·공제", tax.expense],
    ["과세표준", tax.taxable],
    ["소득세", tax.incomeTax],
    ["지방소득세", tax.localTax],
    ["원천징수 합계", tax.withholding],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tax.methodLabel}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {payout.side === "in" ? "입금 예정 실수령액" : "원천징수 후 이체액"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl bg-[color:var(--navy)] px-4 py-3 text-white">
          <p className="text-xs text-white/70">실지급 / 실수령</p>
          <p className="text-2xl font-bold tracking-tight">{formatWon(tax.net)}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium tabular-nums">{formatWon(value)}</dd>
            </div>
          ))}
        </dl>
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {tax.notes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
