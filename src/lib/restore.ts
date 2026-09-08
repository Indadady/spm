import { collectKindLabel, listCampaigns, loadCampaign, type GroupCampaign } from "./group-collect";
import { RETIRED_PAYOUT_IDS } from "./paths";
import { listPayoutMetas, loadPayoutMeta, payoutFromMeta, type PayoutMeta } from "./payout-meta";
import type { Payout } from "./types";

export type RestoreKind = "payout" | "group";

export type RestoreItem = {
  kind: RestoreKind;
  id: string;
  title: string;
  hint: string;
  hidden?: boolean;
};

export function parseRestoreId(raw: string) {
  const text = raw.trim();
  if (!text) return "";

  const fromQuery = text.match(/[?&]id=([^&\s#]+)/i);
  if (fromQuery) {
    try {
      return decodeURIComponent(fromQuery[1]).trim();
    } catch {
      return fromQuery[1].trim();
    }
  }

  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  const candidate = urlMatch ? urlMatch[0].replace(/[),.;]+$/, "") : text;

  try {
    const url = new URL(candidate);
    const id = url.searchParams.get("id");
    if (id) return id.trim();
    const parts = url.pathname.split("/").filter(Boolean);
    const payIdx = parts.lastIndexOf("payouts");
    if (payIdx >= 0 && parts[payIdx + 1] && parts[payIdx + 1] !== "new") {
      return decodeURIComponent(parts[payIdx + 1]).trim();
    }
    const pIdx = parts.lastIndexOf("p");
    if (pIdx >= 0 && parts[pIdx + 1] && parts[pIdx + 1] !== "s") {
      return decodeURIComponent(parts[pIdx + 1]).trim();
    }
  } catch {
    /* 링크가 아니면 아이디로 봅니다. */
  }

  return candidate.replace(/^\/+|\/+$/g, "").trim();
}

export function payoutRestoreItem(meta: PayoutMeta, hidden = false): RestoreItem {
  return {
    kind: "payout",
    id: meta.id,
    title: meta.partnerName || meta.title,
    hint: meta.eventName || meta.title || "파트너 지급",
    hidden,
  };
}

export function campaignRestoreItem(campaign: GroupCampaign): RestoreItem {
  return {
    kind: "group",
    id: campaign.id,
    title: campaign.title,
    hint: collectKindLabel(campaign.kind),
  };
}

export async function lookupRestore(id: string) {
  const key = parseRestoreId(id);
  if (!key) return null;
  const looksGroup = key.startsWith("g") && !key.startsWith("g-");
  const tryCampaign = async () => {
    const campaign = await loadCampaign(key);
    return campaign ? campaignRestoreItem(campaign) : null;
  };
  const tryPayout = async () => {
    const meta = await loadPayoutMeta(key);
    return meta ? payoutRestoreItem(meta) : null;
  };
  if (looksGroup) return (await tryCampaign()) ?? (await tryPayout());
  return (await tryPayout()) ?? (await tryCampaign());
}

export async function listMissingRemote(opts: {
  payoutIds: Iterable<string>;
  hiddenIds: Iterable<string>;
  campaignIds: Iterable<string>;
}) {
  const payoutIds = new Set(opts.payoutIds);
  const hiddenIds = new Set(opts.hiddenIds);
  const campaignIds = new Set(opts.campaignIds);
  const [payouts, campaigns] = await Promise.all([
    listPayoutMetas().catch(() => [] as PayoutMeta[]),
    listCampaigns().catch(() => [] as GroupCampaign[]),
  ]);
  const missing: RestoreItem[] = [];
  for (const meta of payouts) {
    if ((RETIRED_PAYOUT_IDS as readonly string[]).includes(meta.id)) continue;
    if (payoutIds.has(meta.id)) continue;
    missing.push(payoutRestoreItem(meta, hiddenIds.has(meta.id)));
  }
  for (const campaign of campaigns) {
    if (campaignIds.has(campaign.id)) continue;
    missing.push(campaignRestoreItem(campaign));
  }
  return missing;
}

export async function hydrateOfficeLists(opts: {
  payoutIds: Iterable<string>;
  hiddenIds: Iterable<string>;
  campaignIds: Iterable<string>;
  addPayout: (payout: Payout) => void;
  rememberCampaign: (campaign: GroupCampaign) => void;
}) {
  const payoutIds = new Set(opts.payoutIds);
  const hiddenIds = new Set(opts.hiddenIds);
  const campaignIds = new Set(opts.campaignIds);
  const [payouts, campaigns] = await Promise.all([
    listPayoutMetas().catch(() => [] as PayoutMeta[]),
    listCampaigns().catch(() => [] as GroupCampaign[]),
  ]);
  let added = 0;
  for (const meta of payouts) {
    if ((RETIRED_PAYOUT_IDS as readonly string[]).includes(meta.id)) continue;
    if (payoutIds.has(meta.id) || hiddenIds.has(meta.id)) continue;
    opts.addPayout(payoutFromMeta(meta));
    payoutIds.add(meta.id);
    added += 1;
  }
  for (const campaign of campaigns) {
    if (campaignIds.has(campaign.id)) continue;
    opts.rememberCampaign(campaign);
    campaignIds.add(campaign.id);
    added += 1;
  }
  return added;
}

export async function restoreOne(
  item: RestoreItem,
  opts: {
    addPayout: (payout: Payout) => void;
    rememberCampaign: (campaign: GroupCampaign) => void;
  }
) {
  if (item.kind === "group") {
    const campaign = await loadCampaign(item.id);
    if (!campaign) throw new Error("missing");
    opts.rememberCampaign(campaign);
    return campaignRestoreItem(campaign);
  }
  const meta = await loadPayoutMeta(item.id);
  if (!meta) throw new Error("missing");
  opts.addPayout(payoutFromMeta(meta));
  return payoutRestoreItem(meta);
}
