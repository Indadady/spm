import { addDoc, onSnapshot, query, type Unsubscribe } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { ensureAnonAuth, getFirebase, payeeResponsesCol, SURVEY_APP_ID } from "./firebase";
import type { PayeeProfile, Payout } from "./types";

export type InboxStatus = "connecting" | "live" | "local";

function dataUrlToBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? Math.ceil(((dataUrl.length - comma - 1) * 3) / 4) : dataUrl.length;
}

async function uploadIdImage(payoutId: string, dataUrl: string, fileName?: string) {
  const { storage } = getFirebase();
  if (!storage) return undefined;
  const path = `artifacts/${SURVEY_APP_ID}/public/spm/${payoutId}/${Date.now()}.jpg`;
  const fileRef = ref(storage, path);
  await uploadString(fileRef, dataUrl, "data_url", {
    contentType: "image/jpeg",
    customMetadata: { originalName: fileName ?? "id.jpg" },
  });
  return getDownloadURL(fileRef);
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
    privacyAgreed: Boolean(data.privacyAgreed),
    submittedAt: String(data.createdAt ?? data.submittedAt ?? ""),
    source,
    remoteId: id,
  };
}

export async function submitPayee(payout: Payout, profile: PayeeProfile) {
  await ensureAnonAuth();
  let idImageUrl = profile.idImageUrl;
  let idImageDataUrl = profile.idImageDataUrl;

  if (profile.idImageDataUrl) {
    try {
      idImageUrl = await uploadIdImage(payout.id, profile.idImageDataUrl, profile.idFileName);
      idImageDataUrl = undefined;
    } catch {
      if (dataUrlToBytes(profile.idImageDataUrl) > 700_000) {
        idImageDataUrl = undefined;
      }
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
    ...(idImageDataUrl ? { idImageDataUrl } : {}),
  };

  const doc = await addDoc(payeeResponsesCol(payout.id), payload);
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
