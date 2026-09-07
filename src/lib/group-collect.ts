import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { randomKakaoOgSlot } from "./company";
import { ensureAnonAuth, getFirebase, SURVEY_APP_ID } from "./firebase";

export type CollectKind = "insurance" | "passport" | "both";
export type GroupRole = "guest" | "leader";
export type InboxStatus = "connecting" | "live" | "local";

export type GroupCampaign = {
  id: string;
  title: string;
  kind: CollectKind;
  expectedCount?: number;
  ogSlot?: number;
  createdAt: string;
};

export type GroupEntry = {
  name: string;
  phone?: string;
  role: GroupRole;
  rrn?: string;
  passportName?: string;
  passportNo?: string;
  passportImageDataUrl?: string;
  passportImageUrl?: string;
  passportFileName?: string;
  privacyAgreed: boolean;
  submittedAt?: string;
  source?: "firebase" | "local";
  remoteId?: string;
};

export const COLLECT_KINDS: { id: CollectKind; label: string; hint: string }[] = [
  { id: "insurance", label: "여행자보험", hint: "성명·주민번호" },
  { id: "passport", label: "여권사본", hint: "여행자 명단용 사진" },
  { id: "both", label: "보험 + 여권", hint: "해외 행사" },
];

export function collectKindLabel(kind: CollectKind) {
  return COLLECT_KINDS.find((k) => k.id === kind)?.label ?? "여행 자료";
}

export function needsRrn(kind: CollectKind) {
  return kind === "insurance" || kind === "both";
}

export function needsPassport(kind: CollectKind) {
  return kind === "passport" || kind === "both";
}

export function needsRole(kind: CollectKind) {
  return kind === "passport" || kind === "both";
}

export function newGroupId() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
  return `g${Date.now().toString(36)}${rand}`.slice(0, 20);
}

export function groupSharePath(id: string, slot?: number) {
  const n = slot ?? randomKakaoOgSlot();
  return `/g/s/${n}/?id=${encodeURIComponent(id)}`;
}

export function groupWatchPath(id: string, slot?: number) {
  const n = slot ?? randomKakaoOgSlot();
  return `/g/w/${n}/?id=${encodeURIComponent(id)}`;
}

export function groupNoticeText(title: string, url: string, kind: CollectKind) {
  const what =
    kind === "passport" ? "여권사본" : kind === "insurance" ? "여행자보험 자료" : "여행자보험·여권 자료";
  return `${title}
${what} 입력 부탁드립니다.
각자 아래 링크에서 입력해 주세요. 자료는 투어메이커로 바로 전달됩니다.
${url}`;
}

export function roleLabel(role: GroupRole) {
  return role === "leader" ? "인솔" : "참가자";
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

function parseKind(raw: unknown): CollectKind {
  if (raw === "passport" || raw === "both" || raw === "insurance") return raw;
  return "insurance";
}

export function groupCampaignsCol() {
  return collectionPath("spm_group_campaigns");
}

export function groupEntriesCol(campaignId: string) {
  return collectionPath(`responses_spm_g_${campaignId}`);
}

function collectionPath(name: string) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore가 없습니다.");
  return collection(db, "artifacts", SURVEY_APP_ID, "public", "data", name);
}

export function campaignFromDoc(id: string, data: Record<string, unknown>): GroupCampaign {
  const expected = Number(data.expectedCount);
  const ogSlot = Number(data.ogSlot);
  return {
    id,
    title: String(data.title ?? ""),
    kind: parseKind(data.collectKind ?? data.kind),
    expectedCount: expected > 0 ? expected : undefined,
    ogSlot: ogSlot >= 1 && ogSlot <= 3 ? ogSlot : undefined,
    createdAt: String(data.createdAt ?? ""),
  };
}

export function entryFromDoc(
  id: string,
  data: Record<string, unknown>,
  source: GroupEntry["source"]
): GroupEntry {
  return {
    name: String(data.name ?? ""),
    phone: data.phone ? String(data.phone) : undefined,
    role: data.role === "leader" ? "leader" : "guest",
    rrn: data.rrn ? String(data.rrn) : undefined,
    passportName: data.passportName ? String(data.passportName) : undefined,
    passportNo: data.passportNo ? String(data.passportNo) : undefined,
    passportImageUrl: data.passportImageUrl ? String(data.passportImageUrl) : undefined,
    passportImageDataUrl: data.passportImageDataUrl ? String(data.passportImageDataUrl) : undefined,
    passportFileName: data.passportFileName ? String(data.passportFileName) : undefined,
    privacyAgreed: Boolean(data.privacyAgreed),
    submittedAt: String(data.createdAt ?? data.submittedAt ?? ""),
    source,
    remoteId: id,
  };
}

