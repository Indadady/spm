import { addDoc, deleteDoc, getDocs, onSnapshot, query, type Unsubscribe } from "firebase/firestore";
import { getDownloadURL, listAll, ref, uploadBytes, uploadString } from "firebase/storage";
import { dataUrlBytes, fileForDownload, fileForStorageFallback, shrinkDataUrl } from "./image-file";
import { ensureAnonAuth, getFirebase, payeeResponsesCol, SURVEY_APP_ID } from "./firebase";
import type { PayeeProfile, Payout } from "./types";

export type InboxStatus = "connecting" | "live" | "local";

const EMBED_LIMIT = 220_000;

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

function safeFileName(name: string, fallback: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "").slice(0, 40);
  return base || fallback;
}

async function compactImage(dataUrl?: string) {
  if (!dataUrl) return "";
  const steps: [number, number][] = [
    [800, 0.52],
    [560, 0.42],
    [400, 0.35],
  ];
  for (const [max, quality] of steps) {
    try {
      const small = await shrinkDataUrl(dataUrl, max, quality);
      if (dataUrlBytes(small) <= EMBED_LIMIT) return small;
    } catch {
      /* 다음 크기로 다시 줄입니다. */
    }
  }
  return dataUrlBytes(dataUrl) <= EMBED_LIMIT ? dataUrl : "";
}

async function uploadDataUrl(payoutId: string, dataUrl: string, fileName: string) {
  const { storage } = getFirebase();
  if (!storage) return undefined;
  const path = `artifacts/${SURVEY_APP_ID}/public/spm/${payoutId}/${Date.now()}-${safeFileName(fileName, "photo.jpg")}`;
  const fileRef = ref(storage, path);
  await withTimeout(
    uploadString(fileRef, dataUrl, "data_url", {
      contentType: "image/jpeg",
      customMetadata: { originalName: fileName },
    }),
    20_000,
    "upload"
  );
  return withTimeout(getDownloadURL(fileRef), 8_000, "url");
}

/** Storage용으로 줄인 JPEG를 올립니다. 미리보기(640) 품질은 쓰지 않습니다. */
async function uploadOriginalFile(payoutId: string, file: File, kind: "id" | "passport") {
  const { storage } = getFirebase();
  if (!storage) return undefined;
  let stored: File;
  try {
    stored = await fileForDownload(file);
  } catch {
    stored = await fileForStorageFallback(file);
  }
  const ext = (stored.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `artifacts/${SURVEY_APP_ID}/public/spm/${payoutId}/${Date.now()}-${kind}.${ext}`;
  const fileRef = ref(storage, path);
  await withTimeout(
    uploadBytes(fileRef, stored, {
      contentType: stored.type || "image/jpeg",
      customMetadata: { originalName: file.name },
    }),
    60_000,
    "upload"
  );
  return withTimeout(getDownloadURL(fileRef), 8_000, "url");
}

async function listPayeeFiles(payoutId: string) {
  const { storage } = getFirebase();
  if (!storage) return [];
  const folder = ref(storage, `artifacts/${SURVEY_APP_ID}/public/spm/${payoutId}`);
  const listed = await withTimeout(listAll(folder), 8_000, "list");
  const urls = await Promise.all(listed.items.map((item) => getDownloadURL(item)));
  return listed.items.map((item, i) => ({ name: item.name, url: urls[i] }));
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
    passportName: data.passportName ? String(data.passportName) : undefined,
    passportNo: data.passportNo ? String(data.passportNo) : undefined,
    passportImageDataUrl: data.passportImageDataUrl ? String(data.passportImageDataUrl) : undefined,
    passportImageUrl: data.passportImageUrl ? String(data.passportImageUrl) : undefined,
    passportFileName: data.passportFileName ? String(data.passportFileName) : undefined,
    signatureDataUrl: data.signatureDataUrl ? String(data.signatureDataUrl) : undefined,
    privacyAgreed: Boolean(data.privacyAgreed),
    submittedAt: String(data.createdAt ?? data.submittedAt ?? ""),
    source,
    remoteId: id,
  };
}

export function mergePayee(remote?: PayeeProfile, local?: PayeeProfile) {
  if (!remote) return local;
  if (!local) return remote;
  return {
    ...local,
    ...remote,
    idImageUrl: remote.idImageUrl || local.idImageUrl,
    idImageDataUrl: remote.idImageDataUrl || local.idImageDataUrl,
    passportImageUrl: remote.passportImageUrl || local.passportImageUrl,
    passportImageDataUrl: remote.passportImageDataUrl || local.passportImageDataUrl,
    signatureDataUrl: remote.signatureDataUrl || local.signatureDataUrl,
  };
}

