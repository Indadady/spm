"use client";

import { Button } from "@/components/ui/button";
import { COLLECT_KINDS, newGroupId, normalizeDepartPin, publishCampaign, validDepartPin, type CollectKind } from "@/lib/group-collect";
import { randomKakaoOgSlot } from "@/lib/company";
import { useGroupStore } from "@/lib/group-store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGroupCollectPage() {
  const router = useRouter();
  const { addCampaign } = useGroupStore();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CollectKind>("insurance");
  const [expected, setExpected] = useState("");
  const [departPin, setDepartPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <Link href="/collect" className="text-sm text-muted-foreground">
        ← 여행자 자료
      </Link>
      <h1 className="text-2xl font-bold">새 여행자 링크</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        지급 정보처럼 링크 하나를 만듭니다. 담당자가 단체방에 올리면 참가자가 직접 넣습니다.
      </p>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const name = title.trim();
          if (!name) return;
          const pin = normalizeDepartPin(departPin);
          if (!validDepartPin(pin)) {
            setError("출발일 6자리를 넣어 주세요. 예: 270306");
            return;
          }
          const count = Number(expected);
          const campaign = {
            id: newGroupId(),
            title: name,
            kind,
            expectedCount: count > 0 ? count : undefined,
            ogSlot: randomKakaoOgSlot(),
            departPin: pin,
            createdAt: new Date().toISOString(),
          };
          setSaving(true);
          setError("");
          try {
            await publishCampaign(campaign);
            addCampaign(campaign);
            router.push(`/collect/open/?id=${encodeURIComponent(campaign.id)}`);
          } catch {
            setError("자료함에 올리지 못했습니다. 연결을 확인하고 다시 만들어 주세요.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="title">행사명</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="행사명"
          />
        </div>
        <div className="space-y-1.5">
          <Label>받을 자료</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COLLECT_KINDS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left",
                  kind === item.id
                    ? "border-[color:var(--navy)] bg-accent/70"
                    : "bg-card"
                )}
                onClick={() => setKind(item.id)}
              >
                <p className="font-semibold">{item.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="depart-pin">출발일 6자리 (내부 직원 비밀번호)</Label>
          <Input
            id="depart-pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={departPin}
            onChange={(e) => setDepartPin(normalizeDepartPin(e.target.value))}
            placeholder="270306"
            required
          />
          <p className="text-xs text-muted-foreground">
            출발전서류와 같습니다. 2027년 3월 6일 출발이면 270306입니다. 내부 직원이 자료를 볼 때 이 번호를
            넣습니다.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expected">예상 인원 (있으면)</Label>
          <Input
            id="expected"
            inputMode="numeric"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="33"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? "만드는 중…" : "링크 만들기"}
        </Button>
      </form>
    </div>
  );
}
