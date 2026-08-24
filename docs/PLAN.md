# 케어닥 포괄평가기록 SaaS — 개발 계획서

작성일: 2026-08-24
대상: 요양병원 입소자 「포괄평가기록부」 작성·이력관리 웹 서비스
스택: Next.js 16 + Tailwind CSS v4 + shadcn/ui + Supabase(Seoul) + Vercel

---

## 1. 목표

| 현재 (종이) | 개선 후 (웹) |
|---|---|
| 손글씨 2장, 판독 어려움 | 화면 입력 → 인쇄물은 항상 깔끔 |
| 지난 평가와 비교 불가 | 회차별 이력 + 점수 변화 자동 비교 |
| ADL/GDS/MMSE 점수 손계산 | 자동 채점 + 해석 자동 표시 |
| 영어 용어(Incontinence, DNR…) 해석 필요 | 한글 병기 + 설명 툴팁 |
| 분실·보관 부담 | 클라우드 저장 + A4 인쇄 언제든 |

핵심 가치 3개: **① 빠른 입력 ② 정확한 채점 ③ 이력 추적**

---

## 2. 양식 분석 결과 (references 4장 기준)

참고 이미지에는 두 가지 버전이 있습니다.
- 구버전: 「포괄평가기록지」 — 1~7 번호 체계
- 신버전: 「포괄평가기록부 [입소자 포괄적 평가]」 — A~I 알파벳 체계 (항목이 더 많음)

**신버전(A~I)을 기준 스키마로 채택**하고, 구버전 항목은 신버전에 매핑합니다.

### 최종 섹션 구조 (10개 섹션)

| # | 섹션 | 항목 |
|---|---|---|
| 0 | **기본정보** | 등록번호, 이름, 성별/나이, 주민등록번호, 주소, 평가일시 |
| A | **진단명(기존질병)** | 입소이유(서술), 의료기관 진단명(서술), 질병 체크리스트 15종 |
| B | **과거력** | 1)주요수술 2)급성기 병동 입원 3)알레르기 |
| C | **Life style (생활습관)** | 1)운동 2)수면 3)교육정도 4)음주 5)흡연 6)식이 |
| D | **Medical & Functional (신체·기능 평가)** | Ht/Wt, BP, PR, Vision, Hearing, ADL, IADL, Incontinence, Constipation, Nutrition, Mobility(TUG), 환자보행상태 |
| E | **Neuropsychiatric (신경정신 평가)** | GDS-SF, K-MMSE, BPSD, Mental status |
| F | **Medication (복용 약물)** | 12개 계열 체크 + 약품명 메모 |
| G | **사전치료지시** | DNR, 입원거부, 영양관 공급 거부 |
| H | **Problem list** | Active(진행중) 1~4, Inactive(해결됨) 1~4 |
| I | **Management Plan** | 일자 / 주요 관리 사항 / 완수 여부 / 불이행 이유 (여러 줄 누적) |
| J | **참고사항 · Initial Lab & X-ray** | 필수검사 17종 결과 + 시행일 |
| — | **하단** | 작성일자, 의사 서명 |

### A. 질병 체크리스트 (원본 표 그대로 15종)
고혈압 · 당뇨 · 고관절염 · 골다공증 · 뇌졸중 · 관상동맥질환 · 심부전 · 치매 · 부정맥 · COPD · 암 · 파킨슨병 · 백내장 · 갑상선기능 이상(↑↓) · 기타

### D. 환자보행상태 (4택 1)
보행가능 / 보조기 사용 보행가능 / 보행불가능 / 와상상태

### E. Mental status (3택 1)
oriented(지남력 있음) / disoriented(지남력 없음) / not alert(의식 저하)

### F. 약물 12계열
고혈압제 · 이뇨제 · 당뇨약 · 항우울제 · 안정제 · 진통제 · 항히스타민제 · 혈관확장제 · 혈관수축제 · 마약류 · 한약 · 기타

### J. 필수 검사 17종
CBC · ESR · UA · Stool · T.P/Alb · FBS · BUN/Cr · Uric Acid · T.Bilirubin · AST/ALT · ALP · T.Chol · TSH/T4 · EKG · Chest PA · L-S Spine · Knee

