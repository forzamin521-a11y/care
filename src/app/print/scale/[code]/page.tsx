import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SCALES, isScaleCode } from "@/lib/scales";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { ScaleQuestionnaire } from "@/components/print/scale-questionnaire";

export async function generateMetadata(
  props: PageProps<"/print/scale/[code]">
): Promise<Metadata> {
  const { code } = await props.params;
  return { title: isScaleCode(code) ? `${SCALES[code].name} 설문지` : "설문지" };
}

/**
 * 빈 설문지 한 종류를 A4 로 인쇄한다.
 *
 * ⚠ 저작권이 있는 도구(K-MMSE)는 문항을 인쇄하지 않는다.
 */
export default async function PrintScalePage(
  props: PageProps<"/print/scale/[code]">
) {
  const { code } = await props.params;
  const search = await props.searchParams;

  if (!isScaleCode(code)) notFound();

  const def = SCALES[code];

  // 문항이 없는 도구는 인쇄 대상이 아니다
  if (def.kind !== "items") notFound();

  const patientName = typeof search.name === "string" ? search.name : "";
  const patientNo = typeof search.no === "string" ? search.no : "";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-[190mm] px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <PrintToolbar title={`${def.name} 설문지`} />
      <ScaleQuestionnaire
        def={def}
        patientName={patientName}
        patientNo={patientNo}
        date={today}
      />
    </main>
  );
}
