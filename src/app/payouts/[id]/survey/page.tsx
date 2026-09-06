"use client";

import { PayoutSubnav } from "@/components/payout-subnav";
import { SurveyForm } from "@/components/survey-form";
import { usePayout, useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SurveyPage() {
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
        <h1 className="text-2xl font-bold">설문</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          계좌·사업자 여부·수행 확인을 구글폼처럼 받습니다. 답은 이 기기에만 남습니다.
        </p>
      </div>
      <PayoutSubnav payout={payout} />
      <SurveyForm
        payoutId={payout.id}
        questions={payout.survey}
        externalFormUrl={payout.externalFormUrl}
      />
    </div>
  );
}
