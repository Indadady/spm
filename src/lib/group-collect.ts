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
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { randomKakaoOgSlot } from "./company";
import { ensureAnonAuth, getFirebase, SURVEY_APP_ID } from "./firebase";
import { dataUrlBytes } from "./image-file";

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
  birthDate?: string;
  gender?: "M" | "F" | "";
  passportName?: string;
  passportNo?: string;
  passportExpiry?: string;
  nationality?: string;
  note?: string;
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
  { id: "both", label: "보험 + 여권", hint: "해외 행사 명단" },
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

export function parseRrnMeta(rrn: string): { birthIso: string; gender: "M" | "F" } | null {
  const d = rrn.replace(/\D/g, "");
  if (d.length < 7) return null;
  const yy = Number(d.slice(0, 2));
  const mm = Number(d.slice(2, 4));
  const dd = Number(d.slice(4, 6));
  if (!mm || mm > 12 || !dd || dd > 31) return null;
  const g = d[6];
  let century = 1900;
  if ("3478".includes(g)) century = 2000;
  else if (g === "9" || g === "0") century = 1800;
  const gender: "M" | "F" = "13579".includes(g) ? "M" : "F";
  return {
    birthIso: `${century + yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
    gender,
  };
}

export function rosterDate(iso?: string) {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return iso.replaceAll("-", ".");
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

export function groupNoticeText(title: string, kind: CollectKind) {
  const what =
    kind === "passport" ? "여권사본" : kind === "insurance" ? "여행자보험 자료" : "여행자보험·여권 자료";
  return `${title}
${what} 제출 부탁드립니다.
각자 아래 링크에서 입력해 주세요. 자료는 투어메이커로 바로 전달됩니다.`;
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
    birthDate: data.birthDate ? String(data.birthDate) : undefined,
    gender: data.gender === "M" || data.gender === "F" ? data.gender : undefined,
    passportName: data.passportName ? String(data.passportName) : undefined,
    passportNo: data.passportNo ? String(data.passportNo) : undefined,
    passportExpiry: data.passportExpiry ? String(data.passportExpiry) : undefined,
    nationality: data.nationality ? String(data.nationality) : undefined,
    note: data.note ? String(data.note) : undefined,
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
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "").slice(0, 40) || "passport.jpg";
  const path = `artifacts/${SURVEY_APP_ID}/public/spm/g/${campaignId}/${Date.now()}-${safe}`;
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
  const raw = entry.passportImageDataUrl ?? "";
  const passportEmbed = raw && dataUrlBytes(raw) <= 220_000 ? raw : "";
  const payload = {
    kind: "spm-group-entry",
    createdAt: entry.submittedAt ?? new Date().toISOString(),
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    collectKind: campaign.kind,
    name: entry.name,
    phone: entry.phone ?? "",
    role: "guest",
    rrn: entry.rrn ?? "",
    birthDate: entry.birthDate ?? "",
    gender: entry.gender ?? "",
    passportName: entry.passportName ?? "",
    passportNo: entry.passportNo ?? "",
    passportExpiry: entry.passportExpiry ?? "",
    nationality: entry.nationality ?? (needsPassport(campaign.kind) ? "KOR" : ""),
    note: entry.note ?? "",
    passportFileName: entry.passportFileName ?? "",
    passportImageUrl: entry.passportImageUrl ?? "",
    passportImageDataUrl: passportEmbed,
    privacyAgreed: entry.privacyAgreed,
    status: "completed",
  };
  let docRef;
  try {
    docRef = await withTimeout(addDoc(groupEntriesCol(campaign.id), payload), 8_000, "save");
  } catch {
    const slim = { ...payload, passportImageDataUrl: "" };
    docRef = await withTimeout(addDoc(groupEntriesCol(campaign.id), slim), 8_000, "save");
  }

  if (passportEmbed || raw) {
    void uploadDataUrl(
      campaign.id,
      passportEmbed || raw,
      entry.passportFileName ?? "passport.jpg"
    )
      .then((url) => {
        if (!url) return;
        return updateDoc(docRef, { passportImageUrl: url });
      })
      .catch(() => {});
  }
  return { remoteId: docRef.id, passportImageUrl: payload.passportImageUrl };
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
  const ordered = [...rows].sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  const overseas = needsPassport(kind);
  const cols = overseas
    ? ["순번", "성명", "영문명(NAME)", "생년월일", "성별(M/F)", "여권번호", "여권만료일", "국적", "기타"]
    : ["순번", "성명", "생년월일", "성별(M/F)", "연락처", "기타"];
  const lines = [
    cols.join(","),
    ...ordered.map((row, i) => {
      const fromRrn = row.rrn ? parseRrnMeta(row.rrn) : null;
      const birth = rosterDate(row.birthDate || fromRrn?.birthIso);
      const gender = row.gender || fromRrn?.gender || "";
      const cells = overseas
        ? [
            String(i + 1),
            row.name,
            row.passportName ?? "",
            birth,
            gender,
            excelText(row.passportNo ?? ""),
            rosterDate(row.passportExpiry),
            row.nationality || "KOR",
            row.note ?? "",
          ]
        : [
            String(i + 1),
            row.name,
            birth,
            gender,
            excelText(row.phone ?? ""),
            row.note ?? "",
          ];
      return cells.map(csvCell).join(",");
    }),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

function excelText(value: string) {
  if (!value) return "";
  return `="${value.replaceAll('"', '""')}"`;
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
