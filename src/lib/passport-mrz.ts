export type PassportScan = {
  passportName: string;
  passportNo: string;
  passportExpiry: string;
  birthDate: string;
  gender: "M" | "F" | "";
  nationality: string;
};

const WEIGHTS = [7, 3, 1];

const NAME_NOISE = new Set([
  "REPUBLIC",
  "KOREA",
  "PASSPORT",
  "TYPE",
  "CODE",
  "NATIONALITY",
  "DATE",
  "BIRTH",
  "SEX",
  "PLACE",
  "AUTHORITY",
  "EXPIRY",
  "ISSUE",
  "ISSUED",
  "PERSONAL",
  "NUMBER",
  "GIVEN",
  "NAMES",
  "SURNAME",
  "NAME",
  "OF",
  "THE",
  "AND",
  "SEE",
  "PAGE",
  "HOLDER",
  "COUNTRY",
  "KOR",
  "KOREAN",
  "MALE",
  "FEMALE",
  "DIPLOMATIC",
  "OFFICIAL",
]);

const SURNAMES = new Set([
  "KIM",
  "LEE",
  "PARK",
  "CHOI",
  "JUNG",
  "JEONG",
  "KANG",
  "CHO",
  "JO",
  "YOON",
  "YUN",
  "JANG",
  "LIM",
  "IM",
  "HAN",
  "OH",
  "SEO",
  "SHIN",
  "KWON",
  "HWANG",
  "AHN",
  "AN",
  "SONG",
  "HONG",
  "RYU",
  "YOO",
  "YU",
  "KO",
  "GO",
  "MOON",
  "MUN",
  "BAE",
  "BAEK",
  "NAM",
  "SIM",
  "SHIM",
  "WON",
  "KWAK",
  "HUH",
  "HEO",
  "YANG",
  "CHUN",
  "JEON",
  "CHUNG",
  "NOH",
  "ROH",
  "HA",
  "BYUN",
  "BYEON",
  "YOUN",
  "JUN",
  "SUH",
  "SEONG",
  "SUNG",
  "RHEE",
  "YI",
  "PAK",
  "PACK",
  "SON",
  "CHA",
  "JOO",
  "JU",
  "HAHN",
  "SOHN",
]);

const DIGIT_FROM: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  S: "5",
  B: "8",
  Z: "2",
  G: "6",
};

const LETTER_FROM: Record<string, string> = {
  "0": "O",
  "1": "I",
  "5": "S",
  "8": "B",
  "2": "Z",
  "6": "G",
};

const CONFUSE: Record<string, string[]> = {
  "0": ["O", "Q", "D"],
  O: ["0", "Q", "D"],
  Q: ["0", "O"],
  D: ["0", "O"],
  "1": ["I", "L"],
  I: ["1", "L"],
  L: ["1", "I"],
  "5": ["S"],
  S: ["5"],
  "8": ["B"],
  B: ["8"],
  "2": ["Z"],
  Z: ["2"],
  "6": ["G"],
  G: ["6"],
};

export function emptyPassportScan(): PassportScan {
  return {
    passportName: "",
    passportNo: "",
    passportExpiry: "",
    birthDate: "",
    gender: "",
    nationality: "",
  };
}

export function passportScanReady(scan: PassportScan | null | undefined) {
  return Boolean(scan?.passportName && scan?.passportNo && scan?.passportExpiry);
}

export function passportScanUseful(scan: PassportScan | null | undefined) {
  return Boolean(scan?.passportName || scan?.passportNo || scan?.passportExpiry);
}

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

