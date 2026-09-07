"use client";

import { Button } from "@/components/ui/button";
import { collectSharePath } from "@/lib/company";
import { absoluteUrl } from "@/lib/paths";
import { useState } from "react";

export function CopyLink({
  payoutId,
  label = "링크 복사",
  onCopied,
}: {
  payoutId: string;
  label?: string;
  onCopied?: (url: string) => void;
}) {
  const [done, setDone] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={!payoutId}
      onClick={async () => {
        const text = absoluteUrl(collectSharePath(payoutId));
        try {
          await navigator.clipboard.writeText(text);
          onCopied?.(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt("아래 글을 복사하세요", text);
        }
      }}
    >
      {done ? "복사했습니다" : label}
    </Button>
  );
}
