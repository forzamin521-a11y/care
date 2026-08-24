/**
 * 전화번호 하이픈 자동 삽입
 *
 * 숫자만 입력해도 010-1234-5678 형태로 맞춰준다.
 * 이름·관계 같은 메모를 덧붙인 경우(예: "010-1234-5678 (딸)")에는
 * 손대지 않고 그대로 둔다.
 */

/** 번호 앞자리에 따른 자릿수 묶음 */
function groupsFor(digits: string): number[] {
  // 1588-1234 같은 대표번호
  if (/^1[5-9]/.test(digits)) return [4, 4];
  // 휴대폰(010) · 인터넷전화(070) — 항상 11자리
  if (/^0(10|70)/.test(digits)) return [3, 4, 4];
  // 서울
  if (/^02/.test(digits)) return digits.length > 9 ? [2, 4, 4] : [2, 3, 4];
  // 예전 휴대폰(011·016~019)과 지역번호는 10자리·11자리가 모두 있으므로
  // 자릿수를 보고 정한다. 고정해 두면 마지막 한 자리가 잘린다.
  return digits.length > 10 ? [3, 4, 4] : [3, 3, 4];
}

/** 숫자·하이픈·공백·점만 있는 값인지 — 그 외 문자가 섞이면 건드리지 않는다 */
function isPlainNumber(value: string): boolean {
  return /^[\d\-.\s]*$/.test(value);
}

export function formatPhone(input: string): string {
  if (!input) return "";
  if (!isPlainNumber(input)) return input;

  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  const groups = groupsFor(digits);
  const max = groups.reduce((sum, g) => sum + g, 0);
  const capped = digits.slice(0, max);

  const parts: string[] = [];
  let index = 0;

  for (const size of groups) {
    if (index >= capped.length) break;
    parts.push(capped.slice(index, index + size));
    index += size;
  }

  return parts.join("-");
}
