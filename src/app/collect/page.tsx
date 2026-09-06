"use client";

import { TypeBadge } from "@/components/type-badge";
import { maskRrn } from "@/lib/format";
import { PAYOUT_TYPES, payeeReady } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

export default function CollectPage() {
  const { payouts, ready, payeeOf } = useStore();
  const outgoing = payouts.filter((p) => p.side === "out");
  const links = payouts.flatMap((p) =>
    p.docs.map((d) => ({
      payout: p,
      type: PAYOUT_TYPES.find((t) => t.id === p.typeId)!,
      doc: d,
    }))
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">자료함</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          상대가 제출한 이체 자료는 만족도 설문과 같은 파이어베이스 자료함에 모입니다. 각 지출 건의
          받은 자료에서 확인합니다.
        </p>
      </div>
      {payouts.length === 0 && !ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold">이체 자료</h2>
            {outgoing.length === 0 ? (
              <p className="text-sm text-muted-foreground">법인 지출 건이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {outgoing.map((p) => {
                  const payee = payeeOf(p.id);
                  const ok = payeeReady(payee);
                  return (
                    <li key={p.id} className="rounded-2xl border bg-card p-4 text-sm">
                      <Link href={`/payouts/${p.id}/payee`} className="font-semibold underline">
                        {p.title}
                      </Link>
                      {ok && payee ? (
                        <p className="mt-1 text-muted-foreground">
                          {payee.name} · {maskRrn(payee.rrn)} · {payee.bank} {payee.account} (
                          {payee.holder})
                        </p>
                      ) : (
                        <p className="mt-1 text-muted-foreground">아직 자료를 받지 못했습니다.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">링크</h2>
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 링크가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {links.map(({ payout, type, doc }) => (
                  <li key={`${payout.id}-${doc.id}`} className="rounded-2xl border bg-card p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <TypeBadge id={payout.typeId} name={type.name} />
                      <Link href={`/payouts/${payout.id}`} className="text-xs underline">
                        {payout.title}
                      </Link>
                    </div>
                    <a
                      href={doc.href}
                      target={doc.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="flex items-start gap-2 text-sm font-medium"
                    >
                      {doc.kind === "pdf" ? (
                        <FileText className="mt-0.5 size-4 shrink-0" />
                      ) : (
                        <ExternalLink className="mt-0.5 size-4 shrink-0" />
                      )}
                      {doc.title}
                    </a>
                    {doc.note ? (
                      <p className="mt-1 pl-6 text-xs text-muted-foreground">{doc.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