async function uploadDataUrl(campaignId: string, dataUrl: string, fileName: string) {
  const { storage } = getFirebase();
  if (!storage) return undefined;
  const path = `artifacts/${SURVEY_APP_ID}/public/spm/g/${campaignId}/${Date.now()}-${fileName}`;
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

export async function publishCampaign(campaign: GroupCampaign) {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  await withTimeout(
    setDoc(doc(groupCampaignsCol(), campaign.id), {
      kind: "spm-group",
      collectKind: campaign.kind,
      title: campaign.title,
      expectedCount: campaign.expectedCount ?? "",
      ogSlot: campaign.ogSlot ?? "",
      createdAt: campaign.createdAt,
    }),
    8_000,
    "save"
  );
}

export async function loadCampaign(id: string): Promise<GroupCampaign | null> {
  if (!id) return null;
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const snap = await withTimeout(getDoc(doc(groupCampaignsCol(), id)), 8_000, "load");
  if (!snap.exists()) return null;
  return campaignFromDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function submitGroupEntry(campaign: GroupCampaign, entry: GroupEntry) {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  let passportImageUrl = entry.passportImageUrl ?? "";
  if (entry.passportImageDataUrl) {
    passportImageUrl =
      (await uploadDataUrl(campaign.id, entry.passportImageDataUrl, entry.passportFileName ?? "passport.jpg")) ??
      "";
  }
  const payload = {
    kind: "spm-group-entry",
    createdAt: entry.submittedAt ?? new Date().toISOString(),
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    collectKind: campaign.kind,
    name: entry.name,
    phone: entry.phone ?? "",
    role: entry.role,
    rrn: entry.rrn ?? "",
    passportName: entry.passportName ?? "",
    passportNo: entry.passportNo ?? "",
    passportFileName: entry.passportFileName ?? "",
    passportImageUrl,
    privacyAgreed: entry.privacyAgreed,
    status: "completed",
  };
  const docRef = await withTimeout(addDoc(groupEntriesCol(campaign.id), payload), 8_000, "save");
  return { remoteId: docRef.id, passportImageUrl };
}

export async function deleteGroupEntry(campaignId: string, entryId: string) {
  if (!campaignId || !entryId) return;
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  await withTimeout(deleteDoc(doc(groupEntriesCol(campaignId), entryId)), 8_000, "delete");
}

export async function deleteAllGroupEntries(campaignId: string) {
  if (!campaignId) return;
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const snap = await withTimeout(getDocs(query(groupEntriesCol(campaignId))), 8_000, "list");
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function deleteCampaign(campaignId: string) {
  if (!campaignId) return;
  await deleteAllGroupEntries(campaignId);
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  await withTimeout(deleteDoc(doc(groupCampaignsCol(), campaignId)), 8_000, "delete");
}

export function subscribeGroupEntries(
  campaignId: string,
  onChange: (rows: GroupEntry[], status: InboxStatus) => void
): Unsubscribe {
  let unsub: Unsubscribe = () => {};
  let cancelled = false;

  (async () => {
    try {
      await ensureAnonAuth();
      if (cancelled) return;
      unsub = onSnapshot(
        query(groupEntriesCol(campaignId)),
        (snap) => {
          const rows = snap.docs
            .map((d) => entryFromDoc(d.id, d.data(), "firebase"))
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

export function groupEntriesCsv(kind: CollectKind, rows: GroupEntry[]) {
  const cols = ["성명", "연락처"];
  if (needsRole(kind)) cols.push("구분");
  if (needsRrn(kind)) cols.push("주민등록번호");
  if (needsPassport(kind)) cols.push("영문성명", "여권번호", "여권사진");
  cols.push("제출시각");
  const lines = [
    cols.join(","),
    ...rows.map((row) => {
      const cells = [row.name, row.phone ?? ""];
      if (needsRole(kind)) cells.push(roleLabel(row.role));
      if (needsRrn(kind)) cells.push(row.rrn ?? "");
      if (needsPassport(kind)) {
        cells.push(row.passportName ?? "", row.passportNo ?? "", row.passportImageUrl ?? "");
      }
      cells.push(row.submittedAt ?? "");
      return cells.map(csvCell).join(",");
    }),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
