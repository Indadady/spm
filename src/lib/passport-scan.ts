import {
  mergePassportScan,
  parsePassportText,
  passportScanReady,
  scorePassportScan,
  type PassportScan,
} from "./passport-mrz";
import { detectPassportRotation } from "./passport-orient";

export type { PassportScan };
export {
  passportScanReady,
  passportScanUseful,
  mergePassportScan,
  scorePassportScan,
} from "./passport-mrz";

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
const MRZ_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";
const NAME_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
/** 이름+번호+만료+생년 정도면 충분 */
const READY_SCORE = 16;

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

async function blobFromInput(input: File | string) {
  if (typeof input !== "string") return input;
  if (input.startsWith("data:")) {
    const res = await fetch(input);
    return res.blob();
  }
  if (input.startsWith("blob:")) {
    const res = await fetch(input);
    return res.blob();
  }
  const res = await fetch(input);
  if (!res.ok) throw new Error("이미지를 읽지 못했습니다.");
  return res.blob();
}

async function canvasFromBlob(blob: Blob) {
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

function otsuThreshold(px: Uint8ClampedArray) {
  const hist = new Array<number>(256).fill(0);
  let total = 0;
  for (let i = 0; i < px.length; i += 4) {
    hist[px[i] ?? 0] += 1;
    total += 1;
  }
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * (hist[i] ?? 0);
  let sumB = 0;
  let wB = 0;
  let max = 0;
  let thresh = 128;
  for (let t = 0; t < 256; t += 1) {
    wB += hist[t] ?? 0;
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * (hist[t] ?? 0);
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) {
      max = between;
      thresh = t;
    }
  }
  return thresh;
}

