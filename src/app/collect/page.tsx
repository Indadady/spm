"use client";

import { GroupCopyLink } from "@/components/group-copy-link";
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
              <div className="mt-1 flex justify-end gap-2">
                <GroupCopyLink campaignId={c.id} ogSlot={c.ogSlot} label="자료 링크 복사" />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
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
