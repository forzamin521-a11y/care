# 케어닥 포괄평가기록

요양병원 입소자 「포괄평가기록부」를 웹으로 작성하고 회차별 이력을 관리하는 시스템입니다.

- 설계 계획서: [`docs/PLAN.md`](docs/PLAN.md)
- 원본 양식 사진: `references/`

기술 스택: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · Vercel

---

## 처음 설정하기 (순서대로)

### 1. Supabase 프로젝트 만들기

1. https://supabase.com 접속 → 로그인 → **New project**
2. 설정
   - Name: `caredoc`
   - Database Password: 아무거나 정하고 **따로 적어두세요** (나중에 필요)
   - **Region: `Northeast Asia (Seoul)` ← 반드시 서울로 선택**
     환자 정보를 국외로 내보내지 않기 위한 조치입니다.
3. 생성까지 2~3분 기다립니다.

### 2. 데이터베이스 표 만들기

1. Supabase 대시보드 왼쪽 메뉴 → **SQL Editor** → **New query**
2. 이 저장소의 [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) 파일을 열어
   **전체를 복사**해 붙여넣습니다.
3. **Run** 을 누릅니다. `Success` 가 나오면 됩니다.

> 이 SQL 이 환자·평가·척도결과 표를 만들고, 모든 표에 RLS(행 수준 보안)를 켭니다.

### 3. 키 복사해서 .env.local 만들기

1. Supabase 대시보드 → **Project Settings** → **API**
2. 프로젝트 폴더에서 `.env.local.example` 을 복사해 `.env.local` 로 이름을 바꿉니다.

   ```bash
   cp .env.local.example .env.local
   ```

3. `.env.local` 을 열어 값을 채웁니다.

   | 넣을 곳 | Supabase 에서 복사할 값 |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` 키 |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` 키 (⚠ 절대 외부 공유 금지) |

`.env.local` 은 `.gitignore` 에 있어 저장소에 올라가지 않습니다.

### 4. 관리자 계정 만들기

```bash
npm install
npm run seed:admin
```

`.env.local` 의 `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` 값으로 계정이 만들어집니다.
비밀번호는 Supabase 가 bcrypt 로 해시해 저장하므로 **데이터베이스에 평문으로 남지 않습니다.**

### 4-1. 제대로 됐는지 확인 (선택)

```bash
npm run verify
```

표 10개가 모두 `✔`로 나오고, 마지막에 `차단됨: permission denied for table patients`
가 보이면 정상입니다. (로그인하지 않은 상태에서는 환자 정보가 읽히지 않는다는 뜻)

### 5. 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

```
이메일    admin@caredoc.local
비밀번호  admin123
```

> ⚠ 최초 로그인하면 **비밀번호 변경 화면이 강제로** 뜹니다.
> `admin123` 은 매우 취약한 값이므로, 실제 환자 정보를 넣기 전에 반드시 변경하세요.
> 변경 규칙: 10자 이상 · 영문/숫자/기호 중 2종 이상 · 흔한 비밀번호 불가

---

## 명령어

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 배포용 빌드 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | 코드 검사 |
| `npm run seed:admin` | 관리자 계정 생성 / 비밀번호 초기화 |
| `npm run verify` | 연결 점검 — 표 생성 여부, 관리자 계정, RLS 차단 확인 |

---

## 배포 정보

- 운영 주소: **https://care-doc.vercel.app**
- Vercel 프로젝트: `care-doc` (서울 리전 `icn1`, `vercel.json` 에 지정)
- Supabase 리전: Seoul (`ap-northeast-2`)
- 요금제: Hobby(무료) — 실제 병원 업무에 정식 사용 시 약관상 Pro 전환 필요

### 다시 배포하기

```bash
vercel --prod
```

환경변수는 Vercel 프로젝트에 이미 등록돼 있습니다. 값을 바꿔야 하면:

