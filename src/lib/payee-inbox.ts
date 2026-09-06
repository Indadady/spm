import { addDoc, onSnapshot, query, type Unsubscribe } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { ensureAnonAuth, getFirebase, payeeResponsesCol, SURVEY_APP_ID } from "./firebase";
import type { PayeeProfile, Payout } from "./types";

export type InboxStatus = "connecting" | "live" | "local";

function dataUrlToBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? Math.ceil(((dataUrl.length - comma - 1) * 3) / 4) : dataUrl.length;
}

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

async function uploadDataUrl(payoutId: string, dataUrl: string, fileName: string) {
  const { storage } = getFirebase();
  if (!storage) return undefined;
  const path = `artifacts/${SURVEY_APP_ID}/public/spm/${payoutId}/${Date.now()}-${fileName}`;
  const fileRef = ref(storage, path);
  await withTimeout(
    uploadString(fileRef, dataUrl, "data_url", {
      contentType: "image/jpeg",
      customMetadata: { originalName: fileName },
    }),
    10_000,
    "upload"
  );
  return withTimeout(getDownloadURL(fileRef), 5_000, "url");
}

export function profileFromDoc(
  id: string,
  data: Record<string, unknown>,
  source: PayeeProfile["source"]
): PayeeProfile {
  return {
    name: String(data.name ?? ""),
    rrn: String(data.rrn ?? ""),
    phone: data.phone ? String(data.phone) : undefined,
    bank: String(data.bank ?? ""),
    account: String(data.account ?? ""),
    holder: String(data.holder ?? ""),
    idImageDataUrl: data.idImageDataUrl ? String(data.idImageDataUrl) : undefined,
    idImageUrl: data.idImageUrl ? String(data.idImageUrl) : undefined,
    idFileName: data.idFileName ? String(data.idFileName) : undefined,
    signatureDataUrl: data.signatureDataUrl ? String(data.signatureDataUrl) : undefined,
    privacyAgreed: Boolean(data.privacyAgreed),
    submittedAt: String(data.createdAt ?? data.submittedAt ?? ""),
    source,
    remoteId: id,
  };
}

export async function submitPayee(payout: Payout, profile: PayeeProfile) {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  let idImageUrl = profile.idImageUrl;
  let signatureDataUrl = profile.signatureDataUrl ?? "";

  if (profile.idImageDataUrl) {
    try {
      idImageUrl = await uploadDataUrl(payout.id, profile.idImageDataUrl, profile.idFileName ?? "id.jpg");
    } catch {
      idImageUrl = idImageUrl ?? "";
    }
  }

  if (signatureDataUrl && dataUrlToBytes(signatureDataUrl) > 180_000) {
    try {
      signatureDataUrl = (await uploadDataUrl(payout.id, signatureDataUrl, "sign.jpg")) ?? "";
    } catch {
      signatureDataUrl = "";
    }
  }

  const payload = {
    kind: "spm-payee",
    createdAt: profile.submittedAt ?? new Date().toISOString(),
    payoutId: payout.id,
    payoutTitle: payout.title,
    partnerRole: payout.partnerRole,
    eventName: payout.eventName ?? "",
    clientName: payout.clientName ?? "",
    documentNo: payout.documentNo ?? "",
    name: profile.name,
    rrn: profile.rrn,
    phone: profile.phone ?? "",
    bank: profile.bank,
    account: profile.account,
    holder: profile.holder,
    privacyAgreed: profile.privacyAgreed,
    idFileName: profile.idFileName ?? "",
    idImageUrl: idImageUrl ?? "",
    signatureDataUrl,
    partnerPhone: profile.phone ?? "",
    taxId: profile.rrn,
    eventCode: payout.documentNo ?? payout.id,
    status: "completed",
  };

  const doc = await withTimeout(addDoc(payeeResponsesCol(payout.id), payload), 8_000, "save");
  return { remoteId: doc.id, idImageUrl };
}

export function subscribePayees(
  payoutId: string,
  onChange: (rows: PayeeProfile[], status: InboxStatus) => void
): Unsubscribe {
  let unsub: Unsubscribe = () => {};
  let cancelled = false;

  (async () => {
    try {
      await ensureAnonAuth();
      if (cancelled) return;
      unsub = onSnapshot(
        query(payeeResponsesCol(payoutId)),
        (snap) => {
          const rows = snap.docs
            .map((d) => profileFromDoc(d.id, d.data(), "firebase"))
            .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
          onChange(rows, "live");
        },
        () => onChange([], "local")
      );
    } catch {
      if (!cancelled) onChange([], "local");
    }
  })();

  return () => {
    cancelled = true;
    unsub();
  };
}
