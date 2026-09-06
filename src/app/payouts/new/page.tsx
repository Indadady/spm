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
  { id: "wage", label: "근로소득 · 간이세액" },
  { id: "daily-wage", label: "일용근로 6.6%" },
  { id: "other-income-60", label: "기타소득 8.8%" },
  { id: "business-3-3", label: "사업소득 3.3%" },
  { id: "tax-invoice", label: "세금계산서 (원천 없음)" },
  { id: "manual", label: "직접 입력" },
];

function NewPayoutForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { addPayout } = useStore();
  const preset = (params.get("type") as PayoutTypeId | null) ?? "freelancer";
  const [typeId, setTypeId] = useState<PayoutTypeId>(
    PAYOUT_TYPES.some((t) => t.id === preset) ? preset : "freelancer"
  );
  const type = useMemo(() => PAYOUT_TYPES.find((t) => t.id === typeId)!, [typeId]);
  const [taxMethod, setTaxMethod] = useState<TaxMethod>(type.taxDefault);
  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [eventName, setEventName] = useState("");
  const [gross, setGross] = useState("");
  const [days, setDays] = useState("1");
  const [due, setDue] = useState(todaySeoulIso());
  const [memo, setMemo] = useState("");
  const [rooms, setRooms] = useState(false);

  function onType(next: PayoutTypeId) {
    setTypeId(next);
    const t = PAYOUT_TYPES.find((x) => x.id === next)!;
    setTaxMethod(t.taxDefault);
    if (next === "event-staff" || next === "lecture") setRooms(true);
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
          gross: Number(gross.replace(/,/g, "")) || 0,
          taxMethod,
          days: typeId === "event-staff" ? Number(days) || 1 : undefined,
          dueDate: due,
          status: "collecting",
          memo: memo.trim() || undefined,
          docs: [],
          evidence: type.evidence,
          survey: type.survey,
          lodging: rooms
            ? {
                name: "",
                address: "",
                note: "숙소명과 호수는 현장에서 받은 배정만 적습니다.",
                people: partner.trim()
                  ? [{ id: "payee", name: partner.trim(), role: type.payee }]
                  : [],
                rooms: [
                  { id: "r1", label: "호수 미정 A", type: "twin", occupantIds: [] },
                  { id: "r2", label: "호수 미정 B", type: "twin", occupantIds: [] },
                ],
              }
            : undefined,
        };
        addPayout(payout);
        router.push(`/payouts/${id}`);
      }}
    >
      <div className="space-y-1.5">
        <Label>지급 유형</Label>
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
          placeholder="예: 고한중 오사카 인솔 보조"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="partner">지급 대상</Label>
          <Input
            id="partner"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            required
            placeholder="이름 또는 상호"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event">행사명 (있으면)</Label>
          <Input id="event" value={eventName} onChange={(e) => setEventName(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gross">지급 총액 (세전)</Label>
          <Input
            id="gross"
            inputMode="numeric"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            required
            placeholder="300000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="due">지급 예정일</Label>
          <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
      {typeId === "event-staff" ? (
        <div className="space-y-1.5">
          <Label htmlFor="days">근무 일수</Label>
          <Input id="days" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
      ) : null}
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={rooms} onChange={(e) => setRooms(e.target.checked)} />
        숙소 객실배정 칸을 함께 만든다
      </label>
      <div className="space-y-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        등록하고 증빙 묶기
      </Button>
    </form>
  );
}

export default function NewPayoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">새 지급</h1>
      <p className="text-sm text-muted-foreground">
        유형을 고르면 원천 방식과 필수 증빙, 설문이 따라붙습니다. 이 브라우저에 저장됩니다.
      </p>
      <Suspense>
        <NewPayoutForm />
      </Suspense>
    </div>
  );
}
