"use client";

import {
  bakeRotatedImage,
  detectImageRotation,
  type Rotation,
} from "@/lib/passport-orient";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

async function downloadImage(src: string, fileName: string) {
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
  onPersist,
}: {
  src?: string;
  label: string;
  empty?: string;
  fileName?: string;
  download?: boolean;
  upright?: boolean;
  /** 회전·보정한 원본 JPEG를 서버에 저장. 새 URL을 돌려주면 화면도 바꿉니다. */
  onPersist?: (blob: Blob) => Promise<string | void>;
}) {
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [turn, setTurn] = useState<Rotation>(0);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [persisting, setPersisting] = useState(false);
  const [persistMsg, setPersistMsg] = useState("");
  const [viewSrc, setViewSrc] = useState(src ?? "");
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const persistSeq = useRef(0);
  const localBlob = useRef<string>("");
  const saveAs = (fileName || `${label}.jpg`).replace(/[\\/:*?"<>|]+/g, "_");

  function revokeLocal() {
    if (localBlob.current) {
      URL.revokeObjectURL(localBlob.current);
      localBlob.current = "";
    }
  }

  useEffect(() => {
    setFailed(false);
    setTurn(0);
    setNatural({ w: 0, h: 0 });
    setPersistMsg("");
    revokeLocal();
    if (!src) {
      setViewSrc("");
      return;
    }
    setViewSrc(src);
    if (!upright) return;
    let gone = false;
    void detectImageRotation(src)
      .then((deg) => {
        if (gone || !deg) return;
        // 자동 보정은 CSS로만 먼저 맞춤(저장 중 멈춤 방지). 확정 저장은 「회전」클릭 시.
        setTurn(deg);
      })
      .catch(() => {
        /* keep as-is */
      });
    return () => {
      gone = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, upright]);

  useEffect(() => {
    return () => revokeLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      drag.current = null;
      pinch.current = null;
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z + 0.25));
      if (e.key === "-" || e.key === "_") {
        setZoom((z) => {
          const next = clampZoom(z - 0.25);
          if (next <= 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === "0") {
        setZoom(1);
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

  async function applyRotation(source: string, deg: Rotation) {
    if (!deg) return;
    const seq = ++persistSeq.current;
    setPersisting(true);
    setPersistMsg("방향 맞추는 중…");
    const bakeTimer = window.setTimeout(() => {
      if (seq === persistSeq.current) {
        setPersisting(false);
        setPersistMsg("시간 초과 · 다시 눌러 주세요");
      }
    }, 35_000);
    try {
      const blob = await bakeRotatedImage(source, deg, 0.9, 2800);
      if (seq !== persistSeq.current) return;
      const localUrl = URL.createObjectURL(blob);
      revokeLocal();
      localBlob.current = localUrl;
      setViewSrc(localUrl);
      setTurn(0);
      setNatural({ w: 0, h: 0 });

      if (!onPersist) {
        setPersistMsg("");
        return;
      }
      setPersistMsg("저장 중…");
      try {
        const nextUrl = await onPersist(blob);
        if (seq !== persistSeq.current) return;
        if (nextUrl) {
          setViewSrc(nextUrl);
          revokeLocal();
        }
        setPersistMsg("저장됨");
        window.setTimeout(() => {
          if (seq === persistSeq.current) setPersistMsg("");
        }, 1_600);
      } catch {
        setPersistMsg("화면은 맞춤 · 저장만 실패");
      }
    } catch {
      setTurn(deg);
      setPersistMsg("방향 맞추기 실패 · 다시 눌러 주세요");
    } finally {
      window.clearTimeout(bakeTimer);
      if (seq === persistSeq.current) setPersisting(false);
    }
  }

  async function rotateBy(deg: 90 | 180 | 270) {
    if (!viewSrc || persisting) return;
    const next = nextTurn(turn, deg);
    if (!next) {
      setTurn(0);
      return;
    }
    // turn이 이미 0인 정상 표시 상태에서 90도씩 구워 저장
    await applyRotation(viewSrc, next);
  }

  function bumpZoom(delta: number) {
    setZoom((z) => {
      const next = clampZoom(z + delta);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  const display = useMemo(() => {
    if (!natural.w || !natural.h || typeof window === "undefined") {
      return { w: undefined as number | undefined, h: undefined as number | undefined };
    }
    const vw = window.innerWidth * 0.94;
    const vh = window.innerHeight * 0.88;
    const swapped = turn === 90 || turn === 270;
    const boxW = swapped ? natural.h : natural.w;
    const boxH = swapped ? natural.w : natural.h;
    const fit = Math.min(vw / boxW, vh / boxH, 1);
    return {
      w: Math.max(1, Math.round(boxW * fit * zoom)),
      h: Math.max(1, Math.round(boxH * fit * zoom)),
    };
  }, [natural.h, natural.w, turn, zoom]);

  if (!src) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
        {empty ?? `${label}이 없습니다.`}
      </div>
    );
  }

  const thumbStyle = turn ? { transform: `rotate(${turn}deg)` } : undefined;

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {label}
          {persistMsg ? ` · ${persistMsg}` : ""}
        </p>
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
            disabled={persisting}
            className="text-xs font-medium text-[color:var(--navy)] underline disabled:opacity-50"
            onClick={() => void rotateBy(90)}
          >
            {persisting ? "저장 중…" : "회전"}
          </button>
          {download ? (
            <button
              type="button"
              disabled={downloading}
              className="text-xs font-medium text-[color:var(--navy)] underline disabled:opacity-50"
              onClick={async () => {
                setDownloading(true);
                try {
                  const out =
                    turn && viewSrc
                      ? URL.createObjectURL(await bakeRotatedImage(viewSrc, turn, 0.92))
                      : viewSrc;
                  await downloadImage(out, saveAs);
                  if (out.startsWith("blob:")) URL.revokeObjectURL(out);
                } finally {
                  setDownloading(false);
                }
              }}
            >
              {downloading ? "받는 중…" : "다운로드"}
            </button>
          ) : null}
        </div>
      </div>
      {failed ? (
        download ? (
          <button
            type="button"
            disabled={downloading}
            className="block w-full rounded-xl border px-4 py-5 text-center text-sm font-medium text-[color:var(--navy)] underline disabled:opacity-50"
            onClick={async () => {
              setDownloading(true);
              try {
                await downloadImage(viewSrc, saveAs);
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? "받는 중…" : "사진이 안 보이면 다운로드로 받으세요"}
          </button>
        ) : (
          <p className="rounded-xl border px-4 py-5 text-center text-sm text-muted-foreground">
            사진을 불러오지 못했습니다.
          </p>
        )
      ) : (
        <button type="button" className="block w-full min-w-0 text-left" onClick={() => setOpen(true)}>
          <div className="max-h-80 overflow-hidden rounded-xl border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewSrc}
              alt={label}
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
              onLoad={(e) => {
                const el = e.currentTarget;
                setNatural({ w: el.naturalWidth || 0, h: el.naturalHeight || 0 });
              }}
              style={thumbStyle}
              className="mx-auto max-h-80 max-w-full cursor-zoom-in object-contain"
            />
          </div>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            눌러서 원본 화질로 확대 · 회전은 자동 저장
          </p>
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
                <div className="flex h-full w-full items-center justify-center p-3 sm:p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewSrc}
                    alt={label}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      setNatural({ w: el.naturalWidth || 0, h: el.naturalHeight || 0 });
                    }}
                    style={{
                      width: display.w ? `${display.w}px` : undefined,
                      height: display.h ? `${display.h}px` : undefined,
                      maxWidth: display.w ? "none" : "94vw",
                      maxHeight: display.h ? "none" : "88vh",
                      transform: `translate(${pan.x}px, ${pan.y}px)${turn ? ` rotate(${turn}deg)` : ""}`,
                      transformOrigin: "center center",
                      cursor: zoom > 1 ? "grab" : "zoom-in",
                    }}
                    className="select-none rounded-lg bg-white object-contain shadow-lg"
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
                <p className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">
                  {Math.round(zoom * 100)}%
                  {natural.w ? ` · 원본 ${natural.w}×${natural.h}` : ""}
                  {persistMsg ? ` · ${persistMsg}` : " · 휠/핀치 확대"}
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
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                  >
                    맞춤
                  </button>
                  <button
                    type="button"
                    disabled={persisting}
                    className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[color:var(--navy)] shadow disabled:opacity-50"
                    onClick={() => void rotateBy(90)}
                  >
                    {persisting ? "…" : "회전"}
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
