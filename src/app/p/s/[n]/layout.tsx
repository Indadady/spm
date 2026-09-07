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
  const title = "투어메이커 · 입금 정보";
  const description = "이체용 계좌와 신분증을 입력해 주세요.";
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

export default function KakaoShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
