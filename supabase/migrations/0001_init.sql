-- =============================================================
-- 케어닥 포괄평가기록 SaaS — 초기 스키마
--
-- 확정 사항 반영
--   · 주민등록번호 뒷자리는 저장하지 않는다 (생년월일 6자리 + 성별 1자리만)
--   · RLS 는 모든 테이블에 켠다. 정책은 "로그인했으면 전부 허용" 한 줄
--   · 하드 삭제 없음 (진료기록 보존의무) → deleted_at 소프트 삭제
--
-- 실행 방법: Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 Run
-- =============================================================

-- -------------------------------------------------------------
-- 0. 공통 유틸
-- -------------------------------------------------------------

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -------------------------------------------------------------
-- 1. profiles — 사용자 (auth.users 와 1:1)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  name                  text not null default '관리자',   -- 작성자 실명 (기록 추적용)
  role                  text not null default 'admin'
                          check (role in ('admin', 'nurse')),
  must_change_password  boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- auth.users 가 생기면 profiles 를 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', '관리자')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -------------------------------------------------------------
-- 2. patients — 환자
--    주민등록번호: 앞 6자리(생년월일) + 성별 1자리 까지만 저장.
--    뒷 6자리는 저장하지 않으므로 고유식별정보 암호화 대상이 아니다.
-- -------------------------------------------------------------
create table if not exists public.patients (
  id             uuid primary key default gen_random_uuid(),
  patient_no     text not null,                      -- 등록번호
  name           text not null,
  sex            text check (sex in ('M', 'F')),
  birth_date     date,
  rrn_front      char(6),                            -- 주민번호 앞 6자리 (YYMMDD)
  rrn_sex_digit  char(1),                            -- 성별 자리 (1~4, 5~8)
  address        text,
  phone          text,
  room           text,                               -- 병동 / 호실
  admitted_on    date,                               -- 입소일
  admit_reason   text,                               -- 입소이유 (최초평가에서 복사)
  status         text not null default 'active'
                   check (status in ('active', 'discharged', 'deceased')),
  note           text,
  deleted_at     timestamptz,                        -- 소프트 삭제
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 등록번호는 살아있는 환자 사이에서만 유일 (삭제된 건 제외)
create unique index if not exists patients_patient_no_uniq
  on public.patients (patient_no)
  where deleted_at is null;

create index if not exists patients_name_idx on public.patients (name);
create index if not exists patients_status_idx on public.patients (status)
  where deleted_at is null;

drop trigger if exists patients_touch on public.patients;
create trigger patients_touch
  before update on public.patients
  for each row execute function public.touch_updated_at();


-- -------------------------------------------------------------
-- 3. assessments — 평가 회차 (핵심)
--    섹션 A,B,C,D,E,F,G,J 내용은 data jsonb 에 담고,
--    추이 차트·검색이 필요한 값만 별도 컬럼으로 미러링한다.
-- -------------------------------------------------------------
create table if not exists public.assessments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  seq           int not null,                        -- 1차, 2차, 3차...
  kind          text not null default 'periodic'
                  check (kind in ('initial', 'periodic', 'ad_hoc')),
  assessed_at   timestamptz not null default now(),  -- 평가일시
  assessor_id   uuid references public.profiles(id),
  assessor_name text,                                -- 작성자 실명 (계정 공유 대비 필수)
  doctor_name   text,                                -- 의사 서명란
  status        text not null default 'draft'
                  check (status in ('draft', 'completed')),
  completed_at  timestamptz,
  version       int not null default 1,

  data          jsonb not null default '{}'::jsonb,

  -- 차트 / 경고용 미러 컬럼
  height_cm     numeric(5,1),
  weight_kg     numeric(5,1),
  bmi           numeric(4,1) generated always as (
                  case
                    when height_cm is not null and height_cm > 0 and weight_kg is not null
                    then round((weight_kg / ((height_cm / 100.0) ^ 2))::numeric, 1)
                  end
                ) stored,
  sbp           int,                                 -- 수축기 혈압
  dbp           int,                                 -- 이완기 혈압
  pulse         int,                                 -- PR 맥박수

  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint assessments_seq_uniq unique (patient_id, seq)
);

create index if not exists assessments_patient_idx
  on public.assessments (patient_id, assessed_at desc)
  where deleted_at is null;

create index if not exists assessments_status_idx
  on public.assessments (status) where deleted_at is null;

drop trigger if exists assessments_touch on public.assessments;
create trigger assessments_touch
  before update on public.assessments
  for each row execute function public.touch_updated_at();


-- -------------------------------------------------------------
-- 4. assessment_revisions — 수정 이력 (버전 스냅샷)
-- -------------------------------------------------------------
create table if not exists public.assessment_revisions (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  version        int not null,
  data           jsonb not null,                     -- 그 시점의 전체 스냅샷
  changed_by     uuid references public.profiles(id),
  changed_by_name text,
  change_note    text,
  changed_at     timestamptz not null default now(),

  constraint assessment_revisions_uniq unique (assessment_id, version)
);

create index if not exists assessment_revisions_idx
  on public.assessment_revisions (assessment_id, version desc);