---

## 3. 영어 의료용어 한글 병기 사전

화면에는 **`한글 (English)`** 형태로 표시하고, ⓘ 아이콘에 마우스를 올리면 쉬운 설명이 뜹니다.
코드상 한 곳(`lib/terms.ts`)에서 관리하여 표기가 어긋나지 않게 합니다.

### 평가 항목
| 원문 | 한글 표기 | 툴팁 설명 |
|---|---|---|
| ADL | 일상생활 수행능력 | 혼자 씻고, 먹고, 옷 입고, 화장실 가는 능력 |
| IADL | 도구적 일상생활 수행능력 | 전화·장보기·약 챙겨먹기·돈 관리 등 좀 더 복잡한 일 |
| Ht / Wt | 키 / 체중 | BMI(체질량지수) 자동 계산 |
| BP (Bp) | 혈압 | 수축기/이완기, 단위 mmHg |
| PR | 맥박수 | 1분간 심장이 뛰는 횟수 (회/분) |
| Vision | 시력 | 안경·돋보기 사용 여부 포함 |
| Hearing | 청력 | 보청기 사용 여부 포함 |
| Incontinence | 요실금·대변실금 | 소변이나 대변을 참지 못하고 새는 상태 |
| Constipation | 변비 | 배변 곤란·횟수 감소 |
| Nutrition | 영양상태 | 식사량, 경관식 여부, 체중 변화 |
| Mobility (timed "up and go" test) | 이동능력 (일어나 걷기 검사) | 의자에서 일어나 3m 걸어갔다 돌아와 앉는 시간(초). 13.5초 이상이면 낙상 위험 |
| Neuropsychiatric | 신경정신 평가 | 우울·인지·치매행동 관련 평가 |
| Mental status | 의식·지남력 상태 | 지금이 언제·어디인지 아는지 |
| oriented / disoriented | 지남력 있음 / 지남력 없음 | 시간·장소·사람을 알아보는지 |
| not alert | 의식 저하 | 불러도 반응이 흐리거나 잠에 빠져 있음 |
| BPSD | 치매행동심리증상 | 배회, 망상, 공격성, 밤에 잠 안 자기 등 |
| GDS-SF | 노인우울척도 단축형 | 15문항으로 우울 정도 확인 |
| K-MMSE | 한국판 간이정신상태검사 | 30점 만점 인지기능(치매) 검사 |
| DNR | 심폐소생술 거부 | 임종 시 심장마사지·인공호흡을 하지 않기로 미리 정해두는 것 |
| Medication | 복용 약물 | |
| Active problem | 현재 진행 중인 문제 | 지금 관리해야 하는 것 |
| Inactive problem | 해결된/비활동 문제 | 지난 문제로 지금은 안정된 것 |
| Management Plan | 관리 계획 | 무엇을, 언제까지, 했는지/못 했으면 왜 |

### J. 검사 항목
| 원문 | 한글 표기 | 무엇을 보는 검사인가 |
|---|---|---|
| CBC | 일반혈액검사 | 빈혈·감염·혈액 이상 |
| ESR | 적혈구침강속도 | 몸속 염증 정도 |
| UA | 소변검사 | 요로감염·단백뇨·혈뇨 |
| Stool | 대변검사 | 장출혈·기생충·감염 |
| T.P / Alb | 총단백 / 알부민 | 영양상태 (욕창·부종과 관련) |
| FBS | 공복혈당 | 당뇨 확인 |
| BUN / Cr | 요소질소 / 크레아티닌 | 콩팥(신장) 기능 |
| Uric Acid | 요산 | 통풍 |
| T.Bilirubin | 총빌리루빈 | 황달·간담도 이상 |
| AST / ALT | 간효소 수치 | 간 손상 여부 |
| ALP | 알칼리인산분해효소 | 간·담도·뼈 질환 |
| T.Chol | 총콜레스테롤 | 고지혈증 |
| TSH / T4 | 갑상선 기능 검사 | 갑상선 기능 저하/과다 |
| EKG | 심전도 | 부정맥·심장 이상 |
| Chest PA | 흉부 X선(정면) | 폐렴·결핵·심장 크기 |
| L-S Spine | 허리(요천추) X선 | 척추 압박골절·협착 |
| Knee | 무릎 X선 | 무릎 관절염 |

