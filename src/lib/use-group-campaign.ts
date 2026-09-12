"use client";

import { loadCampaign, type GroupCampaign } from "@/lib/group-collect";
import { useGroupStore } from "@/lib/group-store";
import { useEffect, useState } from "react";

export function useGroupCampaign(id: string) {
  const { campaignOf, rememberCampaign, ready } = useGroupStore();
  const local = campaignOf(id);
  const [remote, setRemote] = useState<GroupCampaign | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!id) {
      setFetched(true);
      return;
    }
    let cancelled = false;
    setFetched(false);
    loadCampaign(id)
      .then((row) => {
        if (cancelled) return;
        if (row) {
          setRemote(row);
          rememberCampaign(row);
        } else {
          setRemote(null);
        }
        setFetched(true);
      })
      .catch(() => {
        if (cancelled) return;
        setFetched(true);
      });
    return () => {
      cancelled = true;
    };
    // id만. rememberCampaign은 렌더마다 바뀝니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const campaign = remote
    ? {
        ...remote,
        departPin: remote.departPin || local?.departPin,
        entryOrder: remote.entryOrder?.length ? remote.entryOrder : local?.entryOrder,
      }
    : local;
  const waiting = !ready || (!fetched && !campaign);
  return { campaign, waiting, missing: fetched && !campaign };
}
