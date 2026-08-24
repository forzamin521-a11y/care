import {
  DIAGNOSES,
  GAIT_STATUS,
  LAB_ITEMS,
  MEDICATION_CATEGORIES,
  MENTAL_STATUS,
} from "@/lib/constants";
import { TERMS } from "@/lib/terms";
import { SCALES, type ScaleCode, type ScaleSummary } from "@/lib/scales";
import { calcBmi, type AssessmentData } from "@/lib/schemas/assessment";
import { describePatient, maskRrn } from "@/lib/rrn";
import { formatDate } from "@/lib/due";

/**
 * 포괄평가기록부 본문.
 *
 * 화면 상세보기와 A4 인쇄가 같은 컴포넌트를 쓴다 —
 * 보이는 그대로 인쇄되도록 하기 위함.
 */

type Patient = {
  name: string;
  patient_no: string;
  sex: "M" | "F" | null;
  birth_date: string | null;
  rrn_front: string | null;
  rrn_sex_digit: string | null;
  address: string | null;
  room: string | null;
};

type Assessment = {
  seq: number;
  kind: string;
  status: string;
  assessed_at: string;
  assessor_name: string | null;
  version: number;
};

const KIND_LABEL: Record<string, string> = {
  initial: "최초평가",
  periodic: "정기평가",
  ad_hoc: "수시평가",
};

function yesNo(value: boolean | null): string {
  if (value === true) return "예";
  if (value === false) return "아니오";
  return "미정";
}

function orDash(value: string | null | undefined): string {
  return value && value.trim() ? value : "-";
}

/** 표 한 줄 — 라벨 + 내용 */
function Row({
  label,
  children,
  labelWidth = "8rem",
  span = 1,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  labelWidth?: string;
  /** 표의 나머지 열을 채우기 위한 colSpan */
  span?: number;
}) {
  return (
    <tr>
      <th
        className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left align-top font-medium"
        style={{ width: labelWidth }}
      >
        {label}
      </th>
      <td
        colSpan={span}
        className="border border-foreground/60 px-2 py-1.5 align-top whitespace-pre-wrap"
      >
        {children}
      </td>
    </tr>
  );
}

function SectionHeading({
  mark,
  title,
  titleEn,
}: {
  mark: string;
  title: string;
  titleEn?: string;
}) {
  return (
    <h2 className="mt-4 mb-1.5 flex items-baseline gap-2 border-b border-foreground/70 pb-1 text-[0.95rem] font-bold">
      <span className="font-mono">{mark}.</span>
      {title}
      {titleEn ? (
        <span className="text-xs font-normal opacity-70">({titleEn})</span>
      ) : null}
    </h2>
  );
}

function ScaleLine({
  code,
  summary,
}: {
  code: ScaleCode;
  summary: ScaleSummary;
}) {
  const def = SCALES[code];

  return (
    <tr>
      <th className="w-[13rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left align-top font-medium">
        {def.name}
        <span className="ml-1 text-xs font-normal opacity-70">
          ({def.nameEn})
        </span>
      </th>
      <td className="w-[7rem] border border-foreground/60 px-2 py-1.5 text-center font-mono">
        {summary ? summary.display : "-"}
      </td>
      <td className="border border-foreground/60 px-2 py-1.5">
        {summary ? summary.interpretation : "미실시"}
      </td>
    </tr>
  );
}