---

## 4. 평가척도(설문) 4종 + 보조 2종

### 4-1. 확정된 도구 정의 (문헌 확인 완료)

| 도구 | 문항 | 응답 | 점수 범위 | 해석 기준 |
|---|---|---|---|---|
| **K-ADL** (한국형 일상생활활동) | 7문항 — 옷 입기, 세수·양치·머리감기, 목욕, 식사하기, 체위변경(이동), 화장실 사용, 대소변 조절 | 3점 척도<br>①완전자립 ②부분도움 ③완전도움 | 7~21점 | 7점=완전자립, 점수↑ = 의존도↑ |
| **K-IADL** (한국형 도구적 일상생활활동) | 10문항 — 몸단장, 집안일, 식사준비, 빨래, 근거리 외출, 교통수단 이용, 물건 사기, 금전관리, 전화사용, 약 챙겨먹기 | 0~3점<br>(0 혼자가능 / 1 약간도움 / 2 많은도움 / 3 불가능) + **해당없음** | 총점 ÷ 해당 문항 수 = **평균 0~3** | 평균 **0.43 이상**이면 기능장애 의심 |
| **GDS-SF / SGDS-K** (단축형 노인우울척도) | 15문항 | 예 / 아니오 (역채점 문항 포함) | 0~15점 | **8점 이상** 우울 의심 → 전문의 상담 권유 |
| **K-MMSE** (한국판 간이정신상태검사) | 30점 만점 / 6영역 | 영역별 수행 | 0~30점 | 24점 이상 정상 / 20~23 경증 / 10~19 중등도 / 10점 미만 중증 |

K-MMSE 영역 배점: 지남력-시간 5 + 지남력-장소 5 + 기억등록 3 + 주의집중·계산 5 + 기억회상 3 + 언어기능 8(이름대기 2·따라말하기 1·명령수행 3·읽기 1·쓰기 1) + 시공간구성 1 = **30점**

### 4-2. ⚠️ K-MMSE 저작권 주의 (반드시 확인 필요)

MMSE 원본은 2001년부터 **PAR(Psychological Assessment Resources)** 가 독점 라이선스를 관리하며, 문항을 무단 복제·전산화하면 저작권 문제가 발생할 수 있습니다. 한국판(K-MMSE)도 국내 배포처를 통한 유상 이용이 원칙입니다.

**대응 방안 (권장 순서)**
1. **기본값: MMSE는 "영역별 점수 입력" 만 지원** — 문항 텍스트를 앱에 넣지 않음. 검사는 병원이 보유한 정식 용지로 시행하고, 6개 영역 점수만 입력 → 총점·해석 자동 계산. (저작권 문제 없음)
2. **대체 도구 권장: MMSE-DS(치매선별용 간이정신상태검사)** — 보건복지부·중앙치매센터가 개발해 치매안심센터에서 무료 배포. 문항까지 앱에 넣어 웹 진행 가능.
3. 병원이 K-MMSE 정식 라이선스를 보유한 경우 → **관리자가 문항 텍스트를 직접 등록**하는 커스텀 문항 기능으로 웹 진행 지원.

> K-ADL / K-IADL / SGDS-K는 국내 학회지·공공기관을 통해 공개 배포되는 도구로, 출처를 표기하고 사용합니다.

### 4-3. 보조 도구 2종
- **TUG (일어나 걷기 검사)**: 초 단위 입력 → 13.5초 이상 낙상 위험 경고 자동 표시
- **MNA-SF (간이영양상태 평가)**: 6문항 14점 — 영양(Nutrition) 항목 보조. 선택 구현

### 4-4. 설문 실행 3가지 모드 (요구사항 그대로)

