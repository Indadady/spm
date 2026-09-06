"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export function SignPad({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fit = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth;
      const h = 180;
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1c2834";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      if (value && !dirty.current) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, w, h);
        img.src = value;
      }
    };

    fit();
  }, [value]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function snapshot() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/jpeg", 0.72));
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-dashed border-[color:var(--navy)] bg-white">
        <canvas
          ref={canvasRef}
          className="block h-[180px] w-full touch-none cursor-crosshair"
          onPointerDown={(e) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;
            canvas.setPointerCapture(e.pointerId);
            drawing.current = true;
            dirty.current = true;
            const p = pos(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            const p = pos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }}
          onPointerUp={() => {
            drawing.current = false;
            snapshot();
          }}
          onPointerLeave={() => {
            if (!drawing.current) return;
            drawing.current = false;
            snapshot();
          }}
        />
      </div>
      <div className="mt-2 flex justify-end print:hidden">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;
            dirty.current = false;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.offsetWidth, 180);
            onChange("");
          }}
        >
          서명 지우기
        </Button>
      </div>
    </div>
  );
}
