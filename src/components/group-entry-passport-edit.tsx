"use client";

import { PassportEnFields } from "@/components/passport-en-fields";
import { Button } from "@/components/ui/button";
import { markPassportScan, passportReadUnsure, patchGroupEntry, type GroupEntry } from "@/lib/group-collect";
import { mergePassportScan, scanPassportImage } from "@/lib/passport-scan";
import { useEffect, useState } from "react";

function toDateInput(raw?: string) {
  const m = (raw ?? "").replaceAll(".", "-").replaceAll("/", "-").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
}

export function GroupEntryPassportEdit({
  campaignId,
  row,
}: {
  campaignId: string;
  row: GroupEntry;
}) {
  const [passName, setPassName] = useState(row.passportName ?? "");
  const [passNo, setPassNo] = useState(row.passportNo ?? "");
  const [passExp, setPassExp] = useState(toDateInput(row.passportExpiry));
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    setPassName(row.passportName ?? "");
    setPassNo(row.passportNo ?? "");
    setPassExp(toDateInput(row.passportExpiry));
  }, [row.passportName, row.passportNo, row.passportExpiry]);

  const dirty =
    passName.trim() !== (row.passportName ?? "") ||
    passNo.trim() !== (row.passportNo ?? "") ||
    passExp.trim() !== toDateInput(row.passportExpiry);
  const src = row.passportImageUrl || row.passportImageDataUrl;

  async function save(
    next = { name: passName, no: passNo, exp: passExp },
    scanMark: "manual" | "ok" | "partial" | "fail" = "manual"
  ) {
    if (!row.remoteId) return;
    setSaving(true);
    setHint("");
    try {
      await patchGroupEntry(campaignId, row.remoteId, {
        passportName: next.name.trim().toUpperCase(),
        passportNo: next.no.trim().toUpperCase(),
        passportExpiry: next.exp,
        passportScan: scanMark,
      });
      setHint("저장했습니다.");
    } catch {
      setHint("저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  const unsure = passportReadUnsure({ ...row, passportName: passName, passportNo: passNo, passportExpiry: passExp });

  return (
    <div className={unsure ? "mt-3 space-y-2 rounded-xl bg-[#fff4a3] px-3 py-3" : "mt-3 space-y-2 rounded-xl bg-muted/60 px-3 py-3"}>
      <PassportEnFields
        idPrefix={`row-${row.remoteId ?? row.name}`}
        name={passName}
        passportNo={passNo}
        expiry={passExp}
        disabled={saving || reading}
        onName={setPassName}
        onNo={setPassNo}
        onExpiry={setPassExp}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || saving || reading || !row.remoteId}
          onClick={() => void save()}
        >
          {saving ? "저장 중…" : "영문 저장"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!src || saving || reading}
          onClick={async () => {
            if (!src) return;
            setReading(true);
            setHint("");
            try {
              const hit = await scanPassportImage(src);
              if (!hit) {
                setHint("사진에서 영문을 못 읽었습니다. 보이는 대로 적어 주세요.");
                return;
              }
              const merged = mergePassportScan(
                {
                  passportName: passName,
                  passportNo: passNo,
                  passportExpiry: passExp,
                  birthDate: row.birthDate ?? "",
                  gender: row.gender ?? "",
                  nationality: row.nationality ?? "KOR",
                },
                hit
              );
              if (!merged) {
                setHint("사진에서 영문을 못 읽었습니다. 보이는 대로 적어 주세요.");
                return;
              }
              setPassName(merged.passportName);
              setPassNo(merged.passportNo);
              setPassExp(merged.passportExpiry);
              await save(
                {
                  name: merged.passportName,
                  no: merged.passportNo,
                  exp: merged.passportExpiry,
                },
                markPassportScan(merged)
              );
              if (!merged.passportName || !merged.passportNo || !merged.passportExpiry) {
                setHint("일부만 읽었습니다. 빈 칸을 채운 뒤 저장해 주세요.");
              }
            } catch {
              setHint("다시 읽지 못했습니다.");
            } finally {
              setReading(false);
            }
          }}
        >
          {reading ? "다시 읽는 중…" : "사진에서 다시 읽기"}
        </Button>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
