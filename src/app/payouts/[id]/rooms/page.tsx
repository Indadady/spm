"use client";

import { usePayout, useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function RoomsPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready } = useStore();

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
        ← {payout.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">객실배정</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          객실배정은 지출 자료 수집과 거리가 있어 이 건에 묶지 않습니다. 가이드북이나 현장 명단에서
          따로 관리합니다.
        </p>
      </div>
    </div>
  );
}
