"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_PAYOUTS } from "./seed";
import type { Contract, Lodging, PayeeProfile, Payout, PayoutStatus } from "./types";

const USER_KEY = "spm.userPayouts.v2";
const STATE_KEY = "spm.caseState.v2";

export type CaseState = {
  evidenceDone: Record<string, string[]>;
  survey: Record<string, Record<string, string>>;
  lodging: Record<string, Lodging>;
  payee: Record<string, PayeeProfile>;
  contracts: Record<string, Contract>;
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
  payeeOf: (id: string) => PayeeProfile | undefined;
  savePayee: (id: string, profile: PayeeProfile) => void;
  contractOf: (id: string) => Contract | undefined;
  saveContract: (id: string, contract: Contract) => void;
};

const emptyState: CaseState = {
  evidenceDone: {},
  survey: {},
  lodging: {},
  payee: {},
  contracts: {},
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

function mergeState(raw: Partial<CaseState> | null): CaseState {
  return { ...emptyState, ...raw };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [userPayouts, setUserPayouts] = useState<Payout[]>([]);
  const [state, setState] = useState<CaseState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedPayouts = readJson<Payout[]>(USER_KEY, []);
    const storedState = mergeState(readJson<Partial<CaseState>>(STATE_KEY, emptyState));
    setUserPayouts((current) => (current.length ? current : storedPayouts));
    setState((current) => ({
      ...storedState,
      ...current,
      payee: { ...storedState.payee, ...current.payee },
      evidenceDone: { ...storedState.evidenceDone, ...current.evidenceDone },
      survey: { ...storedState.survey, ...current.survey },
      lodging: { ...storedState.lodging, ...current.lodging },
      contracts: { ...storedState.contracts, ...current.contracts },
    }));
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
    const overrides = new Map(userPayouts.map((p) => [p.id, p]));
    const seeded = SEED_PAYOUTS.map((s) => {
      const over = overrides.get(s.id);
      return over ? { ...s, ...over, docs: s.docs, evidence: s.evidence } : s;
    });
    return [...seeded, ...extras];
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
    payeeOf: (id) => state.payee[id],
    savePayee: (id, profile) =>
      setState((s) => {
        const marks = new Set(s.evidenceDone[id] ?? []);
        ["payee-name", "payee-rrn", "payee-id", "payee-bank"].forEach((k) => marks.add(k));
        return {
          ...s,
          payee: { ...s.payee, [id]: profile },
          evidenceDone: { ...s.evidenceDone, [id]: [...marks] },
        };
      }),
    contractOf: (id) => state.contracts[id] ?? SEED_PAYOUTS.find((p) => p.id === id)?.contract,
    saveContract: (id, contract) =>
      setState((s) => ({ ...s, contracts: { ...s.contracts, [id]: contract } })),
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
