"use client";

import { CopyTextButton } from "@/components/copy-text-button";
import { DocImage } from "@/components/doc-image";
import { GroupPinGate } from "@/components/group-pin-gate";
import { Button } from "@/components/ui/button";
import {
  collectKindLabel,
  deleteAllGroupEntries,
  deleteCampaign,
  deleteGroupEntry,
  downloadRosterFile,
  entryKey,
  formatRrn,
  groupEntriesXlsx,
  groupNoticeText,
  groupOfficePath,
  groupSharePath,
  groupWatchPath,
  markPassportScan,
  mergeEntryOrder,
  needsPassport,
  needsRrn,
  parseRrnMeta,
  patchCampaign,
  patchGroupEntry,
  replaceGroupPassportImage,
  rosterDate,
  rowNeedsPassportScan,
  sortEntriesByOrder,
  type GroupEntry,
} from "@/lib/group-collect";
import { absoluteUrl } from "@/lib/paths";
import { useGroupCampaign } from "@/lib/use-group-campaign";
import { useGroupInbox } from "@/lib/use-group-inbox";
import { useGroupStore } from "@/lib/group-store";
import { mergePassportScan, scanPassportImage } from "@/lib/passport-scan";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function orderStorageKey(campaignId: string) {
  return `spm-group-entry-order:${campaignId}`;
}