```
① 웹 진행 모드 (Wizard)
   - 한 화면에 한 문항, 큰 글씨(20px+), 큰 버튼
   - 진행률 바 "7 / 15", 이전/다음, 중간 저장
   - 마지막에 총점 + 해석 + 이전 회차 대비 변화 자동 표시
   - 태블릿으로 어르신 앞에서 바로 진행 가능

② 점수만 입력 모드 (Quick)
   - 종이로 현장에서 실시한 뒤 총점(또는 영역별 점수)만 입력
   - 입력 즉시 해석 자동 표시
   - K-MMSE 기본 모드

③ A4 빈 설문지 인쇄 모드
   - 문항이 인쇄된 빈 설문지를 A4로 출력 → 현장에서 종이로 실시
   - 상단에 환자명·등록번호·날짜 자동 인쇄
   - 하단에 채점 안내 문구 인쇄
   - 실시 후 ②로 점수 입력
```

> 빈 설문지는 평가를 만들지 않고도 **상단 메뉴 [설문지 인쇄]** 에서 바로 뽑을 수 있습니다.
> 종류(K-ADL·K-IADL·GDS-SF)와 환자, 부수를 골라 A4 로 한 번에 출력합니다.

세 모드 모두 **같은 테이블(`scale_results`)** 에 저장하고 `entry_mode`(web / score_only / paper) 로 구분합니다. → 이력 조회·차트는 모드와 무관하게 동일하게 작동.

---

## 5. 데이터베이스 설계 (Supabase / PostgreSQL)

### 설계 원칙
서술형·체크박스처럼 양식이 바뀔 수 있는 항목은 **JSONB**로 유연하게, 시간에 따라 추적·비교해야 하는 값(점수, 혈압, 체중, 문제목록, 관리계획)은 **정규화 테이블**로. (하이브리드)

### 테이블

```sql
-- 사용자 (Supabase auth.users 와 1:1)
profiles
  id uuid PK REFERENCES auth.users
  name text                      -- 작성자 실명 (기록 추적용)
  role text default 'admin'
  must_change_password boolean default true
  created_at timestamptz

-- 환자
patients
  id uuid PK
  patient_no text UNIQUE         -- 등록번호
  name text NOT NULL
  sex text                       -- 'M' | 'F'
  birth_date date                -- 나이 자동 계산
  rrn_enc bytea                  -- 주민등록번호 암호화 저장 (pgcrypto)
  rrn_masked text                -- 화면표시용 '370922-2******'
  address text
  phone text
  room text                      -- 병동/호실
  admitted_on date
  status text default 'active'   -- active | discharged | deceased
  deleted_at timestamptz         -- soft delete (진료기록 보존의무)
  created_at, updated_at

-- 평가 회차 (핵심)
assessments
  id uuid PK
  patient_id uuid FK
  seq int                        -- 1차, 2차, 3차...
  kind text                      -- 'initial'(최초) | 'periodic'(정기) | 'ad_hoc'(수시)
  assessed_at timestamptz        -- 평가일시
  assessor_id uuid FK profiles
  doctor_name text               -- 의사 서명란
  status text                    -- 'draft'(작성중) | 'completed'(완료)
  completed_at timestamptz
  version int default 1
  data jsonb                     -- 섹션 A,B,C,D,E,F,G,J 내용
  -- 차트/검색용 미러 컬럼
  height_cm numeric, weight_kg numeric, bmi numeric
  sbp int, dbp int, pulse int
  created_at, updated_at

-- 수정 이력 (버전 관리)
assessment_revisions
  id uuid PK
  assessment_id uuid FK
  version int
  data jsonb                     -- 그 시점의 전체 스냅샷
  changed_by uuid FK profiles
  changed_at timestamptz
  change_note text

-- 척도 결과
scale_results
  id uuid PK
  patient_id uuid FK             -- 회차와 무관한 추이 조회용
  assessment_id uuid FK NULL     -- 단독 실시도 허용
  scale_code text                -- 'K_ADL' | 'K_IADL' | 'SGDS_K' | 'K_MMSE' | 'MMSE_DS' | 'TUG' | 'MNA_SF'
  entry_mode text                -- 'web' | 'score_only' | 'paper'
  answers jsonb                  -- 문항별 응답 (웹 진행 시)
  total_score numeric
  subscores jsonb                -- K-MMSE 영역별 점수 등
  interpretation text            -- '우울 의심 (8점 이상)'
  measured_at timestamptz
  created_by uuid FK profiles

-- H. Problem list
problems
  id uuid PK
  assessment_id uuid FK
  patient_id uuid FK
  kind text                      -- 'active' | 'inactive'
  ord int
  content text
  resolved_at date               -- active → inactive 전환 시점

-- I. Management Plan
management_plans
  id uuid PK
  patient_id uuid FK
  assessment_id uuid FK
  plan_date date                 -- 일자
  content text                   -- 주요 관리 사항
  done boolean                   -- 완수 여부
  undone_reason text             -- 불이행 이유

-- F. 약물
medications
  id uuid PK
  assessment_id uuid FK
  category text                  -- 12계열
  drug_name text
  note text

-- J. 검사
labs
  id uuid PK
  assessment_id uuid FK
  code text                      -- 'CBC' ...
  value text
  taken_on date
  abnormal boolean

-- 감사 로그
audit_logs
  id bigserial PK
  actor_id uuid
  action text                    -- 'view' | 'create' | 'update' | 'delete' | 'print' | 'login'
  target_table text, target_id uuid
  ip inet, user_agent text
  at timestamptz default now()
```

