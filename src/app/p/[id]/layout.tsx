import { SEED_PAYOUT_IDS } from "@/lib/paths";

export function generateStaticParams() {
  return SEED_PAYOUT_IDS.filter((id) => id.startsWith("out-")).map((id) => ({ id }));
}

export default function PublicPayeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