```bash
vercel env rm  NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

> `.env.local` 은 저장소에 올라가지 않으므로, Vercel 쪽 환경변수와 로컬 값을
> 따로 관리해야 합니다. 현재 등록된 변수는 `vercel env ls` 로 확인합니다.

---

## 폴더 구조

```
src/
  app/
    login/                  로그인
    change-password/        비밀번호 변경 (최초 1회 강제)
    (app)/                  로그인 후 화면 (공통 상단바 적용)
      patients/             환자 목록 · 등록 · 상세
      forms/                설문지 인쇄 고르기
      settings/             계정 · 감사 로그
    print/                  인쇄 전용 화면 (앱 상단바 없음)
      forms/                빈 설문지 여러 장
      scale/[code]/         빈 설문지 한 종류
  components/
    ui/                     shadcn/ui 컴포넌트
    app-shell.tsx           상단바 + 본문 레이아웃
    field.tsx               라벨 + 용어 한글병기 + 도움말 툴팁
    idle-logout.tsx         30분 미조작 자동 로그아웃
    assessment/
      assessment-form.tsx   평가 입력 폼 (자동저장 · 섹션 네비)
      sections.tsx          섹션 A~J 입력 컴포넌트
      parts.tsx             섹션 공통 부품 (칩 · 버튼선택 · 체크그리드)
      assessment-document.tsx  기록부 본문 — 화면 상세와 A4 인쇄가 공용
    scale/scale-entry.tsx   척도 입력 (웹 진행 / 점수만)
    print/form-picker.tsx   설문지 고르기 (종류 · 환자 · 부수)
    print/scale-questionnaire.tsx  빈 설문지 A4 본문
    chart/trend-charts.tsx  점수 · 체중 · 혈압 추이
    print/print-toolbar.tsx 인쇄 화면 도구막대
  lib/
    terms.ts                의료용어 한글 병기 사전  ★
    scales.ts               K-ADL · K-IADL · SGDS-K · K-MMSE · TUG 정의와 채점  ★
    constants.ts            양식 선택항목 (질병 15종 · 약물 12계열 · 검사 17종 등)
    rrn.ts                  주민등록번호 앞 7자리 처리 · 마스킹 · 만나이
    password.ts             비밀번호 정책
    due.ts                  다음 정기평가 예정일 계산
    audit.ts                감사 로그
    scale-results.ts        척도 결과 조회 · 추이 집계
    schemas/                평가 · 환자 입력 스키마 (zod)
    supabase/               Supabase 클라이언트 (브라우저 / 서버)
  proxy.ts                  인증 가드 (Next.js 16 에서 middleware → proxy)
supabase/migrations/        데이터베이스 스키마
scripts/seed-admin.ts       관리자 계정 생성
scripts/verify-supabase.ts  연결 · 스키마 · RLS 점검
docs/PLAN.md                설계 계획서
references/                 원본 양식 사진
```

---

## 쓰는 순서 (간호조무사용)

```
① 환자 목록 → [환자 등록]
     이름 · 등록번호 · 주민번호 앞 7자리만 넣으면 나이·성별은 자동 계산
     보호자 연락처는 숫자만 눌러도 하이픈이 자동으로 들어갑니다
     (01012345678 → 010-1234-5678)

② 환자 목록에서 그 줄 아무 곳이나 클릭 → [새 평가 작성]
     첫 평가는 자동으로 "최초평가"
     두 번째부터는 "이전 회차 불러오기"에 체크하면
     지난 내용이 그대로 채워지고 바뀐 부분만 고치면 됩니다

③ 섹션 A~J 를 채웁니다
     · 왼쪽 목록으로 원하는 섹션에 바로 이동 (● 표시 = 입력됨)
     · 입력하면 3초 뒤 자동 저장 — 상단에 "저장됨 14:32"
     · 키·체중을 넣으면 BMI 자동 계산
     · 혈압이 높으면 노란 경고가 뜹니다

④ D · E 섹션의 척도는 [입력하기] 를 눌러 진행합니다
     · 웹으로 진행    — 태블릿으로 어르신 앞에서 한 문항씩
     · 점수만 입력    — 종이로 실시한 뒤 결과만
     점수와 해석(우울 의심 / 낙상 위험 등)은 자동으로 계산됩니다

⑤ 다 채웠으면 맨 아래 [평가 완료]
     완료 후에도 수정할 수 있고, 수정하면 새 버전으로 이력이 남습니다

⑥ [A4 인쇄] 로 종이 서류철용 2장을 출력합니다
```

### 현장에서 종이로 하려면 — 상단 메뉴 [설문지 인쇄]

병실에 들고 갈 빈 설문지는 **상단 메뉴 → [설문지 인쇄]** 에서 바로 뽑습니다.
평가를 먼저 만들 필요가 없습니다.

```
설문지 고르기   K-ADL(7문항) · K-IADL(10문항) · GDS-SF(15문항) — 기본은 3종 모두
환자 (선택)     고르면 환자명·등록번호가 인쇄됨. 안 고르면 빈칸
부수            여러 어르신께 쓸 빈 양식을 한 번에 (최대 20부)
      ↓
[설문지 인쇄]   A4 로 출력 (설문지마다 새 장)
      ↓
병실에서 실시   ★ 표시 문항은 역채점 — 인쇄물 하단 "채점 방법" 참고
      ↓
