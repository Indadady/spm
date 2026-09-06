"use client";

import { TypeBadge } from "@/components/type-badge";
import { PAYOUT_TYPES } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

export default function CollectPage() {
  const { payouts, ready } = useStore();
  const links = payouts.flatMap((p) =>
    p.docs.map((d) => ({
      payout: p,
      type: PAYOUT_TYPES.find((t) => t.id === p.typeId)!,
      doc: d,
    }))
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">자료함</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          PDF, 싸인오케이, 구글 설문처럼 링크만 모아 둡니다. 원본은 드라이브·전자계약에 두고,
          여기서는 찾아가는 길만 관리합니다.
        </p>
      </div>
      {!ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 링크가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {links.map(({ payout, type, doc }) => (
            <li key={`${payout.id}-${doc.id}`} className="rounded-2xl border bg-card p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <TypeBadge id={payout.typeId} name={type.name} />
                <Link href={`/payouts/${payout.id}`} className="text-xs underline">
                  {payout.title}
                </Link>
              </div>
              <a
                href={doc.href}
                target={doc.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="flex items-start gap-2 text-sm font-medium"
              >
                {doc.kind === "pdf" ? (
                  <FileText className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <ExternalLink className="mt-0.5 size-4 shrink-0" />
                )}
                {doc.title}
              </a>
              {doc.note ? (
                <p className="mt-1 pl-6 text-xs text-muted-foreground">{doc.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
