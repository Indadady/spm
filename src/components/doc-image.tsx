"use client";

import { rotateImageSrc, uprightImageSrc, type Rotation } from "@/lib/passport-orient";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

function nextTurn(turn: Rotation, deg: 90 | 180 | 270): Rotation {
  return ((turn + deg) % 360) as Rotation;
}

function clampZoom(z: number) {
  return Math.min(8, Math.max(1, Number(z.toFixed(2))));
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
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [turn, setTurn] = useState<Rotation>(0);
  const [cssTurn, setCssTurn] = useState<Rotation>(0);
  const [rotating, setRotating] = useState(false);
  const [base, setBase] = useState(src ?? "");
  const [shown, setShown] = useState(src ?? "");
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const saveAs = (fileName || `${label}.jpg`).replace(/[\\/:*?"<>|]+/g, "_");
  const viewSrc = shown || src;

  useEffect(() => {
    setFailed(false);
    setTurn(0);
    setCssTurn(0);
    if (!src) {
      setBase("");
      setShown("");
      return;
    }
    setBase(src);
    setShown(src);
    if (!upright) return;
    let gone = false;
    void uprightImageSrc(src)
      .then((next) => {
        if (!gone) {
          setBase(next);
          setShown(next);
        }
      })
      .catch(() => {
        if (!gone) {
          setBase(src);
          setShown(src);
        }
      });
    return () => {
      gone = true;
    };
  }, [src, upright]);

  useEffect(() => {
    if (!open) {
      setZoom(1.5);
      setPan({ x: 0, y: 0 });
      drag.current = null;
      pinch.current = null;
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "+" || e.key === "=") {
        setZoom((z) => clampZoom(z + 0.25));
      }
      if (e.key === "-" || e.key === "_") {
        setZoom((z) => {
          const next = clampZoom(z - 0.25);
          if (next <= 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === "0") {
        setZoom(1.5);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function rotateBy(deg: 90 | 180 | 270) {
    if (!base || rotating) return;
    const next = nextTurn(turn, deg);
    setRotating(true);
    try {
      setShown(next ? await rotateImageSrc(base, next) : base);
      setTurn(next);
      setCssTurn(0);
    } catch {
      setTurn(next);
      setCssTurn(next);
      setShown(base);
    } finally {
      setRotating(false);
    }
  }

  function bumpZoom(delta: number) {
    setZoom((z) => {
      const next = clampZoom(z + delta);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  if (!src) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
        {empty ?? `${label}이 없습니다.`}
      </div>
    );
  }

  const imgStyle = cssTurn
    ? { transform: `rotate(${cssTurn}deg)` }
    : undefined;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <button
            type="button"
            className="text-xs font-medium text-[color:var(--navy)] underline"
            onClick={() => setOpen(true)}
          >
            크게 보기
          </button>
          <button
            type="button"
            disabled={rotating}
            className="text-xs font-medium text-[color:var(--navy)] underline disabled:opacity-50"
            onClick={() => void rotateBy(90)}
          >
            {rotating ? "돌리는 중…" : "회전"}
          </button>
          {download ? (
            <button
              type="button"
              disabled={saving}
              className="text-xs font-medium text-[color:var(--navy)] underline disabled:opacity-50"
              onClick={async () => {
                setSaving(true);
                try {
                  await saveImage(viewSrc, saveAs);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "받는 중…" : "다운로드"}
            </button>
          ) : null}
        </div>
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
                await saveImage(viewSrc, saveAs);
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
        <button type="button" className="block w-full text-left" onClick={() => setOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewSrc}
            alt={label}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            style={imgStyle}
            className="max-h-80 w-full cursor-zoom-in rounded-xl border bg-white object-contain"
          />
          <p className="mt-1 text-center text-[11px] text-muted-foreground">눌러서 화면에서 확대 · 다운로드 없이 확인</p>
        </button>
      )}
      {open && viewSrc && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex bg-black/90"
              role="dialog"
              aria-modal="true"
              aria-label={`${label} 크게 보기`}
            >
              <div
                className="absolute inset-0 touch-none overflow-hidden"
                onWheel={(e) => {
                  e.preventDefault();
                  bumpZoom(e.deltaY < 0 ? 0.2 : -0.2);
                }}
                onClick={() => setOpen(false)}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d) return;
                  e.preventDefault();
                  setPan({
                    x: d.panX + (e.clientX - d.x),
                    y: d.panY + (e.clientY - d.y),
                  });
                }}
                onPointerUp={(e) => {
                  drag.current = null;
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {
                    /* ignore */
                  }
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    const a = e.touches[0];
                    const b = e.touches[1];
                    if (!a || !b) return;
                    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                    pinch.current = { dist, zoom };
                    drag.current = null;
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2 && pinch.current) {
                    e.preventDefault();
                    const a = e.touches[0];
                    const b = e.touches[1];
                    if (!a || !b) return;
                    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                    const next = clampZoom(pinch.current.zoom * (dist / pinch.current.dist));
                    setZoom(next);
                    if (next <= 1) setPan({ x: 0, y: 0 });
                  }
                }}
                onTouchEnd={() => {
                  pinch.current = null;
                }}
              >
                <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewSrc}
                    alt={label}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})${
                        cssTurn ? ` rotate(${cssTurn}deg)` : ""
                      }`,
                      transformOrigin: "center center",
                      maxHeight: "88vh",
                      maxWidth: "min(96vw, 56rem)",
                      cursor: zoom > 1 ? "grab" : "zoom-in",
                    }}
                    className="select-none rounded-lg bg-white object-contain shadow-lg"
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
                <p className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">
                  {Math.round(zoom * 100)}% · 드래그로 이동 · 휠/핀치 확대
                </p>
                <div className="pointer-events-auto flex flex-col gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full bg-white text-xl font-semibold leading-none text-[color:var(--navy)] shadow"
                    aria-label="확대"
                    onClick={() => bumpZoom(0.25)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full bg-white text-xl font-semibold leading-none text-[color:var(--navy)] shadow disabled:opacity-40"
                    aria-label="축소"
                    disabled={zoom <= 1}
                    onClick={() => bumpZoom(-0.25)}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[color:var(--navy)] shadow"
                    onClick={() => {
                      setZoom(1.5);
                      setPan({ x: 0, y: 0 });
                    }}
                  >
                    맞춤
                  </button>
                  <button
                    type="button"
                    disabled={rotating}
                    className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[color:var(--navy)] shadow disabled:opacity-50"
                    onClick={() => void rotateBy(90)}
                  >
                    {rotating ? "…" : "회전"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[color:var(--navy)] shadow"
                    onClick={() => setOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
