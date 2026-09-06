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

  if (!payout) {
    return (
      <p className="text-sm text-muted-foreground">
        {ready ? "해당 건을 찾을 수 없습니다." : "불러오는 중…"}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <Link href={`/payouts/${payout.id}`} className="text-sm text-muted-foreground">
        ← {payout.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">참고 설문</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          법인 지출 건의 이체 자료는 별도 링크로 받습니다. 이 화면은 참고 수입 사례용입니다.
        </p>
      </div>
      <PayoutSubnav payout={payout} />
      {payout.survey.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          이 건에는 설문이 없습니다. 이체 자료는 상대에게 보낸 링크의 제출 버튼으로 받습니다.
        </p>
      ) : (
        <SurveyForm
          payoutId={payout.id}
          questions={payout.survey}
          externalFormUrl={payout.externalFormUrl}
        />
      )}
    </div>
  );
}
