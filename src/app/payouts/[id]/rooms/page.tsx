"use client";

import { PayoutSubnav } from "@/components/payout-subnav";
import { RoomBoard } from "@/components/room-board";
import { usePayout, useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function RoomsPage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready } = useStore();

  if (!ready) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (!payout) return <p>해당 건을 찾을 수 없습니다.</p>;

  return (
    <div className="space-y-5">
      <Link href={`/payouts/${payout.id}`} className="text-sm text-muted-foreground">
        ← {payout.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">객실배정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          가이드북과 같이 사람만 실제 명단으로 두고, 호수는 현장에서 받은 값을 직접 적습니다.
        </p>
      </div>
      <PayoutSubnav payout={payout} />
      {payout.lodging ? (
        <RoomBoard payoutId={payout.id} initial={payout.lodging} />
      ) : (
        <p className="text-sm text-muted-foreground">
          이 건에는 숙소가 없습니다. 새 지급을 등록할 때 객실배정 칸을 켜면 생깁니다.
        </p>
      )}
    </div>
  );
}
