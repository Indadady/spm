"use client";

import { mergePayee, subscribePayees, type InboxStatus } from "@/lib/payee-inbox";
import { useStore } from "@/lib/store";
import type { PayeeProfile } from "@/lib/types";
import { useEffect, useState } from "react";

export function usePayeeInbox(payoutId: string) {
  const { payeeOf, savePayee } = useStore();
  const local = payeeOf(payoutId);
  const [remote, setRemote] = useState<PayeeProfile[]>([]);
  const [status, setStatus] = useState<InboxStatus>("connecting");

  useEffect(() => {
    if (!payoutId) return;
    return subscribePayees(payoutId, (rows, next) => {
      setRemote(rows);
      setStatus(next);
    });
  }, [payoutId]);

  useEffect(() => {
    const row = remote[0];
    if (!row) return;
    const merged = mergePayee(row, local);
    if (!merged) return;
    const localHasImg = Boolean(local?.idImageUrl || local?.idImageDataUrl);
    const remoteHasImg = Boolean(merged.idImageUrl || merged.idImageDataUrl);
    if (remoteHasImg && !localHasImg) savePayee(payoutId, merged);
  }, [local, payoutId, remote, savePayee]);

  const payee = mergePayee(remote[0], local);
  return { payee, submissions: remote, status, local };
}
