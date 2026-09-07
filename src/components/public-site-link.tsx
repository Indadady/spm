"use client";

import { COMPANY } from "@/lib/company";

export function PublicSiteLink() {
  return (
    <p className="mt-8 pb-4 text-center text-xs leading-relaxed text-muted-foreground">
      <a
        href={COMPANY.site}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-[color:var(--navy)] underline"
      >
        투어메이커 홈페이지 tourmaker.kr
      </a>
    </p>
  );
}
