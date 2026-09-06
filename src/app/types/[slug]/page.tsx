import { TypeBadge } from "@/components/type-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAYOUT_TYPES } from "@/lib/payout-types";
import type { PayoutTypeId } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const type = PAYOUT_TYPES.find((t) => t.id === slug);
  if (!type) notFound();

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted-foreground">
        ← 현황
      </Link>
      <div>
        <TypeBadge id={type.id} name={type.name} />
        <h1 className="mt-2 text-2xl font-bold">{type.name}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{type.when}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>원천징수</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>{type.taxHint}</p>
          <p className="text-muted-foreground">지급 대상: {type.payee}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>진행 순서</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {type.flow.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--navy)] text-xs text-white">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>필수 증빙</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {type.evidence.map((e) => (
              <li key={e.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                {e.label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Link
        href={`/payouts/new?type=${type.id}`}
        className={cn(buttonVariants(), "w-full sm:w-auto")}
      >
        이 유형으로 지급 등록
      </Link>

      <div className="flex flex-wrap gap-2 pt-2">
        {PAYOUT_TYPES.filter((t) => t.id !== type.id).map((t) => (
          <TypeBadge
            key={t.id}
            id={t.id as PayoutTypeId}
            name={t.name}
            href={`/types/${t.id}`}
          />
        ))}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return PAYOUT_TYPES.map((t) => ({ slug: t.id }));
}

