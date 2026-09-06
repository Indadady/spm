"use client";

import { EvidenceList } from "@/components/evidence-list";
import { PayoutSubnav } from "@/components/payout-subnav";
import { TaxCard } from "@/components/tax-card";
import { TypeBadge } from "@/components/type-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { typeById } from "@/lib/payout-types";
import { usePayout, useStore } from "@/lib/store";
import { todaySeoulIso } from "@/lib/format";
import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const statusLabel = {
  collecting: "자료 수집",
  contract: "계약·서명",
  ready: "지급 대기",
  paid: "지급 완료",
  received: "입금 확인",
} as const;

export default function PayoutPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { setStatus, ready } = useStore();

  if (!ready) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (!payout) return <p>해당 건을 찾을 수 없습니다.</p>;

  const type = typeById(payout.typeId);

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted-foreground">
        ← 현황
      </Link>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge id={payout.typeId} name={type.name} href={`/types/${type.id}`} />
          <span className="text-xs text-muted-foreground">
            {payout.side === "in" ? "기타소득 수입 샘플" : "법인 지급"} ·{" "}
            {statusLabel[payout.status]}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">{payout.title}</h1>
        <p className="text-sm text-muted-foreground">
          {payout.partnerName} ({payout.partnerRole})
          {payout.eventName ? ` · ${payout.eventName}` : ""}
          {" · "}지급일 {formatDate(payout.dueDate)}
        </p>
      </div>
      <PayoutSubnav payout={payout} />
      {payout.memo ? (
        <p className="rounded-xl bg-accent/70 px-4 py-3 text-sm leading-relaxed">{payout.memo}</p>
      ) : null}

      <TaxCard payout={payout} />

      <div className="flex flex-wrap gap-2">
        {payout.side === "out" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setStatus(payout.id, "ready")}>
              지급 대기로
            </Button>
            <Button size="sm" onClick={() => setStatus(payout.id, "paid", todaySeoulIso())}>
              이체 완료
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setStatus(payout.id, "received", todaySeoulIso())}>
            입금 확인
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>링크 자료</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payout.docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 링크가 없습니다.</p>
          ) : (
            payout.docs.map((d) => (
              <a
                key={d.id}
                href={d.href}
                target={d.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
              >
                {d.kind === "pdf" ? (
                  <FileText className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <ExternalLink className="mt-0.5 size-4 shrink-0" />
                )}
                <span>
                  <span className="block text-sm font-medium">{d.title}</span>
                  {d.note ? (
                    <span className="text-xs text-muted-foreground">{d.note}</span>
                  ) : null}
                </span>
              </a>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>증빙 체크</CardTitle>
        </CardHeader>
        <CardContent>
          <EvidenceList payoutId={payout.id} items={payout.evidence} />
        </CardContent>
      </Card>
    </div>
  );
}