-- -------------------------------------------------------------
-- 5. scale_results — 평가척도 결과
--    웹 진행 / 점수만 입력 / 종이 실시 — 세 방식 모두 같은 테이블
--    K_MMSE 는 저작권 문제로 문항을 담지 않고 영역별 점수만 받는다
-- -------------------------------------------------------------
create table if not exists public.scale_results (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.patients(id) on delete cascade,
  assessment_id   uuid references public.assessments(id) on delete set null,

  scale_code      text not null check (scale_code in (
                    'K_ADL',      -- 한국형 일상생활활동 7문항 7~21점
                    'K_IADL',     -- 한국형 도구적 일상생활활동 10문항 평균 0~3
                    'SGDS_K',     -- 단축형 노인우울척도 15문항 0~15점
                    'K_MMSE',     -- 한국판 간이정신상태검사 30점 (영역별 점수만)
                    'TUG',        -- 일어나 걷기 검사 (초)
                    'MNA_SF'      -- 간이영양상태 평가 14점
                  )),
  entry_mode      text not null check (entry_mode in ('web', 'score_only', 'paper')),

  answers         jsonb,                             -- 문항별 응답 (웹 진행 시에만)
  subscores       jsonb,                             -- K-MMSE 영역별 점수 등
  total_score     numeric(6,2),
  interpretation  text,                              -- '우울 의심 (8점 이상)'
  severity        text check (severity in ('ok', 'warn', 'danger')),
  note            text,

  measured_at     timestamptz not null default now(),
  created_by      uuid references public.profiles(id),
  created_by_name text,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists scale_results_trend_idx
  on public.scale_results (patient_id, scale_code, measured_at desc)
  where deleted_at is null;

create index if not exists scale_results_assessment_idx
  on public.scale_results (assessment_id);


-- -------------------------------------------------------------
-- 6. problems — H. Problem list
-- -------------------------------------------------------------
create table if not exists public.problems (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete cascade,
  assessment_id  uuid references public.assessments(id) on delete cascade,
  kind           text not null check (kind in ('active', 'inactive')),
  ord            int not null default 1,
  content        text not null,
  resolved_at    date,                               -- active → inactive 전환 시점
  created_at     timestamptz not null default now()
);

create index if not exists problems_assessment_idx
  on public.problems (assessment_id, kind, ord);


-- -------------------------------------------------------------
-- 7. management_plans — I. Management Plan
-- -------------------------------------------------------------
create table if not exists public.management_plans (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete cascade,
  assessment_id  uuid references public.assessments(id) on delete set null,
  plan_date      date not null,                      -- 일자
  content        text not null,                      -- 주요 관리 사항
  done           boolean not null default false,     -- 완수 여부
  undone_reason  text,                               -- 불이행 이유
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists management_plans_patient_idx
  on public.management_plans (patient_id, plan_date desc);

drop trigger if exists management_plans_touch on public.management_plans;
create trigger management_plans_touch
  before update on public.management_plans
  for each row execute function public.touch_updated_at();


-- -------------------------------------------------------------
-- 8. medications — F. 복용 약물 (12계열)
-- -------------------------------------------------------------
create table if not exists public.medications (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  category       text not null check (category in (
                   'antihypertensive',  -- 고혈압제
                   'diuretic',          -- 이뇨제
                   'antidiabetic',      -- 당뇨약
                   'antidepressant',    -- 항우울제
                   'sedative',          -- 안정제
                   'analgesic',         -- 진통제
                   'antihistamine',     -- 항히스타민제
                   'vasodilator',       -- 혈관확장제
                   'vasoconstrictor',   -- 혈관수축제
                   'narcotic',          -- 마약류
                   'herbal',            -- 한약
                   'other'              -- 기타
                 )),
  drug_name      text,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists medications_assessment_idx
  on public.medications (assessment_id, category);


-- -------------------------------------------------------------
-- 9. labs — J. Initial Lab & X-ray (필수 17종)
-- -------------------------------------------------------------
create table if not exists public.labs (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  code           text not null,                      -- 'CBC', 'ESR', 'CHEST_PA' ...
  value          text,
  taken_on       date,
  abnormal       boolean not null default false,
  created_at     timestamptz not null default now(),

  constraint labs_uniq unique (assessment_id, code)
);


-- -------------------------------------------------------------
-- 10. audit_logs — 감사 로그
-- -------------------------------------------------------------
create table if not exists public.audit_logs (
  id            bigserial primary key,
  actor_id      uuid,
  actor_name    text,
  action        text not null check (action in (
                  'login', 'logout', 'view', 'create', 'update', 'delete', 'print', 'password_change'
                )),
  target_table  text,
  target_id     uuid,
  detail        jsonb,
  ip            inet,
  user_agent    text,
  at            timestamptz not null default now()
);

create index if not exists audit_logs_at_idx on public.audit_logs (at desc);
create index if not exists audit_logs_target_idx on public.audit_logs (target_table, target_id);


-- =============================================================
-- RLS — 모든 테이블에 켠다.
--
-- 권한을 여러 단계로 나누지는 않는다. 다만 anon 공개 키가 브라우저에
-- 노출되므로 RLS 를 끄면 URL 만 아는 사람이 전 환자 정보를 조회할 수 있다.
-- 정책은 "로그인했으면 전부 허용" 한 줄이라 사용상 불편은 없다.
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'patients', 'assessments', 'assessment_revisions',
    'scale_results', 'problems', 'management_plans', 'medications',
    'labs', 'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists authenticated_all on public.%I', t);
    execute format(
      'create policy authenticated_all on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end
$$;

-- anon 역할은 아무 권한도 갖지 않는다 (명시적으로 회수)
revoke all on all tables in schema public from anon;
