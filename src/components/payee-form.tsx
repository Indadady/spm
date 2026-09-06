"use client";

import { SignPad } from "@/components/sign-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY } from "@/lib/company";
import { formatWon } from "@/lib/format";
import { submitPayee } from "@/lib/payee-inbox";
import { payeeMissing } from "@/lib/payout-types";
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
  const [signature, setSignature] = useState(existing?.signatureDataUrl ?? "");
  const [agree, setAgree] = useState(existing?.privacyAgreed ?? false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<"firebase" | "local" | "">("");
  const [sending, setSending] = useState(false);

  const work =
    payout.workLines?.length
      ? payout.workLines.join(" · ")
      : `${payout.eventName ?? payout.title} ${payout.partnerRole}`;

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const profile = {
          name: name.trim(),
          rrn: rrn.trim(),
          phone: phone.trim() || undefined,
          bank: bank.trim(),
          account: account.trim(),
          holder: (holder.trim() || name.trim()),
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
          setSaved("firebase");
        } catch {
          setSaved("local");
          setError(
            "지금 미리보기 주소에서는 자료함이 바로 열리지 않을 수 있습니다. 배포된 투어메이커 링크로 제출하면 사무실에서 바로 보입니다."
          );
        } finally {
          setSending(false);
        }
      }}
    >
      <section>
        <h2 className="mb-3 text-base font-bold text-[color:var(--navy)]">
          파트너 정보 및 정산 계좌
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              성명(상호) <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              연락처 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bank">
              지급 은행 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bank"
              placeholder="예: 농협, 신한"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="holder">
              예금주(본인) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="holder"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder={name || "성명과 같으면 비워도 됩니다"}
            />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="account">
            계좌번호 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="account"
            inputMode="numeric"
            placeholder="하이픈 없이 숫자"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            required
          />
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="rrn">
            세무 신고 식별정보 (주민등록번호) <span className="text-destructive">*</span>
          </Label>
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
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="idcard">
            신분증 사진 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="idcard"
            type="file"
            accept="image/*"
            className="print:hidden"
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
            <p className="text-xs text-muted-foreground print:hidden">
              주민등록증·운전면허증 사진을 올립니다.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-[#f8fafc] px-4 py-4 text-sm leading-relaxed text-[#334155]">
        <h2 className="mb-2 text-base font-bold text-[color:var(--navy)]">정산 및 원천 안내</h2>
        <ul className="space-y-2">
          <li>
            <span className="font-semibold text-[color:var(--navy)]">업무 · </span>
            {work}
          </li>
          <li>
            <span className="font-semibold text-[color:var(--navy)]">정산 · </span>
            {payout.clientName ? `${payout.clientName} 발주 금액 ` : "지급 총액 "}
            {formatWon(tax.gross)}에서 사업소득 원천 3.3%({formatWon(tax.withholding)})를 뺀{" "}
            {formatWon(tax.net)}을 본인 명의 계좌로 이체합니다.
          </li>
          <li>
            <span className="font-semibold text-[color:var(--navy)]">자료 · </span>
            원천징수 신고와 이체를 위해 성명, 연락처, 주민등록번호, 신분증, 본인 계좌를 제출합니다.
          </li>
          {payout.needsContract === false ? (
            <li>
              <span className="font-semibold text-[color:var(--navy)]">성격 · </span>
              이 화면은 투어메이커와 새 용역계약을 맺는 자리가 아닙니다. 정산에 필요한 자료와 동의만
              받습니다.
            </li>
          ) : (
            <li>
              <span className="font-semibold text-[color:var(--navy)]">서명 · </span>
              아래 서명은 정산 정보 제출 및 원천 처리에 동의하는 의사 표시입니다.
            </li>
          )}
        </ul>
      </section>

      <div className="rounded-xl border border-[#c7dcf3] bg-[#eef5fc] px-4 py-3 text-xs leading-relaxed text-[#1e3a8a]">
        <p className="font-semibold">개인정보 수집 및 이용</p>
        <p className="mt-1">
          목적: 강사료·용역비 정산 및 사업소득 원천징수 신고 · 보유: 세법상 보관 기간이 지나면
          지체 없이 파기 · 처리: {COMPANY.name}
        </p>
        <label className="mt-2 flex items-start gap-2 text-sm font-semibold text-[color:var(--navy)]">
          <input
            type="checkbox"
            className="mt-1"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            required
          />
          개인정보 수집 및 세무 처리 이용에 동의합니다.
        </label>
      </div>

      <section className="print:break-inside-avoid">
        <h2 className="mb-2 text-base font-bold text-[color:var(--navy)]">서명</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          손가락이나 마우스로 서명해 주세요. 구글폼·외부 전자계약 사이트 없이 투어메이커 화면에서
          끝냅니다.
        </p>
        <SignPad value={signature} onChange={setSignature} />
      </section>

      {error ? <p className="text-sm text-destructive print:hidden">{error}</p> : null}
      <Button type="submit" className="w-full print:hidden" disabled={sending}>
        {sending ? "처리 중…" : "동의하고 제출하기"}
      </Button>
      {saved === "firebase" ? (
        <p className="text-sm text-emerald-700">투어메이커 자료함으로 전달했습니다.</p>
      ) : null}
    </form>
  );
}
