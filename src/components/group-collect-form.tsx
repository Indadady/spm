"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PassportEnFields } from "@/components/passport-en-fields";
import {
  markPassportScan,
  needsPassport,
  needsRrn,
  parseRrnMeta,
  submitGroupEntry,
  type GroupCampaign,
} from "@/lib/group-collect";
import { fileToJpeg } from "@/lib/image-file";
import { ensureAnonAuth } from "@/lib/firebase";
import { passportScanReady, scanPassportImage, type PassportScan } from "@/lib/passport-scan";
import { uprightPassportFile } from "@/lib/passport-orient";
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function agreeLabel(campaign: GroupCampaign) {
  if (campaign.kind === "passport") {
    return "여행자 명단 작성을 위해 성명·연락처·여권사본 수집에 동의합니다.";
  }
  if (campaign.kind === "both") {
    return "여행자보험 가입과 여행자 명단 작성을 위해 성명·주민등록번호·여권사본 수집에 동의합니다.";
  }
  return "여행자보험 가입을 위해 성명·주민등록번호·연락처 수집에 동의합니다.";
}

function applyScan(
  hit: PassportScan | null,
  setName: (v: string) => void,
  setNo: (v: string) => void,
  setExp: (v: string) => void
) {
  if (!hit) return;
  if (hit.passportName) setName(hit.passportName);
  if (hit.passportNo) setNo(hit.passportNo);
  if (hit.passportExpiry) setExp(hit.passportExpiry);
}

