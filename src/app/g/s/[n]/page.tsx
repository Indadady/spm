"use client";

import { PublicGroupView } from "@/components/public-group-view";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GroupFromQuery() {
  const search = useSearchParams();
  return <PublicGroupView id={search.get("id") ?? ""} />;
}

export default function KakaoShareGroupPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}>
      <GroupFromQuery />
    </Suspense>
  );
}
