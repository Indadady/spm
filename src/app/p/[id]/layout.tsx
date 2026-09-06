import type { Metadata } from "next";
import { kakaoOgImage } from "@/lib/company";
import { SEED_PAYOUT_IDS } from "@/lib/paths";
import { SEED_PAYOUTS } from "@/lib/seed";

export function generateStaticParams() {
  return SEED_PAYOUT_IDS.filter((id) => id.startsWith("out-")).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const payout = SEED_PAYOUTS.find((p) => p.id === id);
  const image = kakaoOgImage(id);
  const title = "투어메이커 · 입금 정보";
  const description = payout
    ? `${payout.partnerName}님, 이체용 계좌와 신분증을 입력해 주세요.`
    : "이체용 계좌와 신분증을 입력해 주세요.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "투어메이커",
      locale: "ko_KR",
      type: "website",
      images: [{ url: image, alt: "투어메이커" }],
    },
  };
}

export default function PublicPayeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
