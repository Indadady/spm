"use client";

import { CopyLink } from "@/components/copy-link";
import { GroupCopyLink } from "@/components/group-copy-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { wipePayoutRemote } from "@/lib/delete-payout";
import { formatPayDate, formatWon } from "@/lib/format";
import { collectKindLabel, deleteCampaign } from "@/lib/group-collect";
import { useGroupStore } from "@/lib/group-store";
import { campaignWhen, payoutWhen, recentSlice } from "@/lib/recent";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function HomePage() {
  const { payouts, ready, payeeOf, removePayout } = useStore();
  const { campaigns, ready: groupReady, removeCampaign } = useGroupStore();
  const outgoing = payouts.filter((p) => p.side === "out");
  const payoutsShown = useMemo(() => recentSlice(outgoing, payoutWhen), [outgoing]);
  const campsShown = useMemo(() => recentSlice(campaigns, campaignWhen), [campaigns]);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const busy = Boolean(deletingId);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">자료모우기</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          심플한 링크를 보내 자료를 받습니다. 스마트파트너 지급과 여행자 보험·여권을 한곳에서
          모읍니다. 홈에는 최근 5건만 두고, 지난 자료는 보관함에서 봅니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/archive" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
            보관함
          </Link>
          <Link href="/archive/#restore" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
            예전 링크 복원
          </Link>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
        ) : payoutsShown.total === 0 ? (
          <p className="text-sm text-muted-foreground">아직 지급 건이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {payoutsShown.recent.map((p) => {
              const tax = calcTax({ method: p.taxMethod, gross: p.gross });
              const payee = payeeOf(p.id);
              const got = Boolean(payee?.name && payee?.bank && payee?.account);
              const key = `payout:${p.id}`;
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
                  <div className="mt-1 flex justify-end gap-2">
                    {p.status !== "paid" ? (
                      <CopyLink payoutId={p.id} label="자료 링크 복사" />
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(`${p.partnerName} 자료와 링크를 삭제할까요? 되돌릴 수 없습니다.`))
                          return;
                        setDeletingId(key);
                        setError("");
                        try {
                          await wipePayoutRemote(p.id);
                          removePayout(p.id);
                        } catch {
                          setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
                        } finally {
                          setDeletingId("");
                        }
                      }}
                    >
                      {deletingId === key ? "지우는 중…" : "삭제"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {payoutsShown.rest.length > 0 ? (
          <p className="text-right text-xs">
            <Link href="/archive" className="underline">
              지난 지급 {payoutsShown.rest.length}건 보관함
            </Link>
          </p>
        ) : null}
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
        ) : campsShown.total === 0 ? (
          <p className="rounded-2xl border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            아직 여행자 링크가 없습니다. 행사 담당자에게 보낼 링크를 만들면, 참가자가 주민번호나
            여권사진을 직접 넣습니다. 예전에 만든 링크가 안 보이면{" "}
            <Link href="/archive/#restore" className="underline">
              복원
            </Link>
            에서 가져올 수 있습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {campsShown.recent.map((c) => {
              const key = `group:${c.id}`;
              return (
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
                  <div className="mt-1 flex justify-end gap-2">
                    <GroupCopyLink campaignId={c.id} ogSlot={c.ogSlot} label="자료 링크 복사" />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(`${c.title} 링크와 받은 자료를 삭제할까요? 되돌릴 수 없습니다.`))
                          return;
                        setDeletingId(key);
                        setError("");
                        try {
                          await deleteCampaign(c.id);
                          removeCampaign(c.id);
                        } catch {
                          setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
                        } finally {
                          setDeletingId("");
                        }
                      }}
                    >
                      {deletingId === key ? "지우는 중…" : "삭제"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {campsShown.rest.length > 0 ? (
          <p className="text-right text-xs">
            <Link href="/archive" className="underline">
              지난 여행자 자료 {campsShown.rest.length}건 보관함
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
