const INBOX_FOLDER_ID = "1mFV1FpcypbnEyghCT9rdNahU3uLuA3KE";
const LEDGER_SHEET_ID = "1livVBMRo6g574ECo16lTlVeTvUBpckdSUfgK3d1I-fA";

function doGet() {
  return json_({ ok: true, writeOnly: true });
}

function parseBody_(e) {
  const raw = (e && e.postData && e.postData.contents) || "";
  try {
    const direct = JSON.parse(raw);
    if (direct && typeof direct === "object") return direct;
  } catch (_) {}
  if (e && e.parameter && e.parameter.data) {
    try {
      return JSON.parse(e.parameter.data);
    } catch (_) {}
  }
  const eq = String(raw).indexOf("=");
  if (eq > 0) {
    try {
      return JSON.parse(decodeURIComponent(String(raw).slice(eq + 1).replace(/\+/g, " ")));
    } catch (_) {}
  }
  return {};
}

function doPost(e) {
  try {
    const data = parseBody_(e);
    if (!data.name || !data.rrn || !data.account) {
      return json_({ ok: false, error: "필수 항목이 없습니다." });
    }

    const folder = DriveApp.getFolderById(INBOX_FOLDER_ID);
    const stamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd-HHmm");
    const safeName = safe_(data.name);
    const safeTitle = safe_(data.documentNo || data.payoutTitle || data.payoutId || "지급");
    const dest = folder.createFolder(stamp + "_" + safeTitle + "_" + safeName);

    dest.createFile(safeName + "_인적정보.txt", infoText_(data), MimeType.PLAIN_TEXT);

    if (data.idImageDataUrl) {
      dest.createFile(blobFromDataUrl_(data.idImageDataUrl, safeName + "_신분증.jpg"));
    }
    if (data.signatureDataUrl) {
      dest.createFile(blobFromDataUrl_(data.signatureDataUrl, safeName + "_서명.jpg"));
    }
    if (data.passportImageDataUrl) {
      dest.createFile(blobFromDataUrl_(data.passportImageDataUrl, safeName + "_여권.jpg"));
    }

    appendLedger_(data, dest.getUrl());
    return json_({ ok: true, status: "success", url: dest.getUrl() });
  } catch (err) {
    return json_({ ok: false, status: "error", error: String(err) });
  }
}

function infoText_(data) {
  return [
    "투어메이커 SPM 입금 정보",
    "제출시각: " + (data.submittedAt || ""),
    "지급 건: " + (data.payoutTitle || ""),
    "문서번호: " + (data.documentNo || ""),
    "행사: " + (data.eventName || ""),
    "발주: " + (data.clientName || ""),
    "",
    "성명: " + (data.name || ""),
    "연락처: " + (data.phone || ""),
    "주민등록번호: " + (data.rrn || ""),
    "은행: " + (data.bank || ""),
    "계좌번호: " + (data.account || ""),
    "예금주: " + (data.holder || ""),
    "개인정보 동의: " + (data.privacyAgreed ? "예" : "아니오"),
  ].join("\n");
}

function appendLedger_(data, folderUrl) {
  const sheet = SpreadsheetApp.openById(LEDGER_SHEET_ID).getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "제출시각",
      "지급 건",
      "성명",
      "연락처",
      "주민등록번호",
      "은행",
      "계좌",
      "예금주",
      "폴더",
    ]);
  }
  sheet.appendRow([
    data.submittedAt || "",
    data.payoutTitle || data.payoutId || "",
    data.name || "",
    data.phone || "",
    data.rrn || "",
    data.bank || "",
    data.account || "",
    data.holder || "",
    folderUrl,
  ]);
}

function blobFromDataUrl_(dataUrl, fileName) {
  const comma = String(dataUrl).indexOf(",");
  const raw = comma >= 0 ? String(dataUrl).slice(comma + 1) : String(dataUrl);
  const bytes = Utilities.base64Decode(raw);
  return Utilities.newBlob(bytes, "image/jpeg", fileName);
}

function safe_(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