평가 화면 → 척도 [입력하기] → "점수만 입력" 에 총점 입력
```

환자 화면의 **[설문지 인쇄]** 버튼을 쓰면 그 환자가 미리 선택된 채로 열립니다.

> K-MMSE 는 저작권이 있어 문항을 인쇄할 수 없습니다. 병원 정식 용지를 쓰고
> 영역별 점수만 입력하세요. TUG(일어나 걷기)는 설문이 아니라 초를 재는 검사입니다.

### 이력 보기
- 환자 상세 화면에 **점수 · 체중 · 혈압 추이 그래프**가 나옵니다 (평가 2회부터)
- 평가가 2회 이상이면 **[회차 비교]** 로 항목별 변화를 나란히 볼 수 있습니다
  (▲ 악화 / ▼ 호전은 검사마다 방향이 다르므로 자동으로 맞춰 표시됩니다)

### 환자 삭제
목록 오른쪽 끝의 휴지통 아이콘(또는 환자 화면의 휴지통)으로 삭제합니다.
**실제로 지워지지 않습니다** — 진료기록 보존의무 때문에 목록에서만 감춰집니다.

되돌리려면 목록 아래의 **[삭제된 환자 보기]** → **[되돌리기]** 를 누르세요.

### 자리 비움
30분간 아무 조작이 없으면 자동 로그아웃됩니다. 1분 전에 안내가 뜹니다.

---

## 백업

Supabase 유료 플랜은 자동 백업이 되지만, 무료 플랜은 직접 받아 두는 편이 안전합니다.

**월 1회 권장 절차**
1. Supabase 대시보드 → **Table Editor**
2. `patients` · `assessments` · `scale_results` 표를 각각 선택
3. 오른쪽 위 **Export** → **Download as CSV**
4. 병원 내부 저장장치에 `백업_2026-08.zip` 같은 이름으로 보관

> 진료기록은 법정 보존기간(항목별 5~10년)이 있습니다.
> 이 시스템은 하드 삭제를 하지 않고 `deleted_at` 으로만 표시하므로
> 실수로 지워도 데이터베이스에는 남아 있습니다.

---

## 알아두면 좋은 것

### 용어 한글 병기
화면의 모든 의료용어 표기는 `src/lib/terms.ts` 한 곳에서 관리합니다.
표기를 바꾸려면 이 파일만 고치면 전체 화면에 반영됩니다.

### K-MMSE 저작권
MMSE 는 PAR 이 독점 라이선스를 관리하는 저작물이므로 **문항 텍스트를 앱에 넣지 않습니다.**
병원이 보유한 정식 용지로 검사한 뒤 **영역별 점수만 입력**하면 총점과 해석이 자동 계산됩니다.
(`src/lib/scales.ts` 의 `K_MMSE`)

### 주민등록번호
**뒷 6자리는 저장하지 않습니다.** 앞 6자리(생년월일)와 성별 1자리까지만 보관하며,
화면에는 항상 `370922-2******` 로 마스킹해 표시합니다.

### RLS
모든 표에 RLS 가 켜져 있고 정책은 "로그인했으면 전부 허용" 한 줄입니다.
권한을 여러 단계로 나누지는 않지만, RLS 자체를 끄면 URL 과 공개 키만 아는 사람이
전 환자 정보를 조회할 수 있으므로 **끄지 마세요.**

### OneDrive 폴더에서 작업할 때
이 프로젝트가 OneDrive 동기화 폴더 안에 있으면 `node_modules` 와 `.next` 의 파일이
수만 개 단위로 동기화되어 느려지고, 드물게 빌드 중 파일 잠금(EPERM) 오류가 납니다.

OneDrive 설정 → **동기화 및 백업** → **폴더 선택** 에서 `caredoc/node_modules` 와
`caredoc/.next` 의 체크를 해제하면 해결됩니다.

### 계획과 달라진 점
- **Next.js 16** — `create-next-app@latest` 가 16을 설치합니다. 15와 달리
  `middleware` 가 `proxy` 로, `params`/`cookies()` 가 전부 async 로 바뀌었습니다.
- **react-hook-form 을 쓰지 않았습니다** — 평가 폼은 자동저장이 붙은 섹션형이라,
  상태를 직접 들고 섹션별로 `memo` 하는 쪽이 단순하고 예측 가능했습니다.
  입력값 검증은 서버(zod)에서 합니다.
- **주민번호 암호화 컬럼 없음** — 뒷자리를 저장하지 않기로 해서 필요가 없어졌습니다.
