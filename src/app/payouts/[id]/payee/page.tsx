"use client";

import { CopyLink } from "@/components/copy-link";
import { PayeeCard } from "@/components/payee-card";
import { PayoutSubnav } from "@/components/payout-subnav";
import { absoluteUrl } from "@/lib/paths";
import { usePayout, useStore } from "@/lib/store";
import { usePayeeInbox } from "@/lib/use-payee-inbox";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PayeeAdminPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready } = useStore();
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

  const url = origin ? absoluteUrl(`/p/${payout.id}`) : "";

  return (
    <div className="space-y-5">
      <Link href={`/payouts/${payout.id}`} className="text-sm text-muted-foreground">
        ← {payout.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">받은 자료</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          상대가 링크에서 제출하면 만족도 설문과 같은 파이어베이스 자료함에 쌓입니다. 카톡으로 받은
          파편 정보를 여기로 모읍니다.
        </p>
      </div>
      <PayoutSubnav payout={payout} />
      <div className="flex flex-wrap items-center gap-2">
        {url ? <CopyLink url={url} label="받는 사람 링크 복사" /> : null}
        <Link href={`/p/${payout.id}`} className="text-sm underline">
          받는 화면 열기
        </Link>
      </div>
      <PayeeCard payout={payout} payee={inbox.payee} status={inbox.status} />
      {inbox.submissions.length > 1 ? (
        <p className="text-xs text-muted-foreground">
          같은 링크로 {inbox.submissions.length}번 제출되었습니다. 위는 가장 최근 건입니다.
        </p>
      ) : null}
    </div>
  );
}
