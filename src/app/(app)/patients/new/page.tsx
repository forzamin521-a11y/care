import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "../patient-form";

export const metadata: Metadata = { title: "환자 등록" };

export default function NewPatientPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/patients"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          환자 목록
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">환자 등록</h1>
      </div>

      <PatientForm />
    </div>
  );
}
