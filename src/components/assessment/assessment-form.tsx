"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  Check,
  CircleAlert,
  CloudOff,
  Loader2,
  Printer,
  Save,
  CircleCheckBig,
  RotateCcw,
} from "lucide-react";
import {
  completeAssessmentAction,
  saveDraftAction,
  type SaveDraftResult,
} from "@/app/(app)/assessments/actions";
import {
  SECTIONS,
  isSectionFilled,
  type AssessmentData,
  type SectionKey,
} from "@/lib/schemas/assessment";
import type { ScaleCode } from "@/lib/scales";
import { describePatient } from "@/lib/rrn";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { SectionCard } from "./parts";
import { DeleteDraftButton } from "@/app/(app)/assessments/delete-draft";
import {
  SectionA,
  SectionB,
  SectionC,
  SectionD,
  SectionE,
  SectionF,
  SectionG,
  SectionH,
  SectionI,
  SectionJ,
  type ScaleSummary,
} from "./sections";

type Patient = {
  id: string;
  name: string;
  patient_no: string;
  sex: "M" | "F" | null;
  birth_date: string | null;
  room: string | null;
};

type Assessment = {
  id: string;
  seq: number;
  kind: string;
  status: string;
  assessed_at: string;
  assessor_name: string | null;
};

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY = 3000;

/** localStorage 는 스스로 알려주지 않는다 — 구독은 비워 둔다 */
function subscribeNever() {
  return () => {};
}

