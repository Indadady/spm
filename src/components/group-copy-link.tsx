"use client";

import { Button } from "@/components/ui/button";
import { groupOfficePath, groupSharePath } from "@/lib/group-collect";
import { absoluteUrl } from "@/lib/paths";
import { useState } from "react";

export function GroupCopyLink({
  campaignId,
  ogSlot,
  kind = "share",
  label = "링크 복사",
}: {
  campaignId: string;
  ogSlot?: number;
  kind?: "share" | "office";
  label?: string;
}) {
  const [done, setDone] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={!campaignId}
      onClick={async () => {
        const text = absoluteUrl(
          kind === "office" ? groupOfficePath(campaignId, ogSlot) : groupSharePath(campaignId, ogSlot)
        );
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
