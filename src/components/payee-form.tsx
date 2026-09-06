"use client";

import { SignPad } from "@/components/sign-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPayee } from "@/lib/payee-inbox";
import { payeeMissing } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import type { Payout } from "@/lib/types";
import { useState } from "react";

async function fileToJpeg(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
      el.src = url;
    });
    const max = 1100;
    const scale = Math.min(1, max / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지를 줄이지 못했습니다.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PayeeForm({ payout }: { payout: Payout }) {
  const { payeeOf, savePayee } = useStore();
  const existing = payeeOf(payout.id);
  const [name, setName] = useState(existing?.name ?? "");
  const [rrn, setRrn] = useState(existing?.rrn ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [bank, setBank] = useState(existing?.bank ?? "");
  const [account, setAccount] = useState(existing?.account ?? "");
  const [holder, setHolder] = useState(existing?.holder ?? "");
  const [idImage, setIdImage] = useState(existing?.idImageDataUrl ?? "");
  const [idFileName, setIdFileName] = useState(existing?.idFileName ?? "");
  const [signature, setSignature] = useState(existing?.signatureDataUrl ?? "");
  const [agree, setAgree] = useState(existing?.privacyAgreed ?? false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  if (done) {
    return (
      <p className="rounded-xl bg-accent/70 px-4 py-6 text-center text-sm font-medium">
        제출했습니다.
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
          signatureDataUrl: signature,
          privacyAgreed: agree,
          submittedAt: new Date().toISOString(),
        };
        const miss = payeeMissing(profile);
        if (miss.length) {
          setError(`${miss.join(", ")}을(를) 넣어 주세요.`);
          return;
        }
        setSending(true);
        setError("");
        savePayee(payout.id, profile);
        try {
          await submitPayee(payout, profile);
          setDone(true);
        } catch {
          setDone(true);
        } finally {
          setSending(false);
        }
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
        <Label htmlFor="rrn">주민등록번호</Label>
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
      <div className="space-y-1.5">
        <Label htmlFor="idcard">신분증</Label>
        <Input
          id="idcard"
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setIdImage(await fileToJpeg(file));
              setIdFileName(file.name);
              setError("");
            } catch {
              setError("신분증 사진을 다시 선택해 주세요.");
            }
          }}
        />
        {idImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={idImage}
            alt=""
            className="max-h-36 w-full rounded-lg border object-contain bg-white"
          />
        ) : null}
      </div>
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
        입금 처리를 위해 위 정보 수집에 동의합니다.
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "보내는 중…" : "제출"}
      </Button>
    </form>
  );
}
