"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CopyLink({ url, label = "링크 복사" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt("아래 주소를 복사하세요", url);
        }
      }}
    >
      {done ? "복사했습니다" : label}
    </Button>
  );
}
