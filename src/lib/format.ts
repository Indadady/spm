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
