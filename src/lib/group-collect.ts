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
import { getDownloadURL, ref, uploadBytes, uploadString } from "firebase/storage";
import { randomKakaoOgSlot } from "./company";
import { ensureAnonAuth, getFirebase, SURVEY_APP_ID } from "./firebase";
import { dataUrlBytes, fileForDownload } from "./image-file";
import { buildRosterXlsx, type RosterSheet } from "./roster-xlsx";

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
  { id: "insurance", label: "여행자보험용", hint: "성명·주민번호" },
  { id: "both", label: "여권사본 + 보험", hint: "성명·주민번호·여권사진" },
];

export function collectKindLabel(kind: CollectKind) {
  if (kind === "insurance") return "여행자보험용";
  if (kind === "both") return "여권사본 + 보험";
  if (kind === "passport") return "여권사본";
  return "여행 자료";
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
    kind === "passport" ? "여권사본" : kind === "insurance" ? "여행자보험 자료" : "여권사본·여행자보험 자료";
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

async function uploadPassportFile(campaignId: string, file: File) {
  const { storage } = getFirebase();
  if (!storage) return undefined;
  const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `artifacts/${SURVEY_APP_ID}/public/spm/g/${campaignId}/${Date.now()}-passport.${ext}`;
  const fileRef = ref(storage, path);
  await withTimeout(
    uploadBytes(fileRef, file, {
      contentType: file.type || "image/jpeg",
      customMetadata: { originalName: file.name },
    }),
    60_000,
    "upload"
  );
  return withTimeout(getDownloadURL(fileRef), 8_000, "url");
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

export async function listCampaigns(): Promise<GroupCampaign[]> {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const snap = await withTimeout(getDocs(query(groupCampaignsCol())), 8_000, "list");
  return snap.docs
    .map((d) => campaignFromDoc(d.id, d.data() as Record<string, unknown>))
    .filter((row) => row.id && row.title)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function submitGroupEntry(campaign: GroupCampaign, entry: GroupEntry, originalFile?: File) {
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const preview = entry.passportImageDataUrl ?? "";
  const passportEmbed = preview && dataUrlBytes(preview) <= 220_000 ? preview : "";
  let passportImageUrl = entry.passportImageUrl ?? "";
  if (originalFile) {
    try {
      const stored = await fileForDownload(originalFile);
      passportImageUrl = (await uploadPassportFile(campaign.id, stored)) ?? "";
    } catch {
      passportImageUrl = "";
    }
  }
  if (!passportImageUrl && preview) {
    try {
      passportImageUrl = (await uploadDataUrl(campaign.id, preview, entry.passportFileName ?? "passport.jpg")) ?? "";
    } catch {
      passportImageUrl = "";
    }
  }
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
    passportFileName: originalFile?.name || entry.passportFileName || "",
    passportImageUrl,
    passportImageDataUrl: passportEmbed,
    privacyAgreed: entry.privacyAgreed,
    status: "completed",
  };
  try {
    const docRef = await withTimeout(addDoc(groupEntriesCol(campaign.id), payload), 8_000, "save");
    return { remoteId: docRef.id, passportImageUrl };
  } catch {
    const slim = { ...payload, passportImageDataUrl: "" };
    const docRef = await withTimeout(addDoc(groupEntriesCol(campaign.id), slim), 8_000, "save");
    return { remoteId: docRef.id, passportImageUrl };
  }
}

export async function patchGroupEntry(
  campaignId: string,
  entryId: string,
  fields: Partial<
    Pick<GroupEntry, "passportName" | "passportNo" | "passportExpiry" | "birthDate" | "gender" | "nationality">
  >
) {
  if (!campaignId || !entryId) return;
  await withTimeout(ensureAnonAuth(), 8_000, "auth");
  const payload: Record<string, string> = {};
  if (fields.passportName) payload.passportName = fields.passportName;
  if (fields.passportNo) payload.passportNo = fields.passportNo;
  if (fields.passportExpiry) payload.passportExpiry = fields.passportExpiry;
  if (fields.birthDate) payload.birthDate = fields.birthDate;
  if (fields.gender) payload.gender = fields.gender;
  if (fields.nationality) payload.nationality = fields.nationality;
  if (Object.keys(payload).length === 0) return;
  await withTimeout(updateDoc(doc(groupEntriesCol(campaignId), entryId), payload), 8_000, "save");
}

export function rowNeedsPassportScan(row: GroupEntry) {
  return !row.passportName || !row.passportNo || !row.passportExpiry;
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

function rosterRows(rows: GroupEntry[]) {
  return [...rows].sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
}

function birthGender(row: GroupEntry) {
  const fromRrn = row.rrn ? parseRrnMeta(row.rrn) : null;
  return {
    birth: rosterDate(fromRrn?.birthIso || row.birthDate),
    gender: fromRrn?.gender || row.gender || "",
  };
}

export function groupEntriesXlsx(kind: CollectKind, rows: GroupEntry[]) {
  const ordered = rosterRows(rows);
  const sheets: RosterSheet[] = [];
  if (needsPassport(kind)) {
    sheets.push({
      name: "여행자명단",
      headers: ["순번", "성명", "영문명(NAME)", "생년월일", "성별(M/F)", "여권번호", "여권만료일", "국적", "기타"],
      widths: [8, 12, 24, 14, 12, 16, 14, 10, 22],
      rows: ordered.map((row, i) => {
        const { birth, gender } = birthGender(row);
        return [
          String(i + 1),
          row.name,
          row.passportName ?? "",
          birth,
          gender,
          row.passportNo ?? "",
          rosterDate(row.passportExpiry),
          row.nationality || "KOR",
          row.note ?? "",
        ];
      }),
    });
  }
  if (needsRrn(kind)) {
    sheets.push({
      name: "여행자명단_국내",
      headers: ["순번", "성명", "생년월일", "성별(M/F)", "연락처", "기타"],
      widths: [8, 12, 14, 12, 18, 22],
      rows: ordered.map((row, i) => {
        const { birth, gender } = birthGender(row);
        return [String(i + 1), row.name, birth, gender, row.phone ?? "", row.note ?? ""];
      }),
    });
  }
  return buildRosterXlsx(sheets);
}

export function downloadRosterFile(title: string, bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[\\/:*?"<>|]+/g, "_")}_여행자명단.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
