"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_PAYOUTS } from "./seed";
import type { Lodging, Payout, PayoutStatus } from "./types";

const USER_KEY = "spm.userPayouts.v1";
const STATE_KEY = "spm.caseState.v1";

export type CaseState = {
  evidenceDone: Record<string, string[]>;
  survey: Record<string, Record<string, string>>;
  lodging: Record<string, Lodging>;
};

type Store = {
  payouts: Payout[];
  ready: boolean;
  addPayout: (p: Payout) => void;
  setStatus: (id: string, status: PayoutStatus, paidDate?: string) => void;
  toggleEvidence: (id: string, evidenceId: string) => void;
  evidenceOn: (id: string, evidenceId: string) => boolean;
  saveSurvey: (id: string, values: Record<string, string>) => void;
  surveyOf: (id: string) => Record<string, string>;
  lodgingOf: (payout: Payout) => Lodging | undefined;
  saveLodging: (id: string, lodging: Lodging) => void;
};

const Ctx = createContext<Store | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [userPayouts, setUserPayouts] = useState<Payout[]>([]);
  const [state, setState] = useState<CaseState>({
    evidenceDone: {},
    survey: {},
    lodging: {},
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUserPayouts(readJson<Payout[]>(USER_KEY, []));
    setState(
      readJson<CaseState>(STATE_KEY, { evidenceDone: {}, survey: {}, lodging: {} })
    );
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(USER_KEY, JSON.stringify(userPayouts));
  }, [userPayouts, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const payouts = useMemo(() => {
    const extras = userPayouts.filter((p) => !SEED_PAYOUTS.some((s) => s.id === p.id));
    return [...SEED_PAYOUTS, ...extras];
  }, [userPayouts]);

  const value: Store = {
    payouts,
    ready,
    addPayout: (p) => setUserPayouts((prev) => [p, ...prev.filter((x) => x.id !== p.id)]),
    setStatus: (id, status, paidDate) =>
      setUserPayouts((prev) => {
        const exists = prev.some((p) => p.id === id);
        const seed = SEED_PAYOUTS.find((p) => p.id === id);
        const current = prev.find((p) => p.id === id) ?? seed;
        if (!current) return prev;
        const next = { ...current, status, paidDate: paidDate ?? current.paidDate };
        if (exists) return prev.map((p) => (p.id === id ? next : p));
        return [next, ...prev];
      }),
    toggleEvidence: (id, evidenceId) =>
      setState((s) => {
        const cur = new Set(s.evidenceDone[id] ?? []);
        if (cur.has(evidenceId)) cur.delete(evidenceId);
        else cur.add(evidenceId);
        return { ...s, evidenceDone: { ...s.evidenceDone, [id]: [...cur] } };
      }),
    evidenceOn: (id, evidenceId) => (state.evidenceDone[id] ?? []).includes(evidenceId),
    saveSurvey: (id, values) =>
      setState((s) => ({ ...s, survey: { ...s.survey, [id]: values } })),
    surveyOf: (id) => state.survey[id] ?? {},
    lodgingOf: (payout) => state.lodging[payout.id] ?? payout.lodging,
    saveLodging: (id, lodging) =>
      setState((s) => ({ ...s, lodging: { ...s.lodging, [id]: lodging } })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export function usePayout(id: string) {
  const store = useStore();
  return store.payouts.find((p) => p.id === id);
}