### 이력 관리 동작
```
환자 1명
 └ 평가 1차 (2026-02-20, 최초평가) ─ 완료 → v1
 └ 평가 2차 (2026-08-20, 정기평가) ─ 완료 → v1 → 오타 수정 → v2
      · v1, v2 모두 열람·인쇄 가능
      · "1차 ↔ 2차 비교" 화면에서 자동 표시:
           K-ADL   12 → 15  ▲ 3점 (의존도 악화)
           SGDS-K   9 →  6  ▼ 3점 (호전)
           체중    45 → 43  ▼ 2kg (⚠ 영양 확인)
```

---

## 6. 보안 설계 (요청사항: 평문 저장 절대 금지)

### 6-1. 비밀번호
- **Supabase Auth 사용** → 비밀번호는 Supabase가 bcrypt로 해시하여 저장. 앱 DB·코드·SQL 어디에도 평문이 남지 않습니다.
- 초기 계정: `admin@caredoc.local` / `admin123`
  - **SQL 시드에 비밀번호를 넣지 않고**, `service_role` 키로 Admin API를 호출하는 1회용 스크립트(`scripts/seed-admin.ts`)로 생성 → 리포지토리에 평문이 커밋되지 않습니다.
  - `must_change_password = true` 로 생성 → **최초 로그인 시 비밀번호 변경 화면 강제**, 변경 전에는 다른 화면 접근 차단.
- 비밀번호 변경: 설정 화면에서 `현재 비밀번호 재확인 → 신규 비밀번호` (`supabase.auth.updateUser`)
- 정책: 최소 10자 + 영문/숫자/기호 2종 이상, 흔한 비밀번호 차단

> ⚠️ `admin123`은 매우 취약합니다. 개발/테스트용으로만 쓰고, **실제 환자 정보를 넣기 전에 반드시 변경**하십시오. 계획서에 명시해 둡니다.

### 6-2. RLS(행 수준 보안) — "잠금은 필요없다"에 대한 예외
권한을 여러 단계로 나누지는 않겠습니다. 다만 **RLS 자체는 반드시 켜야 합니다.**
이유: Supabase의 `anon` 공개 키는 브라우저 소스에 그대로 노출됩니다. RLS를 끄면 **URL과 공개 키만 아는 사람이 전 환자의 주민등록번호를 그대로 조회**할 수 있습니다.

정책은 아주 단순하게 한 줄로 둡니다.
```sql
alter table patients enable row level security;
create policy "logged_in_all" on patients
  for all to authenticated using (true) with check (true);
-- 모든 테이블에 동일 적용
```
→ 로그인한 사람은 전부 가능 / 로그인 안 하면 아무것도 불가. 사용상 불편은 전혀 없고 최악의 사고만 막습니다.

### 6-3. 주민등록번호 (법적 의무)
개인정보보호법상 주민등록번호는 **고유식별정보**로 암호화 저장이 의무입니다.

