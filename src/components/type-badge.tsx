import Link from "next/link";
import type { PayoutTypeId } from "@/lib/types";
import { cn } from "@/lib/utils";

const colors: Record<PayoutTypeId, string> = {
  "event-staff": "bg-amber-100 text-amber-950",
  lecture: "bg-violet-100 text-violet-950",
  experience: "bg-emerald-100 text-emerald-950",
  freelancer: "bg-orange-100 text-orange-950",
  "revenue-share": "bg-rose-100 text-rose-950",
};

export function TypeBadge({
  id,
  name,
  href,
}: {
  id: PayoutTypeId;
  name: string;
  href?: string;
}) {
  const cls = cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight",
    colors[id]
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {name}
      </Link>
    );
  }
  return <span className={cls}>{name}</span>;
}
