"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { SurveyQuestion } from "@/lib/types";
import { useEffect, useState } from "react";

export function SurveyForm({
  payoutId,
  questions,
  externalFormUrl,
}: {
  payoutId: string;
  questions: SurveyQuestion[];
  externalFormUrl?: string;
}) {
  const { surveyOf, saveSurvey, ready } = useStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready) setValues(surveyOf(payoutId));
    // 최초 로드만. surveyOf는 렌더마다 새 함수라 의존성에 넣지 않습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, payoutId]);

  function set(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
    setSaved(false);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        saveSurvey(payoutId, values);
        setSaved(true);
      }}
    >
      {externalFormUrl ? (
        <a
          href={externalFormUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-dashed bg-card px-4 py-3 text-sm"
        >
          외부 구글 설문 열기
          <span className="mt-0.5 block text-xs text-muted-foreground">
            로그인된 구글 계정에서만 열립니다. 아래 내부 설문은 이 기기 자료함에 남습니다.
          </span>
        </a>
      ) : null}

      {questions.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <Label htmlFor={q.id}>
            {q.label}
            {q.required ? <span className="text-destructive"> *</span> : null}
          </Label>
          {q.help ? <p className="text-xs text-muted-foreground">{q.help}</p> : null}
          {q.type === "textarea" ? (
            <Textarea
              id={q.id}
              value={values[q.id] ?? ""}
              onChange={(e) => set(q.id, e.target.value)}
              required={q.required}
            />
          ) : q.type === "select" ? (
            <select
              id={q.id}
              required={q.required}
              value={values[q.id] ?? ""}
              onChange={(e) => set(q.id, e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">선택</option>
              {q.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : q.type === "yesno" ? (
            <div className="flex gap-2">
              {["예", "아니오"].map((opt) => (
                <Button
                  key={opt}
                  type="button"
                  size="sm"
                  variant={values[q.id] === opt ? "default" : "outline"}
                  onClick={() => set(q.id, opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          ) : q.type === "check" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                id={q.id}
                type="checkbox"
                checked={values[q.id] === "동의"}
                onChange={(e) => set(q.id, e.target.checked ? "동의" : "")}
                required={q.required}
              />
              동의합니다
            </label>
          ) : (
            <Input
              id={q.id}
              type={q.type === "tel" ? "tel" : "text"}
              value={values[q.id] ?? ""}
              onChange={(e) => set(q.id, e.target.value)}
              required={q.required}
            />
          )}
        </div>
      ))}

      <Button type="submit" className="w-full sm:w-auto">
        이 기기에 저장
      </Button>
      {saved ? (
        <p className="text-sm text-emerald-700">저장했습니다. 서버로는 올라가지 않습니다.</p>
      ) : null}
    </form>
  );
}
