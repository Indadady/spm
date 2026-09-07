"use client";

import { CopyLink } from "@/components/copy-link";
import { buttonVariants } from "@/components/ui/button";
import { formatPayDate, formatWon } from "@/lib/format";
import { payeeReady } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const { payouts, ready, payeeOf } = useStore();

  const outgoing = payouts.filter((p) => p.side === "out");

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">스마트파트너 관리</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          링크를 보내 계좌·신분증을 받고, 3.3%를 뺀 뒤 이체합니다.
        </p>
      </section>

      <div className="flex justify-end">
        <Link href="/payouts/new" className={cn(buttonVariants({ size: "sm" }))}>
          새 지급
        </Link>
      </div>

      {!ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : outgoing.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 지급 건이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {outgoing.map((p) => {
            const tax = calcTax({ method: p.taxMethod, gross: p.gross });
            const payee = payeeOf(p.id);
            const got = payeeReady(payee);
            return (
              <li key={p.id}>
                <Link
                  href={`/payouts/${p.id}`}
                  className="block rounded-2xl border bg-card px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.partnerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.eventName || p.title}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.status === "paid" ? "이체 완료" : got ? "자료 받음" : "자료 대기"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm tabular-nums">
                    세전 {formatWon(tax.gross)} → 이체 {formatWon(tax.net)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    지급일 {formatPayDate(p.paidDate || p.dueDate)}
                  </p>
                </Link>
                {p.status !== "paid" ? (
                  <div className="mt-1 flex justify-end">
                    <CopyLink payoutId={p.id} label="자료 링크 복사" />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
