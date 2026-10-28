import type { PayeeProfile, Payout } from "./types";

/** 내 드라이브/1.여행행사관련/5.spm(스마트파트너관리) */
export const SPM_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1_UBiFOAwHBN0l8U9enygPdnlYoeLFkVl";

export const SPM_INBOX_FOLDER_URL =
  "https://drive.google.com/drive/folders/1mFV1FpcypbnEyghCT9rdNahU3uLuA3KE";

export const SPM_LEDGER_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1livVBMRo6g574ECo16lTlVeTvUBpckdSUfgK3d1I-fA/edit";

const DEPLOYED_DRIVE_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxyAel0GaQM56_318XwleCD5-oiaM4x-FYr_hRgP3X7efVlzImxSt7sEdx7KTKBO3RMcA/exec";

export const DRIVE_WEBAPP_URL =
  process.env.NEXT_PUBLIC_DRIVE_WEBAPP_URL || DEPLOYED_DRIVE_WEBAPP_URL;

export const isDriveConfigured = Boolean(DRIVE_WEBAPP_URL);

export function driveReceipt(name: string): PayeeProfile {
  return {
    name,
    rrn: "",
    bank: "",
    account: "",
    holder: "",
    privacyAgreed: true,
    submittedAt: new Date().toISOString(),
    source: "drive",
  };
}

/**
 * 앱스스크립트는 CORS를 안 주므로 응답을 읽을 수 없습니다.
 * 본문 업로드가 끝나면(upload.onload) 전달된 것으로 보고 바로 성공 처리합니다.
 * 스크립트 폴더 저장은 서버에서 이어서 진행됩니다.
 */
function postDrivePayload(body: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    const finish = (ok: boolean, err?: Error) => {
      if (settled) return;
      settled = true;
      if (ok) resolve();
      else reject(err ?? new Error("DRIVE_WEBAPP_FAILED"));
    };

    xhr.upload.onload = () => finish(true);
    xhr.upload.onerror = () => finish(false, new Error("DRIVE_WEBAPP_UPLOAD"));
    xhr.onerror = () => {
      // CORS로 응답을 못 읽어도 업로드는 끝난 경우가 많습니다.
      if (!settled) finish(true);
    };
    xhr.ontimeout = () => finish(false, new Error("DRIVE_WEBAPP_TIMEOUT"));
    xhr.open("POST", DRIVE_WEBAPP_URL);
    xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
    xhr.timeout = 45_000;
    try {
      xhr.send(body);
    } catch (err) {
      finish(false, err instanceof Error ? err : new Error("DRIVE_WEBAPP_FAILED"));
    }
  });
}

export async function submitPayeeToDrive(payout: Payout, profile: PayeeProfile) {
  if (!DRIVE_WEBAPP_URL) {
    throw new Error("DRIVE_WEBAPP_NOT_CONFIGURED");
  }

  const payload = {
    kind: "spm-payee",
    submittedAt: profile.submittedAt ?? new Date().toISOString(),
    payoutId: payout.id,
    payoutTitle: payout.title,
    documentNo: payout.documentNo ?? "",
    eventName: payout.eventName ?? "",
    clientName: payout.clientName ?? "",
    name: profile.name,
    rrn: profile.rrn,
    phone: profile.phone ?? "",
    bank: profile.bank,
    account: profile.account,
    holder: profile.holder,
    privacyAgreed: profile.privacyAgreed,
    idImageDataUrl: profile.idImageDataUrl ?? "",
    signatureDataUrl: profile.signatureDataUrl ?? "",
    passportName: profile.passportName ?? "",
    passportNo: profile.passportNo ?? "",
    passportImageDataUrl: profile.passportImageDataUrl ?? "",
  };

  await postDrivePayload(JSON.stringify(payload));
}
