"use client";

import { CopyTextButton } from "@/components/copy-text-button";
import { DocImage } from "@/components/doc-image";
import { GroupEntryPassportEdit } from "@/components/group-entry-passport-edit";
import { GroupPinGate } from "@/components/group-pin-gate";
import { Button } from "@/components/ui/button";
import {
  collectKindLabel,
  deleteAllGroupEntries,
  deleteCampaign,
  deleteGroupEntry,
  downloadRosterFile,
  formatRrn,
  groupEntriesXlsx,
  groupNoticeText,
  groupOfficePath,
  groupSharePath,
  groupWatchPath,
  markPassportScan,
  needsPassport,
  needsRrn,
  parseRrnMeta,
  passportReadUnsure,
  patchGroupEntry,
  rosterDate,
  rowNeedsPassportScan,
  type GroupEntry,
} from "@/lib/group-collect";
import { absoluteUrl } from "@/lib/paths";
import { useGroupCampaign } from "@/lib/use-group-campaign";
import { useGroupInbox } from "@/lib/use-group-inbox";
import { useGroupStore } from "@/lib/group-store";
import { mergePassportScan, scanPassportImage } from "@/lib/passport-scan";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function CollectOpenView({
  id,
  mode = "admin",
}: {
  id: string;
  mode?: "admin" | "office";
}) {
  const { campaign, waiting, missing } = useGroupCampaign(id);
  const inbox = useGroupInbox(id);
  const { removeCampaign } = useGroupStore();
  const router = useRouter();
  const office = mode === "office";
  const [shareUrl, setShareUrl] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [officeUrl, setOfficeUrl] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    if (!id) return;
    setShareUrl(absoluteUrl(groupSharePath(id, campaign?.ogSlot)));
    setWatchUrl(absoluteUrl(groupWatchPath(id, campaign?.ogSlot)));
    setOfficeUrl(absoluteUrl(groupOfficePath(id, campaign?.ogSlot)));
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
        해당 자료를 찾을 수 없습니다. 보관함의 예전 링크 복원에 주소를 붙여 넣어 보세요.
      </p>
    );
  }

  const count = inbox.rows.length;
  const expected = campaign.expectedCount;

  return (
    <GroupPinGate campaign={campaign} canSetPin={!office}>
      <div className={cn("space-y-5", office && "mx-auto max-w-3xl px-4 py-6")}>
        {office ? null : (
          <Link href="/collect" className="text-sm text-muted-foreground">
            ← 여행자 자료
          </Link>
        )}
        <div>
          <p className="text-xs font-semibold tracking-wide text-[color:var(--gold-ink)]">
            {collectKindLabel(campaign.kind)}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">{campaign.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {expected ? `${expected}명 중 ${count}명 제출` : `${count}명 제출`}
            {inbox.status === "connecting" ? " · 연결 중" : ""}
            {!office && campaign.departPin ? ` · 출발일 ${campaign.departPin}` : ""}
          </p>
        </div>

        {office ? null : (
          <div className="space-y-3 rounded-2xl border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-semibold">안내 문구</p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {notice || "문구를 만드는 중…"}
              </p>
            </div>
            <CopyTextButton text={notice} label="안내 문구 복사" />
            <div>
              <p className="text-sm font-semibold">고객 자료 링크</p>
              <p className="mt-1 break-all text-xs leading-relaxed text-muted-foreground">
                {shareUrl || "주소를 만드는 중…"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">내부 직원 링크</p>
              <p className="mt-1 break-all text-xs leading-relaxed text-muted-foreground">
                {officeUrl || "주소를 만드는 중…"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                카톡에 올리면 투어메이커 사진 로고가 보입니다. 자료는 출발일 6자리로 엽니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyTextButton text={shareUrl} label="고객 링크 복사" />
              <CopyTextButton text={officeUrl} label="내부 직원 링크 복사" />
              <CopyTextButton text={watchUrl} label="담당자 현황 복사" />
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={inbox.rows.length === 0 || Boolean(exporting)}
            onClick={async () => {
              setError("");
              const rows: GroupEntry[] = inbox.rows.map((row) => ({ ...row }));
              if (needsPassport(campaign.kind)) {
                const pending = rows.filter(
                  (row) => rowNeedsPassportScan(row) && (row.passportImageUrl || row.passportImageDataUrl)
                );
                for (let i = 0; i < pending.length; i += 1) {
                  setExporting(`여권 사진 읽는 중 ${i + 1}/${pending.length}`);
                  const row = pending[i];
                  if (!row) continue;
                  const src = row.passportImageUrl || row.passportImageDataUrl;
                  if (!src) continue;
                  const hit = mergePassportScan(
                    {
                      passportName: row.passportName ?? "",
                      passportNo: row.passportNo ?? "",
                      passportExpiry: row.passportExpiry ?? "",
                      birthDate: row.birthDate ?? "",
                      gender: row.gender ?? "",
                      nationality: row.nationality ?? "",
                    },
                    await scanPassportImage(src)
                  );
                  if (!hit) {
                    row.passportScan = "fail";
                    continue;
                  }
                  row.passportName = hit.passportName || row.passportName;
                  row.passportNo = hit.passportNo || row.passportNo;
                  row.passportExpiry = hit.passportExpiry || row.passportExpiry;
                  row.birthDate = row.birthDate || hit.birthDate;
                  row.gender = row.gender || hit.gender;
                  row.nationality = hit.nationality || row.nationality;
                  row.passportScan = markPassportScan(row);
                  if (row.remoteId) {
                    try {
                      await patchGroupEntry(campaign.id, row.remoteId, {
                        ...hit,
                        passportScan: row.passportScan,
                      });
                    } catch {
                      /* 엑셀에는 넣고, 저장은 다음에 다시 */
                    }
                  }
                }
              }
              setExporting("엑셀 만드는 중…");
              try {
                downloadRosterFile(campaign.title, groupEntriesXlsx(campaign.kind, rows));
              } catch {
                setError("엑셀을 만들지 못했습니다. 다시 시도해 주세요.");
              } finally {
                setExporting("");
              }
            }}
          >
            {exporting || "표준 명단 엑셀"}
          </Button>
          {office ? null : (
            <>
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
            </>
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {inbox.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 제출이 없습니다. 단체방에 공지를 올려 주세요.</p>
        ) : (
          <ul className="space-y-2">
            {inbox.rows.map((row) => {
              const passSrc = row.passportImageUrl || row.passportImageDataUrl;
              const passExt = row.passportFileName?.match(/\.[a-zA-Z0-9]+$/)?.[0] || ".jpg";
              const unsure = needsPassport(campaign.kind) && passportReadUnsure(row);
              return (
                <li
                  key={row.remoteId ?? `${row.name}-${row.submittedAt}`}
                  className={cn(
                    "rounded-2xl border bg-card px-4 py-3",
                    unsure && "border-[#e6c200] bg-[#fff4a3]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.phone ?? ""}</p>
                    </div>
                    {row.remoteId && !office ? (
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
                  {unsure ? (
                    <p className="mt-2 text-xs leading-relaxed">
                      사진에서 영문을 정확히 못 읽었습니다. 사본을 내려받아 수기로 확인해 주세요.
                    </p>
                  ) : null}
                  {needsRrn(campaign.kind) ? (
                    <dl className="mt-2 grid grid-cols-[6.5rem_1fr] gap-y-1 text-sm">
                      <dt className="text-muted-foreground">주민등록번호</dt>
                      <dd className="font-medium tabular-nums">{formatRrn(row.rrn) || "—"}</dd>
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
                    <>
                      {!needsRrn(campaign.kind) && (row.birthDate || row.gender) ? (
                        <dl className="mt-2 grid grid-cols-[6.5rem_1fr] gap-y-1 text-sm">
                          <dt className="text-muted-foreground">생년월일</dt>
                          <dd className="tabular-nums">{rosterDate(row.birthDate) || "—"}</dd>
                          <dt className="text-muted-foreground">성별</dt>
                          <dd>{row.gender || "—"}</dd>
                        </dl>
                      ) : null}
                      <GroupEntryPassportEdit campaignId={campaign.id} row={row} />
                      <div className="mt-3">
                        <DocImage
                          src={passSrc}
                          upright
                          label="여권 사진"
                          empty="여권 사진이 없습니다."
                          fileName={`${row.name}-여권${passExt}`}
                        />
                      </div>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </GroupPinGate>
  );
}
