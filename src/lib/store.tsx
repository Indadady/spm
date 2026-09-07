"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_PAYOUTS } from "./seed";
import { RETIRED_PAYOUT_IDS } from "./paths";
import type { Contract, Lodging, PayeeProfile, Payout, PayoutStatus } from "./types";

const USER_KEY = "spm.userPayouts.v2";
const STATE_KEY = "spm.caseState.v2";
const HIDDEN_KEY = "spm.hiddenPayouts.v1";

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
  removePayout: (id: string) => void;
  updatePayout: (id: string, patch: Partial<Payout>) => void;
  setStatus: (id: string, status: PayoutStatus, paidDate?: string) => void;
  toggleEvidence: (id: string, evidenceId: string) => void;
  evidenceOn: (id: string, evidenceId: string) => boolean;
  saveSurvey: (id: string, values: Record<string, string>) => void;
  surveyOf: (id: string) => Record<string, string>;
  lodgingOf: (payout: Payout) => Lodging | undefined;
  saveLodging: (id: string, lodging: Lodging) => void;
  payeeOf: (id: string) => PayeeProfile | undefined;
  savePayee: (id: string, profile: PayeeProfile) => void;
  clearPayee: (id: string) => void;
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

function blockedIds(extra: string[] = []) {
  return new Set<string>([...RETIRED_PAYOUT_IDS, ...extra]);
}

function withoutBlocked(payouts: Payout[], extra: string[] = []) {
  const blocked = blockedIds(extra);
  return payouts.filter((p) => !blocked.has(p.id));
}

function dropCase(state: CaseState, id: string): CaseState {
  const payee = { ...state.payee };
  const evidenceDone = { ...state.evidenceDone };
  const survey = { ...state.survey };
  const lodging = { ...state.lodging };
  const contracts = { ...state.contracts };
  delete payee[id];
  delete evidenceDone[id];
  delete survey[id];
  delete lodging[id];
  delete contracts[id];
  return { payee, evidenceDone, survey, lodging, contracts };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [userPayouts, setUserPayouts] = useState<Payout[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [state, setState] = useState<CaseState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedHidden = readJson<string[]>(HIDDEN_KEY, []).filter((id) => typeof id === "string");
    const storedPayouts = withoutBlocked(readJson<Payout[]>(USER_KEY, []), storedHidden);
    const storedState = mergeState(readJson<Partial<CaseState>>(STATE_KEY, emptyState));
    setHiddenIds(storedHidden);
    setUserPayouts((current) =>
      withoutBlocked(current.length ? current : storedPayouts, storedHidden)
    );
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
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenIds));
  }, [hiddenIds, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const payouts = useMemo(() => {
    const blocked = blockedIds(hiddenIds);
    const extras = userPayouts.filter(
      (p) => !SEED_PAYOUTS.some((s) => s.id === p.id) && !blocked.has(p.id)
    );
    const overrides = new Map(userPayouts.map((p) => [p.id, p]));
    const seeded = SEED_PAYOUTS.filter((s) => !blocked.has(s.id)).map((s) => {
      const over = overrides.get(s.id);
      return over ? { ...s, ...over, docs: s.docs, evidence: s.evidence } : s;
    });
    return [...seeded, ...extras].map((p) => ({
      ...p,
      collectInsurance: false,
      collectPassport: false,
    }));
  }, [userPayouts, hiddenIds]);

  const value: Store = {
    payouts,
    ready,
    addPayout: (p) => {
      setHiddenIds((ids) => ids.filter((id) => id !== p.id));
      setUserPayouts((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
    },
    removePayout: (id) => {
      setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setUserPayouts((prev) => prev.filter((p) => p.id !== id));
      setState((s) => dropCase(s, id));
    },
    updatePayout: (id, patch) =>
      setUserPayouts((prev) => {
        const exists = prev.some((p) => p.id === id);
        const seed = SEED_PAYOUTS.find((p) => p.id === id);
        const current = prev.find((p) => p.id === id) ?? seed;
        if (!current) return prev;
        const next = { ...current, ...patch };
        if (exists) return prev.map((p) => (p.id === id ? next : p));
        return [next, ...prev];
      }),
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
    clearPayee: (id) =>
      setState((s) => {
        const payee = { ...s.payee };
        delete payee[id];
        const evidenceDone = { ...s.evidenceDone };
        const marks = (evidenceDone[id] ?? []).filter(
          (k) => !["payee-name", "payee-rrn", "payee-id", "payee-bank"].includes(k)
        );
        if (marks.length) evidenceDone[id] = marks;
        else delete evidenceDone[id];
        return { ...s, payee, evidenceDone };
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
