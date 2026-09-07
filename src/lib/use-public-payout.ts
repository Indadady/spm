"use client";

import { loadPayoutMeta, payoutFromMeta, type PayoutMeta } from "@/lib/payout-meta";
import { usePayout, useStore } from "@/lib/store";
import { useEffect, useState } from "react";

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

  const payout = stored
    ? {
        ...stored,
        collectInsurance: meta?.collectInsurance ?? stored.collectInsurance,
        collectPassport: meta?.collectPassport ?? stored.collectPassport,
      }
    : meta
      ? payoutFromMeta(meta)
      : undefined;

  return { payout, ready: ready && metaTried };
}
