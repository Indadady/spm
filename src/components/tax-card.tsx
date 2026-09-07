"use client";

import { CopyButton } from "@/components/copy-button";
import { GrossAmountField } from "@/components/gross-amount-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { payDateIso } from "@/lib/format";
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
  const payDate = payDateIso(payout);

  return (
    <Card>
      <CardHeader>
        <CardTitle>세무 전달 자료</CardTitle>
        <p className="text-xs text-muted-foreground">
          지급일을 바꾸면 아래 글의 지급일도 바로 바뀝니다. 계좌는 상대가 제출한 뒤 채워집니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <GrossAmountField
          value={payout.gross}
          taxMethod={payout.taxMethod}
          days={payout.days}
          onChange={(gross) => updatePayout(payout.id, { gross })}
        />
        <div className="space-y-1.5">
          <Label htmlFor={`pay-date-${payout.id}`}>지급일</Label>
          <Input
            id={`pay-date-${payout.id}`}
            type="date"
            value={payDate}
            onChange={(e) => {
              const date = e.target.value;
              if (!date) return;
              updatePayout(payout.id, {
                dueDate: date,
                ...(payout.paidDate ? { paidDate: date } : {}),
              });
            }}
          />
        </div>
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
