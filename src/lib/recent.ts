import { payDateIso } from "./format";
import type { GroupCampaign } from "./group-collect";
import type { Payout } from "./types";

export const RECENT_LIMIT = 5;

export function seoulYearMonth(iso: string) {
  if (!iso) return { year: "0000", month: "00", key: "0000-00" };
  if (/^\d{4}-\d{2}(-\d{2})?/.test(iso) && !iso.includes("T")) {
    const year = iso.slice(0, 4);
    const month = iso.slice(5, 7);
    return { year, month, key: `${year}-${month}` };
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { year: "0000", month: "00", key: "0000-00" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = get("year");
  const month = get("month");
  return { year, month, key: `${year}-${month}` };
}

export function payoutWhen(payout: Payout) {
  return payDateIso(payout);
}

export function campaignWhen(campaign: GroupCampaign) {
  return campaign.createdAt || "";
}

export function recentSlice<T>(items: T[], key: (item: T) => string, limit = RECENT_LIMIT) {
  const sorted = [...items].sort((a, b) => key(b).localeCompare(key(a)));
  return { recent: sorted.slice(0, limit), rest: sorted.slice(limit), total: sorted.length };
}

export function monthLabel(month: string) {
  const n = Number(month);
  return n ? `${n}월` : month;
}

export function groupByYearMonth<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const { key } = seoulYearMonth(keyFn(item));
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, grouped]) => ({
      key,
      year: key.slice(0, 4),
      month: key.slice(5, 7),
      items: grouped,
    }));
}
