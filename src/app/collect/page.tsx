"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CollectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <p className="text-sm text-muted-foreground">지급 목록으로 이동합니다…</p>;
}
