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
