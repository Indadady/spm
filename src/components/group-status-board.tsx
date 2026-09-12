"use client";

import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import {
  collectKindLabel,
  needsPassport,
  needsRrn,
  type GroupCampaign,
  type GroupEntry,
} from "@/lib/group-collect";

function rowMeta(campaign: GroupCampaign, row: GroupEntry) {
  const bits: string[] = [];
  if (needsRrn(campaign.kind)) bits.push("보험");
  if (needsPassport(campaign.kind)) {
    bits.push(row.passportImageUrl || row.passportImageDataUrl ? "여권" : "여권 없음");
  }
  return bits.join(" · ");
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
        <ol className="space-y-1.5">
          {rows.map((row, i) => (
            <li
              key={row.remoteId ?? `${row.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-[#efe9df] bg-[#fbfaf7] px-3 py-2.5"
            >
              <span className="w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{rowMeta(campaign, row) || "제출"}</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-[color:var(--gold-ink)]">제출</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
