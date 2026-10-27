"use client";

import type { InboxStatus } from "@/lib/payee-inbox";
import { useStore } from "@/lib/store";
import type { PayeeProfile } from "@/lib/types";

export function usePayeeInbox(payoutId: string) {
  const { payeeOf } = useStore();
  const local = payeeOf(payoutId);
  const status: InboxStatus = local?.source === "drive" ? "live" : "local";
  return { payee: local, submissions: local ? [local] : [], status, local };
}

export function usePayeeMap(_payoutIds: string[]) {
  const { payeeOf } = useStore();
  return (id: string): PayeeProfile | undefined => payeeOf(id);
}
