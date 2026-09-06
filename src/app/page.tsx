"use client";

import { TypeBadge } from "@/components/type-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatWon } from "@/lib/format";
import { PAYOUT_TYPES } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import type { Payout } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusLabel: Record<Payout["status"], string> = {
  collecting: "자료 수집",
  contract: "계약·서명",
  ready: "지급 대기",
  paid: "지급 완료",
  received: "입금 확인",
};

function sums(list: Payout[]) {
  return list.reduce(
    (acc, p) => {
      const tax = calcTax({ method: p.taxMethod, gross: p.gross, days: p.days });
      acc.gross += tax.gross;
      acc.withholding += tax.withholding;
      acc.net += tax.net;
      return acc;
    },
    { gross: 0, withholding: 0, net: 0 }
  );
}

export default function HomePage() {
  const { payouts, ready } = useStore();
  const outgoing = payouts.filter((p) => p.side === "out");
  const incoming = payouts.filter((p) => p.side === "in");
  const outSum = sums(outgoing);
  const inSum = sums(incoming);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--gold-ink)]">
          TOURMAKER SPM
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          법인에서 나가는 돈은 원천 후 이체,
          <br className="hidden sm:block" /> 증빙은 한 묶음으로.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          인건비, 행사요원, 강사료, 체험비, 개인사업자·프리랜서, 수익쉐어.
          설문으로 계좌를 받고, 계약에 서명하고, 필요하면 객실까지 배정한 뒤
          원천징수 숫자를 원장에 남깁니다.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">법인 지급 총액</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatWon(outSum.gross)}</p>
            <p className="text-xs text-muted-foreground">원천 {formatWon(outSum.withholding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">원천 후 이체</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatWon(outSum.net)}</p>
            <p className="text-xs text-muted-foreground">{outgoing.length}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">기타소득 수입</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatWon(inSum.net)}</p>
            <p className="text-xs text-muted-foreground">
              실수령 · 원천 {formatWon(inSum.withholding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">지급 유형</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYOUT_TYPES.map((t) => {
            const items = outgoing.filter((p) => p.typeId === t.id);
            const s = sums(items);
            return (
              <Link key={t.id} href={`/types/${t.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <TypeBadge id={t.id} name={t.name} />
                      <span className="text-xs text-muted-foreground">
                        {items.length}건
                      </span>
                    </div>
                    <CardTitle className="mt-1">{t.short}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{t.when}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{t.taxHint}</p>
                    {ready && items.length > 0 ? (
                      <p className="mt-2 text-sm font-semibold tabular-nums">
                        {formatWon(s.gross)}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">아직 법인 지급 건이 없습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">최근 건</h2>
          <Link href="/payouts/new" className={cn(buttonVariants({ size: "sm" }))}>
            새 지급 등록
          </Link>
        </div>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 건이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {payouts.map((p) => {
              const tax = calcTax({ method: p.taxMethod, gross: p.gross, days: p.days });
              const type = PAYOUT_TYPES.find((t) => t.id === p.typeId)!;
              return (
                <li key={p.id}>
                  <Link
                    href={`/payouts/${p.id}`}
                    className="flex flex-col gap-1 rounded-2xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeBadge id={p.typeId} name={type.name} />
                        <span className="text-[11px] text-muted-foreground">
                          {p.side === "in" ? "수입 샘플" : "법인 지급"} · {statusLabel[p.status]}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.partnerName} · {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{formatWon(p.gross)}</p>
                      <p className="text-xs text-muted-foreground">
                        원천 {formatWon(tax.withholding)} → {formatWon(tax.net)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
