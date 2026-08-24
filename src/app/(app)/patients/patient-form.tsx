"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, ShieldCheck, UserPlus } from "lucide-react";
import { createPatientAction, type PatientFormState } from "./actions";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { parseRrn, calcAge, SEX_LABEL } from "@/lib/rrn";
import { formatPhone } from "@/lib/phone";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="h-12 px-6 text-base" disabled={pending}>
      {pending ? (
        "저장 중…"
      ) : (
        <>
          <UserPlus className="size-5" aria-hidden />
          환자 등록
        </>
      )}
    </Button>
  );
}

export function PatientForm() {
  const [state, formAction] = useActionState<PatientFormState, FormData>(
    createPatientAction,
    {}
  );

  const [rrn, setRrn] = useState(state.values?.rrn ?? "");
  const [sex, setSex] = useState(state.values?.sex ?? "");
  const [phone, setPhone] = useState(() =>
    formatPhone(state.values?.phone ?? "")
  );

  // 주민번호 앞 7자리에서 생년월일·성별·만 나이를 즉시 도출해 보여준다
  const derived = useMemo(() => {
    const parsed = parseRrn(rrn);
    if (!parsed) return null;
    return { ...parsed, age: calcAge(parsed.birthDate) };
  }, [rrn]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
          <CardDescription>
            * 표시는 필수 입력입니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            htmlFor="patient_no"
            label="등록번호"
            required
            error={errors.patient_no}
          >
            <Input
              id="patient_no"
              name="patient_no"
              required
              inputMode="numeric"
              defaultValue={state.values?.patient_no ?? ""}
              placeholder="예: 2026-0001"
              className="h-11 text-base"
            />
          </Field>

          <Field htmlFor="name" label="이름" required error={errors.name}>
            <Input
              id="name"
              name="name"
              required
              defaultValue={state.values?.name ?? ""}
              placeholder="예: 정해님"
              className="h-11 text-base"
            />
          </Field>

          <Field
            htmlFor="rrn"
            label="주민등록번호 앞 7자리"
            hint="뒷 6자리는 저장하지 않습니다. 입력해도 서버에서 버립니다."
            error={errors.rrn}
            className="sm:col-span-2"
          >
            <Input
              id="rrn"
              name="rrn"
              value={rrn}
              onChange={(e) => setRrn(e.target.value)}
              placeholder="예: 370922-2"
              autoComplete="off"
              className="h-11 max-w-[18rem] font-mono text-base"
            />
          </Field>

          {derived ? (
            <div className="flex items-center gap-2.5 rounded-md bg-accent px-3.5 py-2.5 text-sm sm:col-span-2">
              <ShieldCheck
                className="size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-accent-foreground">
                <span className="font-mono">
                  {derived.front}-{derived.sexDigit}******
                </span>
                <span className="mx-2 text-muted-foreground">→</span>
                {derived.birthDate} · {SEX_LABEL[derived.sex]}
                {derived.age !== null ? ` · 만 ${derived.age}세` : ""}
              </span>
            </div>
          ) : (
            <>
              <Field htmlFor="birth_date" label="생년월일" error={errors.birth_date}>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={state.values?.birth_date ?? ""}
                  className="h-11 text-base"
                />
              </Field>

              <Field label="성별" error={errors.sex}>
                <input type="hidden" name="sex" value={sex} />
                <ToggleGroup
                  type="single"
                  value={sex}
                  onValueChange={(v) => setSex(v)}
                  variant="outline"
                  className="w-fit"
                >
                  <ToggleGroupItem value="F" className="h-11 px-6 text-base">
                    여
                  </ToggleGroupItem>
                  <ToggleGroupItem value="M" className="h-11 px-6 text-base">
                    남
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">입소 정보</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="room" label="병동 / 호실" error={errors.room}>
            <Input
              id="room"
              name="room"
              defaultValue={state.values?.room ?? ""}
              placeholder="예: 3병동 805호"
              className="h-11 text-base"
            />
          </Field>

          <Field htmlFor="admitted_on" label="입소일" error={errors.admitted_on}>
            <Input
              id="admitted_on"
              name="admitted_on"
              type="date"
              defaultValue={state.values?.admitted_on ?? ""}
              className="h-11 text-base"
            />
          </Field>

          <Field
            htmlFor="phone"
            label="보호자 연락처"
            hint="숫자만 입력해도 하이픈이 자동으로 들어갑니다."
            error={errors.phone}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                const el = e.target;
                // 커서가 맨 끝일 때(=이어서 입력 중)만 즉시 정리한다.
                // 중간을 고치는 중에 다시 포맷하면 커서가 끝으로 튄다.
                const atEnd = el.selectionStart === el.value.length;
                setPhone(atEnd ? formatPhone(el.value) : el.value);
              }}
              onBlur={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="예: 010-1234-5678"
              className="h-11 text-base"
            />
          </Field>

          <Field htmlFor="address" label="주소" error={errors.address}>
            <Input
              id="address"
              name="address"
              defaultValue={state.values?.address ?? ""}
              placeholder="예: 서울특별시 구로구 연동로 233"
              className="h-11 text-base"
            />
          </Field>

          <Field
            htmlFor="note"
            label="비고"
            error={errors.note}
            className="sm:col-span-2"
          >
            <Textarea
              id="note"
              name="note"
              rows={3}
              defaultValue={state.values?.note ?? ""}
              placeholder="특별히 기록해 둘 내용"
              className="text-base"
            />
          </Field>
        </CardContent>
      </Card>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md bg-danger-soft px-3.5 py-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Button asChild variant="ghost" className="h-12 px-4 text-base">
          <Link href="/patients">취소</Link>
        </Button>
      </div>
    </form>
  );
}
