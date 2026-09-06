"use client";

import { PayeeCard } from "@/components/payee-card";
import { usePayout, useStore } from "@/lib/store";
import { usePayeeInbox } from "@/lib/use-payee-inbox";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PayeeAdminPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready } = useStore();
  const inbox = usePayeeInbox(id);

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
        ← {payout.partnerName}
      </Link>
      <PayeeCard payout={payout} payee={inbox.payee} status={inbox.status} />
    </div>
  );
}
