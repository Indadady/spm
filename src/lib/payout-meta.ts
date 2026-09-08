import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from "firebase/firestore";
import { ensureAnonAuth, getFirebase, SURVEY_APP_ID } from "./firebase";
import { typeById } from "./payout-types";
import type { Payout, PayoutStatus, TaxMethod } from "./types";

export type PayoutMeta = {
  id: string;
  title: string;
  partnerName: string;
  partnerRole: string;
  eventName?: string;
  dueDate: string;
  paidDate?: string;
  gross: number;
  taxMethod: TaxMethod;
  status: PayoutStatus;
  collectInsurance: boolean;
  collectPassport: boolean;
  updatedAt?: string;
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

function parseTaxMethod(raw: unknown): TaxMethod {
  if (raw === "business-3-3" || raw === "tax-invoice" || raw === "other-income-60") return raw;
  return "business-3-3";
}

function parseStatus(raw: unknown): PayoutStatus {
  if (raw === "collecting" || raw === "contract" || raw === "ready" || raw === "paid" || raw === "received") {
    return raw;
  }
  return "collecting";
}

function metaFromDoc(id: string, data: Record<string, unknown>): PayoutMeta {
  const gross = Number(data.gross);
  return {
    id,
    title: String(data.title ?? ""),
    partnerName: String(data.partnerName ?? ""),
    partnerRole: String(data.partnerRole ?? "스마트파트너"),
    eventName: data.eventName ? String(data.eventName) : undefined,
    dueDate: String(data.dueDate ?? ""),
    paidDate: data.paidDate ? String(data.paidDate) : undefined,
    gross: Number.isFinite(gross) && gross > 0 ? gross : 0,
    taxMethod: parseTaxMethod(data.taxMethod),
    status: parseStatus(data.status),
    collectInsurance: Boolean(data.collectInsurance),
    collectPassport: Boolean(data.collectPassport),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

export function metaFromPayout(payout: Payout): PayoutMeta {
  return {
    id: payout.id,
    title: payout.title,
    partnerName: payout.partnerName,
    partnerRole: payout.partnerRole,
    eventName: payout.eventName,
    dueDate: payout.dueDate,
    paidDate: payout.paidDate,
    gross: payout.gross,
    taxMethod: payout.taxMethod,
    status: payout.status,
    collectInsurance: Boolean(payout.collectInsurance),
    collectPassport: Boolean(payout.collectPassport),
  };
}

export function payoutFromMeta(meta: PayoutMeta): Payout {
  return {
    id: meta.id,
    typeId: "lecture",
    side: "out",
    title: meta.title || meta.partnerName,
    partnerName: meta.partnerName,
    partnerRole: meta.partnerRole || "스마트파트너",
    eventName: meta.eventName,
    gross: meta.gross,
    taxMethod: meta.taxMethod,
    dueDate: meta.dueDate,
    paidDate: meta.paidDate,
    collectInsurance: meta.collectInsurance,
    collectPassport: meta.collectPassport,
    status: meta.status,
    docs: [],
    evidence: typeById("lecture").evidence,
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
      paidDate: meta.paidDate ?? "",
      gross: meta.gross,
      taxMethod: meta.taxMethod,
      status: meta.status,
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
  return metaFromDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function listPayoutMetas(): Promise<PayoutMeta[]> {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const snap = await withTimeout(getDocs(query(payoutMetaCol())), 8_000, "list");
  return snap.docs
    .map((d) => metaFromDoc(d.id, d.data() as Record<string, unknown>))
    .filter((row) => row.id && (row.partnerName || row.title))
    .sort((a, b) => (b.updatedAt ?? b.dueDate ?? "").localeCompare(a.updatedAt ?? a.dueDate ?? ""));
}

export async function deletePayoutMeta(id: string) {
  if (!id) return;
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  await withTimeout(deleteDoc(doc(payoutMetaCol(), id)), 8_000, "delete");
}
