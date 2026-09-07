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
  const title = "투어메이커 · 여행 자료";
  const description = "여행자보험·여권 자료를 입력해 주세요.";
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

export default function KakaoShareGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
