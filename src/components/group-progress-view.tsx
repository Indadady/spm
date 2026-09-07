"use client";

import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import { collectKindLabel, needsPassport, needsRole, needsRrn, roleLabel } from "@/lib/group-collect";
import { useGroupCampaign } from "@/lib/use-group-campaign";
import { useGroupInbox } from "@/lib/use-group-inbox";

export function GroupProgressView({ id }: { id: string }) {
  const { campaign, waiting, missing } = useGroupCampaign(id);
  const inbox = useGroupInbox(id);

  if (waiting) {
    return <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>;
  }

  if (!id || missing || !campaign) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-xl font-bold">링크를 확인하세요</h1>
        <p className="mt-2 text-sm text-muted-foreground">투어메이커에서 받은 현황 주소입니다.</p>
      </div>
    );
  }

  const expected = campaign.expectedCount;
  const count = inbox.rows.length;

  return (
    <article className="mx-auto max-w-md px-4 py-6">
      <header className="mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COMPANY_LOGO} alt={COMPANY.name} className="h-8 w-auto" />
        <p className="mt-3 text-xs font-semibold tracking-wide text-[color:var(--gold-ink)]">
          {collectKindLabel(campaign.kind)} 제출 현황
        </p>
        <h1 className="mt-1 text-lg font-bold text-[color:var(--navy)]">{campaign.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          누가 냈는지만 보입니다. 주민번호와 여권사본은 투어메이커만 확인합니다.
        </p>
      </header>

      <p className="rounded-2xl border bg-card px-4 py-3 text-sm font-semibold">
        {expected ? `${expected}명 중 ${count}명 제출` : `${count}명 제출`}
      </p>

      {inbox.rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">아직 제출이 없습니다.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {inbox.rows.map((row) => (
            <li key={row.remoteId ?? row.name} className="rounded-2xl border bg-card px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  {needsRole(campaign.kind) ? (
                    <p className="text-xs text-muted-foreground">{roleLabel(row.role)}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-[color:var(--gold-ink)]">제출</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {needsRrn(campaign.kind) ? "보험 자료" : null}
                {needsRrn(campaign.kind) && needsPassport(campaign.kind) ? " · " : null}
                {needsPassport(campaign.kind)
                  ? row.passportImageUrl || row.passportImageDataUrl
                    ? "여권 받음"
                    : "여권 없음"
                  : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
