"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  needsPassport,
  needsRrn,
  parseRrnMeta,
  submitGroupEntry,
  type GroupCampaign,
} from "@/lib/group-collect";
import { fileToJpeg } from "@/lib/image-file";
import { ensureAnonAuth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";

function agreeLabel(campaign: GroupCampaign) {
  if (campaign.kind === "passport") {
    return "여행자 명단 작성을 위해 성명·연락처·여권사본 수집에 동의합니다.";
  }
  if (campaign.kind === "both") {
    return "여행자보험 가입과 여행자 명단 작성을 위해 성명·주민등록번호·여권사본 수집에 동의합니다.";
  }
  return "여행자보험 가입을 위해 성명·주민등록번호·연락처 수집에 동의합니다.";
}

export function GroupCollectForm({ campaign }: { campaign: GroupCampaign }) {
  const wantRrn = needsRrn(campaign.kind);
  const wantPass = needsPassport(campaign.kind);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rrn, setRrn] = useState("");
  const [passportImage, setPassportImage] = useState("");
  const [passportFileName, setPassportFileName] = useState("");
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
        if (!agree) {
          setError("수집 동의에 체크해 주세요.");
          return;
        }
        const fromRrn = wantRrn ? parseRrnMeta(rrn) : null;
        setSending(true);
        setError("");
        try {
          await submitGroupEntry(campaign, {
            name: name.trim(),
            phone: phone.trim(),
            role: "guest",
            rrn: wantRrn ? rrn.trim() : undefined,
            birthDate: fromRrn?.birthIso,
            gender: fromRrn?.gender,
            nationality: wantPass ? "KOR" : undefined,
            passportImageDataUrl: wantPass ? passportImage : undefined,
            passportFileName: wantPass ? passportFileName : undefined,
            privacyAgreed: true,
            submittedAt: new Date().toISOString(),
          });
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
                try {
                  setPassportImage(await fileToJpeg(file));
                  setPassportFileName(file.name);
                  setError("");
                } catch {
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
                  여권 정보면이 잘 보이게 찍어 주세요
                </span>
              </>
            )}
          </label>
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
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "보내는 중…" : "제출"}
      </Button>
    </form>
  );
}
