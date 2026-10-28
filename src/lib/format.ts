const seoulFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

export function formatWon(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function parseWonInput(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

export function formatWonInput(n: number) {
  if (!n) return "";
  return Math.round(n).toLocaleString("ko-KR");
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const utc = Date.UTC(y, m - 1, d, 3, 0, 0);
  const parts = seoulFmt.formatToParts(new Date(utc));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")} (${get("weekday")})`;
}

export function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export function formatRrnInput(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 6) return d;
  return `${d.slice(0, 6)}-${d.slice(6)}`;
}

/** 은행마다 자릿수는 달라도 읽기 쉽게 3-3-나머지, 카카오는 4-2-나머지로 나눕니다. */
export function formatAccount(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 16);
  if (!d) return "";
  if (d.startsWith("3333") && d.length > 4) {
    if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 13) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

export function maskRrn(rrn: string) {
  const digits = rrn.replace(/\D/g, "");
  if (digits.length < 7) return rrn || "—";
  return `${digits.slice(0, 6)}-${digits[6]}${"*".repeat(Math.max(0, digits.length - 7))}`;
}

export function formatPayDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${y.slice(2)}.${m}.${d}`;
}

export function todaySeoulIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function formatSeoulDateTime(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function payDateIso(payout: { paidDate?: string; dueDate: string }) {
  return payout.paidDate || payout.dueDate;
}

/** 관례상 10일 지급. 오늘이 10일 이후면 다음 달 10일. */
export function nextCompanyPayDateIso(from = todaySeoulIso()) {
  const [y, m, d] = from.split("-").map(Number);
  if (!y || !m || !d) return from;
  if (d <= 10) return `${y}-${String(m).padStart(2, "0")}-10`;
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  return `${next.y}-${String(next.m).padStart(2, "0")}-10`;
}
