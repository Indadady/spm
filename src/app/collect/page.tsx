"use client";

import { GroupCopyLink } from "@/components/group-copy-link";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { collectKindLabel, deleteCampaign } from "@/lib/group-collect";
import { useGroupStore } from "@/lib/group-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function CollectPage() {
  const { campaigns, ready, removeCampaign } = useGroupStore();
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="TRAVELER"
        title="여행자 자료"
        description="지급 정보처럼 링크만 보냅니다. 여행자보험 주민번호와 여행자명단용 여권사본을 받습니다."
        actions={
          <>
            <Link
              href="/archive/#restore"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              복원
            </Link>
            <Link href="/archive" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              보관함
            </Link>
            <Link href="/collect/new" className={cn(buttonVariants({ size: "sm" }))}>
              새 링크
            </Link>
          </>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : campaigns.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card/70 px-4 py-8 text-center text-sm leading-relaxed text-muted-foreground">
          아직 링크가 없습니다. 새 링크를 만들어 담당자 단체방에 보내 주세요. 예전 링크는{" "}
          <Link href="/archive/#restore" className="underline underline-offset-2">
            복원
          </Link>
          에서 가져올 수 있습니다.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-[color:var(--border)] bg-card shadow-[0_1px_0_rgba(15,44,68,0.04)]"
            >
              <Link
                href={`/collect/open/?id=${encodeURIComponent(c.id)}`}
                className="block px-4 py-3.5 transition-colors hover:bg-[color:var(--muted)]/40"
              >
                <p className="font-semibold text-[color:var(--navy)]">{c.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {collectKindLabel(c.kind)}
                  {c.expectedCount ? ` · 예상 ${c.expectedCount}명` : ""}
                </p>
              </Link>
              <div className="flex flex-wrap justify-end gap-2 border-t border-[color:var(--border)] px-3 py-2">
                <GroupCopyLink campaignId={c.id} ogSlot={c.ogSlot} label="고객 링크 복사" />
                <GroupCopyLink
                  campaignId={c.id}
                  ogSlot={c.ogSlot}
                  kind="office"
                  label="내부 직원 링크 복사"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={deletingId === c.id}
                  onClick={async () => {
                    if (!window.confirm(`${c.title} 링크와 받은 자료를 삭제할까요?`)) return;
                    setDeletingId(c.id);
                    setError("");
                    try {
                      await deleteCampaign(c.id);
                      removeCampaign(c.id);
                    } catch {
                      setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
                    } finally {
                      setDeletingId("");
                    }
                  }}
                >
                  {deletingId === c.id ? "지우는 중…" : "삭제"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
