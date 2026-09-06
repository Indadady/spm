"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEVICE_OPTIONS,
  INTERVIEW_C,
  ROLE_OPTIONS,
  SCALE_A,
  SCALE_B,
  TAEBAEK_SURVEY,
} from "@/lib/surveys";
import { useStore } from "@/lib/store";
import { useState } from "react";

function ScaleRow({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5 rounded-xl border bg-card px-3 py-2.5">
      <p className="text-sm">{label}</p>
      <div className="grid grid-cols-5 gap-1">
        {["1", "2", "3", "4", "5"].map((n) => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={value === n ? "default" : "outline"}
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function SatisfactionForm() {
  const { addSatisfaction } = useStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function set(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
    setSaved(false);
  }

  const showB =
    values.role === "인솔자" ||
    values.role === "공공기관 직원" ||
    values.role === "운영 인력";

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        addSatisfaction(TAEBAEK_SURVEY.id, {
          ...values,
          submittedAt: new Date().toISOString(),
        });
        setSaved(true);
      }}
    >
      <div>
        <p className="text-xs font-semibold text-[color:var(--gold-ink)]">
          {TAEBAEK_SURVEY.periodLabel}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{TAEBAEK_SURVEY.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{TAEBAEK_SURVEY.eventName}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {TAEBAEK_SURVEY.intro}
        </p>
        <a
          href={TAEBAEK_SURVEY.guidebookUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm underline"
        >
          스마트 가이드북 열기
        </a>
      </div>

      <div className="space-y-1.5">
        <Label>역할</Label>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <Button
              key={opt}
              type="button"
              size="sm"
              variant={values.role === opt ? "default" : "outline"}
              onClick={() => set("role", opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="age">연령대</Label>
          <Input id="age" value={values.age ?? ""} onChange={(e) => set("age", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>주로 본 기기</Label>
          <select
            className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
            value={values.device ?? ""}
            onChange={(e) => set("device", e.target.value)}
          >
            <option value="">선택</option>
            {DEVICE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-bold">A. 참가자 공통</h2>
        {SCALE_A.map((q) => (
          <ScaleRow
            key={q.id}
            id={q.id}
            label={q.label}
            value={values[q.id] ?? ""}
            onChange={(v) => set(q.id, v)}
          />
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="A9">A9. 가장 자주 확인한 정보</Label>
          <Textarea id="A9" value={values.A9 ?? ""} onChange={(e) => set("A9", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="A10">A10. 불편했거나 추가되면 좋을 기능</Label>
          <Textarea id="A10" value={values.A10 ?? ""} onChange={(e) => set("A10", e.target.value)} />
        </div>
      </section>

      {showB ? (
        <section className="space-y-2">
          <h2 className="text-base font-bold">B. 인솔자·직원·운영자</h2>
          {SCALE_B.map((q) => (
            <ScaleRow
              key={q.id}
              id={q.id}
              label={q.label}
              value={values[q.id] ?? ""}
              onChange={(v) => set(q.id, v)}
            />
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="B8">B8. 안내자료 작성 소요 시간 (분)</Label>
            <Input id="B8" value={values.B8 ?? ""} onChange={(e) => set("B8", e.target.value)} />
          </div>
        </section>
      ) : null}

      {showB ? (
        <section className="space-y-2">
          <h2 className="text-base font-bold">C. 인터뷰</h2>
          {INTERVIEW_C.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <Label htmlFor={q.id}>{q.label}</Label>
              <Textarea id={q.id} value={values[q.id] ?? ""} onChange={(e) => set(q.id, e.target.value)} />
            </div>
          ))}
        </section>
      ) : null}

      <Button type="submit" className="w-full">
        응답 저장
      </Button>
      {saved ? (
        <p className="text-sm text-emerald-700">저장했습니다. 이 브라우저에만 남습니다.</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          연구책임 이재명 010-9443-7881 · 투어메이커. 서버로는 올라가지 않습니다.
        </p>
      )}
    </form>
  );
}