function backupKey(assessmentId: string) {
  return `caredoc:draft:${assessmentId}`;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function AssessmentForm({
  assessment,
  patient,
  initialData,
  scales,
}: {
  assessment: Assessment;
  patient: Patient;
  initialData: AssessmentData;
  scales: Partial<Record<ScaleCode, ScaleSummary>>;
}) {
  const [data, setData] = useState<AssessmentData>(initialData);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backupDismissed, setBackupDismissed] = useState(false);

  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- 브라우저 임시 보관본 ----------
  // localStorage 는 React 바깥의 저장소이므로 useSyncExternalStore 로 읽는다.
  // (effect 안에서 setState 하면 하이드레이션 직후 불필요한 재렌더가 생긴다)
  const backupRaw = useSyncExternalStore(
    subscribeNever,
    () => {
      try {
        return window.localStorage.getItem(backupKey(assessment.id));
      } catch {
        return null; // 저장소 접근이 막힌 환경
      }
    },
    () => null // 서버 렌더 시에는 없음
  );

  const backupFound = useMemo<AssessmentData | null>(() => {
    if (backupDismissed || !backupRaw) return null;
    try {
      return JSON.parse(backupRaw) as AssessmentData;
    } catch {
      return null;
    }
  }, [backupRaw, backupDismissed]);

  // ---------- 저장 ----------
  const save = useCallback(
    async (next: AssessmentData) => {
      setStatus("saving");
      let result: SaveDraftResult;

      try {
        result = await saveDraftAction(assessment.id, next);
      } catch {
        result = { ok: false, error: "서버에 연결하지 못했습니다." };
      }

      if (result.ok) {
        dirtyRef.current = false;
        setStatus("saved");
        setSavedAt(result.savedAt ?? new Date().toISOString());
        setErrorMessage(null);
        try {
          window.localStorage.removeItem(backupKey(assessment.id));
        } catch {
          /* 무시 */
        }
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "저장에 실패했습니다.");
        // 서버에 못 넣었으니 이 브라우저에라도 남겨둔다
        try {
          window.localStorage.setItem(
            backupKey(assessment.id),
            JSON.stringify(next)
          );
        } catch {
          /* 무시 */
        }
      }
    },
    [assessment.id]
  );

  // ---------- 자동 저장 (3초 debounce) ----------
  useEffect(() => {
    if (!dirtyRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save(data);
    }, AUTOSAVE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, save]);

  // ---------- 저장 안 된 채 나가려 하면 경고 ----------
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ---------- 섹션별 patch ----------
  const patchSection = useCallback(
    <K extends SectionKey>(key: K) =>
      (patch: Partial<AssessmentData[K]>) => {
        dirtyRef.current = true;
        setStatus("dirty");
        setData((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
      },
    []
  );

  const patchA = useMemo(() => patchSection("a"), [patchSection]);
  const patchB = useMemo(() => patchSection("b"), [patchSection]);
  const patchC = useMemo(() => patchSection("c"), [patchSection]);
  const patchD = useMemo(() => patchSection("d"), [patchSection]);
  const patchE = useMemo(() => patchSection("e"), [patchSection]);
  const patchF = useMemo(() => patchSection("f"), [patchSection]);
  const patchG = useMemo(() => patchSection("g"), [patchSection]);
  const patchH = useMemo(() => patchSection("h"), [patchSection]);
  const patchI = useMemo(() => patchSection("i"), [patchSection]);
  const patchJ = useMemo(() => patchSection("j"), [patchSection]);
  const patchFooter = useMemo(() => patchSection("footer"), [patchSection]);

  const filled = useMemo(() => {
    const map = {} as Record<SectionKey, boolean>;
    for (const section of SECTIONS) {
      map[section.key] = isSectionFilled(data, section.key);
    }
    return map;
  }, [data]);

  const filledCount = SECTIONS.filter((s) => filled[s.key]).length;

  const restoreBackup = () => {
    if (!backupFound) return;
    dirtyRef.current = true;
    setData(backupFound);
    setBackupDismissed(true);
    setStatus("dirty");
  };

  const discardBackup = () => {
    try {
      window.localStorage.removeItem(backupKey(assessment.id));
    } catch {
      /* 무시 */
    }
    setBackupDismissed(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ---------- 환자 확인 바 (항상 보임) ---------- */}
      <div className="sticky top-16 z-30 -mx-4 border-b bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <Link
              href={`/patients/${patient.id}`}
              className="text-lg font-semibold underline-offset-4 hover:underline"
            >
              {patient.name}
            </Link>
            <span className="text-sm text-muted-foreground">
              {describePatient(patient.sex, patient.birth_date)}
            </span>
            <span className="font-mono text-sm text-muted-foreground">
              {patient.patient_no}
            </span>
            {patient.room ? (
              <span className="text-sm text-muted-foreground">
                {patient.room}
              </span>
            ) : null}
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
              {assessment.seq}차 ·{" "}
              {assessment.status === "completed" ? "완료" : "작성 중"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SaveIndicator
              status={status}
              savedAt={savedAt}
              error={errorMessage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => void save(data)}
              disabled={status === "saving"}
            >
              <Save className="size-4" aria-hidden />
              지금 저장
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- 임시 보관본 안내 ---------- */}
      {backupFound ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-warn-soft px-4 py-3 text-sm">
          <CircleAlert className="size-4 shrink-0 text-warn" aria-hidden />
          <span>
            저장되지 못한 내용이 이 브라우저에 남아 있습니다. 불러올까요?
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-9"
              onClick={restoreBackup}
            >
              불러오기
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9"
              onClick={discardBackup}
            >
              버리기
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        {/* ---------- 섹션 네비 ---------- */}
        <nav
          aria-label="섹션 이동"
          className="no-print top-[8.75rem] hidden self-start lg:sticky lg:block"
        >
          <div className="flex items-center justify-between border-b pb-2 text-xs text-muted-foreground">
            <span>섹션</span>
            <span className="tabular-nums">
              {filledCount} / {SECTIONS.length}
            </span>
          </div>
          <ol className="mt-2 flex flex-col gap-0.5">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <a
                  href={`#section-${section.key}`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded font-mono text-[0.7rem]",
                      filled[section.key]
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                    aria-hidden
                  >
                    {section.mark}
                  </span>
                  <span className="truncate">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ---------- 섹션 본문 ---------- */}
        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard meta={SECTIONS[0]} filled={filled.a}>
            <SectionA value={data.a} patch={patchA} />
          </SectionCard>

          <SectionCard meta={SECTIONS[1]} filled={filled.b}>
            <SectionB value={data.b} patch={patchB} />
          </SectionCard>

          <SectionCard meta={SECTIONS[2]} filled={filled.c}>
            <SectionC value={data.c} patch={patchC} />
          </SectionCard>

          <SectionCard meta={SECTIONS[3]} filled={filled.d}>
            <SectionD
              value={data.d}
              patch={patchD}
              assessmentId={assessment.id}
              scales={scales}
            />
          </SectionCard>

          <SectionCard meta={SECTIONS[4]} filled={filled.e}>
            <SectionE
              value={data.e}
              patch={patchE}
              assessmentId={assessment.id}
              scales={scales}
            />
          </SectionCard>

          <SectionCard
            meta={SECTIONS[5]}
            filled={filled.f}
            description="복용 중인 약이 있는 계열에만 약품명을 적으세요."
          >
            <SectionF value={data.f} patch={patchF} />
          </SectionCard>

          <SectionCard meta={SECTIONS[6]} filled={filled.g}>
            <SectionG value={data.g} patch={patchG} />
          </SectionCard>

          <SectionCard meta={SECTIONS[7]} filled={filled.h}>
            <SectionH value={data.h} patch={patchH} />
          </SectionCard>

          <SectionCard meta={SECTIONS[8]} filled={filled.i}>
            <SectionI value={data.i} patch={patchI} />
          </SectionCard>

          <SectionCard meta={SECTIONS[9]} filled={filled.j}>
            <SectionJ value={data.j} patch={patchJ} />
          </SectionCard>

          {/* ---------- 하단 서명 ---------- */}
          <section className="rounded-xl border bg-card px-5 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field htmlFor="footer-writtenOn" label="작성일자">
                <Input
                  id="footer-writtenOn"
                  type="date"
                  value={data.footer.writtenOn}
                  onChange={(e) => patchFooter({ writtenOn: e.target.value })}
                  className="h-11 max-w-[12rem] text-base"
                />
              </Field>
              <Field htmlFor="footer-doctorName" label="의사">
                <Input
                  id="footer-doctorName"
                  value={data.footer.doctorName}
                  onChange={(e) => patchFooter({ doctorName: e.target.value })}
                  placeholder="담당 의사 이름"
                  className="h-11 max-w-[14rem] text-base"
                />
              </Field>
            </div>
          </section>

          <CompleteBar
            assessment={assessment}
            onBeforeSubmit={() => save(data)}
          />
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({
  status,
  savedAt,
  error,
}: {
  status: SaveStatus;
  savedAt: string | null;
  error: string | null;
}) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        저장 중…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        className="flex items-center gap-1.5 rounded-md bg-danger-soft px-2.5 py-1 text-sm"
        role="status"
      >
        <CloudOff className="size-3.5 text-danger" aria-hidden />
        {error ?? "저장 실패"} — 브라우저에 임시 보관됨
      </span>
    );
  }

  if (status === "dirty") {
    return (
      <span className="text-sm text-muted-foreground">입력 중…</span>
    );
  }

  if (status === "saved" && savedAt) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-3.5 text-ok" aria-hidden />
        저장됨 {timeLabel(savedAt)}
      </span>
    );
  }

  return null;
}

