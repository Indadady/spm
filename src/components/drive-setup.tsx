"use client";

import {
  isDriveConfigured,
  SPM_DRIVE_FOLDER_URL,
  SPM_INBOX_FOLDER_URL,
} from "@/lib/drive-inbox";

export function DriveSetupCard() {
  if (isDriveConfigured) return null;

  return (
    <aside className="rounded-2xl border border-[color:var(--gold)]/50 bg-accent/50 px-4 py-4 text-sm leading-relaxed">
      <p className="font-semibold">제출이 드라이브로 들어가려면 한 번만 연결이 필요합니다.</p>
      <p className="mt-1 text-muted-foreground">
        깃허브 페이지는 화면만 보여 줍니다. 주민등록번호·계좌·신분증은 이재명 계정 구글 드라이브
        받은자료 폴더에만 저장합니다.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>
          크롬에서{" "}
          <a href="https://script.google.com" target="_blank" rel="noreferrer" className="underline">
            script.google.com
          </a>
          을 엽니다.
        </li>
        <li>새 프로젝트 → 같은 폴더의 개인정보_드라이브저장.gs.txt 내용을 붙여 넣습니다.</li>
        <li>배포 → 새 배포 → 유형 웹 앱 → 실행 계정 나 → 액세스 모든 사용자</li>
        <li>나온 웹 앱 주소를 이 채팅에 보내 주시면 연결합니다.</li>
      </ol>
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={SPM_DRIVE_FOLDER_URL} target="_blank" rel="noreferrer" className="underline">
          5.spm 폴더 열기
        </a>
        <a href={SPM_INBOX_FOLDER_URL} target="_blank" rel="noreferrer" className="underline">
          받은자료 폴더 열기
        </a>
      </div>
    </aside>
  );
}
