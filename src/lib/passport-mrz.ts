export type PassportScan = {
  passportName: string;
  passportNo: string;
  passportExpiry: string;
  birthDate: string;
  gender: "M" | "F" | "";
  nationality: string;
};

const WEIGHTS = [7, 3, 1];

function charVal(ch: string) {
  if (ch === "<") return 0;
  if (ch >= "0" && ch <= "9") return Number(ch);
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55;
  return -1;
}

export function mrzCheckDigit(value: string) {
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) {
    const n = charVal(value[i] ?? "<");
    if (n < 0) return "";
    sum += n * WEIGHTS[i % 3];
  }
  return String(sum % 10);
}

function yymmddToIso(raw: string) {
  if (!/^\d{6}$/.test(raw)) return "";
  const yy = Number(raw.slice(0, 2));
  const mm = Number(raw.slice(2, 4));
  const dd = Number(raw.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const century = yy >= 40 ? 1900 : 2000;
  return `${century + yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function expiryToIso(raw: string) {
  if (!/^\d{6}$/.test(raw)) return "";
  const yy = Number(raw.slice(0, 2));
  const mm = Number(raw.slice(2, 4));
  const dd = Number(raw.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  return `20${String(yy).padStart(2, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function displayName(line1: string) {
  const names = line1.slice(5).replace(/<+$/g, "");
  if (!names.includes("<<")) {
    return names.replace(/</g, " ").replace(/\s+/g, " ").trim();
  }
  const [surname = "", given = ""] = names.split("<<");
  return `${surname.replace(/</g, " ")} ${given.replace(/</g, " ")}`
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLine(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[\u00AB\u2039\u3008\uFF1C]/g, "<")
    .replace(/[^A-Z0-9<\n]/g, "")
    .replace(/C{2,}/g, (m) => (m.length >= 3 ? "<".repeat(m.length) : m));
}

function pad44(line: string) {
  const s = line.slice(0, 44);
  return s.length >= 30 ? s.padEnd(44, "<") : "";
}

function fixLine2(line: string) {
  const chars = [...pad44(line)];
  if (chars.length !== 44) return "";
  const digitish = (i: number) => {
    const ch = chars[i] ?? "";
    if (ch === "O" || ch === "Q" || ch === "D") chars[i] = "0";
    else if (ch === "I" || ch === "L") chars[i] = "1";
    else if (ch === "S") chars[i] = "5";
    else if (ch === "B") chars[i] = "8";
    else if (ch === "Z") chars[i] = "2";
    else if (ch === "G") chars[i] = "6";
  };
  const letterish = (i: number) => {
    const ch = chars[i] ?? "";
    if (ch === "0") chars[i] = "O";
    else if (ch === "1") chars[i] = "I";
    else if (ch === "5") chars[i] = "S";
    else if (ch === "8") chars[i] = "B";
  };
  for (let i = 0; i < 9; i += 1) digitish(i);
  letterish(0);
  for (let i = 10; i < 13; i += 1) letterish(i);
  for (let i = 13; i < 20; i += 1) digitish(i);
  if (chars[20] === "N") chars[20] = "M";
  if (chars[20] === "E") chars[20] = "F";
  for (let i = 21; i < 28; i += 1) digitish(i);
  return chars.join("");
}

function scoreLine2(line: string) {
  if (line.length !== 44) return -1;
  let score = 0;
  const no = line.slice(0, 9);
  const nat = line.slice(10, 13);
  const birth = line.slice(13, 19);
  const sex = line[20];
  const exp = line.slice(21, 27);
  if (mrzCheckDigit(no) === line[9]) score += 3;
  if (/^[A-Z]{3}$/.test(nat)) score += 1;
  if (mrzCheckDigit(birth) === line[19]) score += 2;
  if (sex === "M" || sex === "F") score += 1;
  if (mrzCheckDigit(exp) === line[27]) score += 3;
  if (/^[A-Z][A-Z0-9]{8}$/.test(no)) score += 1;
  return score;
}

function parsePair(line1: string, line2raw: string): { scan: PassportScan; score: number } | null {
  const start = line1.indexOf("P");
  const l1 = pad44(start >= 0 ? line1.slice(start) : line1);
  const l2 = fixLine2(line2raw);
  if (!l1.startsWith("P") || !l2) return null;
  const score = scoreLine2(l2);
  if (score < 4) return null;
  const name = displayName(l1);
  const passportNo = l2.slice(0, 9).replace(/</g, "");
  const expiry = expiryToIso(l2.slice(21, 27));
  const birth = yymmddToIso(l2.slice(13, 19));
  const sex = l2[20];
  const nationality = l2.slice(10, 13);
  if (!name || !passportNo || !expiry) return null;
  return {
    score,
    scan: {
      passportName: name,
      passportNo,
      passportExpiry: expiry,
      birthDate: birth,
      gender: sex === "M" || sex === "F" ? sex : "",
      nationality: /^[A-Z]{3}$/.test(nationality) ? nationality : "KOR",
    },
  };
}

function lineCandidates(text: string) {
  const cleaned = cleanLine(text);
  const rows = cleaned
    .split(/\n+/)
    .map((row) => row.replace(/</g, "<"))
    .map((row) => row.trim())
    .filter(Boolean);
  const blob = rows.join("");
  const lines: string[] = [];
  for (const row of rows) {
    if (row.length >= 28) lines.push(row);
  }
  for (let i = 0; i + 88 <= blob.length; i += 1) {
    if (blob[i] === "P") lines.push(blob.slice(i, i + 44), blob.slice(i + 44, i + 88));
  }
  const p = blob.indexOf("P<");
  if (p >= 0) {
    lines.push(blob.slice(p, p + 44), blob.slice(p + 44, p + 88));
  }
  return lines;
}

export function parsePassportMrz(text: string): PassportScan | null {
  const lines = lineCandidates(text);
  let best: { scan: PassportScan; score: number } | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const a = lines[i] ?? "";
    const b = lines[i + 1] ?? "";
    const fromP = a.includes("P") ? a.slice(a.indexOf("P")) : a;
    const hit = parsePair(fromP, b) ?? (a.length >= 40 ? parsePair(fromP, a) : null);
    if (hit && (!best || hit.score > best.score)) best = hit;
  }
  return best?.scan ?? null;
}
