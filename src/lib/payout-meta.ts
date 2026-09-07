import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { ensureAnonAuth, getFirebase, SURVEY_APP_ID } from "./firebase";
import type { Payout } from "./types";

export type PayoutMeta = {
  id: string;
  title: string;
  partnerName: string;
  partnerRole: string;
  eventName?: string;
  dueDate: string;
  collectInsurance: boolean;
  collectPassport: boolean;
};

function withTimeout<T>(p: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function payoutMetaCol() {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore가 없습니다.");
  return collection(db, "artifacts", SURVEY_APP_ID, "public", "data", "spm_payout_meta");
}

export function metaFromPayout(payout: Payout): PayoutMeta {
  return {
    id: payout.id,
    title: payout.title,
    partnerName: payout.partnerName,
    partnerRole: payout.partnerRole,
    eventName: payout.eventName,
    dueDate: payout.dueDate,
    collectInsurance: Boolean(payout.collectInsurance),
    collectPassport: Boolean(payout.collectPassport),
  };
}

export function payoutFromMeta(meta: PayoutMeta): Payout {
  return {
    id: meta.id,
    typeId: "lecture",
    side: "out",
    title: meta.title,
    partnerName: meta.partnerName,
    partnerRole: meta.partnerRole || "스마트파트너",
    eventName: meta.eventName,
    gross: 0,
    taxMethod: "business-3-3",
    dueDate: meta.dueDate,
    collectInsurance: meta.collectInsurance,
    collectPassport: meta.collectPassport,
    status: "collecting",
    docs: [],
    evidence: [],
    survey: [],
  };
}

export async function publishPayoutMeta(payout: Payout) {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const meta = metaFromPayout(payout);
  await withTimeout(
    setDoc(doc(payoutMetaCol(), payout.id), {
      kind: "spm-payout-meta",
      ...meta,
      eventName: meta.eventName ?? "",
      updatedAt: new Date().toISOString(),
    }),
    8_000,
    "save"
  );
  return meta;
}

export async function loadPayoutMeta(id: string): Promise<PayoutMeta | null> {
  if (!id) return null;
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const snap = await withTimeout(getDoc(doc(payoutMetaCol(), id)), 8_000, "load");
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    title: String(data.title ?? ""),
    partnerName: String(data.partnerName ?? ""),
    partnerRole: String(data.partnerRole ?? "스마트파트너"),
    eventName: data.eventName ? String(data.eventName) : undefined,
    dueDate: String(data.dueDate ?? ""),
    collectInsurance: Boolean(data.collectInsurance),
    collectPassport: Boolean(data.collectPassport),
  };
}
