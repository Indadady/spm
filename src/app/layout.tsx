import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { Providers } from "./providers";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://indadady.github.io/spm"),
  title: "투어메이커 자료모우기",
  description: "투어메이커 자료모우기. 스마트파트너 지급 정보와 여행자보험·여권 자료를 링크로 받습니다.",
  openGraph: {
    siteName: "투어메이커",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${noto.variable} h-full antialiased`}>
      <body className={`${noto.className} flex min-h-full flex-col`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
