import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        주소를 다시 확인하거나, 투어메이커에서 받은 링크를 그대로 열어 주세요.
      </p>
      <Link href="/" className="mt-4 inline-block text-sm underline">
        현황으로
      </Link>
    </div>
  );
}
