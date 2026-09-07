"use client";

import { GroupProgressView } from "@/components/group-progress-view";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WatchFromQuery() {
  const search = useSearchParams();
  return <GroupProgressView id={search.get("id") ?? ""} />;
}

export default function KakaoWatchGroupPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}>
      <WatchFromQuery />
    </Suspense>
  );
}
