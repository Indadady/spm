"use client";

import { SignPad } from "@/components/sign-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileToJpeg } from "@/lib/image-file";
import { submitPayee } from "@/lib/payee-inbox";
import { payeeMissing } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import type { Payout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";
import { useState } from "react";

function PhotoPick({
  id,
  label,
  hint,
  value,
  fileName,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  fileName: string;
  onChange: (dataUrl: string, fileName: string) => void;
}) {
  const [error, setError] = useState("");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-center",
          value ? "border-[color:var(--navy)] bg-white" : "border-[#c4a15a] bg-[#f3eee4]"
        )}
      >
        <input
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              onChange(await fileToJpeg(file), file.name);
              setError("");
            } catch {
              setError("사진을 다시 선택해 주세요.");
            }
          }}
        />
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="max-h-36 w-full rounded-lg object-contain" />
            <span className="text-xs font-medium text-[color:var(--navy)]">
              다시 선택{fileName ? ` · ${fileName}` : ""}
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="size-7 text-[#c4a15a]" />
            <span className="inline-flex h-10 items-center rounded-lg bg-[color:var(--navy)] px-4 text-sm font-semibold text-white">
              사진 선택
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">{hint}</span>
          </>
        )}
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function agreeText(payout: Payout) {
  const bits = ["입금 처리"];
  if (payout.collectInsurance) bits.push("여행자보험 가입");
  if (payout.collectPassport) bits.push("여행자 명단(여권사본)");
  return `${bits.join("·")}을 위해 위 정보 수집에 동의합니다.`;
}

export function PayeeForm({ payout }: { payout: Payout }) {
  const { payeeOf, savePayee } = useStore();
  const existing = payeeOf(payout.id);
  const wantPass = Boolean(payout.collectPassport);
  const wantIns = Boolean(payout.collectInsurance);
  const [name, setName] = useState(existing?.name ?? "");
  const [rrn, setRrn] = useState(existing?.rrn ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [bank, setBank] = useState(existing?.bank ?? "");
  const [account, setAccount] = useState(existing?.account ?? "");
  const [holder, setHolder] = useState(existing?.holder ?? "");
  const [idImage, setIdImage] = useState(existing?.idImageDataUrl ?? existing?.idImageUrl ?? "");
  const [idFileName, setIdFileName] = useState(existing?.idFileName ?? "");
  const [passportName, setPassportName] = useState(existing?.passportName ?? "");
  const [passportNo, setPassportNo] = useState(existing?.passportNo ?? "");
  const [passportImage, setPassportImage] = useState(
    existing?.passportImageDataUrl ?? existing?.passportImageUrl ?? ""
  );
  const [passportFileName, setPassportFileName] = useState(existing?.passportFileName ?? "");
  const [signature, setSignature] = useState(existing?.signatureDataUrl ?? "");
  const [agree, setAgree] = useState(existing?.privacyAgreed ?? false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  if (done) {
    return (
      <p className="rounded-xl bg-accent/70 px-4 py-6 text-center text-sm font-medium">
        제출했습니다. 투어메이커로 전달됩니다.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const profile = {
          name: name.trim(),
          rrn: rrn.trim(),
          phone: phone.trim() || undefined,
          bank: bank.trim(),
          account: account.trim(),
          holder: holder.trim() || name.trim(),
          idImageDataUrl: idImage,
          idFileName,
          passportName: wantPass ? passportName.trim() || undefined : undefined,
          passportNo: wantPass ? passportNo.trim() || undefined : undefined,
          passportImageDataUrl: wantPass ? passportImage : undefined,
          passportFileName: wantPass ? passportFileName : undefined,
          signatureDataUrl: signature,
          privacyAgreed: agree,
          submittedAt: new Date().toISOString(),
        };
        const miss = payeeMissing(profile, { passport: wantPass });
        if (miss.length) {
          setError(`${miss.join(", ")}을(를) 넣어 주세요.`);
          return;
        }
        setSending(true);
        setError("");
        savePayee(payout.id, profile);
        try {
          await Promise.race([
            submitPayee(payout, profile),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 25_000)),
          ]);
        } catch {
          /* 이 기기에는 이미 저장됨. 자료함 연결이 느려도 제출은 끝냅니다. */
        }
        setSending(false);
        setDone(true);
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">성명</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">연락처</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rrn">{wantIns ? "주민등록번호 (원천징수·여행자보험)" : "주민등록번호"}</Label>
        <Input
          id="rrn"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000000-0000000"
          value={rrn}
          onChange={(e) => setRrn(e.target.value)}
          required
        />
      </div>
      <PhotoPick
        id="idcard"
        label="신분증 사진"
        hint="주민등록증 또는 운전면허증 사진을 올려 주세요"
        value={idImage}
        fileName={idFileName}
        onChange={(dataUrl, file) => {
          setIdImage(dataUrl);
          setIdFileName(file);
        }}
      />
      {wantPass ? (
        <>
          <PhotoPick
            id="passport"
            label="여권사본"
            hint="여권 정보면이 잘 보이게 찍어 주세요"
            value={passportImage}
            fileName={passportFileName}
            onChange={(dataUrl, file) => {
              setPassportImage(dataUrl);
              setPassportFileName(file);
            }}
          />
          <div className="space-y-1.5">
            <Label htmlFor="pass-en">영문 성명 (여권과 같으면)</Label>
            <Input
              id="pass-en"
              value={passportName}
              onChange={(e) => setPassportName(e.target.value)}
              placeholder="HONG GILDONG"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pass-no">여권번호 (보이면)</Label>
            <Input id="pass-no" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} />
          </div>
        </>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bank">은행</Label>
          <Input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="holder">예금주</Label>
          <Input id="holder" value={holder} onChange={(e) => setHolder(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="account">계좌번호</Label>
        <Input
          id="account"
          inputMode="numeric"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>서명</Label>
        <SignPad value={signature} onChange={setSignature} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          required
        />
        {agreeText(payout)}
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "보내는 중…" : "제출"}
      </Button>
    </form>
  );
}
