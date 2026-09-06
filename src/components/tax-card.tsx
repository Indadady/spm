"use client";

import { CopyButton } from "@/components/copy-button";
import { GrossAmountField } from "@/components/gross-amount-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { calcTax, taxMemoFor } from "@/lib/tax";
import type { PayeeProfile, Payout } from "@/lib/types";

export function TaxCard({
  payout,
  payee,
}: {
  payout: Payout;
  payee?: PayeeProfile;
}) {
  const { updatePayout } = useStore();
  const tax = calcTax({
    method: payout.taxMethod,
    gross: payout.gross,
    days: payout.days,
  });
  const memo = taxMemoFor(payout, payee);

  return (
    <Card>
      <CardHeader>
        <CardTitle>세무 전달 자료</CardTitle>
        <p className="text-xs text-muted-foreground">
          세무 담당자에게 그대로 보내면 됩니다. 계좌는 상대가 제출한 뒤 채워집니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <GrossAmountField
          value={payout.gross}
          taxMethod={payout.taxMethod}
          days={payout.days}
          onChange={(gross) => updatePayout(payout.id, { gross })}
        />
        <pre className="whitespace-pre-wrap break-keep rounded-xl bg-[color:var(--navy)] px-4 py-3 text-sm leading-relaxed text-white">
          {memo}
        </pre>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            소득세 {tax.incomeTax.toLocaleString("ko-KR")}원 · 지방소득세{" "}
            {tax.localTax.toLocaleString("ko-KR")}원
          </p>
          <CopyButton text={memo} label="세무 자료 복사" />
        </div>
      </CardContent>
    </Card>
  );
}
