"use client";

import { CopyLink } from "@/components/copy-link";
import { GroupCopyLink } from "@/components/group-copy-link";
import { buttonVariants } from "@/components/ui/button";
import { formatPayDate, formatWon } from "@/lib/format";
import { collectKindLabel } from "@/lib/group-collect";
import { useGroupStore } from "@/lib/group-store";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const { payouts, ready, payeeOf } = useStore();
  const { campaigns, ready: groupReady } = useGroupStore();
  const outgoing = payouts.filter((p) => p.side === "out");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">자료모우기</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          심플한 링크를 보내 자료를 받습니다. 스마트파트너 지급과 여행자 보험·여권을 한곳에서
          모읍니다.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">파트너 지급</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              개인계좌로 받아야 하는 스마트파트너. 계좌·신분증·주민번호.
            </p>
          </div>
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
              const got = Boolean(payee?.name && payee?.bank && payee?.account);
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
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">여행자 자료</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              여행자보험 주민번호, 여행자명단용 여권사본. 지급과 같이 링크만 보냅니다.
            </p>
          </div>
          <Link href="/collect/new" className={cn(buttonVariants({ size: "sm" }))}>
            새 링크
          </Link>
        </div>

        {!groupReady ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : campaigns.length === 0 ? (
          <p className="rounded-2xl border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            아직 여행자 링크가 없습니다. 행사 담당자에게 보낼 링크를 만들면, 참가자가 주민번호나
            여권사진을 직접 넣습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/collect/open/?id=${encodeURIComponent(c.id)}`}
                  className="block rounded-2xl border bg-card px-4 py-3"
                >
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {collectKindLabel(c.kind)}
                    {c.expectedCount ? ` · 예상 ${c.expectedCount}명` : ""}
                  </p>
                </Link>
                <div className="mt-1 flex justify-end">
                  <GroupCopyLink campaignId={c.id} ogSlot={c.ogSlot} label="자료 링크 복사" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
