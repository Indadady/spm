import { driveReceipt, submitPayeeToDrive } from "./drive-inbox";
import type { PayeeProfile, Payout } from "./types";

export type InboxStatus = "connecting" | "live" | "local";

export function mergePayee(remote?: PayeeProfile, local?: PayeeProfile) {
  if (!remote) return local;
  if (!local) return remote;
  return { ...local, ...remote };
}

export async function submitPayee(payout: Payout, profile: PayeeProfile) {
  await submitPayeeToDrive(payout, profile);
  return { remoteId: undefined, idImageUrl: undefined, passportImageUrl: undefined };
}

export function subscribePayees(
  _payoutId: string,
  onChange: (rows: PayeeProfile[], status: InboxStatus) => void
) {
  onChange([], "local");
  return () => {};
}

export async function deletePayeeSubmissions(_payoutId: string) {
  return;
}

export { driveReceipt };