두 가지 안 — **A안 권장**
- **A안 (권장): 뒷자리 저장 안 함.** 생년월일 + 성별 1자리만 저장(`370922-2`). 요양병원 실무에 충분하고 법적 부담이 가장 작습니다.
- B안: 전체 저장. `pgcrypto` (`pgp_sym_encrypt`)로 암호화 + 화면은 항상 마스킹(`370922-2******`), 전체 보기는 별도 버튼 + 감사 로그 기록.

### 6-4. 그 밖의 보안 항목
| 항목 | 조치 |
|---|---|
| Supabase 리전 | **Seoul (ap-northeast-2)** 로 생성 ★ 환자정보 국외이전 이슈 회피 |
| service_role 키 | 서버(Server Action)에서만 사용, 클라이언트 노출 금지, Vercel 환경변수로 관리 |
| 전송 구간 | Vercel/Supabase 기본 HTTPS + HSTS |
| 세션 | 30분 미조작 시 자동 로그아웃 (공용 PC 대비) |
| 감사 로그 | 로그인·조회·수정·인쇄 기록 (`audit_logs`) |
| 삭제 | 하드 삭제 금지 → `deleted_at` 소프트 삭제 (진료기록 보존의무) |
| 백업 | Supabase 자동 백업 + 월 1회 CSV 내려받기 절차 문서화 |
| 작성자 추적 | 계정이 1개이므로 평가 저장 시 **작성자 실명 선택/입력** 필수화 |

---

## 7. 화면 설계 & 웹 테마

### 7-1. 테마 (요양병원용)
```
Primary    : 세이지 그린-틸 계열  #2E7D6F   (의료 신뢰 + 요양의 따뜻함)
Secondary  : 웜 그레이           #F5F4F1   (배경, 눈부심 적음)
상태 색상  : 정상 #16A34A / 주의 #D97706 / 위험 #DC2626  (신호등)
폰트       : Pretendard (한글 가독성 최상)
```
shadcn/ui `new-york` 스타일 + `radius 0.5rem` + CSS 변수로 테마 토큰 관리.

### 7-2. 가독성·입력 편의 (요구사항의 핵심)
| 원칙 | 구현 |
|---|---|
| 글씨 크기 | 본문 **16px 기본**(14px 금지), 라벨 15px, 설문 진행 화면 20px |
| 터치 타겟 | 버튼·라디오 최소 **44×44px** (태블릿 손가락 입력) |
| 명암비 | 모든 텍스트 4.5:1 이상 |
| 라디오 대신 | **버튼형 선택(Toggle Group)** — "보행가능 / 보조기 사용 / 보행불가 / 와상" 을 큰 버튼 4개로 |
| 자주 쓰는 값 | 원클릭 칩 — 수면 "잘 주무심", 식이 "경관식", 음주 "해당없음" |
| **이전 회차 불러오기** | 새 평가 시작 시 지난 회차 값을 그대로 채워넣고 바뀐 부분만 수정 → **가장 큰 시간 절약** |
| 자동 저장 | 3초 debounce 자동 저장 + "저장됨 14:32" 표시 (작성 중 날아갈 걱정 없음) |
| 섹션 이동 | 왼쪽 고정 네비 A~J + 섹션별 완료 체크(●○) + 미입력 항목 개수 |
| 환자 확인 | 상단 스티키 바에 이름·나이·등록번호·병실 항상 표시 (오기록 방지) |
| 자동 계산 | BMI, 나이, 척도 총점·해석, TUG 낙상경고 |
| 이상치 경고 | 혈압 180/110 이상, 체중 3개월 5% 감소 등 입력 즉시 노란 배지 |

### 7-3. 화면 목록
```
/login                          로그인
/change-password                최초 1회 강제 (그 후 설정에서 변경)
/patients                       환자 목록 — 이름/등록번호 검색, 최근평가일, 다음평가 예정 배지
/patients/new                   환자 등록
/patients/[id]                  환자 요약 — 최신 평가 카드 + 점수 추이 차트 + 평가 이력 타임라인
/patients/[id]/assessments/new  새 평가 (이전 회차 불러오기 옵션)
/assessments/[id]/edit          평가 입력 (섹션 A~J, 자동저장)
/assessments/[id]              평가 상세 (읽기)
/assessments/[id]/print         A4 인쇄 뷰 (2장)
/assessments/[id]/scales/[code] 설문 진행 위저드
/print/scale/[code]?patient=    빈 설문지 A4 인쇄
/patients/[id]/compare?a=&b=    회차 비교
/settings                       비밀번호 변경, 작성자 명단, 감사 로그
```

