export type Rotation = 0 | 90 | 180 | 270;

export function rotateCanvas(src: HTMLCanvasElement, deg: Rotation) {
  if (!deg) return src;
  const canvas = document.createElement("canvas");
  if (deg === 180) {
    canvas.width = src.width;
    canvas.height = src.height;
  } else {
    canvas.width = src.height;
    canvas.height = src.width;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return canvas;
}

function sampleGray(src: HTMLCanvasElement) {
  const max = 180;
  const scale = Math.min(1, max / Math.max(src.width, src.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(src.width * scale));
  canvas.height = Math.max(8, Math.round(src.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function bandEnergy(canvas: HTMLCanvasElement, top: number, height: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const y0 = Math.max(0, Math.floor(canvas.height * top));
  const h = Math.max(4, Math.floor(canvas.height * height));
  const { data, width } = ctx.getImageData(0, y0, canvas.width, Math.min(h, canvas.height - y0));
  let sum = 0;
  let n = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const j = (y * width + x - 1) * 4;
      const g1 = (data[i] ?? 0) * 0.3 + (data[i + 1] ?? 0) * 0.59 + (data[i + 2] ?? 0) * 0.11;
      const g0 = (data[j] ?? 0) * 0.3 + (data[j + 1] ?? 0) * 0.59 + (data[j + 2] ?? 0) * 0.11;
      sum += Math.abs(g1 - g0);
      n += 1;
    }
  }
  return n ? sum / n : 0;
}

function uprightScore(src: HTMLCanvasElement) {
  const sample = sampleGray(src);
  const portrait = sample.height >= sample.width * 1.05 ? 18 : sample.width > sample.height * 1.12 ? -16 : 0;
  const bottom = bandEnergy(sample, 0.68, 0.3);
  const top = bandEnergy(sample, 0.02, 0.28);
  return portrait + bottom * 3 - top;
}

export function detectPassportRotation(src: HTMLCanvasElement): Rotation {
  const degs: Rotation[] = [0, 90, 180, 270];
  let best: Rotation = 0;
  let bestScore = uprightScore(src);
  for (const deg of degs) {
    if (!deg) continue;
    const score = uprightScore(rotateCanvas(src, deg));
    if (score > bestScore + 6) {
      best = deg;
      bestScore = score;
    }
  }
  return best;
}

export function uprightPassportCanvas(src: HTMLCanvasElement) {
  const rotation = detectPassportRotation(src);
  return { canvas: rotateCanvas(src, rotation), rotation };
}

export async function canvasToJpegFile(canvas: HTMLCanvasElement, fileName: string, quality = 0.92) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => {
        if (next) resolve(next);
        else reject(new Error("이미지를 만들지 못했습니다."));
      },
      "image/jpeg",
      quality
    );
  });
  const base = fileName.replace(/\.[^.]+$/, "") || "passport";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

export async function canvasToJpegUrl(canvas: HTMLCanvasElement, quality = 0.92) {
  return canvas.toDataURL("image/jpeg", quality);
}

async function blobToCanvas(blob: Blob) {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, bmp.width);
      canvas.height = Math.max(1, bmp.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("캔버스를 만들지 못했습니다.");
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      return canvas;
    } catch {
      /* img fallback */
    }
  }
  const src = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      const timer = window.setTimeout(() => reject(new Error("이미지를 읽지 못했습니다.")), 20_000);
      el.onload = () => {
        window.clearTimeout(timer);
        resolve(el);
      };
      el.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("이미지를 읽지 못했습니다."));
      };
      el.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, img.naturalWidth || img.width);
    canvas.height = Math.max(1, img.naturalHeight || img.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스를 만들지 못했습니다.");
    ctx.drawImage(img, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(src);
  }
}

async function inputToCanvas(input: File | string) {
  if (typeof input !== "string") return blobToCanvas(input);
  if (input.startsWith("data:") || input.startsWith("blob:")) {
    const res = await fetch(input);
    return blobToCanvas(await res.blob());
  }
  const res = await fetch(input);
  if (!res.ok) throw new Error("이미지를 읽지 못했습니다.");
  return blobToCanvas(await res.blob());
}

export async function uprightPassportFile(file: File) {
  const { canvas, rotation } = uprightPassportCanvas(await inputToCanvas(file));
  if (!rotation) return file;
  return canvasToJpegFile(canvas, file.name, 0.92);
}

export async function uprightImageSrc(src: string) {
  const { canvas, rotation } = uprightPassportCanvas(await inputToCanvas(src));
  if (!rotation) return src;
  return canvasToJpegUrl(canvas, 0.92);
}

export async function rotateImageSrc(src: string, deg: Rotation) {
  if (!deg) return src;
  return canvasToJpegUrl(rotateCanvas(await inputToCanvas(src), deg), 0.92);
}

