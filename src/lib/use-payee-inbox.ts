"use client";

import { subscribePayees, type InboxStatus } from "@/lib/payee-inbox";
import { useStore } from "@/lib/store";
import type { PayeeProfile } from "@/lib/types";
import { useEffect, useState } from "react";

export function usePayeeInbox(payoutId: string) {
  const { payeeOf } = useStore();
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

  const payee = remote[0] ?? local;
  return { payee, submissions: remote, status, local };
}
