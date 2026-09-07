import type { Metadata } from "next";
import { kakaoOgImageMeta } from "@/lib/company";

export function generateStaticParams() {
  return [{ n: "1" }, { n: "2" }, { n: "3" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const slot = Number(n) || 1;
  const image = kakaoOgImageMeta(slot);
  const title = "투어메이커 · 제출 현황";
  const description = "누가 제출했는지 확인합니다. 주민번호와 여권사본은 보이지 않습니다.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "투어메이커",
      locale: "ko_KR",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default function KakaoWatchGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
