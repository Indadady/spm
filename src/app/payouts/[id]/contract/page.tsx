"use client";

import { PayoutSubnav } from "@/components/payout-subnav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { usePayout, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready, contractOf } = useStore();

  if (!ready) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (!payout) return <p>해당 건을 찾을 수 없습니다.</p>;

  const c = contractOf(payout.id) ?? payout.contract;

  return (
    <div className="space-y-5">
      <Link href={`/payouts/${payout.id}`} className="text-sm text-muted-foreground">
        ← {payout.title}
      </Link>
      <h1 className="text-2xl font-bold">계약</h1>
      <PayoutSubnav payout={payout} />

      {!c ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          이 건은 투어메이커와 별도 계약을 두지 않았습니다. 이체에 필요한 자료만 받습니다.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {c.signUrl ? (
              <a
                href={c.signUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants())}
              >
                싸인오케이 서명
              </a>
            ) : null}
            {c.pdfHref ? (
              <a
                href={c.pdfHref}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                계약서 PDF
              </a>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{c.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {c.periodStart && c.periodEnd
                  ? `${formatDate(c.periodStart)} ~ ${formatDate(c.periodEnd)}`
                  : null}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[c.partyA, c.partyB].map((p) => (
                  <div key={p.label} className="rounded-xl bg-muted px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">{p.label}</p>
                    <p className="font-semibold">{p.name}</p>
                    <p>{p.title}</p>
                    {p.phone ? <p>{p.phone}</p> : null}
                    {p.birth ? <p>생년월일 {p.birth}</p> : null}
                  </div>
                ))}
              </div>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {c.workSummary.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              {c.clauses.map((cl) => (
                <section key={cl.title}>
                  <h2 className="text-sm font-semibold">{cl.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{cl.body}</p>
                </section>
              ))}
            </CardContent>
          </Card>

          {c.pdfHref ? (
            <iframe
              title="계약서 PDF"
              src={c.pdfHref}
              className="h-[70vh] w-full rounded-xl border bg-white"
            />
          ) : null}
        </>
      )}
    </div>
  );
}
