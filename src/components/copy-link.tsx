"use client";

import { CopyButton } from "@/components/copy-button";

export function CopyLink({ url, label = "링크 복사" }: { url: string; label?: string }) {
  return <CopyButton text={url} label={label} />;
}