export function AssessmentDocument({
  patient,
  assessment,
  data,
  scales,
}: {
  patient: Patient;
  assessment: Assessment;
  data: AssessmentData;
  scales: Partial<Record<ScaleCode, ScaleSummary>>;
}) {
  const bmi = calcBmi(data.d.heightCm, data.d.weightKg);

  const selectedDiagnoses = DIAGNOSES.filter((d) =>
    data.a.diagnoses.includes(d.key)
  );

  const medications = MEDICATION_CATEGORIES.map((cat) => ({
    ...cat,
    item: data.f.items.find((i) => i.category === cat.key),
  })).filter((row) => row.item?.drugName?.trim());

  const labs = LAB_ITEMS.map((lab) => ({
    ...lab,
    entry: data.j.items[lab.code],
  })).filter((row) => row.entry?.value?.trim() || row.entry?.takenOn?.trim());

  const plans = data.i.rows.filter((row) => row.content.trim());
  const gait = GAIT_STATUS.find((g) => g.key === data.d.gait);
  const mental = MENTAL_STATUS.find((m) => m.key === data.e.mentalStatus);

  return (
    <article className="assessment-doc flex flex-col text-[0.85rem] leading-relaxed">
      {/* ================= 1쪽 ================= */}
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-lg font-bold tracking-tight">포괄평가기록부</h1>
          <span className="text-xs">
            [입소자 포괄적 평가] · {assessment.seq}차 ·{" "}
            {KIND_LABEL[assessment.kind] ?? assessment.kind}
            {assessment.version > 1 ? ` · v${assessment.version}` : ""}
          </span>
        </div>

        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <th className="w-[5.5rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                등록번호
              </th>
              <td className="w-[8rem] border border-foreground/60 px-2 py-1.5 font-mono">
                {patient.patient_no}
              </td>
              <th className="w-[4rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                이름
              </th>
              <td className="border border-foreground/60 px-2 py-1.5">
                {patient.name}
              </td>
              <th className="w-[5.5rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                성별 / 나이
              </th>
              <td className="w-[7rem] border border-foreground/60 px-2 py-1.5">
                {describePatient(patient.sex, patient.birth_date)}
              </td>
            </tr>
            <tr>
              <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                주민등록번호
              </th>
              <td className="border border-foreground/60 px-2 py-1.5 font-mono">
                {maskRrn(patient.rrn_front, patient.rrn_sex_digit)}
              </td>
              <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                주소
              </th>
              <td className="border border-foreground/60 px-2 py-1.5" colSpan={3}>
                {orDash(patient.address)}
              </td>
            </tr>
            <tr>
              <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                병동 / 호실
              </th>
              <td className="border border-foreground/60 px-2 py-1.5">
                {orDash(patient.room)}
              </td>
              <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                평가일시
              </th>
              <td className="border border-foreground/60 px-2 py-1.5">
                {formatDate(assessment.assessed_at)}
              </td>
              <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                작성자
              </th>
              <td className="border border-foreground/60 px-2 py-1.5">
                {orDash(assessment.assessor_name)}
              </td>
            </tr>
          </tbody>
        </table>
      </header>

      {/* ---------- A ---------- */}
      <SectionHeading mark="A" title="진단명 (기존질병)" />
      <table className="w-full border-collapse">
        <tbody>
          <Row label="입소이유">{orDash(data.a.admitReason)}</Row>
          <Row label={<>의료기관에 의한<br />진단명</>}>
            {orDash(data.a.clinicalDiagnosis)}
          </Row>
          <Row label="해당 질병">
            {selectedDiagnoses.length > 0
              ? selectedDiagnoses
                  .map((d) =>
                    d.key === "other" && data.a.diagnosisOther
                      ? `기타(${data.a.diagnosisOther})`
                      : d.label
                  )
                  .join(" · ")
              : "-"}
          </Row>
        </tbody>
      </table>

      {/* ---------- B ---------- */}
      <SectionHeading mark="B" title="과거력" />
      <table className="w-full border-collapse">
        <tbody>
          <Row label="1) 주요 수술">{orDash(data.b.surgery)}</Row>
          <Row label="2) 급성기 입원">{orDash(data.b.admission)}</Row>
          <Row label="3) 알레르기">{orDash(data.b.allergy)}</Row>
        </tbody>
      </table>

      {/* ---------- C ---------- */}
      <SectionHeading mark="C" title="생활습관" titleEn="Life style" />
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <th className="w-[5rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              1) 운동
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.c.exercise)}
            </td>
            <th className="w-[5rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              2) 수면
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.c.sleep)}
            </td>
            <th className="w-[6rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              3) 교육정도
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.c.education)}
            </td>
          </tr>
          <tr>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              4) 음주
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.c.alcohol)}
            </td>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              5) 흡연
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.c.smoking)}
            </td>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              6) 식이
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.c.diet)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ---------- D ---------- */}
      <SectionHeading
        mark="D"
        title="신체 · 기능 평가"
        titleEn="Medical & Functional"
      />
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <th className="w-[6rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              키 / 체중
            </th>
            <td className="border border-foreground/60 px-2 py-1.5 font-mono">
              {data.d.heightCm ?? "-"}cm / {data.d.weightKg ?? "-"}kg
              {bmi ? ` (BMI ${bmi})` : ""}
            </td>
            <th className="w-[4rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              혈압
            </th>
            <td className="border border-foreground/60 px-2 py-1.5 font-mono">
              {data.d.sbp ?? "-"}/{data.d.dbp ?? "-"} mmHg
            </td>
            <th className="w-[4rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              맥박
            </th>
            <td className="w-[6rem] border border-foreground/60 px-2 py-1.5 font-mono">
              {data.d.pulse ?? "-"} 회/분
            </td>
          </tr>
          <tr>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              시력 (Vision)
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.d.vision)}
            </td>
            <th
              className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium"
              colSpan={1}
            >
              청력
            </th>
            <td className="border border-foreground/60 px-2 py-1.5" colSpan={3}>
              {orDash(data.d.hearing)}
            </td>
          </tr>
          <tr>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              요실금
            </th>
            <td className="border border-foreground/60 px-2 py-1.5">
              {orDash(data.d.incontinence)}
            </td>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              변비
            </th>
            <td className="border border-foreground/60 px-2 py-1.5" colSpan={3}>
              {orDash(data.d.constipation)}
            </td>
          </tr>
          <Row label="영양상태" span={5}>
            {orDash(data.d.nutrition)}
          </Row>
          <Row label="환자 보행상태" span={5}>
            {gait ? gait.label : "-"}
          </Row>
        </tbody>
      </table>

      <table className="mt-1.5 w-full border-collapse">
        <tbody>
          <ScaleLine code="K_ADL" summary={scales.K_ADL ?? null} />
          <ScaleLine code="K_IADL" summary={scales.K_IADL ?? null} />
          <ScaleLine code="TUG" summary={scales.TUG ?? null} />
        </tbody>
      </table>

      {/* ---------- E ---------- */}
      <SectionHeading
        mark="E"
        title="신경정신 평가"
        titleEn="Neuropsychiatric"
      />
      <table className="w-full border-collapse">
        <tbody>
          <ScaleLine code="SGDS_K" summary={scales.SGDS_K ?? null} />
          <ScaleLine code="K_MMSE" summary={scales.K_MMSE ?? null} />
          <Row label="의식 · 지남력" labelWidth="13rem" span={2}>
            {mental ? `${mental.label} (${mental.en})` : "-"}
          </Row>
          <Row label={`${TERMS.BPSD.ko} (BPSD)`} labelWidth="13rem" span={2}>
            {orDash(data.e.bpsd)}
          </Row>
          {data.e.note ? (
            <Row label="특이사항" labelWidth="13rem" span={2}>
              {data.e.note}
            </Row>
          ) : null}
        </tbody>
      </table>

      {/* ================= 2쪽 ================= */}
      <div className="page-break" />

      {/* ---------- F ---------- */}
      <SectionHeading mark="F" title="복용 약물" titleEn="Medication" />
      {medications.length > 0 ? (
        <table className="w-full border-collapse">
          <tbody>
            {medications.map((row) => (
              <Row key={row.key} label={row.label}>
                {orDash(row.item?.drugName)}
              </Row>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-1 py-2 opacity-70">복용 중인 약물 없음</p>
      )}

      {/* ---------- G ---------- */}
      <SectionHeading mark="G" title="사전치료지시" />
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <th className="w-[10rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              심폐소생술 거부 (DNR)
            </th>
            <td className="w-[5rem] border border-foreground/60 px-2 py-1.5 text-center">
              {yesNo(data.g.dnr)}
            </td>
            <th className="w-[6rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              입원 거부
            </th>
            <td className="w-[5rem] border border-foreground/60 px-2 py-1.5 text-center">
              {yesNo(data.g.refuseAdmission)}
            </td>
            <th className="w-[8rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              영양관 공급 거부
            </th>
            <td className="border border-foreground/60 px-2 py-1.5 text-center">
              {yesNo(data.g.refuseTubeFeeding)}
            </td>
          </tr>
          <tr>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              결정한 사람
            </th>
            <td className="border border-foreground/60 px-2 py-1.5" colSpan={2}>
              {orDash(data.g.agreedBy)}
            </td>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              결정일
            </th>
            <td className="border border-foreground/60 px-2 py-1.5" colSpan={2}>
              {orDash(data.g.agreedOn)}
            </td>
          </tr>
          {data.g.note ? (
            <Row label="특이사항" span={5}>
              {data.g.note}
            </Row>
          ) : null}
        </tbody>
      </table>

      {/* ---------- H ---------- */}
      <SectionHeading mark="H" title="문제 목록" titleEn="Problem list" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-1/2 border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              현재 진행 중인 문제 (Active)
            </th>
            <th className="w-1/2 border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              해결된 문제 (Inactive)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-foreground/60 px-2 py-1.5 align-top">
              {data.h.active.filter((v) => v.trim()).length > 0 ? (
                <ol className="flex flex-col gap-0.5">
                  {data.h.active
                    .filter((v) => v.trim())
                    .map((item, i) => (
                      <li key={i}>
                        {i + 1}. {item}
                      </li>
                    ))}
                </ol>
              ) : (
                "-"
              )}
            </td>
            <td className="border border-foreground/60 px-2 py-1.5 align-top">
              {data.h.inactive.filter((v) => v.trim()).length > 0 ? (
                <ol className="flex flex-col gap-0.5">
                  {data.h.inactive
                    .filter((v) => v.trim())
                    .map((item, i) => (
                      <li key={i}>
                        {i + 1}. {item}
                      </li>
                    ))}
                </ol>
              ) : (
                "-"
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ---------- I ---------- */}
      <SectionHeading mark="I" title="관리 계획" titleEn="Management Plan" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-[6.5rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              일자
            </th>
            <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              주요 관리 사항
            </th>
            <th className="w-[5rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-center font-medium">
              완수 여부
            </th>
            <th className="w-[11rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
              불이행 이유
            </th>
          </tr>
        </thead>
        <tbody>
          {plans.length > 0 ? (
            plans.map((row, i) => (
              <tr key={i}>
                <td className="border border-foreground/60 px-2 py-1.5 font-mono">
                  {orDash(row.planDate)}
                </td>
                <td className="border border-foreground/60 px-2 py-1.5">
                  {row.content}
                </td>
                <td className="border border-foreground/60 px-2 py-1.5 text-center">
                  {row.done === true
                    ? "완수"
                    : row.done === false
                      ? "미완"
                      : "-"}
                </td>
                <td className="border border-foreground/60 px-2 py-1.5">
                  {orDash(row.undoneReason)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="border border-foreground/60 px-2 py-3 text-center opacity-70"
                colSpan={4}
              >
                작성된 관리 계획 없음
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ---------- J ---------- */}
      <SectionHeading
        mark="J"
        title="검사"
        titleEn="Initial Lab & X-ray"
      />
      {labs.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-[14rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                검사
              </th>
              <th className="border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                결과
              </th>
              <th className="w-[6.5rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-left font-medium">
                시행일
              </th>
              <th className="w-[3rem] border border-foreground/60 bg-muted/40 px-2 py-1.5 text-center font-medium">
                이상
              </th>
            </tr>
          </thead>
          <tbody>
            {labs.map((row) => {
              const t = TERMS[row.term];
              return (
                <tr key={row.code}>
                  <td className="border border-foreground/60 px-2 py-1.5">
                    {t.ko}
                    <span className="ml-1 font-mono text-xs opacity-70">
                      {t.en}
                    </span>
                  </td>
                  <td className="border border-foreground/60 px-2 py-1.5 font-mono">
                    {orDash(row.entry?.value)}
                    {row.unit && row.entry?.value ? ` ${row.unit}` : ""}
                  </td>
                  <td className="border border-foreground/60 px-2 py-1.5 font-mono">
                    {orDash(row.entry?.takenOn)}
                  </td>
                  <td className="border border-foreground/60 px-2 py-1.5 text-center font-bold">
                    {row.entry?.abnormal ? "V" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="px-1 py-2 opacity-70">기록된 검사 결과 없음</p>
      )}

      {data.j.note ? (
        <table className="mt-1.5 w-full border-collapse">
          <tbody>
            <Row label="참고사항">{data.j.note}</Row>
          </tbody>
        </table>
      ) : null}

      {/* ---------- 하단 서명 ---------- */}
      <footer className="mt-5 flex items-end justify-between gap-6 border-t-2 border-foreground pt-3">
        <span className="text-sm">
          작성일자:{" "}
          <span className="font-mono">
            {orDash(data.footer.writtenOn || formatDate(assessment.assessed_at))}
          </span>
        </span>
        <span className="flex items-baseline gap-2 text-sm">
          의사:
          <span className="inline-block min-w-[7rem] border-b border-foreground/70 pb-0.5 text-center">
            {data.footer.doctorName || " "}
          </span>
          <span>(서명)</span>
        </span>
      </footer>
    </article>
  );
}
