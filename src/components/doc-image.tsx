"use client";

import { uprightImageSrc } from "@/lib/passport-orient";
import { useEffect, useState } from "react";

async function saveImage(src: string, fileName: string) {
  const a = document.createElement("a");
  a.download = fileName;
  if (src.startsWith("data:")) {
    a.href = src;
    a.click();
    return;
  }
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error("fetch");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  } catch {
    window.open(src, "_blank", "noreferrer");
  }
}

export function DocImage({
  src,
  label,
  empty,
  fileName,
  download = true,
  upright = false,
}: {
  src?: string;
  label: string;
  empty?: string;
  fileName?: string;
  download?: boolean;
  upright?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shown, setShown] = useState(src ?? "");
  const saveAs = (fileName || `${label}.jpg`).replace(/[\\/:*?"<>|]+/g, "_");

  useEffect(() => {
    setFailed(false);
    if (!src) {
      setShown("");
      return;
    }
    setShown(src);
    if (!upright) return;
    let gone = false;
    void uprightImageSrc(src)
      .then((next) => {
        if (!gone) setShown(next);
      })
      .catch(() => {
        if (!gone) setShown(src);
      });
    return () => {
      gone = true;
    };
  }, [src, upright]);

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
        {download ? (
          <button
            type="button"
            disabled={saving}
            className="text-xs font-medium text-[color:var(--navy)] underline disabled:opacity-50"
            onClick={async () => {
              setSaving(true);
              try {
                await saveImage(shown || src, saveAs);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "받는 중…" : "다운로드"}
          </button>
        ) : null}
      </div>
      {failed ? (
        download ? (
          <button
            type="button"
            disabled={saving}
            className="block w-full rounded-xl border px-4 py-5 text-center text-sm font-medium text-[color:var(--navy)] underline disabled:opacity-50"
            onClick={async () => {
              setSaving(true);
              try {
                await saveImage(shown || src, saveAs);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "받는 중…" : "사진이 안 보이면 다운로드로 받으세요"}
          </button>
        ) : (
          <p className="rounded-xl border px-4 py-5 text-center text-sm text-muted-foreground">
            사진을 불러오지 못했습니다.
          </p>
        )
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown || src}
          alt={label}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="max-h-80 w-full rounded-xl border bg-white object-contain"
        />
      )}
    </div>
  );
}
