"use client";

import { CopyLink } from "@/components/copy-link";
import { TAEBAEK_SURVEY, surveyById } from "@/lib/surveys";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SurveyInboxPage() {
  const { slug } = useParams<{ slug: string }>();
  const survey = surveyById(slug);
  const { satisfactionOf } = useStore();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  if (!survey) return <p>설문을 찾을 수 없습니다.</p>;

  const rows = satisfactionOf(survey.id);
  const url = origin ? `${origin}/s/${survey.id}` : "";

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted-foreground">
        ← 현황
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {survey.eventName} · {survey.periodLabel}. 지출 건과 묶지 않은 별도 설문입니다.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {url ? <CopyLink url={url} label="설문 링크 복사" /> : null}
        <Link href={`/s/${survey.id}`} className="text-sm underline">
          응답 화면
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 이 브라우저에 저장된 응답이 없습니다. 지금은 서버가 없어 같은 기기에서 연 응답만
          보입니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => (
            <li key={`${row.submittedAt ?? i}`} className="rounded-2xl border bg-card p-4 text-sm">
              <p className="font-semibold">
                {row.role || "역할 미기재"} · {row.device || "기기 미기재"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                A 평균 만족{" "}
                {["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]
                  .map((k) => Number(row[k]))
                  .filter((n) => n > 0)
                  .join(" / ") || "—"}
              </p>
              {row.A9 ? <p className="mt-2">자주 본 정보: {row.A9}</p> : null}
              {row.A10 ? <p>보완: {row.A10}</p> : null}
            </li>
          ))}
        </ul>
      )}
      {survey.id === TAEBAEK_SURVEY.id ? (
        <p className="text-xs text-muted-foreground">문항은 태백 1차 평가 부록 원문을 그대로 씁니다.</p>
      ) : null}
    </div>
  );
}
