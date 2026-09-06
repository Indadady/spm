"use client";

import { CopyLink } from "@/components/copy-link";
import { PayeeCard } from "@/components/payee-card";
import { PayoutSubnav } from "@/components/payout-subnav";
import { usePayout, useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PayeeAdminPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready, payeeOf } = useStore();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  if (!ready) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (!payout) return <p>해당 건을 찾을 수 없습니다.</p>;

  const url = origin ? `${origin}/p/${payout.id}` : "";

  return (
    <div className="space-y-5">
      <Link href={`/payouts/${payout.id}`} className="text-sm text-muted-foreground">
        ← {payout.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">받은 자료</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          이체에 필요한 이름, 주민등록번호, 신분증, 본인 계좌만 받습니다. 계약서는 이 건에
          붙이지 않았습니다.
        </p>
      </div>
      <PayoutSubnav payout={payout} />
      <div className="flex flex-wrap items-center gap-2">
        {url ? <CopyLink url={url} label="받는 사람 링크 복사" /> : null}
        <Link href={`/p/${payout.id}`} className="text-sm underline">
          받는 화면 열기
        </Link>
      </div>
      <PayeeCard payout={payout} payee={payeeOf(payout.id)} />
    </div>
  );
}
