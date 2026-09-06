"use client";

import { GrossAmountField } from "@/components/gross-amount-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { todaySeoulIso } from "@/lib/format";
import type { Payout } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPayoutPage() {
  const router = useRouter();
  const { addPayout } = useStore();
  const [partner, setPartner] = useState("");
  const [eventName, setEventName] = useState("");
  const [gross, setGross] = useState(0);
  const [due, setDue] = useState(todaySeoulIso());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">새 지급</h1>
      <p className="text-sm text-muted-foreground">
        세전 금액을 넣으면 3.3% 원천과 이체액이 바로 나옵니다. 받는 사람 화면에는 금액이 보이지
        않습니다.
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!gross) return;
          const name = partner.trim();
          const event = eventName.trim();
          const id = `pmt-${Date.now()}`;
          const payout: Payout = {
            id,
            typeId: "lecture",
            side: "out",
            title: event ? `${event} · ${name}` : name,
            partnerName: name,
            partnerRole: "지급 상대",
            eventName: event || undefined,
            needsContract: false,
            gross,
            taxMethod: "business-3-3",
            dueDate: due,
            status: "collecting",
            docs: [],
            evidence: [],
            survey: [],
          };
          addPayout(payout);
          router.push(`/payouts/${id}`);
        }}
      >
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
        <GrossAmountField value={gross} onChange={setGross} taxMethod="business-3-3" required />
        <div className="space-y-1.5">
          <Label htmlFor="due">지급일</Label>
          <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          등록하고 자료 링크 만들기
        </Button>
      </form>
    </div>
  );
}