function sharpen(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = ctx.createImageData(canvas.width, canvas.height);
  const s = src.data;
  const d = out.data;
  const w = canvas.width;
  const h = canvas.height;
  // 약한 unsharp: center*5 - neighbors
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = (y * w + x) * 4;
      for (const c of [0, 1, 2]) {
        const v =
          5 * (s[i + c] ?? 0) -
          (s[i - 4 + c] ?? 0) -
          (s[i + 4 + c] ?? 0) -
          (s[i - w * 4 + c] ?? 0) -
          (s[i + w * 4 + c] ?? 0);
        d[i + c] = Math.max(0, Math.min(255, v));
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

function grayContrast(
  canvas: HTMLCanvasElement,
  contrast: number,
  binary: boolean,
  invert: boolean,
  threshBias = 0
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] ?? 0) * 0.3 + (px[i + 1] ?? 0) * 0.59 + (px[i + 2] ?? 0) * 0.11;
    const v = Math.max(0, Math.min(255, (g - 128) * contrast + 128));
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
  if (binary) {
    const cut = Math.max(20, Math.min(235, otsuThreshold(px) + threshBias));
    for (let i = 0; i < px.length; i += 4) {
      const v = (px[i] ?? 0) >= cut ? 255 : 0;
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
    }
  }
  if (invert) {
    for (let i = 0; i < px.length; i += 4) {
      px[i] = 255 - (px[i] ?? 0);
      px[i + 1] = 255 - (px[i + 1] ?? 0);
      px[i + 2] = 255 - (px[i + 2] ?? 0);
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

function copyRegion(
  src: HTMLCanvasElement,
  opts: {
    top: number;
    height: number;
    max: number;
    contrast: number;
    binary?: boolean;
    invert?: boolean;
    insetX?: number;
    threshBias?: number;
    doSharpen?: boolean;
  }
) {
  const inset = opts.insetX ?? 0.02;
  const sx = Math.floor(src.width * inset);
  const sw = Math.max(8, Math.floor(src.width * (1 - inset * 2)));
  const sy = Math.floor(src.height * opts.top);
  const sh = Math.max(8, Math.floor(src.height * opts.height));
  const scale = Math.min(3.2, opts.max / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(sw * scale));
  canvas.height = Math.max(8, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들지 못했습니다.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  grayContrast(canvas, opts.contrast, Boolean(opts.binary), Boolean(opts.invert), opts.threshBias ?? 0);
  if (opts.doSharpen) sharpen(canvas);
  return canvas;
}

function rotateCanvas(src: HTMLCanvasElement, deg: number) {
  if (!deg) return src;
  const r = (deg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(r));
  const cos = Math.abs(Math.cos(r));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(src.width * cos + src.height * sin));
  canvas.height = Math.max(8, Math.round(src.width * sin + src.height * cos));
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(r);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return canvas;
}

function mrzBand(src: HTMLCanvasElement) {
  const sample = document.createElement("canvas");
  const scale = Math.min(1, 560 / Math.max(src.width, src.height));
  sample.width = Math.max(8, Math.round(src.width * scale));
  sample.height = Math.max(8, Math.round(src.height * scale));
  const ctx = sample.getContext("2d");
  if (!ctx) return { top: 0.62, height: 0.34 };
  ctx.drawImage(src, 0, 0, sample.width, sample.height);
  const { data } = ctx.getImageData(0, 0, sample.width, sample.height);
  const energy = new Float64Array(sample.height);
  for (let y = 0; y < sample.height; y += 1) {
    let sum = 0;
    for (let x = 1; x < sample.width; x += 1) {
      const i = (y * sample.width + x) * 4;
      const j = (y * sample.width + x - 1) * 4;
      const g1 = (data[i] ?? 0) * 0.3 + (data[i + 1] ?? 0) * 0.59 + (data[i + 2] ?? 0) * 0.11;
      const g0 = (data[j] ?? 0) * 0.3 + (data[j + 1] ?? 0) * 0.59 + (data[j + 2] ?? 0) * 0.11;
      sum += Math.abs(g1 - g0);
    }
    energy[y] = sum / sample.width;
  }
  // MRZ는 보통 하단 — 아래쪽 60%에서만 탐색
  const yMin = Math.floor(sample.height * 0.45);
  const win = Math.max(10, Math.round(sample.height * 0.11));
  let best = 0;
  let bestAt = Math.floor(sample.height * 0.72);
  let run = 0;
  for (let y = yMin; y < Math.min(sample.height, yMin + win); y += 1) run += energy[y] ?? 0;
  best = run;
  bestAt = yMin;
  for (let y = yMin + win; y < sample.height; y += 1) {
    run += (energy[y] ?? 0) - (energy[y - win] ?? 0);
    if (run > best) {
      best = run;
      bestAt = y - win + 1;
    }
  }
  const top = Math.max(0.5, bestAt / sample.height - 0.02);
  const height = Math.min(0.42, 1 - top);
  return { top, height: Math.max(0.14, height) };
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
          tessedit_char_whitelist: MRZ_CHARS,
          tessedit_pageseg_mode: "6",
          preserve_interword_spaces: "0",
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

async function readCanvas(canvas: HTMLCanvasElement, psm: string, whitelist: string) {
  const worker = await tessWorker();
  await worker.setParameters({
    tessedit_char_whitelist: whitelist,
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: whitelist.includes(" ") ? "1" : "0",
  });
  const { data } = await worker.recognize(canvas);
  return data.text ?? "";
}

type TryOpt = {
  top: number;
  height: number;
  max: number;
  contrast: number;
  binary?: boolean;
  invert?: boolean;
  psm: string;
  rotate?: number;
  names?: boolean;
  insetX?: number;
  threshBias?: number;
  doSharpen?: boolean;
};

function isStrong(scan: PassportScan | null) {
  return scorePassportScan(scan) >= READY_SCORE && passportScanReady(scan);
}

async function scanOrientedImage(img: HTMLCanvasElement): Promise<PassportScan | null> {
  const band = mrzBand(img);
  const lineH = Math.max(0.07, band.height * 0.48);
  const line1Top = band.top;
  const line2Top = Math.min(0.92, band.top + band.height * 0.48);

  const tries: TryOpt[] = [
    { top: line2Top, height: lineH + 0.02, max: 2800, contrast: 1.4, binary: true, psm: "7", doSharpen: true },
    { top: line2Top, height: lineH + 0.02, max: 2600, contrast: 1.55, binary: true, psm: "7", threshBias: -12 },
    { top: line2Top, height: lineH + 0.02, max: 2600, contrast: 1.45, binary: true, psm: "7", threshBias: 12 },
    { top: line2Top, height: lineH + 0.03, max: 2400, contrast: 1.5, psm: "7", doSharpen: true },
    { top: line2Top, height: lineH + 0.02, max: 2600, contrast: 1.4, binary: true, invert: true, psm: "7" },
    { top: line1Top, height: lineH + 0.02, max: 2800, contrast: 1.35, binary: true, psm: "7", doSharpen: true },
    { top: line1Top, height: lineH + 0.02, max: 2400, contrast: 1.5, binary: true, psm: "7" },
    { ...band, max: 2600, contrast: 1.4, binary: true, psm: "6", doSharpen: true },
    { ...band, max: 2400, contrast: 1.55, binary: true, psm: "6" },
    { top: 0.58, height: 0.4, max: 2400, contrast: 1.4, binary: true, psm: "6" },
    { top: 0.12, height: 0.5, max: 1800, contrast: 1.25, psm: "6", names: true, insetX: 0.08 },
    { top: 0.18, height: 0.45, max: 1700, contrast: 1.3, binary: true, psm: "6", names: true, insetX: 0.1 },
  ];

  let best: PassportScan | null = null;
  for (const tryOn of tries) {
    const region = copyRegion(img, tryOn);
    const canvas = rotateCanvas(region, tryOn.rotate ?? 0);
    const text = await readCanvas(canvas, tryOn.psm, tryOn.names ? NAME_CHARS : MRZ_CHARS);
    best = mergePassportScan(best, parsePassportText(text));
    if (isStrong(best)) return best;
  }
  return best;
}

export async function scanPassportImage(input: File | string): Promise<PassportScan | null> {
  try {
    const blob = await blobFromInput(input);
    const raw = await canvasFromBlob(blob);
    // 고객이 가로·세로로 찍은 사진을 모두 시도 — 방향 탐지만으로는 부족한 경우가 많음
    const detected = detectPassportRotation(raw);
    const degs: Array<0 | 90 | 180 | 270> = [detected, 0, 90, 180, 270].filter(
      (d, i, arr) => arr.indexOf(d) === i
    ) as Array<0 | 90 | 180 | 270>;

    let best: PassportScan | null = null;
    let bestScore = 0;
    for (const deg of degs) {
      const img = deg ? rotateCanvas(raw, deg) : raw;
      const hit = await scanOrientedImage(img);
      const score = scorePassportScan(hit);
      if (score > bestScore) {
        best = hit;
        bestScore = score;
      }
      if (isStrong(hit)) return hit;
    }
    return best;
  } catch {
    workerPromise = null;
    return null;
  }
}
