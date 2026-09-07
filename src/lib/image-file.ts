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
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    el.src = src;
  });
}

export async function fileToJpeg(file: File, max = 1100, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    return await canvasJpeg(await loadImage(url), max, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function shrinkDataUrl(dataUrl: string, max = 800, quality = 0.52): Promise<string> {
  return canvasJpeg(await loadImage(dataUrl), max, quality);
}
