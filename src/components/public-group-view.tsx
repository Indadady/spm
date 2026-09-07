"use client";

import { GroupCollectForm } from "@/components/group-collect-form";
import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import { collectKindLabel } from "@/lib/group-collect";
import { useGroupCampaign } from "@/lib/use-group-campaign";

export function PublicGroupView({ id }: { id: string }) {
  const { campaign, waiting, missing } = useGroupCampaign(id);

  if (waiting) {
    return <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>;
  }

  if (!id || missing || !campaign) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-xl font-bold">링크를 확인하세요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          투어메이커에서 받은 주소를 다시 열어 주세요.
        </p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-md px-4 py-6">
      <header className="mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COMPANY_LOGO} alt={COMPANY.name} className="h-8 w-auto" />
        <p className="mt-3 text-xs font-semibold tracking-wide text-[color:var(--gold-ink)]">
          {campaign.title}
        </p>
        <h1 className="mt-1 text-lg font-bold text-[color:var(--navy)]">
          {collectKindLabel(campaign.kind)}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          투어메이커로 바로 전달됩니다.
        </p>
      </header>
      <GroupCollectForm campaign={campaign} />
    </article>
  );
}
