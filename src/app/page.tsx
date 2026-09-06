"use client";

import { CopyLink } from "@/components/copy-link";
import { TypeBadge } from "@/components/type-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatWon } from "@/lib/format";
import { PAYOUT_TYPES, payeeReady } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import type { Payout } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const { payouts, ready, payeeOf } = useStore();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const outgoing = payouts.filter((p) => p.side === "out");
  const incoming = payouts.filter((p) => p.side === "in");
  const outSum = sums(outgoing);
  const nextPay = outgoing.find((p) => p.status !== "paid") ?? outgoing[0];
  const nextTax = nextPay
    ? calcTax({ method: nextPay.taxMethod, gross: nextPay.gross })
    : null;
  const nextReady = nextPay ? payeeReady(payeeOf(nextPay.id)) : false;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--gold-ink)]">
          TOURMAKER SPM
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          먼저 이체 자료를 받고,
          <br className="hidden sm:block" /> 3.3%를 뺀 뒤 보냅니다.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          직원 급여는 넣지 않습니다. 강사료·요원비·체험비·용역비는 사업소득으로 보고
          원천 3.3%를 제외한 금액을 이체합니다. 객실배정·만족도 설문은 이 화면과 묶지 않습니다.
        </p>
      </section>

      {nextPay && nextTax ? (
        <Card className="border-[color:var(--gold)]/40">
          <CardHeader>
            <p className="text-xs font-semibold text-[color:var(--gold-ink)]">바로 처리할 지출</p>
            <CardTitle className="text-xl">{nextPay.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {nextPay.clientName ? `${nextPay.clientName} 발주 · ` : ""}
              {nextPay.eventName}
              {nextPay.documentNo ? ` · ${nextPay.documentNo}` : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextPay.memo ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{nextPay.memo}</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">발주처 금액</p>
                <p className="text-lg font-bold tabular-nums">{formatWon(nextTax.gross)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">원천 3.3%</p>
                <p className="text-lg font-bold tabular-nums">{formatWon(nextTax.withholding)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">이체액</p>
                <p className="text-lg font-bold tabular-nums">{formatWon(nextTax.net)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {nextReady
                ? "이체용 자료를 받았습니다."
                : "이름, 주민등록번호, 신분증, 본인 계좌만 받으면 이체할 수 있습니다."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/payouts/${nextPay.id}`} className={cn(buttonVariants({ size: "sm" }))}>
                지출 건 열기
              </Link>
              {origin ? (
                <CopyLink url={`${origin}/p/${nextPay.id}`} label="자료 받는 링크 복사" />
              ) : null}
              <Link
                href="/s/tm-260903"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                행사 만족도 설문 (별도)
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">법인 지출 총액</CardTitle>
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
            <CardTitle className="text-sm text-muted-foreground">참고 수입 사례</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatWon(sums(incoming).gross)}
            </p>
            <p className="text-xs text-muted-foreground">법인 손금과 섞지 않습니다</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">지출 유형</h2>
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
                      <span className="text-xs text-muted-foreground">{items.length}건</span>
                    </div>
                    <CardTitle className="mt-1">{t.short}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{t.when}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{t.taxHint}</p>
                    {ready && items.length > 0 ? (
                      <p className="mt-2 text-sm font-semibold tabular-nums">{formatWon(s.gross)}</p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">아직 이 유형의 지출이 없습니다.</p>
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
            새 지출
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
                          {p.side === "in" ? "참고 수입" : "법인 지출"} · {statusLabel[p.status]}
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
