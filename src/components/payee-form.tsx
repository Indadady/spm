"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWon } from "@/lib/format";
import { submitPayee } from "@/lib/payee-inbox";
import { payeeReady } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
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
  const tax = calcTax({ method: payout.taxMethod, gross: payout.gross });
  const [name, setName] = useState(existing?.name ?? payout.partnerName);
  const [rrn, setRrn] = useState(existing?.rrn ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [bank, setBank] = useState(existing?.bank ?? "");
  const [account, setAccount] = useState(existing?.account ?? "");
  const [holder, setHolder] = useState(existing?.holder ?? "");
  const [idImage, setIdImage] = useState(existing?.idImageDataUrl ?? "");
  const [idFileName, setIdFileName] = useState(existing?.idFileName ?? "");
  const [agree, setAgree] = useState(existing?.privacyAgreed ?? false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<"firebase" | "local" | "">("");
  const [sending, setSending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const profile = {
          name: name.trim(),
          rrn: rrn.trim(),
          phone: phone.trim() || undefined,
          bank: bank.trim(),
          account: account.trim(),
          holder: holder.trim(),
          idImageDataUrl: idImage,
          idFileName,
          privacyAgreed: agree,
          submittedAt: new Date().toISOString(),
        };
        if (!payeeReady(profile)) {
          setError("이름, 주민등록번호, 신분증, 본인 계좌, 동의를 모두 넣어 주세요.");
          return;
        }
        setSending(true);
        setError("");
        savePayee(payout.id, profile);
        try {
          await submitPayee(payout, profile);
          setSaved("firebase");
        } catch {
          setSaved("local");
          setError(
            "지금 화면에서는 투어메이커 자료함과 바로 연결되지 않았습니다. 카카오톡 대신 이 링크를 배포 주소로 보내 주시면 제출 즉시 사무실에서 보입니다."
          );
        } finally {
          setSending(false);
        }
      }}
    >
      <div className="rounded-xl bg-accent/70 px-4 py-3 text-sm leading-relaxed">
        <p className="font-medium">{payout.eventName ?? payout.title}</p>
        <p className="mt-1 text-muted-foreground">
          지급 총액 {formatWon(tax.gross)} · 원천 3.3% {formatWon(tax.withholding)} · 입금 예정{" "}
          {formatWon(tax.net)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          제출하면 투어메이커 자료함으로 전달됩니다. 카톡이나 구두로 따로 보내지 않으셔도 됩니다.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">이름</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
        <Label htmlFor="phone">휴대전화 (선택)</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bank">은행</Label>
          <Input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="holder">예금주 (본인)</Label>
          <Input
            id="holder"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            required
          />
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
        <Label htmlFor="idcard">신분증 사진</Label>
        <Input
          id="idcard"
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const data = await fileToJpeg(file);
              setIdImage(data);
              setIdFileName(file.name);
              setError("");
            } catch {
              setError("신분증 사진을 읽지 못했습니다. 다른 사진으로 다시 시도해 주세요.");
            }
          }}
        />
        {idImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={idImage}
            alt="신분증 미리보기"
            className="mt-2 max-h-48 w-full rounded-xl border object-contain bg-white"
          />
        ) : (
          <p className="text-xs text-muted-foreground">주민등록증·운전면허증 사진을 올립니다.</p>
        )}
      </div>
      <label className="flex items-start gap-2 text-sm leading-relaxed">
        <input
          type="checkbox"
          className="mt-1"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          required
        />
        원천징수 신고와 이체를 위해 성명, 주민등록번호, 신분증, 계좌 정보를 수집하는 데 동의합니다.
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "보내는 중…" : "제출하기"}
      </Button>
      {saved === "firebase" ? (
        <p className="text-sm text-emerald-700">투어메이커로 전달했습니다. 이체 준비에 쓰입니다.</p>
      ) : null}
      {saved === "local" && !error ? (
        <p className="text-sm text-muted-foreground">이 기기에 임시 저장했습니다.</p>
      ) : null}
    </form>
  );
}
