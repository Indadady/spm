"use client";

import { PayeeForm } from "@/components/payee-form";
import { formatWon } from "@/lib/format";
import { usePayout, useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import { useParams } from "next/navigation";

export default function PublicPayeePage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready } = useStore();

  if (!payout || payout.side !== "out") {
    if (!ready) {
      return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
    }
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-bold">링크를 확인하세요</h1>
        <p className="text-sm text-muted-foreground">
          해당하는 지출 건이 없습니다. 투어메이커에서 받은 주소를 다시 열어 주세요.
        </p>
      </div>
    );
  }

  const tax = calcTax({ method: payout.taxMethod, gross: payout.gross });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-[color:var(--gold-ink)]">지출 자료</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{payout.partnerRole} 정보</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {payout.eventName ?? payout.title} 관련 비용을 지급하기 위해 받습니다.
          총액 {formatWon(tax.gross)}에서 사업소득 원천 3.3%({formatWon(tax.withholding)})를 뺀{" "}
          {formatWon(tax.net)}이 본인 명의 계좌로 입금됩니다.
        </p>
      </div>
      <PayeeForm payout={payout} />
    </div>
  );
}
