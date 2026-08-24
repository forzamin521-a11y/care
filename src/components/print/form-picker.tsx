"use client";

import { useMemo, useState } from "react";
import { Check, Printer } from "lucide-react";
import { SCALES, type ScaleCode } from "@/lib/scales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type PatientOption = {
  id: string;
  name: string;
  patient_no: string;
  room: string | null;
};

/**
 * 현장에서 쓸 빈 설문지를 골라 A4 로 인쇄한다.
 * 환자를 고르면 이름·등록번호가 인쇄되고, 고르지 않으면 빈칸으로 나온다.
 */
export function FormPicker({
  codes,
  patients,
  defaultPatientId = "",
}: {
  codes: ScaleCode[];
  patients: PatientOption[];
  defaultPatientId?: string;
}) {
  const [selected, setSelected] = useState<ScaleCode[]>(codes);
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [copies, setCopies] = useState(1);

  const patient = patients.find((p) => p.id === patientId) ?? null;

  const href = useMemo(() => {
    const params = new URLSearchParams();
    params.set("codes", selected.join(","));
    if (patient) {
      params.set("name", patient.name);
      params.set("no", patient.patient_no);
    }
    if (copies > 1) params.set("copies", String(copies));
    return `/print/forms?${params.toString()}`;
  }, [selected, patient, copies]);

  const toggle = (code: ScaleCode) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const sheetCount = selected.length * copies;

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- 설문지 고르기 ---------- */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[1.05rem] font-semibold">인쇄할 설문지</h2>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {codes.map((code) => {
            const def = SCALES[code];
            const active = selected.includes(code);

            return (
              <button
                key={code}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => toggle(code)}
                className={cn(
                  "flex flex-col gap-1.5 rounded-lg border px-4 py-3.5 text-left transition-colors",
                  active
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                      active ? "border-primary bg-primary" : "border-input"
                    )}
                    aria-hidden
                  >
                    {active ? (
                      <Check className="size-3 text-primary-foreground" />
                    ) : null}
                  </span>
                  <span className="text-[0.95rem] font-medium">{def.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {def.nameEn} · {def.kind === "items" ? `${def.items.length}문항` : ""}
                </span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {def.purpose}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- 환자 · 부수 ---------- */}
      <div className="flex flex-wrap items-end gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="patient" className="text-[0.95rem]">
            환자 (선택)
          </Label>
          <select
            id="patient"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="h-11 min-w-[16rem] rounded-md border bg-background px-3 text-base"
          >
            <option value="">이름 없이 빈 양식으로</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.patient_no}
                {p.room ? ` · ${p.room}` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            고르면 환자명·등록번호가 인쇄됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="copies" className="text-[0.95rem]">
            부수
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="copies"
              type="number"
              min={1}
              max={20}
              value={copies}
              onChange={(e) =>
                setCopies(
                  Math.min(Math.max(Number(e.target.value) || 1, 1), 20)
                )
              }
              className="h-11 w-[5rem] rounded-md border bg-background px-3 text-center text-base tabular-nums"
            />
            <span className="text-sm text-muted-foreground">부</span>
          </div>
          <p className="text-xs text-muted-foreground">
            여러 어르신께 쓸 빈 양식을 한 번에
          </p>
        </div>
      </div>

      {/* ---------- 인쇄 ---------- */}
      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button
          asChild={selected.length > 0}
          size="lg"
          disabled={selected.length === 0}
          className="h-12 gap-2 px-6 text-base"
        >
          {selected.length > 0 ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              <Printer className="size-5" aria-hidden />
              설문지 인쇄 (A4 {sheetCount}장)
            </a>
          ) : (
            <span>
              <Printer className="size-5" aria-hidden />
              설문지를 하나 이상 고르세요
            </span>
          )}
        </Button>

        {patient ? (
          <span className="text-sm text-muted-foreground">
            {patient.name} 님 이름으로 인쇄됩니다
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            환자명 칸이 비어 있는 양식으로 인쇄됩니다
          </span>
        )}
      </div>
    </div>
  );
}
