function crc32(data: Uint8Array) {
  let c = ~0 >>> 0;
  for (let i = 0; i < data.length; i += 1) {
    c ^= data[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function u16(n: number) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}

function u32(n: number) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function zipStore(files: { name: string; xml: string }[]) {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = enc.encode(file.name);
    const data = enc.encode(file.xml);
    const crc = crc32(data);
    const local = concat([
      enc.encode("PK\u0003\u0004"),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    locals.push(local);
    centrals.push(
      concat([
        enc.encode("PK\u0001\u0002"),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ])
    );
    offset += local.length;
  }
  const central = concat(centrals);
  const eocd = concat([
    enc.encode("PK\u0005\u0006"),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);
  return concat([...locals, central, eocd]);
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function colLetter(index: number) {
  return String.fromCharCode(65 + index);
}

export type RosterSheet = {
  name: string;
  headers: string[];
  widths: number[];
  rows: string[][];
  /** 본문과 같은 크기. true인 칸은 노란색 */
  warn?: boolean[][];
};

function sheetXml(sheet: RosterSheet) {
  const lastCol = colLetter(sheet.headers.length - 1);
  const footerRow = sheet.rows.length + 3;
  const cols = sheet.widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");
  const headerCells = sheet.headers
    .map(
      (h, i) =>
        `<c r="${colLetter(i)}1" t="inlineStr" s="1"><is><t>${xmlEscape(h)}</t></is></c>`
    )
    .join("");
  const body = sheet.rows
    .map((row, ri) => {
      const r = ri + 2;
      const cells = sheet.headers
        .map((_, i) => {
          const warn = sheet.warn?.[ri]?.[i];
          const style = warn ? "4" : "2";
          return `<c r="${colLetter(i)}${r}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xmlEscape(row[i] ?? "")}</t></is></c>`;
        })
        .join("");
      return `<row r="${r}" ht="18">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:${lastCol}${footerRow}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18" defaultColWidth="10"/>
  <cols>${cols}</cols>
  <sheetData>
    <row r="1" ht="20">${headerCells}</row>
    ${body}
    <row r="${footerRow}">
      <c r="A${footerRow}" t="inlineStr" s="3"><is><t>System Powered by TOURMAKER</t></is></c>
    </row>
  </sheetData>
  <mergeCells count="1">
    <mergeCell ref="A${footerRow}:${lastCol}${footerRow}"/>
  </mergeCells>
  <pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  <pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

function workbookXml(names: string[]) {
  const sheets = names
    .map(
      (name, i) =>
        `<sheet name="${xmlEscape(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets}</sheets>
</workbook>`;
}

function workbookRels(count: number) {
  const rels = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return `<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  ${rels}
</Relationships>`;
}

function contentTypes(count: number) {
  const overrides = Array.from(
    { length: count },
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${overrides}
</Types>`;
}

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="맑은 고딕"/></font>
    <font><b/><sz val="11"/><name val="맑은 고딕"/></font>
    <font><i/><sz val="9"/><color rgb="FF808080"/><name val="맑은 고딕"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFB4B4B4"/></left>
      <right style="thin"><color rgb="FFB4B4B4"/></right>
      <top style="thin"><color rgb="FFB4B4B4"/></top>
      <bottom style="thin"><color rgb="FFB4B4B4"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="5">
    <xf xfId="0"/>
    <xf fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf fontId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <xf fontId="2" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

export function buildRosterXlsx(sheets: RosterSheet[]) {
  const files = [
    { name: "[Content_Types].xml", xml: contentTypes(sheets.length) },
    { name: "_rels/.rels", xml: RELS },
    { name: "xl/workbook.xml", xml: workbookXml(sheets.map((s) => s.name)) },
    { name: "xl/_rels/workbook.xml.rels", xml: workbookRels(sheets.length) },
    { name: "xl/styles.xml", xml: STYLES },
    ...sheets.map((sheet, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      xml: sheetXml(sheet),
    })),
  ];
  return zipStore(files);
}
