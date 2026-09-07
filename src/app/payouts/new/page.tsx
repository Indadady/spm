"use client";

import { GrossAmountField } from "@/components/gross-amount-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nextCompanyPayDateIso } from "@/lib/format";
import { publishPayoutMeta } from "@/lib/payout-meta";
import { useStore } from "@/lib/store";
import type { Payout } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPayoutPage() {
  const router = useRouter();
  const { addPayout } = useStore();
  const [partner, setPartner] = useState("");
  const [eventName, setEventName] = useState("");
  const [gross, setGross] = useState(0);
  const [due, setDue] = useState(nextCompanyPayDateIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">새 지급</h1>
      <p className="text-sm text-muted-foreground">
        세전 금액을 넣으면 3.3% 원천과 이체액이 바로 나옵니다. 받는 사람 화면에는 금액이 보이지
        않습니다. 링크에서는 이체용 성명·주민번호·신분증·계좌만 받습니다.
      </p>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
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
            partnerRole: "스마트파트너",
            eventName: event || undefined,
            needsContract: false,
            gross,
            taxMethod: "business-3-3",
            dueDate: due,
            collectInsurance: false,
            collectPassport: false,
            status: "collecting",
            docs: [],
            evidence: [],
            survey: [],
          };
          setSaving(true);
          setError("");
          addPayout(payout);
          try {
            await publishPayoutMeta(payout);
          } catch {
            setError("자료함 연결이 느립니다. 링크는 만들었으니 잠시 후 다시 열어 주세요.");
          }
          setSaving(false);
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
          <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? "만드는 중…" : "등록하고 자료 링크 만들기"}
        </Button>
      </form>
    </div>
  );
}
