import type { ItemScaleDef } from "@/lib/scales";

/**
 * A4 빈 설문지 한 장.
 *
 * 현장에서 종이로 실시한 뒤 "점수만 입력" 으로 결과를 넣는다.
 * 여러 장을 이어 인쇄할 수 있도록 페이지 나눔은 바깥에서 제어한다.
 */
export function ScaleQuestionnaire({
  def,
  patientName = "",
  patientNo = "",
  date = "",
}: {
  def: ItemScaleDef;
  patientName?: string;
  patientNo?: string;
  date?: string;
}) {
  return (
    <article className="flex flex-col gap-5">
      {/* ---------- 머리말 ---------- */}
      <header className="flex flex-col gap-3 border-b-2 border-foreground pb-3">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-bold">
            {def.name}
            <span className="ml-2 text-base font-normal">({def.nameEn})</span>
          </h1>
          <span className="text-sm">{def.items.length}문항</span>
        </div>

        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <th className="w-[5rem] border border-foreground/60 bg-muted/50 px-2 py-1.5 text-left font-medium">
                환자명
              </th>
              <td className="border border-foreground/60 px-2 py-1.5">
                {patientName}
              </td>
              <th className="w-[5rem] border border-foreground/60 bg-muted/50 px-2 py-1.5 text-left font-medium">
                등록번호
              </th>
              <td className="w-[7rem] border border-foreground/60 px-2 py-1.5">
                {patientNo}
              </td>
              <th className="w-[4rem] border border-foreground/60 bg-muted/50 px-2 py-1.5 text-left font-medium">
                실시일
              </th>
              <td className="w-[7rem] border border-foreground/60 px-2 py-1.5">
                {date}
              </td>
            </tr>
          </tbody>
        </table>
      </header>

      {/* ---------- 문항 ---------- */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-[2.2rem] border border-foreground/60 bg-muted/50 px-1 py-1.5">
              번호
            </th>
            <th className="border border-foreground/60 bg-muted/50 px-2 py-1.5 text-left">
              문항
            </th>
            {def.choices.map((choice) => (
              <th
                key={choice.value}
                className="w-[4.5rem] border border-foreground/60 bg-muted/50 px-1 py-1.5 text-center text-xs"
              >
                {choice.label}
              </th>
            ))}
            {def.allowNotApplicable ? (
              <th className="w-[4rem] border border-foreground/60 bg-muted/50 px-1 py-1.5 text-center text-xs">
                해당없음
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {def.items.map((item) => (
            <tr key={item.no} className="avoid-break">
              <td className="border border-foreground/60 px-1 py-2 text-center font-mono">
                {item.no}
                {item.reverse ? "★" : ""}
              </td>
              <td className="border border-foreground/60 px-2 py-2">
                <span className="text-[0.95rem]">{item.text}</span>
                {item.hint ? (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({item.hint})
                  </span>
                ) : null}
              </td>
              {def.choices.map((choice) => (
                <td
                  key={choice.value}
                  className="border border-foreground/60 px-1 py-2 text-center align-middle"
                >
                  <span className="mx-auto block size-4 border border-foreground/70" />
                </td>
              ))}
              {def.allowNotApplicable ? (
                <td className="border border-foreground/60 px-1 py-2 text-center align-middle">
                  <span className="mx-auto block size-4 border border-foreground/70" />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---------- 채점 안내 ---------- */}
      <section className="avoid-break flex flex-col gap-2 border border-foreground/60 px-3 py-3 text-sm">
        <h2 className="font-bold">채점 방법</h2>
        <p className="leading-relaxed">{def.scoringNote}</p>

        <div className="mt-1 flex flex-wrap items-center gap-6 border-t border-foreground/30 pt-2">
          <span className="flex items-baseline gap-2">
            <span className="font-medium">총점</span>
            <span className="inline-block w-[6rem] border-b border-foreground/70" />
            <span>{def.unit}</span>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="font-medium">실시자</span>
            <span className="inline-block w-[7rem] border-b border-foreground/70" />
          </span>
        </div>
      </section>

      <footer className="flex items-center justify-between text-xs opacity-70">
        <span>출처: {def.source}</span>
        <span>
          실시 후 시스템의 &ldquo;점수만 입력&rdquo;에 결과를 넣으세요.
        </span>
      </footer>
    </article>
  );
}
