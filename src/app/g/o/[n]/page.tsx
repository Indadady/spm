"use client";

import { CollectOpenView } from "@/components/collect-open-view";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OfficeFromQuery() {
  const search = useSearchParams();
  return <CollectOpenView id={search.get("id") ?? ""} mode="office" />;
}

export default function KakaoOfficeGroupPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}>
      <OfficeFromQuery />
    </Suspense>
  );
}
