"use client";

import { PayoutOpenView } from "@/components/payout-open-view";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PayoutOpenBody() {
  const id = useSearchParams().get("id") ?? "";
  return <PayoutOpenView id={id} />;
}

export default function PayoutOpenPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
      <PayoutOpenBody />
    </Suspense>
  );
}
