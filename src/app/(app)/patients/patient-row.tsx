"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

/**
 * 목록의 한 줄 전체를 눌러 환자에게 들어갈 수 있게 한다.
 *
 * 이름은 그대로 링크로 두었다 — 키보드 이동과 새 탭 열기(가운데 클릭)가
 * 계속 되어야 하기 때문. 줄 클릭은 마우스 편의 기능이다.
 * 삭제 버튼처럼 줄 안의 다른 조작은 눌러도 환자 화면으로 넘어가지 않는다.
 */
export function PatientRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow
      onClick={(event) => {
        // 링크·버튼·대화상자 안을 눌렀으면 그쪽에 맡긴다
        const target = event.target as HTMLElement;
        if (target.closest("a, button, input, [role='dialog']")) return;

        // 텍스트를 드래그해 복사하는 중이면 이동하지 않는다
        if (window.getSelection()?.toString()) return;

        router.push(href);
      }}
      className="cursor-pointer hover:bg-accent/40"
    >
      {children}
    </TableRow>
  );
}
