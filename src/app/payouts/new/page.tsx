"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PAYOUT_TYPES } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { todaySeoulIso } from "@/lib/format";
import type { Payout, PayoutTypeId, TaxMethod } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const taxChoices: { id: TaxMethod; label: string }[] = [
  { id: "business-3-3", label: "사업소득 3.3%" },
  { id: "tax-invoice", label: "세금계산서 (원천 없음)" },
];

function NewPayoutForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { addPayout } = useStore();
  const preset = (params.get("type") as PayoutTypeId | null) ?? "lecture";
  const [typeId, setTypeId] = useState<PayoutTypeId>(
    PAYOUT_TYPES.some((t) => t.id === preset) ? preset : "lecture"
  );
  const type = useMemo(() => PAYOUT_TYPES.find((x) => x.id === typeId)!, [typeId]);
  const [taxMethod, setTaxMethod] = useState<TaxMethod>(type.taxDefault);
  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [eventName, setEventName] = useState("");
  const [clientName, setClientName] = useState("");
  const [gross, setGross] = useState("");
  const [due, setDue] = useState(todaySeoulIso());
  const [memo, setMemo] = useState("");

  function onType(next: PayoutTypeId) {
    setTypeId(next);
    const t = PAYOUT_TYPES.find((x) => x.id === next)!;
    setTaxMethod(t.taxDefault);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const id = `pmt-${Date.now()}`;
        const payout: Payout = {
          id,
          typeId,
          side: "out",
          title: title.trim() || `${type.name} · ${partner.trim() || "미정"}`,
          partnerName: partner.trim() || "미정",
          partnerRole: type.payee,
          eventName: eventName.trim() || undefined,
          clientName: clientName.trim() || undefined,
          needsContract: false,
          gross: Number(gross.replace(/,/g, "")) || 0,
          taxMethod,
          dueDate: due,
          status: "collecting",
          memo: memo.trim() || undefined,
          docs: [],
          evidence: type.evidence,
          survey: [],
        };
        addPayout(payout);
        router.push(`/payouts/${id}`);
      }}
    >
      <div className="space-y-1.5">
        <Label>지출 유형</Label>
        <select
          className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
          value={typeId}
          onChange={(e) => onType(e.target.value as PayoutTypeId)}
        >
          {PAYOUT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{type.taxHint}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">건 제목</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 태백해설사 심화교육 강사료 · 김련"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="partner">받는 사람</Label>
          <Input
            id="partner"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            required
            placeholder="이름"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event">행사명 (있으면)</Label>
          <Input id="event" value={eventName} onChange={(e) => setEventName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client">발주처 (있으면)</Label>
        <Input
          id="client"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="예: 태백고생대자연사박물관"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gross">지출 총액 (세전)</Label>
          <Input
            id="gross"
            inputMode="numeric"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            required
            placeholder="2000000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="due">지급 예정일</Label>
          <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>원천 방식</Label>
        <select
          className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
          value={taxMethod}
          onChange={(e) => setTaxMethod(e.target.value as TaxMethod)}
        >
          {taxChoices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        등록하고 자료 링크 만들기
      </Button>
    </form>
  );
}

export default function NewPayoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">새 지출</h1>
      <p className="text-sm text-muted-foreground">
        받는 사람에게 보낼 링크가 생깁니다. 이름·주민등록번호·신분증·본인 계좌를 받아 3.3%를 뺀 뒤
        이체하면 됩니다. 이 브라우저에 저장됩니다.
      </p>
      <Suspense>
        <NewPayoutForm />
      </Suspense>
    </div>
  );
}
