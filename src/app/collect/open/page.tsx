"use client";

import { CollectOpenView } from "@/components/collect-open-view";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CollectOpenBody() {
  const id = useSearchParams().get("id") ?? "";
  return <CollectOpenView id={id} mode="admin" />;
}

export default function CollectOpenPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
      <CollectOpenBody />
    </Suspense>
  );
}
