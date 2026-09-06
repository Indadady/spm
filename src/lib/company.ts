export const COMPANY_LOGO =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHfgIX70O5k6Anuo0UgALIdaG9jSga9auHu3uyz0uEirylGPAJnjN_qQbvEGMUvPqUQf_g9FMNUHRxlDcUBf4vZ3Mpy4TnA9WxbmzWYK11gt2zuy_Irl4wctNFjcjLyPo0GPXV792o_J7L9guRMuDfeC1gy7USwywjYbECZgzcsHybuGRRAXAnO1eNmP8/s320/logo.png";

const LOGO_LARGE = COMPANY_LOGO.replace("/s320/", "/s1600/");

/** 카톡 공유 썸네일. 링크마다 3장 중 하나를 고릅니다. */
export const KAKAO_OG_IMAGES = [LOGO_LARGE, LOGO_LARGE, LOGO_LARGE] as const;

export function kakaoOgImage(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return KAKAO_OG_IMAGES[h % KAKAO_OG_IMAGES.length];
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
};
