"use client";

import { GroupStatusBoard } from "@/components/group-status-board";
import { PublicSiteLink } from "@/components/public-site-link";
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

  return (
    <article className="mx-auto max-w-md px-4 py-6">
      <GroupStatusBoard campaign={campaign} rows={inbox.rows} />
      <div className="mt-4">
        <PublicSiteLink />
      </div>
    </article>
  );
}
