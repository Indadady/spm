"use client";

import { GroupCopyLink } from "@/components/group-copy-link";
import { buttonVariants } from "@/components/ui/button";
import { collectKindLabel } from "@/lib/group-collect";
import { useGroupStore } from "@/lib/group-store";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CollectPage() {
  const { campaigns, ready } = useGroupStore();

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">여행자 자료</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          지급 정보처럼 링크만 보냅니다. 여행자보험 주민번호와 여행자명단용 여권사본을 받습니다.
        </p>
      </section>

      <div className="flex justify-end">
        <Link href="/collect/new" className={cn(buttonVariants({ size: "sm" }))}>
          새 링크
        </Link>
      </div>

      {!ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 링크가 없습니다. 새 링크를 만들어 담당자 단체방에 보내 주세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/collect/open/?id=${encodeURIComponent(c.id)}`}
                className="block rounded-2xl border bg-card px-4 py-3"
              >
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {collectKindLabel(c.kind)}
                  {c.expectedCount ? ` · 예상 ${c.expectedCount}명` : ""}
                </p>
              </Link>
              <div className="mt-1 flex justify-end">
                <GroupCopyLink campaignId={c.id} ogSlot={c.ogSlot} label="자료 링크 복사" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
