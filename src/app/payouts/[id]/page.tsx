"use client";

import { CopyLink } from "@/components/copy-link";
import { PayeeCard } from "@/components/payee-card";
import { TaxCard } from "@/components/tax-card";
import { Button } from "@/components/ui/button";
import { formatPayDate, todaySeoulIso } from "@/lib/format";
import { absoluteUrl } from "@/lib/paths";
import { usePayout, useStore } from "@/lib/store";
import { usePayeeInbox } from "@/lib/use-payee-inbox";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PayoutPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { setStatus, ready } = useStore();
  const inbox = usePayeeInbox(id);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  if (!payout) {
    return (
      <p className="text-sm text-muted-foreground">
        {ready ? "해당 건을 찾을 수 없습니다." : "불러오는 중…"}
      </p>
    );
  }

  const collectUrl = origin ? absoluteUrl(`/p/${payout.id}`) : "";

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted-foreground">
        ← 지급
      </Link>
      <div>
        <h1 className="text-2xl font-bold leading-tight">{payout.partnerName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {payout.eventName || payout.title}
          {" · "}지급일 {formatPayDate(payout.paidDate || payout.dueDate)}
          {payout.status === "paid" ? " · 이체 완료" : ""}
        </p>
      </div>

      {payout.side === "out" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">자료 받는 링크</p>
            <p className="truncate text-xs text-muted-foreground">
              {collectUrl || "주소를 만드는 중…"}
            </p>
          </div>
          {collectUrl ? <CopyLink url={collectUrl} /> : null}
        </div>
      ) : null}

      <TaxCard payout={payout} payee={inbox.payee} />

      {payout.side === "out" ? (
        <PayeeCard payout={payout} payee={inbox.payee} status={inbox.status} />
      ) : null}

      {payout.side === "out" && payout.status !== "paid" ? (
        <Button
          className="w-full sm:w-auto"
          onClick={() => setStatus(payout.id, "paid", todaySeoulIso())}
        >
          이체 완료
        </Button>
      ) : null}
    </div>
  );
}
