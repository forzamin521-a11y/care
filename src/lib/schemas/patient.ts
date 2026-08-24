import { z } from "zod";
import { parseRrn } from "@/lib/rrn";
import { formatPhone } from "@/lib/phone";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null));

export const patientFormSchema = z
  .object({
    patient_no: z
      .string()
      .trim()
      .min(1, "등록번호를 입력하세요.")
      .max(40, "등록번호가 너무 깁니다."),
    name: z
      .string()
      .trim()
      .min(1, "이름을 입력하세요.")
      .max(60, "이름이 너무 깁니다."),

    /**
     * 주민등록번호 — 앞 7자리만 사용한다.
     * 뒷자리를 함께 입력해도 서버에서 버린다.
     */
    rrn: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : null)),

    // 성별을 고르지 않으면 빈 문자열이 넘어온다 — null 로 받아준다
    sex: z
      .union([z.enum(["M", "F"]), z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    birth_date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일 형식이 올바르지 않습니다.")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),

    room: optionalText,
    // 화면에서 이미 맞춰 주지만, 붙여넣기 등으로 들어온 값도 서버에서 정규화한다
    phone: z
      .string()
      .trim()
      .max(60)
      .optional()
      .transform((v) => {
        const formatted = formatPhone(v ?? "");
        return formatted ? formatted : null;
      }),
    address: optionalText,
    admitted_on: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "입소일 형식이 올바르지 않습니다.")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),
    note: optionalText,
  })
  .transform((value, ctx) => {
    let { sex, birth_date } = value;
    let rrn_front: string | null = null;
    let rrn_sex_digit: string | null = null;

    if (value.rrn) {
      const parsed = parseRrn(value.rrn);

      if (!parsed) {
        ctx.addIssue({
          code: "custom",
          path: ["rrn"],
          message:
            "주민등록번호 앞 7자리를 확인하세요. 예: 370922-2 (뒷자리는 저장하지 않습니다)",
        });
        return z.NEVER;
      }

      rrn_front = parsed.front;
      rrn_sex_digit = parsed.sexDigit;
      // 주민번호에서 도출한 값을 우선한다
      sex = parsed.sex;
      birth_date = parsed.birthDate;
    }

    return {
      patient_no: value.patient_no,
      name: value.name,
      sex: sex ?? null,
      birth_date,
      rrn_front,
      rrn_sex_digit,
      room: value.room,
      phone: value.phone,
      address: value.address,
      admitted_on: value.admitted_on,
      note: value.note,
    };
  });

export type PatientFormInput = z.input<typeof patientFormSchema>;
export type PatientFormValues = z.output<typeof patientFormSchema>;
