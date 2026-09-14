"use client";

import { PayoutOpenView } from "@/components/payout-open-view";
import { useParams } from "next/navigation";

export default function PayoutPage() {
  const { id } = useParams<{ id: string }>();
  return <PayoutOpenView id={id ?? ""} />;
}
