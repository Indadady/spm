import { deletePayeeSubmissions } from "./payee-inbox";
import { deletePayoutMeta } from "./payout-meta";

export async function wipePayoutRemote(payoutId: string) {
  if (!payoutId) return;
  await Promise.allSettled([deletePayeeSubmissions(payoutId), deletePayoutMeta(payoutId)]);
}