### 7-4. A4 인쇄 (별도 라이브러리 없이)
- 브라우저 기본 인쇄 + `@media print` CSS. PDF 라이브러리를 쓰지 않으므로 **한글 폰트 깨짐이 없습니다.**
- `@page { size: A4; margin: 12mm; }`, 화면용 UI는 `.no-print` 로 숨김
- 원본 종이 양식과 **같은 표 형태**로 재현 → 기존 서류철에 그대로 끼워 보관 가능
- 인쇄 대상 3종: ① 포괄평가기록부 2장 ② 빈 설문지 ③ 회차 비교표
- 페이지 하단에 `환자명 / 등록번호 / 평가일 / 페이지 n/2` 반복 인쇄

---

## 8. 기술 스택 확정

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js 16 (App Router) + TypeScript** | Vercel 최적, Server Actions로 키 은닉. 16부터 Turbopack 기본, `middleware`→`proxy`, `params`/`cookies()` async |
| 스타일 | **Tailwind CSS v4** | 요청사항 |
| 컴포넌트 | **shadcn/ui** | 요청사항, 접근성 기본 탑재, 코드 소유 |
| 폼 | **react-hook-form + zod** | 섹션별 부분 검증, 자동저장 연동 |
| 데이터 접근 | **Server Actions** (+ 필요 시 TanStack Query) | 구조 단순, 서비스 키 노출 없음 |
| DB/인증/스토리지 | **Supabase** (Seoul 리전) | 요청사항 |
| 차트 | **Recharts** | 점수·체중·혈압 추이 |
| 인쇄 | 브라우저 print + print CSS | 한글 안전 |
| 폰트 | Pretendard | 한글 가독성 |
| 배포 | **Vercel** | 요청사항 |

---

## 9. 개발 로드맵

| Phase | 내용 | 산출물 | 예상 | 상태 |
|---|---|---|---|---|
| **0. 셋업** | Next.js 16 + Tailwind + shadcn 초기화, Supabase 프로젝트(Seoul), Vercel 연결, 테마 토큰 | 배포되는 빈 앱 | 0.5일 | ✅ 완료 |
| **1. DB + 인증** | 마이그레이션 SQL, RLS 정책, admin 시드 스크립트, 로그인, 최초 비밀번호 변경 강제 | 로그인 가능 | 1일 | ✅ 완료 |
| **2. 환자 관리** | 환자 CRUD, 목록/검색, 주민번호 마스킹, 환자 요약 화면 | 환자 등록·조회 | 1일 | ✅ 완료 |
| **3. 평가 입력 폼** | 섹션 A~J 전체, 용어 한글 병기, 자동저장, 이전 회차 불러오기, 자동 계산·이상치 경고 | 평가 작성 가능 | 3일 | ✅ 완료 |
| **4. 설문 4종** | K-ADL / K-IADL / SGDS-K / MMSE(점수입력·MMSE-DS) + TUG. 웹 위저드 / 점수만 입력 / 빈 설문지 인쇄 | 설문 3모드 완성 | 2일 | ✅ 완료 |
| **5. 인쇄 + 이력** | A4 인쇄 뷰 2장, 버전 스냅샷, 회차 비교, 추이 차트 | 인쇄·이력 완성 | 2일 | ✅ 완료 |
| **6. 마무리** | 감사 로그, 세션 타임아웃, 백업 절차, 사용 안내서 | 실사용 가능 | 1일 | ✅ 완료 |

**합계 약 10~11 작업일 — 전 단계 구현 완료**

### 구현 결과 (2026-08-24)

- 화면 15개, `npm run build` · `typecheck` · `lint` 전부 통과
- 브라우저 E2E 32개 항목 전부 통과 (로그인 → 환자등록 → 평가작성 → 척도 3종 → 완료 → 인쇄 → 회차비교)
- 채점 로직 단위 검증: K-ADL 7~21점, SGDS-K 역채점(1·5·7·11·13번), K-IADL 해당없음 제외 평균(절단점 0.43), K-MMSE 영역 합산·상한 방어
- Supabase 실제 연결 확인: 표 10개 생성, RLS 가 anon 접근을 실제로 차단(`permission denied for table patients`)