function CompleteBar({
  assessment,
  onBeforeSubmit,
}: {
  assessment: Assessment;
  onBeforeSubmit: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const alreadyCompleted = assessment.status === "completed";

  const handleComplete = async () => {
    setPending(true);
    // 완료 처리 전에 마지막 입력분을 확실히 저장한다
    await onBeforeSubmit();
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      action={completeAssessmentAction}
      className="no-print flex flex-col gap-4 rounded-xl border bg-card px-5 py-5"
    >
      <input type="hidden" name="assessmentId" value={assessment.id} />

      <div className="flex flex-wrap items-end gap-4">
        <Field htmlFor="assessorName" label="작성자" hint="누가 작성했는지 남깁니다.">
          <Input
            id="assessorName"
            name="assessorName"
            defaultValue={assessment.assessor_name ?? ""}
            required
            className="h-11 w-[14rem] text-base"
          />
        </Field>

        {alreadyCompleted ? (
          <Field
            htmlFor="changeNote"
            label="수정 사유"
            hint="이력에 함께 기록됩니다."
          >
            <Input
              id="changeNote"
              name="changeNote"
              placeholder="예: 혈압 수치 오기 수정"
              className="h-11 w-[18rem] text-base"
            />
          </Field>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="lg"
          className="h-12 gap-2 px-6 text-base"
          onClick={handleComplete}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <CircleCheckBig className="size-5" aria-hidden />
          )}
          {alreadyCompleted ? "수정 내용 저장하고 다시 완료" : "평가 완료"}
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-12 gap-1.5 px-4 text-base"
        >
          <Link href={`/assessments/${assessment.id}/print`} target="_blank">
            <Printer className="size-4" aria-hidden />
            인쇄 미리보기
          </Link>
        </Button>

        {alreadyCompleted ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <RotateCcw className="size-3.5" aria-hidden />
            완료된 평가를 수정하면 새 버전으로 기록됩니다.
          </span>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">
              완료해도 나중에 다시 수정할 수 있습니다.
            </span>
            <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              잘못 만든 평가라면
              <DeleteDraftButton
                assessmentId={assessment.id}
                seq={assessment.seq}
                hasContent
              />
            </span>
          </>
        )}
      </div>
    </form>
  );
}
