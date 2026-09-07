import { parsePassportMrz, type PassportScan } from "./passport-mrz";

export type { PassportScan };

type TessWorker = {
  setParameters: (p: Record<string, string>) => Promise<void>;
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
};

type TessLib = {
  createWorker: (
    lang: string,
    oem: number,
    opts: { workerPath: string; corePath: string; langPath: string }
  ) => Promise<TessWorker>;
};

const TESS_VER = "5.1.1";
const SCRIPT_SRC = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESS_VER}/dist/tesseract.min.js`;
const WORKER_PATH = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESS_VER}/dist/worker.min.js`;
const LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0";

let workerPromise: Promise<TessWorker> | null = null;

function tessFromWindow() {
  return (window as unknown as { Tesseract?: TessLib }).Tesseract;
}

function loadTessScript() {
  const existing = tessFromWindow();
  if (existing) return Promise.resolve(existing);
  return new Promise<TessLib>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      const lib = tessFromWindow();
      if (!lib) reject(new Error("인식기를 부르지 못했습니다."));
      else resolve(lib);
    };
    script.onerror = () => reject(new Error("인식기를 부르지 못했습니다."));
    document.head.appendChild(script);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    const timer = window.setTimeout(() => reject(new Error("이미지를 읽지 못했습니다.")), 12_000);
    el.onload = () => {
      window.clearTimeout(timer);
      resolve(el);
    };
    el.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    if (!src.startsWith("blob:") && !src.startsWith("data:")) el.crossOrigin = "anonymous";
    el.src = src;
  });
}

async function srcFromInput(input: File | string) {
  if (typeof input !== "string") return URL.createObjectURL(input);
  if (input.startsWith("data:") || input.startsWith("blob:")) return input;
  try {
    const res = await fetch(input);
    if (!res.ok) return input;
    return URL.createObjectURL(await res.blob());
  } catch {
    return input;
  }
}

function drawRegion(
  img: HTMLImageElement,
  opts: { top: number; height: number; max: number; contrast: number }
) {
  const sy = Math.floor(img.height * opts.top);
  const sh = Math.max(8, Math.floor(img.height * opts.height));
  const scale = Math.min(2.4, opts.max / Math.max(img.width, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(img.width * scale));
  canvas.height = Math.max(8, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들지 못했습니다.");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const c = opts.contrast;
  for (let i = 0; i < px.length; i += 4) {
    const g = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
    const v = Math.max(0, Math.min(255, (g - 128) * c + 128));
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

async function tessWorker() {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    const lib = await loadTessScript();
    const cores = [
      `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESS_VER}/tesseract-core-simd.wasm.js`,
      `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESS_VER}/tesseract-core.wasm.js`,
    ];
    let last: Error | null = null;
    for (const corePath of cores) {
      try {
        const worker = await lib.createWorker("eng", 1, {
          workerPath: WORKER_PATH,
          corePath,
          langPath: LANG_PATH,
        });
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
          tessedit_pageseg_mode: "6",
        });
        return worker;
      } catch (err) {
        last = err instanceof Error ? err : new Error("인식기를 부르지 못했습니다.");
      }
    }
    throw last ?? new Error("인식기를 부르지 못했습니다.");
  })();
  return workerPromise;
}

async function readCanvas(canvas: HTMLCanvasElement) {
  const worker = await tessWorker();
  const { data } = await worker.recognize(canvas);
  return data.text ?? "";
}

export async function scanPassportImage(input: File | string): Promise<PassportScan | null> {
  const src = await srcFromInput(input);
  const revoke = src.startsWith("blob:") && (typeof input !== "string" || !input.startsWith("blob:"));
  try {
    const img = await loadImage(src);
    const crops = [
      { top: 0.58, height: 0.42, max: 1800, contrast: 1.45 },
      { top: 0.62, height: 0.38, max: 2000, contrast: 1.7 },
      { top: 0.5, height: 0.5, max: 1600, contrast: 1.35 },
      { top: 0, height: 1, max: 1400, contrast: 1.2 },
    ];
    for (const crop of crops) {
      const hit = parsePassportMrz(await readCanvas(drawRegion(img, crop)));
      if (hit) return hit;
    }
    const first = crops[0];
    if (!first) return null;
    const worker = await tessWorker();
    await worker.setParameters({ tessedit_pageseg_mode: "7" });
    const retry = parsePassportMrz(await readCanvas(drawRegion(img, first)));
    await worker.setParameters({ tessedit_pageseg_mode: "6" });
    return retry;
  } catch {
    workerPromise = null;
    return null;
  } finally {
    if (revoke) URL.revokeObjectURL(src);
  }
}
