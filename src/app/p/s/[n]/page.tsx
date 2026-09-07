"use client";

import { PublicPayeeView } from "@/components/public-payee-view";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PayeeFromQuery() {
  const search = useSearchParams();
  return <PublicPayeeView id={search.get("id") ?? ""} />;
}

export default function KakaoSharePayeePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}>
      <PayeeFromQuery />
    </Suspense>
  );
}
