export function dataUrlBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? Math.ceil(((dataUrl.length - comma - 1) * 3) / 4) : dataUrl.length;
}

async function canvasJpeg(
  img: HTMLImageElement | ImageBitmap,
  max: number,
  quality: number
): Promise<string> {
  const w = "naturalWidth" in img ? img.naturalWidth || img.width : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight || img.height : img.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 줄이지 못했습니다.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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
      try {
        return await canvasJpeg(bmp, max, quality);
      } finally {
        bmp.close();
      }
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

/** 화면·Firestore 미리보기용. Storage 원본에는 쓰지 않습니다. */
export async function fileToJpeg(file: File, max = 640, quality = 0.48): Promise<string> {
  let jpeg = await canvasFromSource(file, max, quality);
  if (dataUrlBytes(jpeg) <= EMBED_LIMIT) return jpeg;
  jpeg = await canvasJpeg(await loadImage(jpeg), 480, 0.4);
  if (dataUrlBytes(jpeg) <= EMBED_LIMIT) return jpeg;
  return canvasJpeg(await loadImage(jpeg), 360, 0.35);
}

function keepOriginalFile(file: File) {
  if (file.size <= 0) return false;
  const type = file.type.toLowerCase();
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp"
  ) {
    return true;
  }
  // 타입이 비어 있어도 확장자가 일반 사진이면 원본 유지
  if (!type || type === "application/octet-stream") {
    return /\.(jpe?g|png|webp)$/i.test(file.name);
  }
  return false;
}

async function dataUrlToJpegFile(dataUrl: string, fileName: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const base = fileName.replace(/\.[^.]+$/, "") || "passport";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

/**
 * Storage에 올릴 파일.
 * jpeg/png/webp는 손대지 않고, HEIC 등만 고화질 JPEG로 바꿉니다.
 */
export async function fileForDownload(file: File): Promise<File> {
  if (keepOriginalFile(file)) return file;
  const jpeg = await canvasFromSource(file, 4096, 0.95);
  return dataUrlToJpegFile(jpeg, file.name);
}

/**
 * 원본 업로드가 실패했을 때만 쓰는 Storage용 고화질본.
 * 미리보기(640·48%)를 올리지 않습니다.
 */
export async function fileForStorageFallback(file: File): Promise<File> {
  try {
    return await fileForDownload(file);
  } catch {
    const jpeg = await canvasFromSource(file, 3200, 0.92);
    return dataUrlToJpegFile(jpeg, file.name);
  }
}

export async function shrinkDataUrl(dataUrl: string, max = 800, quality = 0.52): Promise<string> {
  return canvasJpeg(await loadImage(dataUrl), max, quality);
}

/** data URL 미리보기를 Storage에 넣어야 할 때, 가능하면 다시 키우지 말고 고품질만 유지 */
export async function highQualityJpegFromDataUrl(dataUrl: string, fileName: string): Promise<File> {
  // 이미 작은 미리보기면 키울 수 없음. 추가 열화만 막기 위해 재인코딩 품질을 높입니다.
  const jpeg = await shrinkDataUrl(dataUrl, 3200, 0.92);
  return dataUrlToJpegFile(jpeg, fileName);
}
