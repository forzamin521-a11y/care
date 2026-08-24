import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PRINTABLE_SCALES,
  SCALES,
  isScaleCode,
  type ItemScaleDef,
  type ScaleCode,
} from "@/lib/scales";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { ScaleQuestionnaire } from "@/components/print/scale-questionnaire";

export const metadata: Metadata = { title: "설문지 인쇄" };

/**
 * 여러 설문지를 한 번에 A4 로 인쇄한다.
 * 설문지마다 새 장에서 시작한다.
 */
export default async function PrintFormsPage(
  props: PageProps<"/print/forms">
) {
  const search = await props.searchParams;

  const rawCodes = typeof search.codes === "string" ? search.codes : "";
  const codes = rawCodes
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ScaleCode => isScaleCode(c) && PRINTABLE_SCALES.includes(c));

  if (codes.length === 0) notFound();

  const patientName = typeof search.name === "string" ? search.name : "";
  const patientNo = typeof search.no === "string" ? search.no : "";

  const rawCopies = typeof search.copies === "string" ? Number(search.copies) : 1;
  const copies = Number.isFinite(rawCopies)
    ? Math.min(Math.max(Math.trunc(rawCopies), 1), 20)
    : 1;

  const today = new Date().toISOString().slice(0, 10);

  // 부수 × 종류 만큼 펼친다
  const sheets: { def: ItemScaleDef; key: string }[] = [];
  for (let copy = 0; copy < copies; copy += 1) {
    for (const code of codes) {
      sheets.push({ def: SCALES[code] as ItemScaleDef, key: `${code}-${copy}` });
    }
  }

  const title =
    codes.length === 1
      ? `${SCALES[codes[0]].name} 설문지`
      : `설문지 ${codes.length}종`;

  return (
    <main className="mx-auto w-full max-w-[190mm] px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <PrintToolbar
        title={`${title}${copies > 1 ? ` · ${copies}부` : ""}${patientName ? ` · ${patientName}` : ""}`}
        hint={`A4 ${sheets.length}장으로 출력됩니다. 인쇄 창에서 용지를 A4, 여백을 기본값으로 두세요.`}
      />

      <div className="flex flex-col gap-10 print:gap-0">
        {sheets.map((sheet, index) => (
          <div
            key={sheet.key}
            className={index < sheets.length - 1 ? "page-break" : undefined}
          >
            <ScaleQuestionnaire
              def={sheet.def}
              patientName={patientName}
              patientNo={patientNo}
              date={today}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
