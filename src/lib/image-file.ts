export function dataUrlBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? Math.ceil(((dataUrl.length - comma - 1) * 3) / 4) : dataUrl.length;
}

async function canvasJpeg(
  img: HTMLImageElement,
  max: number,
  quality: number
): Promise<string> {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 줄이지 못했습니다.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
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
}

async function canvasFromSource(src: string | File, max: number, quality: number) {
  if (typeof src !== "string" && typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(src, { imageOrientation: "from-image" });
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bmp.width * scale));
      canvas.height = Math.max(1, Math.round(bmp.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("이미지를 줄이지 못했습니다.");
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      return canvas.toDataURL("image/jpeg", quality);
    } catch {
      /* img fallback */
    }
  }
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    return canvasJpeg(await loadImage(url), max, quality);
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}

const EMBED_LIMIT = 220_000;

export async function fileToJpeg(file: File, max = 640, quality = 0.48): Promise<string> {
  let jpeg = await canvasFromSource(file, max, quality);
  if (dataUrlBytes(jpeg) <= EMBED_LIMIT) return jpeg;
  jpeg = await canvasJpeg(await loadImage(jpeg), 480, 0.4);
  if (dataUrlBytes(jpeg) <= EMBED_LIMIT) return jpeg;
  return canvasJpeg(await loadImage(jpeg), 360, 0.35);
}

export async function fileForDownload(file: File): Promise<File> {
  const type = file.type.toLowerCase();
  const keep =
    (type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "image/webp") &&
    file.size > 0;
  if (keep) return file;
  const url = URL.createObjectURL(file);
  try {
    const jpeg = await canvasJpeg(await loadImage(url), 4096, 0.95);
    const res = await fetch(jpeg);
    const blob = await res.blob();
    const base = file.name.replace(/\.[^.]+$/, "") || "passport";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function shrinkDataUrl(dataUrl: string, max = 800, quality = 0.52): Promise<string> {
  return canvasJpeg(await loadImage(dataUrl), max, quality);
}
