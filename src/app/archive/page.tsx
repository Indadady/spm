"use client";

import { CopyLink } from "@/components/copy-link";
import { GroupCopyLink } from "@/components/group-copy-link";
import { RestorePanel } from "@/components/restore-panel";
import { Button } from "@/components/ui/button";
import { wipePayoutRemote } from "@/lib/delete-payout";
import { formatPayDate, formatWon } from "@/lib/format";
import { collectKindLabel, deleteCampaign } from "@/lib/group-collect";
import { useGroupStore } from "@/lib/group-store";
import {
  campaignWhen,
  groupByYearMonth,
  monthLabel,
  payoutWhen,
} from "@/lib/recent";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ArchivePage() {
  const { payouts, ready, payeeOf, removePayout } = useStore();
  const { campaigns, ready: groupReady, removeCampaign } = useGroupStore();
  const outgoing = payouts.filter((p) => p.side === "out");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const busy = Boolean(deletingId);

  const payoutMonths = useMemo(
    () => groupByYearMonth(outgoing, payoutWhen),
    [outgoing]
  );
  const campaignMonths = useMemo(
    () => groupByYearMonth(campaigns, campaignWhen),
    [campaigns]
  );
  const years = useMemo(() => {
    const set = new Set<string>();
    for (const row of payoutMonths) set.add(row.year);
    for (const row of campaignMonths) set.add(row.year);
    return [...set].filter((y) => y !== "0000").sort((a, b) => b.localeCompare(a));
  }, [payoutMonths, campaignMonths]);
  const [year, setYear] = useState("");
  useEffect(() => {
    if (window.location.hash !== "#restore") return;
    document.getElementById("restore")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const activeYear = year && years.includes(year) ? year : years[0] ?? "";
  const months = useMemo(() => {
    const keys = new Set<string>();
    const payoutMap = new Map(payoutMonths.map((m) => [m.key, m.items]));
    const campMap = new Map(campaignMonths.map((m) => [m.key, m.items]));
    for (const row of payoutMonths) if (row.year === activeYear) keys.add(row.key);
    for (const row of campaignMonths) if (row.year === activeYear) keys.add(row.key);
    return [...keys]
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        key,
        month: key.slice(5, 7),
        payouts: payoutMap.get(key) ?? [],
        campaigns: campMap.get(key) ?? [],
      }));
  }, [activeYear, payoutMonths, campaignMonths]);

  const empty = ready && groupReady && years.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">보관함</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          홈에는 최근 자료만 둡니다. 지난 지급·여행자 링크는 연도·월별로 모아 둡니다.
        </p>
      </div>

      <RestorePanel />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!ready || !groupReady ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">아직 보관할 자료가 없습니다.</p>
      ) : (
        <>
          {years.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    y === activeYear
                      ? "border-[color:var(--navy)] bg-accent/70 font-semibold"
                      : "bg-card"
                  )}
                  onClick={() => setYear(y)}
                >
                  {y}년
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold">{activeYear}년</p>
          )}

          {months.map((block) => (
            <section key={block.key} className="space-y-2">
              <h2 className="text-sm font-bold text-[color:var(--navy)]">
                {activeYear}년 {monthLabel(block.month)}
              </h2>
              {block.payouts.map((p) => {
                const tax = calcTax({ method: p.taxMethod, gross: p.gross });
                const payee = payeeOf(p.id);
                const got = Boolean(payee?.name && payee?.bank && payee?.account);
                const key = `payout:${p.id}`;
                return (
                  <div key={p.id}>
                    <Link
                      href={`/payouts/${p.id}`}
                      className="block rounded-2xl border bg-card px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[color:var(--gold-ink)]">
                            파트너 지급
                          </p>
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
                  </div>
                );
              })}
              {block.campaigns.map((c) => {
                const key = `group:${c.id}`;
                return (
                  <div key={c.id}>
                    <Link
                      href={`/collect/open/?id=${encodeURIComponent(c.id)}`}
                      className="block rounded-2xl border bg-card px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold text-[color:var(--gold-ink)]">
                        여행자 자료
                      </p>
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
                  </div>
                );
              })}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
