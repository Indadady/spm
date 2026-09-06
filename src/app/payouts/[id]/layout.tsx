import { SEED_PAYOUT_IDS } from "@/lib/paths";

export function generateStaticParams() {
  return SEED_PAYOUT_IDS.map((id) => ({ id }));
}

export default function PayoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
