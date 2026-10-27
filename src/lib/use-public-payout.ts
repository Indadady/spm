"use client";

import { loadPayoutMeta, payoutFromMeta, type PayoutMeta } from "@/lib/payout-meta";
import { usePayout, useStore } from "@/lib/store";
import type { Payout } from "@/lib/types";
import { useEffect, useState } from "react";

function stubPayout(id: string): Payout {
  return {
    id,
    typeId: "lecture",
    side: "out",
    title: "지급 자료",
    partnerName: "스마트파트너",
    partnerRole: "스마트파트너",
    gross: 0,
    taxMethod: "business-3-3",
    dueDate: "",
    status: "collecting",
    docs: [],
    evidence: [],
    survey: [],
  };
}

export function usePublicPayout(id: string) {
  const stored = usePayout(id);
  const { ready } = useStore();
  const [meta, setMeta] = useState<PayoutMeta | null>(null);
  const [metaTried, setMetaTried] = useState(!id);

  useEffect(() => {
    if (!id) {
      setMetaTried(true);
      return;
    }
    let cancelled = false;
    setMetaTried(false);
    loadPayoutMeta(id)
      .then((row) => {
        if (!cancelled) setMeta(row);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      })
      .finally(() => {
        if (!cancelled) setMetaTried(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const found = stored ?? (meta ? payoutFromMeta(meta) : undefined);
  const payout = found
    ? { ...found, collectInsurance: false, collectPassport: false }
    : ready && id
      ? stubPayout(id)
      : undefined;

  return { payout, ready: ready && metaTried };
}
