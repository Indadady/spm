"use client";

import { SatisfactionForm } from "@/components/satisfaction-form";
import { surveyById } from "@/lib/surveys";
import { useParams } from "next/navigation";

export default function PublicSurveyPage() {
  const { slug } = useParams<{ slug: string }>();
  const survey = surveyById(slug);

  if (!survey) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-bold">설문을 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">주소를 다시 확인해 주세요.</p>
      </div>
    );
  }

  return <SatisfactionForm />;
}
