"use client";

import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import {
  collectKindLabel,
  needsPassport,
  needsRrn,
  type GroupCampaign,
  type GroupEntry,
} from "@/lib/group-collect";
import { cn } from "@/lib/utils";

function rowMeta(campaign: GroupCampaign, row: GroupEntry) {
  const bits: string[] = [];
  if (needsRrn(campaign.kind)) bits.push("보험");
  if (needsPassport(campaign.kind)) {
    bits.push(row.passportImageUrl || row.passportImageDataUrl ? "여권" : "여권 없음");
  }
  return bits.join(" · ");
}

/** 캡처용: 10명 이하는 1열, 11~20은 2열, 21명부터 3열 */
export function statusBoardColumns(count: number) {
  if (count > 20) return 3;
  if (count > 10) return 2;
  return 1;
}

export function statusBoardMaxWidthClass(count: number) {
  const cols = statusBoardColumns(count);
  if (cols >= 3) return "max-w-4xl";
  if (cols === 2) return "max-w-2xl";
  return "max-w-md";
}

/** 담당자에게 캡처해 보낼 제출 현황판 */
export function GroupStatusBoard({
  campaign,
  rows,
}: {
  campaign: GroupCampaign;
  rows: GroupEntry[];
}) {
  const expected = campaign.expectedCount;
  const count = rows.length;
  const remain = expected && expected > count ? expected - count : 0;
  const cols = statusBoardColumns(count);

  return (
    <div className="rounded-2xl border bg-white px-4 py-5 text-[color:var(--navy)] shadow-sm">
      <header className="mb-4 border-b border-[#e8e2d6] pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COMPANY_LOGO} alt={COMPANY.name} className="h-7 w-auto" />
        <p className="mt-3 text-[11px] font-semibold tracking-wide text-[color:var(--gold-ink)]">
          {collectKindLabel(campaign.kind)} · 제출 현황
        </p>
        <h2 className="mt-1 text-lg font-bold leading-snug">{campaign.title}</h2>
        <p className="mt-2 text-sm font-semibold">
          {expected ? `${expected}명 중 ${count}명 제출` : `${count}명 제출`}
          {remain > 0 ? (
            <span className="ml-2 font-medium text-[color:var(--gold-ink)]">· 미제출 {remain}명</span>
          ) : null}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          이름만 보입니다. 주민번호·여권사진은 포함하지 않습니다.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 제출이 없습니다.</p>
      ) : (
        <ol
          className={cn(
            "grid gap-1.5",
            cols === 1 && "grid-cols-1",
            cols === 2 && "grid-cols-2",
            cols >= 3 && "grid-cols-2 sm:grid-cols-3"
          )}
        >
          {rows.map((row, i) => (
            <li
              key={row.remoteId ?? `${row.name}-${i}`}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-[#efe9df] bg-[#fbfaf7]",
                cols === 1 ? "gap-3 px-3 py-2.5" : "px-2.5 py-2"
              )}
            >
              <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground sm:w-6">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
                  {rowMeta(campaign, row) || "제출"}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-[color:var(--gold-ink)] sm:text-[11px]">
                제출
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