function lettersOnlyName(raw: string) {
  return raw
    .replace(/</g, " ")
    .replace(/[^A-Z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** OCR가 MRZ 필러 `<`를 L/C 연속으로 읽은 꼬리를 자른다. */
function stripMrzFillerTail(token: string) {
  let s = token.replace(/[^A-Z]/g, "");
  if (!s) return "";
  const filler = s.search(/C?L{3,}|L{3,}|C{3,}|(.)\1{2,}/);
  if (filler >= 2) s = s.slice(0, filler);
  if (s.length > 14) s = s.slice(0, 14);
  return s;
}

function sanitizePassportName(raw: string) {
  const n = lettersOnlyName(raw);
  if (!n) return "";
  const parts = n
    .split(" ")
    .map(stripMrzFillerTail)
    .filter((p) => p.length >= 2 && !NAME_NOISE.has(p));
  if (!parts.length) return "";
  const surnameAt = parts.findIndex((p) => SURNAMES.has(p));
  if (surnameAt >= 0) {
    const surname = parts[surnameAt] ?? "";
    const given = parts.slice(surnameAt + 1).filter((p) => p !== surname && !SURNAMES.has(p));
    return [surname, ...given.slice(0, 3)].join(" ").trim();
  }
  return parts.slice(0, 4).join(" ").trim();
}

function nameLooksGood(name: string) {
  const n = sanitizePassportName(name);
  if (n.length < 3 || n.length > 36) return false;
  if (/(.)\1{2,}/.test(n.replace(/\s/g, ""))) return false;
  const parts = n.split(" ");
  if (parts.some((p) => p.length > 14)) return false;
  if (parts.some((p) => p.length === 1 && p !== "A")) return parts.length >= 2 && n.length >= 6;
  return /[A-Z]{2,}/.test(n);
}

function nameScore(name: string) {
  const n = sanitizePassportName(name);
  if (!n) return 0;
  let score = Math.min(n.length, 18);
  const parts = n.split(" ");
  if (parts.length >= 2) score += 8;
  if (SURNAMES.has(parts[0] ?? "")) score += 10;
  if (/[0-9]/.test(name)) score -= 6;
  if (/(.)\1{2,}/.test(n.replace(/\s/g, ""))) score -= 20;
  if (parts.some((p) => p.length > 12)) score -= 10;
  // 짧은·깔끔한 이름이 필러 붙은 긴 이름보다 유리하게
  score += Math.max(0, 12 - Math.abs(n.length - 10));
  if (NAME_NOISE.has(n)) return 0;
  return score;
}

function betterName(a: string, b: string) {
  const left = sanitizePassportName(a);
  const right = sanitizePassportName(b);
  return nameScore(right) > nameScore(left) ? right : left;
}

function betterNo(a: string, b: string) {
  const na = a.replace(/[^A-Z0-9]/g, "");
  const nb = b.replace(/[^A-Z0-9]/g, "");
  const score = (n: string) => {
    if (!n) return 0;
    if (/^[A-Z]{2}\d{7}$/.test(n)) return 4;
    if (/^[A-Z]\d{8}$/.test(n)) return 3;
    if (/^[A-Z][A-Z0-9]{7,8}$/.test(n)) return 2;
    return 1;
  };
  return score(nb) > score(na) ? nb : na;
}

export function mergePassportScan(
  a: PassportScan | null | undefined,
  b: PassportScan | null | undefined
): PassportScan | null {
  if (!passportScanUseful(a)) return passportScanUseful(b) ? { ...(b as PassportScan) } : null;
  if (!passportScanUseful(b)) return { ...(a as PassportScan) };
  const left = a as PassportScan;
  const right = b as PassportScan;
  return {
    passportName: betterName(left.passportName, right.passportName),
    passportNo: betterNo(left.passportNo, right.passportNo),
    passportExpiry: left.passportExpiry || right.passportExpiry,
    birthDate: left.birthDate || right.birthDate,
    gender: left.gender || right.gender,
    nationality: left.nationality || right.nationality || "KOR",
  };
}

function displayName(line1: string) {
  const names = line1.slice(5).replace(/<+$/g, "");
  if (!names.includes("<<")) {
    return sanitizePassportName(names);
  }
  const [surname = "", given = ""] = names.split("<<");
  // `<` 앞의 알파벳만 이름. 필러·꼬리 잡음(RK 등) 제거
  const sur = surname.match(/^[A-Z]+/)?.[0] ?? stripMrzFillerTail(surname.replace(/</g, ""));
  const giv = given.match(/^[A-Z]+/)?.[0] ?? stripMrzFillerTail(given.replace(/</g, ""));
  return sanitizePassportName(`${sur} ${giv}`);
}

function recoverPKOR(raw: string) {
  return raw
    .replace(/P[C<({\[]KOR/g, "P<KOR")
    .replace(/P[C<({\[]K0R/g, "P<KOR")
    .replace(/P[C<({\[]KQR/g, "P<KOR")
    .replace(/PKOR/g, "P<KOR")
    .replace(/5<KOR/g, "P<KOR")
    .replace(/P<K0R/g, "P<KOR")
    .replace(/P<KQR/g, "P<KOR");
}

function cleanLine(raw: string) {
  return recoverPKOR(
    raw
      .toUpperCase()
      .replace(/[\u00AB\u2039\u3008\uFF1C]/g, "<")
      .replace(/[(\[{]/g, "<")
      .replace(/[^A-Z0-9<\n]/g, "")
      // MRZ 필러 `<`를 L/C 연속으로 읽은 경우
      .replace(/L{3,}/g, (m) => "<".repeat(m.length))
      .replace(/C{2,}/g, (m) => "<".repeat(m.length))
      .replace(/C</g, "<<")
  );
}

function pad44(line: string) {
  const s = line.slice(0, 44);
  return s.length >= 28 ? s.padEnd(44, "<") : "";
}

function repairByCheck(field: string, check: string) {
  if (mrzCheckDigit(field) === check) return field;
  const chars = [...field];
  for (let i = 0; i < chars.length; i += 1) {
    const cur = chars[i] ?? "";
    const alts = CONFUSE[cur];
    if (!alts) continue;
    for (const alt of alts) {
      chars[i] = alt;
      const next = chars.join("");
      if (mrzCheckDigit(next) === check) return next;
    }
    chars[i] = cur;
  }
  return field;
}

function asDigits(raw: string) {
  return [...raw]
    .map((ch) => DIGIT_FROM[ch] ?? ch)
    .join("")
    .replace(/[^\d<]/g, (ch) => (ch >= "0" && ch <= "9" ? ch : "<"));
}

function asLetters(raw: string) {
  return [...raw].map((ch) => LETTER_FROM[ch] ?? ch).join("");
}

function fixNationality(raw: string) {
  const s = asLetters(raw).replace(/0/g, "O").replace(/Q/g, "O");
  if (s === "KOR" || s === "K0R") return "KOR";
  if (/^K[O0Q]R$/.test(s)) return "KOR";
  return /^[A-Z]{3}$/.test(s) ? s : "KOR";
}

function fixDocNumber(raw: string, check: string) {
  const base = raw.padEnd(9, "<").slice(0, 9);
  const variants = new Set<string>([base]);
  const firstLetter = `${asLetters(base[0] ?? "M")}${asDigits(base.slice(1))}`;
  variants.add(firstLetter);
  const twoLetters = `${asLetters(base.slice(0, 2))}${asDigits(base.slice(2))}`;
  variants.add(twoLetters);
  variants.add(asDigits(base));
  let best = base;
  for (const v of variants) {
    const fixed = repairByCheck(v, check);
    if (mrzCheckDigit(fixed) === check) return fixed;
    best = fixed;
  }
  return best;
}

function fixLine2(line: string) {
  const chars = [...pad44(line)];
  if (chars.length !== 44) return "";
  const joined = chars.join("");
  const checkNo = DIGIT_FROM[joined[9] ?? ""] ?? joined[9] ?? "";
  const checkBirth = DIGIT_FROM[joined[19] ?? ""] ?? joined[19] ?? "";
  const checkExp = DIGIT_FROM[joined[27] ?? ""] ?? joined[27] ?? "";
  const no = fixDocNumber(joined.slice(0, 9), checkNo);
  const nat = fixNationality(joined.slice(10, 13));
  const birth = repairByCheck(asDigits(joined.slice(13, 19)), checkBirth);
  let sex = joined[20] ?? "<";
  if (sex === "N" || sex === "H") sex = "M";
  if (sex === "E" || sex === "P") sex = "F";
  if (sex !== "M" && sex !== "F" && sex !== "<") {
    sex = sex === "W" ? "F" : "M";
  }
  const exp = repairByCheck(asDigits(joined.slice(21, 27)), checkExp);
  const rest = joined.slice(28);
  return `${no}${checkNo}${nat}${birth}${checkBirth}${sex}${exp}${checkExp}${rest}`.slice(0, 44).padEnd(44, "<");
}

function scoreLine2(line: string) {
  if (line.length !== 44) return -1;
  let score = 0;
  const no = line.slice(0, 9);
  const nat = line.slice(10, 13);
  const birth = line.slice(13, 19);
  const sex = line[20];
  const exp = line.slice(21, 27);
  if (mrzCheckDigit(no) === line[9]) score += 4;
  if (nat === "KOR") score += 2;
  else if (/^[A-Z]{3}$/.test(nat)) score += 1;
  if (mrzCheckDigit(birth) === line[19] && yymmddToIso(birth)) score += 3;
  if (sex === "M" || sex === "F") score += 1;
  if (mrzCheckDigit(exp) === line[27] && expiryToIso(exp)) score += 4;
  if (/^[A-Z]{2}\d{7}/.test(no) || /^[A-Z]\d{8}/.test(no)) score += 2;
  return score;
}

function scanFromLine2(l2: string, name = ""): PassportScan | null {
  const passportNo = l2.slice(0, 9).replace(/</g, "");
  const expiry = expiryToIso(l2.slice(21, 27));
  const birth = yymmddToIso(l2.slice(13, 19));
  const sex = l2[20];
  const nationality = fixNationality(l2.slice(10, 13));
  if (!passportNo && !expiry && !name) return null;
  return {
    passportName: name,
    passportNo,
    passportExpiry: expiry,
    birthDate: birth,
    gender: sex === "M" || sex === "F" ? sex : "",
    nationality,
  };
}

function parsePair(line1: string, line2raw: string): { scan: PassportScan; score: number } | null {
  const recovered = recoverPKOR(line1);
  const start = recovered.search(/P</);
  const sliced = start >= 0 ? recovered.slice(start) : recovered;
  const l1 = pad44(asLetters(sliced.replace(/<(?![A-Z0-9<])/g, "<")));
  const l2 = fixLine2(line2raw);
  const name = l1 ? displayName(l1) : "";
  const line2Score = l2 ? scoreLine2(l2) : -1;
  if (line2Score >= 4 && l2) {
    const scan = scanFromLine2(l2, nameLooksGood(name) ? name : "");
    if (!scan) return null;
    return { score: line2Score + (nameLooksGood(name) ? 2 : 0), scan };
  }
  if (nameLooksGood(name) && (l1.startsWith("P<") || l1.startsWith("P"))) {
    return {
      score: 2,
      scan: {
        ...emptyPassportScan(),
        passportName: name,
        nationality: "KOR",
      },
    };
  }
  return null;
}

function lineCandidates(text: string) {
  const cleaned = cleanLine(text);
  const rows = cleaned
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);
  const blob = rows.join("");
  const lines: string[] = [];
  for (const row of rows) {
    if (row.length >= 24) lines.push(row);
  }
  for (let i = 0; i + 44 <= blob.length; i += 1) {
    if (blob[i] === "P") lines.push(blob.slice(i, i + 44), blob.slice(i + 44, i + 88));
  }
  const p = blob.search(/P</);
  if (p >= 0) {
    lines.push(blob.slice(p, p + 44), blob.slice(p + 44, p + 88));
  }
  for (let i = 0; i + 44 <= blob.length; i += 1) {
    const nat = blob.slice(i + 10, i + 13);
    if (nat === "KOR" || nat === "K0R" || nat === "KQR") {
      lines.push(blob.slice(i, i + 44));
    }
  }
  return lines;
}

export function parseVisualEnglishName(text: string) {
  const upper = text.toUpperCase().replace(/[^A-Z\n /]+/g, " ");
  const lines = upper
    .split(/\n+/)
    .map((row) => row.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const tokens: string[] = [];
  for (const line of lines) {
    if (line.includes("<") || /P<KOR/.test(line)) continue;
    for (const token of line.split(/[ /]+/)) {
      const cleaned = stripMrzFillerTail(token);
      if (!cleaned || NAME_NOISE.has(cleaned) || cleaned.length < 2 || cleaned.length > 14) continue;
      if (!/^[A-Z]+$/.test(cleaned)) continue;
      if (/(.)\1{2,}/.test(cleaned)) continue;
      tokens.push(cleaned);
    }
  }
  if (!tokens.length) return "";
  const surnameAt = tokens.findIndex((t) => SURNAMES.has(t));
  if (surnameAt >= 0) {
    const given = tokens.slice(surnameAt + 1, surnameAt + 4).filter((t) => !SURNAMES.has(t) || t === tokens[surnameAt]);
    const name = sanitizePassportName(
      [tokens[surnameAt], ...given.filter((t) => t !== tokens[surnameAt])].join(" ")
    );
    if (nameScore(name) >= 12) return name;
  }
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const pair = sanitizePassportName(
      `${tokens[i]} ${tokens[i + 1]}${tokens[i + 2] ? ` ${tokens[i + 2]}` : ""}`
    );
    if (nameScore(pair) >= 16) return pair;
  }
  return "";
}

export function parsePassportMrz(text: string): PassportScan | null {
  const lines = lineCandidates(text);
  const hits: Array<{ scan: PassportScan; score: number }> = [];
  const take = (hit: { scan: PassportScan; score: number } | null) => {
    if (hit) hits.push(hit);
  };
  for (let i = 0; i < lines.length; i += 1) {
    const a = lines[i] ?? "";
    const b = lines[i + 1] ?? "";
    const fromP = a.includes("P") ? a.slice(Math.max(0, a.search(/P/))) : a;
    take(parsePair(fromP, b));
    if (a.length >= 40) take(parsePair(fromP, a));
    const l2 = fixLine2(a);
    if (l2 && scoreLine2(l2) >= 6) {
      const scan = scanFromLine2(l2);
      if (scan) take({ score: scoreLine2(l2), scan });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  const best = hits[0]?.scan ?? null;
  const visual = parseVisualEnglishName(text);
  if (!visual) return best;
  if (!best) return { ...emptyPassportScan(), passportName: visual, nationality: "KOR" };
  return { ...best, passportName: betterName(best.passportName, visual) };
}

export function parsePassportText(text: string): PassportScan | null {
  return parsePassportMrz(text);
}
