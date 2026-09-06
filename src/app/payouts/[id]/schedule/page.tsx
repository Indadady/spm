"use client";

import { PayoutSubnav } from "@/components/payout-subnav";
import { formatDate } from "@/lib/format";
import { usePayout, useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready } = useStore();

  if (!ready) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (!payout) return <p>해당 건을 찾을 수 없습니다.</p>;

  return (
    <div className="space-y-5">
      <Link href={`/payouts/${payout.id}`} className="text-sm text-muted-foreground">
        ← {payout.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">일정 · 수행 증빙</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          일일촬영계획표(260904)에 적힌 회차입니다. 자문 계약기간(8/24~25)과 촬영일은 다릅니다.
        </p>
      </div>
      <PayoutSubnav payout={payout} />
      {payout.docs.some((d) => d.href.endsWith(".pdf") && d.title.includes("촬영")) ? (
        <a
          className="text-sm underline"
          href={payout.docs.find((d) => d.title.includes("촬영"))?.href}
          target="_blank"
          rel="noreferrer"
        >
          원본 PDF 열기
        </a>
      ) : null}

      {!payout.schedule?.length ? (
        <p className="text-sm text-muted-foreground">연결된 일정이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {payout.schedule.map((day) => (
            <article key={`${day.round}-${day.date}`} className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-semibold text-[color:var(--gold-ink)]">
                {day.round}회차 · {formatDate(day.date)}
              </p>
              <p className="mt-1 text-sm">
                콜 {day.callTime} · 슛 {day.shootTime} · 숙소 {day.lodgingName}
              </p>
              <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                {day.locations.map((loc) => (
                  <li key={loc}>{loc}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                {day.meals.map((m) => `${m.when} ${m.place}`).join(" · ")}
              </p>
              <ul className="mt-3 space-y-2">
                {day.beats.map((b) => (
                  <li key={`${b.time}-${b.place}`} className="text-sm">
                    <span className="font-medium tabular-nums">{b.time}</span>
                    {b.scene ? <span className="text-muted-foreground"> · {b.scene}</span> : null}
                    <span> · {b.place}</span>
                    <p className="text-muted-foreground">{b.content}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