export function GroupCollectForm({ campaign }: { campaign: GroupCampaign }) {
  const wantRrn = needsRrn(campaign.kind);
  const wantPass = needsPassport(campaign.kind);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rrn, setRrn] = useState("");
  const [passportImage, setPassportImage] = useState("");
  const [passportFileName, setPassportFileName] = useState("");
  const [passName, setPassName] = useState("");
  const [passNo, setPassNo] = useState("");
  const [passExp, setPassExp] = useState("");
  const [scan, setScan] = useState<PassportScan | null>(null);
  const [scanState, setScanState] = useState<"idle" | "reading" | "ok" | "partial" | "fail">("idle");
  const scanWait = useRef<Promise<PassportScan | null> | null>(null);
  const passportFile = useRef<File | null>(null);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void ensureAnonAuth().catch(() => {});
  }, []);

  if (done) {
    return (
      <p className="rounded-xl bg-accent/70 px-4 py-6 text-center text-sm font-medium">
        제출했습니다. 투어메이커로 바로 전달됩니다.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) {
          setError("성명을 넣어 주세요.");
          return;
        }
        if (!phone.trim()) {
          setError("연락처를 넣어 주세요.");
          return;
        }
        if (wantRrn && !rrn.trim()) {
          setError("주민등록번호를 넣어 주세요.");
          return;
        }
        if (wantPass && !passportImage) {
          setError("여권 사진을 넣어 주세요.");
          return;
        }
        if (wantPass && !passName.trim()) {
          setError("영문명을 넣어 주세요. 여권에 보이는 대로 적어 주시면 됩니다.");
          return;
        }
        if (wantPass && !passNo.trim()) {
          setError("여권번호를 넣어 주세요.");
          return;
        }
        if (wantPass && !passExp.trim()) {
          setError("여권만료일을 넣어 주세요.");
          return;
        }
        if (!agree) {
          setError("수집 동의에 체크해 주세요.");
          return;
        }
        const fromRrn = wantRrn ? parseRrnMeta(rrn) : null;
        setSending(true);
        setError("");
        try {
          const read = wantPass ? scan ?? (await scanWait.current) : null;
          await submitGroupEntry(
            campaign,
            {
              name: name.trim(),
              phone: phone.trim(),
              role: "guest",
              rrn: wantRrn ? rrn.trim() : undefined,
              birthDate: fromRrn?.birthIso || read?.birthDate,
              gender: fromRrn?.gender || read?.gender,
              passportName: wantPass ? passName.trim().toUpperCase() : read?.passportName,
              passportNo: wantPass ? passNo.trim().toUpperCase() : read?.passportNo,
              passportExpiry: wantPass ? passExp : read?.passportExpiry,
              nationality: read?.nationality || (wantPass ? "KOR" : undefined),
              passportImageDataUrl: wantPass ? passportImage : undefined,
              passportFileName: wantPass ? passportFileName : undefined,
              passportScan: wantPass
                ? scanState === "ok" || scanState === "partial" || scanState === "fail"
                  ? scanState
                  : markPassportScan({
                      passportName: passName,
                      passportNo: passNo,
                      passportExpiry: passExp,
                    })
                : undefined,
              privacyAgreed: true,
              submittedAt: new Date().toISOString(),
            },
            wantPass ? passportFile.current ?? undefined : undefined
          );
          setDone(true);
        } catch {
          setError("보내지 못했습니다. 연결을 확인하고 다시 제출해 주세요.");
        } finally {
          setSending(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="g-name">성명</Label>
        <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-phone">연락처</Label>
        <Input
          id="g-phone"
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      {wantRrn ? (
        <div className="space-y-1.5">
          <Label htmlFor="g-rrn">주민등록번호</Label>
          <Input
            id="g-rrn"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000000-0000000"
            value={rrn}
            onChange={(e) => setRrn(e.target.value)}
            required
          />
        </div>
      ) : null}
      {wantPass ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="g-pass">여권 사진</Label>
            <label
              htmlFor="g-pass"
              className={cn(
                "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-center",
                passportImage
                  ? "border-[color:var(--navy)] bg-white"
                  : "border-[#c4a15a] bg-[#f3eee4]"
              )}
            >
              <input
                id="g-pass"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setScan(null);
                  setPassName("");
                  setPassNo("");
                  setPassExp("");
                  setScanState("reading");
                  setError("");
                  try {
                    const upright = await uprightPassportFile(file);
                    passportFile.current = upright;
                    setPassportImage(await fileToJpeg(upright));
                    setPassportFileName(file.name);
                    const pending = scanPassportImage(upright);
                    scanWait.current = pending;
                    const hit = await pending;
                    setScan(hit);
                    applyScan(hit, setPassName, setPassNo, setPassExp);
                    if (passportScanReady(hit)) setScanState("ok");
                    else if (hit?.passportName || hit?.passportNo || hit?.passportExpiry) setScanState("partial");
                    else setScanState("fail");
                  } catch {
                    setScanState("fail");
                    setError("여권 사진을 다시 선택해 주세요.");
                  }
                }}
              />
              {passportImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={passportImage} alt="" className="max-h-36 w-full rounded-lg object-contain" />
                  <span className="text-xs font-medium text-[color:var(--navy)]">
                    다시 선택{passportFileName ? ` · ${passportFileName}` : ""}
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="size-7 text-[#c4a15a]" />
                  <span className="inline-flex h-10 items-center rounded-lg bg-[color:var(--navy)] px-4 text-sm font-semibold text-white">
                    사진 선택
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    영문 이름과 아래 영문 두 줄이 모두 보이게 찍어 주세요
                  </span>
                </>
              )}
            </label>
            {scanState === "reading" ? (
              <p className="text-xs text-muted-foreground">여권 영문을 읽는 중… 읽히면 아래 칸에 채워집니다.</p>
            ) : null}
            {scanState === "ok" ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                읽은 영문을 확인해 주세요. 틀리면 고치면 됩니다.
              </p>
            ) : null}
            {scanState === "partial" ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                일부만 읽었습니다. 빈 칸은 여권에 보이는 대로 적어 주세요.
              </p>
            ) : null}
            {scanState === "fail" && passportImage ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                사진에서 영문을 못 읽었습니다. 아래 칸에 여권 그대로 적어 주시거나, 영문 두 줄이 나오게 다시 찍어 주세요.
              </p>
            ) : null}
          </div>
          {passportImage ? (
            <PassportEnFields
              idPrefix="g-pass"
              name={passName}
              passportNo={passNo}
              expiry={passExp}
              disabled={scanState === "reading"}
              onName={setPassName}
              onNo={setPassNo}
              onExpiry={setPassExp}
            />
          ) : null}
        </div>
      ) : null}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          required
        />
        {agreeLabel(campaign)}
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={sending || scanState === "reading"}>
        {sending ? "보내는 중…" : scanState === "reading" ? "여권 읽는 중…" : "제출"}
      </Button>
    </form>
  );
}
