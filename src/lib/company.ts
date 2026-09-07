export const COMPANY_LOGO =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHfgIX70O5k6Anuo0UgALIdaG9jSga9auHu3uyz0uEirylGPAJnjN_qQbvEGMUvPqUQf_g9FMNUHRxlDcUBf4vZ3Mpy4TnA9WxbmzWYK11gt2zuy_Irl4wctNFjcjLyPo0GPXV792o_J7L9guRMuDfeC1gy7USwywjYbECZgzcsHybuGRRAXAnO1eNmP8/s320/logo.png";

const OG_VERSION = "20260907";

/** 카톡 공유 썸네일. 건물 간판·외부 사인·쇼핑백 사진 로고 3종. */
export const KAKAO_OG_IMAGES = [
  `/og/tm-1.jpg?v=${OG_VERSION}`,
  `/og/tm-2.jpg?v=${OG_VERSION}`,
  `/og/tm-3.jpg?v=${OG_VERSION}`,
] as const;

export const KAKAO_OG_SIZE = { width: 1200, height: 630 } as const;

export function kakaoOgSlot(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % KAKAO_OG_IMAGES.length) + 1;
}

export function randomKakaoOgSlot() {
  return 1 + Math.floor(Math.random() * KAKAO_OG_IMAGES.length);
}

export function kakaoOgImage(seedOrSlot: string | number) {
  const slot =
    typeof seedOrSlot === "number"
      ? seedOrSlot
      : kakaoOgSlot(seedOrSlot);
  const idx = ((slot - 1) % KAKAO_OG_IMAGES.length + KAKAO_OG_IMAGES.length) % KAKAO_OG_IMAGES.length;
  return KAKAO_OG_IMAGES[idx];
}

export function kakaoOgImageMeta(seedOrSlot: string | number) {
  return {
    url: kakaoOgImage(seedOrSlot),
    width: KAKAO_OG_SIZE.width,
    height: KAKAO_OG_SIZE.height,
    alt: "투어메이커",
    type: "image/jpeg",
  };
}

export function collectSharePath(payoutId: string, slot?: number) {
  const n = slot ?? randomKakaoOgSlot();
  return `/p/s/${n}/?id=${encodeURIComponent(payoutId)}`;
}

export const COMPANY = {
  name: "주식회사 투어메이커",
  representative: "이재명",
  admin: "허나연",
  bizNo: "473-81-03183",
  phone: "033-562-2551",
  mobile: "010-9443-7881",
  address: "강원특별자치도 정선군 정선읍 봉양3길 22-10, 3층",
  bank: "신협",
  account: "131-022-382094",
  holder: "주식회사 투어메이커",
  site: "https://tourmaker.kr",
};
