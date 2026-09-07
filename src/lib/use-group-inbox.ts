"use client";

import { subscribeGroupEntries, type GroupEntry, type InboxStatus } from "@/lib/group-collect";
import { useEffect, useState } from "react";

export function useGroupInbox(campaignId: string) {
  const [rows, setRows] = useState<GroupEntry[]>([]);
  const [status, setStatus] = useState<InboxStatus>("connecting");

  useEffect(() => {
    if (!campaignId) return;
    return subscribeGroupEntries(campaignId, (next, inbox) => {
      setRows(next);
      setStatus(inbox);
    });
  }, [campaignId]);

  return { rows, status };
}
