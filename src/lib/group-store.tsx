"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { GroupCampaign } from "./group-collect";

const KEY = "spm.groupCampaigns.v1";

type GroupStore = {
  campaigns: GroupCampaign[];
  ready: boolean;
  addCampaign: (c: GroupCampaign) => void;
  rememberCampaign: (c: GroupCampaign) => void;
  removeCampaign: (id: string) => void;
  campaignOf: (id: string) => GroupCampaign | undefined;
};

const Ctx = createContext<GroupStore | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function GroupStoreProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCampaigns(readJson<GroupCampaign[]>(KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(campaigns));
  }, [campaigns, ready]);

  const value: GroupStore = {
    campaigns,
    ready,
    addCampaign: (c) => setCampaigns((prev) => [c, ...prev.filter((x) => x.id !== c.id)]),
    rememberCampaign: (c) =>
      setCampaigns((prev) => {
        const exists = prev.some((x) => x.id === c.id);
        if (exists) return prev.map((x) => (x.id === c.id ? { ...x, ...c } : x));
        return [c, ...prev];
      }),
    removeCampaign: (id) => setCampaigns((prev) => prev.filter((c) => c.id !== id)),
    campaignOf: (id) => campaigns.find((c) => c.id === id),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGroupStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGroupStore outside provider");
  return ctx;
}
