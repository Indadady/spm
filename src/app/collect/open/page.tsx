"use client";

import { CopyTextButton } from "@/components/copy-text-button";
import { DocImage } from "@/components/doc-image";
import { Button } from "@/components/ui/button";
import {
  collectKindLabel,
  deleteAllGroupEntries,
  deleteCampaign,
  deleteGroupEntry,
  groupEntriesCsv,
  groupNoticeText,
  groupSharePath,
  groupWatchPath,
  needsPassport,
  needsRrn,
  parseRrnMeta,
  rosterDate,
} from "@/lib/group-collect";
import { absoluteUrl } from "@/lib/paths";
import { useGroupCampaign } from "@/lib/use-group-campaign";
import { useGroupInbox } from "@/lib/use-group-inbox";
import { useGroupStore } from "@/lib/group-store";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function CollectOpenBody() {
  const id = useSearchParams().get("id") ?? "";
  const { campaign, waiting, missing } = useGroupCampaign(id);
  const inbox = useGroupInbox(id);
  const { removeCampaign } = useGroupStore();
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setShareUrl(absoluteUrl(groupSharePath(id, campaign?.ogSlot)));
    setWatchUrl(absoluteUrl(groupWatchPath(id, campaign?.ogSlot)));
  }, [id, campaign?.ogSlot]);

  const notice = useMemo(() => {
    if (!campaign) return "";
    return groupNoticeText(campaign.title, campaign.kind);
  }, [campaign]);

  if (waiting) {
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  }

  if (!campaign || missing) {
    return (
      <p className="text-sm text-muted-foreground">
        해당 자료를 찾을 수 없습니다. 이 브라우저에서 만든 링크인지 확인해 주세요.
      </p>
    );
  }

  const count = inbox.rows.length;
  const expected = campaign.expectedCount;

  return (
    <div className="space-y-5">
      <Link href="/collect" className="text-sm text-muted-foreground">
        ← 여행자 자료
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-wide text-[color:var(--gold-ink)]">
          {collectKindLabel(campaign.kind)}
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{campaign.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {expected ? `${expected}명 중 ${count}명 제출` : `${count}명 제출`}
          {inbox.status === "connecting" ? " · 연결 중" : ""}
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold">안내 문구</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {notice || "문구를 만드는 중…"}
          </p>
        </div>
        <CopyTextButton text={notice} label="안내 문구 복사" />
        <div>
          <p className="text-sm font-semibold">자료 링크</p>
          <p className="mt-1 break-all text-xs leading-relaxed text-muted-foreground">
            {shareUrl || "주소를 만드는 중…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyTextButton text={shareUrl} label="링크 복사" />
          <CopyTextButton text={watchUrl} label="담당자 현황 복사" />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={inbox.rows.length === 0}
          onClick={() => {
            const csv = groupEntriesCsv(campaign.kind, inbox.rows);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${campaign.title}-여행자명단.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          명단 양식 CSV
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={inbox.rows.length === 0 || clearing}
          onClick={async () => {
            if (!window.confirm("받은 자료를 모두 삭제할까요? 되돌릴 수 없습니다.")) return;
            setClearing(true);
            setError("");
            try {
              await deleteAllGroupEntries(campaign.id);
            } catch {
              setError("자료를 지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
            } finally {
              setClearing(false);
            }
          }}
        >
          {clearing ? "지우는 중…" : "받은 자료 모두 삭제"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={clearing}
          onClick={async () => {
            if (!window.confirm("이 링크와 받은 자료를 삭제할까요? 되돌릴 수 없습니다.")) return;
            setClearing(true);
            setError("");
            try {
              await deleteCampaign(campaign.id);
              removeCampaign(campaign.id);
              router.push("/collect");
            } catch {
              setError("링크를 지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
              setClearing(false);
            }
          }}
        >
          링크 삭제
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {inbox.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 제출이 없습니다. 단체방에 공지를 올려 주세요.</p>
      ) : (
        <ul className="space-y-2">
          {inbox.rows.map((row) => {
            const passSrc = row.passportImageUrl || row.passportImageDataUrl;
            return (
              <li key={row.remoteId ?? `${row.name}-${row.submittedAt}`} className="rounded-2xl border bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.phone ?? ""}</p>
                  </div>
                  {row.remoteId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === row.remoteId || clearing}
                      onClick={async () => {
                        if (!window.confirm(`${row.name} 제출을 삭제할까요?`)) return;
                        setDeletingId(row.remoteId ?? "");
                        setError("");
                        try {
                          await deleteGroupEntry(campaign.id, row.remoteId ?? "");
                        } catch {
                          setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
                        } finally {
                          setDeletingId("");
                        }
                      }}
                    >
                      {deletingId === row.remoteId ? "지우는 중…" : "삭제"}
                    </Button>
                  ) : null}
                </div>
                {needsRrn(campaign.kind) ? (
                  <dl className="mt-2 grid grid-cols-[6.5rem_1fr] gap-y-1 text-sm">
                    <dt className="text-muted-foreground">주민등록번호</dt>
                    <dd className="font-medium tabular-nums">{row.rrn || "—"}</dd>
                    {row.birthDate || row.rrn ? (
                      <>
                        <dt className="text-muted-foreground">생년월일</dt>
                        <dd className="tabular-nums">
                          {rosterDate(row.birthDate || parseRrnMeta(row.rrn ?? "")?.birthIso) || "—"}
                        </dd>
                        <dt className="text-muted-foreground">성별</dt>
                        <dd>{row.gender || parseRrnMeta(row.rrn ?? "")?.gender || "—"}</dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
                {needsPassport(campaign.kind) ? (
                  <div className="mt-3">
                    <DocImage
                      src={passSrc}
                      label="여권 사진"
                      empty="여권 사진이 없습니다."
                      fileName={`${row.name}-여권.jpg`}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function CollectOpenPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
      <CollectOpenBody />
    </Suspense>
  );
}
