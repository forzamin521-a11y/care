/**
 * 주민등록번호 처리
 *
 * ★ 정책: 뒷 6자리는 저장하지 않는다.
 *   앞 6자리(생년월일)와 성별 1자리까지만 다루므로 개인정보보호법상
 *   고유식별정보(13자리 주민등록번호) 암호화 의무 대상이 아니다.
 *   화면에는 항상 370922-2****** 형태로 마스킹해 보여준다.
 */

export type RrnParts = {
  /** 앞 6자리 YYMMDD */
  front: string;
  /** 성별 자리 (1~8) */
  sexDigit: string;
  /** 도출된 생년월일 */
  birthDate: string; // YYYY-MM-DD
  /** 도출된 성별 */
  sex: "M" | "F";
};

/** 성별 자리에서 세기와 성별을 읽는다 */
function decodeSexDigit(
  digit: string
): { century: number; sex: "M" | "F" } | null {
  switch (digit) {
    case "1":
      return { century: 1900, sex: "M" };
    case "2":
      return { century: 1900, sex: "F" };
    case "3":
      return { century: 2000, sex: "M" };
    case "4":
      return { century: 2000, sex: "F" };
    // 5~8 은 외국인 (국내거소신고)
    case "5":
      return { century: 1900, sex: "M" };
    case "6":
      return { century: 1900, sex: "F" };
    case "7":
      return { century: 2000, sex: "M" };
    case "8":
      return { century: 2000, sex: "F" };
    // 9~0 은 1800년대
    case "9":
      return { century: 1800, sex: "M" };
    case "0":
      return { century: 1800, sex: "F" };
    default:
      return null;
  }
}

/**
 * 입력값에서 앞 7자리를 뽑아 생년월일·성별을 도출한다.
 * "370922-2", "3709222", "370922 - 2******" 모두 받아들인다.
 * 뒷자리를 함께 입력해도 앞 7자리만 남기고 버린다.
 */
export function parseRrn(input: string): RrnParts | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 7) return null;

  const front = digits.slice(0, 6);
  const sexDigit = digits.slice(6, 7);

  const decoded = decodeSexDigit(sexDigit);
  if (!decoded) return null;

  const yy = Number(front.slice(0, 2));
  const mm = Number(front.slice(2, 4));
  const dd = Number(front.slice(4, 6));

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  const year = decoded.century + yy;
  const birthDate = `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

  // 실제로 존재하는 날짜인지 확인 (2월 30일 등 방어)
  const probe = new Date(`${birthDate}T00:00:00`);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() + 1 !== mm ||
    probe.getDate() !== dd
  ) {
    return null;
  }

  return { front, sexDigit, birthDate, sex: decoded.sex };
}

/** 화면·인쇄용 마스킹 표기 — 370922-2****** */
export function maskRrn(
  front: string | null | undefined,
  sexDigit: string | null | undefined
): string {
  if (!front) return "-";
  return `${front}-${sexDigit ?? "*"}******`;
}

/** 만 나이 */
export function calcAge(
  birthDate: string | null | undefined,
  at: Date = new Date()
): number | null {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  let age = at.getFullYear() - birth.getFullYear();
  const monthDiff = at.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export const SEX_LABEL: Record<"M" | "F", string> = {
  M: "남",
  F: "여",
};

/** "여 / 만 88세" 형태 */
export function describePatient(
  sex: "M" | "F" | null | undefined,
  birthDate: string | null | undefined
): string {
  const age = calcAge(birthDate);
  const sexText = sex ? SEX_LABEL[sex] : "-";
  return age === null ? sexText : `${sexText} / 만 ${age}세`;
}
