"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CopyTextButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={!text}
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
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