**계획과 달라진 점**
1. Next.js 15 → **16** (`create-next-app@latest` 기준). `middleware`→`proxy`, `params`/`cookies()` async
2. **react-hook-form 미사용** — 자동저장이 붙은 섹션형 폼에는 상태 직접 관리 + 섹션별 memo 가 더 단순. 검증은 서버(zod)에서 수행
3. **주민번호 암호화 컬럼 삭제** — 뒷자리를 저장하지 않기로 확정되어 불필요
4. K-MMSE 배점 정정: 언어 8 + 시공간 1 (합계 30점은 동일)

권장 진행: Phase 0~3까지 만들고 **실제 환자 1~2명으로 시범 입력** → 불편한 점 수정 후 Phase 4~6. (양식 입력 흐름은 실제로 써봐야 개선점이 보입니다)

---

## 10. 확정이 필요한 사항 (제 권장안 포함)

| # | 항목 | 권장안 |
|---|---|---|
| 1 | **K-MMSE 처리** | ① 점수만 입력(기본) + ② 무료 도구 **MMSE-DS**로 웹 진행 지원. 병원이 K-MMSE 라이선스 보유 시 문항 직접 등록 |
| 2 | **주민등록번호** | **뒷자리 저장 안 함** (`370922-2`) — 법적 부담 최소 |
| 3 | 양식 버전 | 신버전(A~I) 기준, 구버전 항목은 매핑 |
| 4 | 정기평가 주기 | 6개월 (다음 평가 예정 배지 표시) — 병원 규정에 맞게 조정 |
| 5 | 작성자 기록 | 계정 1개이므로 저장 시 작성자 실명 필수 입력 |

---

## 11. 위험 요소 및 유의점

1. **K-MMSE 저작권** — 위 10-①로 회피. 문항 텍스트를 임의로 앱에 넣지 않습니다.
2. **개인정보** — Supabase 리전을 Seoul로. 실제 환자정보 투입 전 병원 개인정보보호책임자 확인 권장.
3. **의료법상 보존의무** — 진료기록 보존기간(항목별 5~10년). 하드 삭제 기능은 만들지 않고 소프트 삭제만.
4. **단일 계정 공유** — 감사 추적이 약해집니다. 나중에 간호사별 계정으로 확장할 수 있도록 `profiles.role` 을 미리 둡니다.
5. **점수 해석은 참고용** — 앱이 표시하는 해석(예: "우울 의심")은 선별 참고이며 진단이 아님을 화면에 명시합니다.
6. **오프라인** — 병동 와이파이가 끊기면 입력이 막힙니다. 자동저장 + 로컬 임시보관(localStorage 초안)으로 완화.

---

## 부록. 참고 출처

- 한국형 일상생활활동 측정도구(K-ADL) 타당도 검증 — 한국보건사회연구원: https://www.kihasa.re.kr/hswr/assets/pdf/1064/journal-37-4-98.pdf
- 한국형 도구적 일상생활활동 측정도구(K-IADL) 타당도 및 신뢰도 — 대한노인병학회: https://www.e-agmr.org/upload/pdf/Kgs-006-04-04.pdf
- 한국 노인의 일상생활 수행능력 및 도구적 일상생활 수행능력 — Korean J Fam Med: https://kjfm.or.kr/upload/pdf/Jkafm030-08-04.pdf
- 노인우울척도 단축형(GDS-SF) 자가검진: https://ssmhc.or.kr/theme/samsan_new/mtest/senior_gds-sf.php
- 한국판 노인우울척도 표준화(SGDS-K) — PMC: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2796007/
- MMSE 저작권 관련 — GeriPal: https://geripal.org/copyrights-and-copylefts-in-medicine/
- MMSE 저작권 관련 — Forbes: https://www.forbes.com/sites/alexknapp/2011/12/31/medical-diagnostic-test-taken-down-by-copyright-claim/
