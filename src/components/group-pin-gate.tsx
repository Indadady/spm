"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import {
  normalizeDepartPin,
  patchCampaign,
  validDepartPin,
  type GroupCampaign,
} from "@/lib/group-collect";
import { useGroupStore } from "@/lib/group-store";
import { FormEvent, useEffect, useState } from "react";

function pinKey(id: string) {
  return `spm.groupPin.${id}`;
}

function readSavedPin(id: string) {
  try {
    return sessionStorage.getItem(pinKey(id)) ?? "";
  } catch {
    return "";
  }
}

function savePin(id: string, pin: string) {
  try {
    sessionStorage.setItem(pinKey(id), pin);
  } catch {
    /* private mode */
  }
}

export function GroupPinGate({
  campaign,
  canSetPin,
  children,
}: {
  campaign: GroupCampaign;
  canSetPin?: boolean;
  children: React.ReactNode;
}) {
  const { rememberCampaign } = useGroupStore();
  const [gatePin, setGatePin] = useState(campaign.departPin ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const expected = campaign.departPin ?? "";
    setGatePin(expected);
    if (!expected) {
      setUnlocked(false);
      return;
    }
    setUnlocked(readSavedPin(campaign.id) === expected);
  }, [campaign.id, campaign.departPin]);

  if (unlocked && gatePin) return <>{children}</>;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = normalizeDepartPin(pin);
    if (!validDepartPin(next)) {
      setError("출발일 6자리를 넣어 주세요. 예: 270306");
      return;
    }
    if (!gatePin) {
      if (!canSetPin) {
        setError("아직 출발일이 없습니다. 투어메이커에 문의해 주세요.");
        return;
      }
      setSaving(true);
      setError("");
      try {
        await patchCampaign(campaign.id, { departPin: next });
        rememberCampaign({ ...campaign, departPin: next });
        savePin(campaign.id, next);
        setGatePin(next);
        setUnlocked(true);
      } catch {
        setError("출발일을 저장하지 못했습니다. 다시 시도해 주세요.");
      } finally {
        setSaving(false);
      }
      return;
    }
    if (next !== gatePin) {
      setError("출발일이 다릅니다. 다시 넣어 주세요.");
      return;
    }
    savePin(campaign.id, next);
    setUnlocked(true);
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={COMPANY_LOGO} alt={COMPANY.name} className="h-8 w-auto" />
      <div>
        <p className="text-xs font-semibold tracking-wide text-[color:var(--gold-ink)]">개인정보 보호</p>
        <h1 className="mt-1 text-xl font-bold">{campaign.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {gatePin
            ? "출발전서류와 같이 출발일 6자리를 넣으면 자료를 볼 수 있습니다."
            : canSetPin
              ? "이 자료는 개인정보입니다. 출발일 6자리를 정해 두면 내부 직원만 볼 수 있습니다."
              : "아직 출발일이 없습니다. 투어메이커에서 출발일을 정한 뒤 다시 열어 주세요."}
        </p>
      </div>
      {canSetPin || gatePin ? (
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <div className="space-y-1.5">
            <Label htmlFor="depart-pin">출발일 6자리</Label>
            <Input
              id="depart-pin"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              placeholder="270306"
              value={pin}
              onChange={(e) => setPin(normalizeDepartPin(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">예: 2027년 3월 6일 출발 → 270306</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={saving || (!gatePin && !canSetPin)}>
            {saving ? "저장 중…" : gatePin ? "자료 보기" : "출발일 정하고 보기"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">투어메이커에 문의해 주세요.</p>
      )}
    </div>
  );
}
