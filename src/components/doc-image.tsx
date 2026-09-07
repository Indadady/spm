"use client";

import { useState } from "react";

export function DocImage({
  src,
  label,
  empty,
}: {
  src?: string;
  label: string;
  empty?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
        {empty ?? `${label}이 없습니다.`}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-[color:var(--navy)] underline"
        >
          크게 보기
        </a>
      </div>
      {failed ? (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border px-4 py-5 text-center text-sm font-medium text-[color:var(--navy)] underline"
        >
          사진이 안 보이면 여기를 눌러 여세요
        </a>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="max-h-80 w-full rounded-xl border bg-white object-contain"
        />
      )}
    </div>
  );
}