function readStoredOrder(campaignId: string): string[] {
  try {
    const raw = localStorage.getItem(orderStorageKey(campaignId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStoredOrder(campaignId: string, order: string[]) {
  try {
    localStorage.setItem(orderStorageKey(campaignId), JSON.stringify(order));
  } catch {
    /* ignore quota */
  }
}

function moveIndex<T>(list: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item === undefined) return list;
  next.splice(to, 0, item);
  return next;
}

export function CollectOpenView({
  id,
  mode = "admin",
}: {
  id: string;
  mode?: "admin" | "office";
}) {
  const { campaign, waiting, missing } = useGroupCampaign(id);
  const inbox = useGroupInbox(id);
  const { removeCampaign, rememberCampaign } = useGroupStore();
  const router = useRouter();
  const office = mode === "office";
  const [shareUrl, setShareUrl] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [officeUrl, setOfficeUrl] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState("");
  const [overId, setOverId] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const orderReady = useRef(false);

  useEffect(() => {
    if (!id) return;
    setShareUrl(absoluteUrl(groupSharePath(id, campaign?.ogSlot)));
    setWatchUrl(absoluteUrl(groupWatchPath(id, campaign?.ogSlot)));
    setOfficeUrl(absoluteUrl(groupOfficePath(id, campaign?.ogSlot)));
  }, [id, campaign?.ogSlot]);

  useEffect(() => {
    orderReady.current = false;
    setOrderIds([]);
  }, [id]);

  useEffect(() => {
    if (!campaign || !id) return;
    if (!orderReady.current) {
      const seed = campaign.entryOrder?.length ? campaign.entryOrder : readStoredOrder(id);
      setOrderIds(mergeEntryOrder(seed, inbox.rows));
      orderReady.current = true;
      return;
    }
    setOrderIds((prev) => mergeEntryOrder(prev, inbox.rows));
  }, [campaign, id, inbox.rows]);

  const rows = useMemo(() => sortEntriesByOrder(inbox.rows, orderIds), [inbox.rows, orderIds]);

  const notice = useMemo(() => {
    if (!campaign) return "";
    return groupNoticeText(campaign.title, campaign.kind);
  }, [campaign]);

  async function persistOrder(next: string[]) {
    if (!campaign) return;
    setOrderIds(next);
    writeStoredOrder(campaign.id, next);
    setSavingOrder(true);
    try {
      await patchCampaign(campaign.id, { entryOrder: next });
      rememberCampaign({ ...campaign, entryOrder: next });
    } catch {
      setError("순서를 저장하지 못했습니다. 화면 순서는 유지되며 엑셀에는 반영됩니다.");
    } finally {
      setSavingOrder(false);
    }
  }

  function reorderById(fromId: string, toId: string) {
    if (!fromId || !toId || fromId === toId) return;
    const keys = rows.map(entryKey);
    const from = keys.indexOf(fromId);
    const to = keys.indexOf(toId);
    if (from < 0 || to < 0) return;
    void persistOrder(moveIndex(keys, from, to));
  }

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
            {savingOrder ? " · 순서 저장 중" : ""}
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
              const exportRows: GroupEntry[] = rows.map((row) => ({ ...row }));
              if (needsPassport(campaign.kind)) {
                const pending = exportRows.filter(
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
                downloadRosterFile(
                  campaign.title,
                  groupEntriesXlsx(
                    campaign.kind,
                    exportRows,
                    exportRows.map(entryKey)
                  )
                );
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
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              왼쪽 ☰을 끌어 가족·부서 순으로 정리하면 바로 저장되고, 명단 엑셀 순서도 같습니다.
            </p>
            <ul className="space-y-2">
              {rows.map((row, index) => {
                const key = entryKey(row);
                const passSrc = row.passportImageUrl || row.passportImageDataUrl;
                const passExt = row.passportFileName?.match(/\.[a-zA-Z0-9]+$/)?.[0] || ".jpg";
                const dragging = draggingId === key;
                const over = overId === key && draggingId && draggingId !== key;
                return (
                  <li
                    key={key}
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-card px-3 py-3 transition-shadow sm:px-4",
                      dragging && "opacity-60 ring-2 ring-[color:var(--navy)]/30",
                      over && "border-[color:var(--navy)] shadow-md"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverId(key);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromId = e.dataTransfer.getData("text/plain") || draggingId;
                      reorderById(fromId, key);
                      setDraggingId("");
                      setOverId("");
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        className="mt-0.5 flex shrink-0 cursor-grab touch-none flex-col items-center gap-1 rounded-lg px-1 py-1 text-muted-foreground active:cursor-grabbing"
                        draggable
                        aria-label={`${row.name} 순서 바꾸기`}
                        title="끌어서 순서 변경"
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", key);
                          setDraggingId(key);
                        }}
                        onDragEnd={() => {
                          setDraggingId("");
                          setOverId("");
                        }}
                      >
                        <GripVertical className="size-5" />
                        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {index + 1}
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.phone ?? ""}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              disabled={index === 0 || savingOrder}
                              aria-label="위로"
                              onClick={() => {
                                const keys = rows.map(entryKey);
                                void persistOrder(moveIndex(keys, index, index - 1));
                              }}
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              disabled={index >= rows.length - 1 || savingOrder}
                              aria-label="아래로"
                              onClick={() => {
                                const keys = rows.map(entryKey);
                                void persistOrder(moveIndex(keys, index, index + 1));
                              }}
                            >
                              ↓
                            </Button>
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
                        </div>
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
                            <dl className="mt-2 grid grid-cols-[6.5rem_1fr] gap-y-1 text-sm">
                              <dt className="text-muted-foreground">영문명</dt>
                              <dd>{row.passportName || "—"}</dd>
                              <dt className="text-muted-foreground">여권번호</dt>
                              <dd className="tabular-nums">{row.passportNo || "—"}</dd>
                              <dt className="text-muted-foreground">여권만료일</dt>
                              <dd className="tabular-nums">{rosterDate(row.passportExpiry) || "—"}</dd>
                              {!needsRrn(campaign.kind) && (row.birthDate || row.gender) ? (
                                <>
                                  <dt className="text-muted-foreground">생년월일</dt>
                                  <dd className="tabular-nums">{rosterDate(row.birthDate) || "—"}</dd>
                                  <dt className="text-muted-foreground">성별</dt>
                                  <dd>{row.gender || "—"}</dd>
                                </>
                              ) : null}
                            </dl>
                            <div className="mt-3">
                              <DocImage
                                src={passSrc}
                                upright
                                label="여권 사진"
                                empty="여권 사진이 없습니다."
                                fileName={`${row.name}-여권${passExt}`}
                                onPersist={
                                  row.remoteId
                                    ? async (blob) => {
                                        const saved = await replaceGroupPassportImage(
                                          campaign.id,
                                          row.remoteId ?? "",
                                          blob,
                                          `${row.name}-여권.jpg`
                                        );
                                        return saved.passportImageUrl;
                                      }
                                    : undefined
                                }
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </GroupPinGate>
  );
}
