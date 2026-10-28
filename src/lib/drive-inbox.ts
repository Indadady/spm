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

function postDriveViaIframe(body: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }
    const iframe = document.createElement("iframe");
    const name = `spm-drive-${Date.now()}`;
    iframe.name = name;
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:absolute;width:0;height:0;border:0;overflow:hidden";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = DRIVE_WEBAPP_URL;
    form.target = name;
    form.acceptCharset = "UTF-8";
    const field = document.createElement("textarea");
    field.name = "data";
    field.value = body;
    form.appendChild(field);
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    const done = () => {
      form.remove();
      window.setTimeout(() => iframe.remove(), 8_000);
      resolve();
    };
    iframe.addEventListener("load", done, { once: true });
    window.setTimeout(done, 2_500);
    try {
      form.submit();
    } catch {
      done();
    }
  });
}

export type DriveSendResult = { confirmed: boolean };

/**
 * text/plain 본문은 CORS preflight를 피합니다.
 * 앱스스크립트가 CORS 헤더를 주면 JSON(ok/status)을 읽고, 못 읽으면 no-cors·iframe으로 보냅니다.
 * no-cors 불투명 응답(ok:false, status:0)은 실패로 보지 않습니다.
 */
async function postDriveCors(body: string): Promise<boolean> {
  const res = await fetch(DRIVE_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  });
  if (res.type === "opaque") return false;
  let json: { ok?: boolean; status?: string } | null = null;
  try {
    json = (await res.json()) as { ok?: boolean; status?: string };
  } catch {
    json = null;
  }
  if (json?.ok === false || json?.status === "error") return false;
  return Boolean(json?.ok || json?.status === "success" || res.ok);
}

async function postDriveNoCors(body: string) {
  await fetch(DRIVE_WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
    keepalive: true,
  });
}

async function postDrivePayload(body: string): Promise<DriveSendResult> {
  try {
    if (await postDriveCors(body)) return { confirmed: true };
  } catch {
    /* 카카오톡·CORS */
  }
  await Promise.allSettled([postDriveNoCors(body), postDriveViaIframe(body)]);
  return { confirmed: false };
}

export async function submitPayeeToDrive(
  payout: Payout,
  profile: PayeeProfile
): Promise<DriveSendResult> {
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

  return postDrivePayload(JSON.stringify(payload));
}