async function fillMissingImages(payoutId: string, rows: PayeeProfile[]) {
  const needsId = rows.some((row) => !row.idImageUrl && !row.idImageDataUrl);
  const needsPass = rows.some((row) => !row.passportImageUrl && !row.passportImageDataUrl);
  if (!needsId && !needsPass) return rows;
  try {
    const files = await listPayeeFiles(payoutId);
    const idFile = files.find((f) => /id|card/i.test(f.name)) ?? files.find((f) => !/sign|pass/i.test(f.name));
    const passFile = files.find((f) => /pass/i.test(f.name));
    return rows.map((row) => ({
      ...row,
      idImageUrl: row.idImageUrl || row.idImageDataUrl ? row.idImageUrl : idFile?.url,
      passportImageUrl: row.passportImageUrl || row.passportImageDataUrl ? row.passportImageUrl : passFile?.url,
    }));
  } catch {
    return rows;
  }
}

export async function submitPayee(
  payout: Payout,
  profile: PayeeProfile,
  originals?: { idFile?: File; passportFile?: File }
) {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const idEmbed = await compactImage(profile.idImageDataUrl);
  const passportEmbed = await compactImage(profile.passportImageDataUrl);
  let idImageUrl = profile.idImageUrl ?? "";
  let passportImageUrl = profile.passportImageUrl ?? "";
  let signatureDataUrl = profile.signatureDataUrl ?? "";

  if (originals?.idFile) {
    try {
      idImageUrl = (await uploadOriginalFile(payout.id, originals.idFile, "id")) ?? "";
    } catch {
      idImageUrl = "";
    }
  }
  if (!idImageUrl && profile.idImageDataUrl) {
    try {
      idImageUrl =
        (await uploadDataUrl(payout.id, profile.idImageDataUrl, profile.idFileName ?? "id.jpg")) ?? "";
    } catch {
      idImageUrl = idImageUrl || "";
    }
  }

  if (originals?.passportFile) {
    try {
      passportImageUrl =
        (await uploadOriginalFile(payout.id, originals.passportFile, "passport")) ?? "";
    } catch {
      passportImageUrl = "";
    }
  }
  if (!passportImageUrl && profile.passportImageDataUrl) {
    try {
      passportImageUrl =
        (await uploadDataUrl(
          payout.id,
          profile.passportImageDataUrl,
          profile.passportFileName ?? "passport.jpg"
        )) ?? "";
    } catch {
      passportImageUrl = passportImageUrl || "";
    }
  }

  if (signatureDataUrl && dataUrlBytes(signatureDataUrl) > 180_000) {
    try {
      const uploaded = await uploadDataUrl(payout.id, signatureDataUrl, "sign.jpg");
      signatureDataUrl = uploaded ?? signatureDataUrl;
    } catch {
      /* 서명은 문서에 그대로 넣습니다. */
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
    idImageUrl,
    idImageDataUrl: idEmbed,
    passportName: profile.passportName ?? "",
    passportNo: profile.passportNo ?? "",
    passportFileName: profile.passportFileName ?? "",
    passportImageUrl,
    passportImageDataUrl: passportEmbed,
    signatureDataUrl,
    partnerPhone: profile.phone ?? "",
    taxId: profile.rrn,
    eventCode: payout.documentNo ?? payout.id,
    status: "completed",
  };

  try {
    const docRef = await withTimeout(addDoc(payeeResponsesCol(payout.id), payload), 8_000, "save");
    return { remoteId: docRef.id, idImageUrl, passportImageUrl };
  } catch {
    const slim = { ...payload, idImageDataUrl: idImageUrl ? "" : payload.idImageDataUrl, passportImageDataUrl: passportImageUrl ? "" : payload.passportImageDataUrl };
    const docRef = await withTimeout(addDoc(payeeResponsesCol(payout.id), slim), 8_000, "save");
    return { remoteId: docRef.id, idImageUrl, passportImageUrl };
  }
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
          void fillMissingImages(payoutId, rows).then((filled) => {
            if (!cancelled) onChange(filled, "live");
          });
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

export async function deletePayeeSubmissions(payoutId: string) {
  if (!payoutId) return;
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const snap = await withTimeout(getDocs(query(payeeResponsesCol(payoutId))), 8_000, "list");
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
