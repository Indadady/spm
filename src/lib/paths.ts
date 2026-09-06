export function appBasePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function withBase(path: string) {
  const base = appBasePath();
  const next = path.startsWith("/") ? path : `/${path}`;
  return `${base}${next}`;
}

export function absoluteUrl(path: string) {
  if (typeof window === "undefined") return withBase(path);
  return `${window.location.origin}${withBase(path)}`;
}

export const SEED_PAYOUT_IDS = [
  "out-tm-260903-kimryeon",
  "out-tm-test-sample",
  "in-yeongseo-yeongdong",
] as const;
