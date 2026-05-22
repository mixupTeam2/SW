
# CareType 모바일 웹 MVP 구현 계획

쉬었음 청년 예방을 위한 AI 기반 취준생 케어 플랫폼을 모바일 특화 웹으로 구현합니다. AI 멀티 에이전트 로직은 별도 FastAPI 서버가 담당하고, Lovable 프로젝트는 **프론트엔드(모바일 UI) + 메인 서버(데이터 저장 + FastAPI 프록시)**를 책임집니다.

## 1. 디자인 시스템

- 톤: Calm Sage (차분한 세이지) — 회복/안정감
- 팔레트: `#F5F0E8` (배경 크림), `#DCE5D4` (서피스), `#A8C0A0` (프라이머리 세이지), `#2D3A2E` (텍스트 딥그린)
- 타이포: 본문 Pretendard, 헤드라인 Instrument Serif (감성 포인트)
- 모바일 우선: max-w-md 컨테이너 + 하단 탭 네비게이션 (홈/회고/추천/채팅/마이)
- 부드러운 라운드(2xl), 절제된 모션, 카드 중심 레이아웃

## 2. 화면 구성 (5 + α)

| 라우트 | 화면 | 핵심 |
|---|---|---|
| `/onboarding` | 온보딩 | 스펙 입력 + 가치관 드래그 우선순위 (7개) |
| `/` (홈) | 대시보드 | 이번 주 상태 카드, CareType 코드, 진행 주차 |
| `/retrospect` | KHT 회고 작성 | Keep / Hard / Try 입력 + 제출 |
| `/feedback/:id` | 피드백 결과 | 리프레이밍 멘트, 강점 키워드, 유동적 솔루션, 가치관 업데이트 팝업 |
| `/recommend` | 추천 | 틴더형 카드 스와이프 (CareType 매칭 3명) |
| `/chat` & `/chat/:id` | 채팅 목록/1:1 | 닉네임 기반 메시지 UI |

인증은 사용하지 않고 localStorage에 데모 유저 ID를 저장합니다.

## 3. 데이터 모델 (Lovable Cloud / Supabase)

- `profiles` — id, nickname, specs(jsonb), value_priorities(text[]), care_type_code, week_count
- `retrospects` — id, user_id, week_no, keep, hard, try, created_at, ai_result(jsonb)
- `recommendations` — id, user_id, target_user_id, score, reason, week_no
- `chats` / `messages` — 1:1 채팅용
- RLS는 데모용 공개 정책 (인증 없음 전제)

## 4. FastAPI 연동 (메인 서버 프록시 패턴)

- 환경변수: `AI_API_URL` (서버 전용, `secrets`로 관리)
- 프록시 server route: `src/routes/api/ai/$.ts` — 클라이언트가 `/api/ai/analyze`, `/api/ai/recommend`, `/api/ai/value-shift` 등을 호출하면 FastAPI로 그대로 forwarding
- 회고 저장 시: `createServerFn` `submitRetrospect`가
  1. Supabase에 회고 저장
  2. FastAPI `/analyze` 호출 (KHT 텍스트 + 누적 컨텍스트 전달)
  3. 응답(리프레이밍, 강점 키워드, 솔루션, 가치관 변화 신호)을 `retrospects.ai_result`에 저장
  4. 결과를 클라이언트에 반환
- 추천 갱신: 별도 server fn이 FastAPI `/recommend` 호출 → `recommendations` 테이블에 upsert
- FastAPI 실패 시 graceful fallback (mock 응답) — MVP 데모 안정성

### FastAPI 측에서 기대하는 엔드포인트 (참고)
```
POST /analyze        { user_id, retrospect, history }
POST /recommend      { user_id, care_type, values }
POST /value-shift    { user_id, text }
POST /generate-type  { user_id }  # 10회 누적 시
```

## 5. 구현 순서

1. 디자인 토큰 (styles.css) + 모바일 셸 레이아웃 + 하단 탭
2. Lovable Cloud 활성화 → 테이블/RLS 마이그레이션
3. 온보딩 (드래그 우선순위는 dnd-kit)
4. 홈 대시보드 (CareType 코드/주차 표시)
5. KHT 회고 + 피드백 화면 (FastAPI 프록시 + mock fallback)
6. 추천 스와이프 (framer-motion)
7. 채팅 UI (Supabase realtime 또는 폴링 — MVP는 폴링)
8. FastAPI 프록시 라우트 및 secret 설정

## 기술 세부사항

- Stack: TanStack Start + React 19 + Tailwind v4 + Lovable Cloud
- 드래그: `@dnd-kit/core`, `@dnd-kit/sortable`
- 스와이프: `framer-motion`
- 데이터 페치: TanStack Query + `createServerFn`
- 프록시: `src/routes/api/ai/$.ts` (splat) — POST/GET 모두 forwarding, `process.env.AI_API_URL` 사용
- AI URL은 활성화 후 `secrets--add_secret`으로 `AI_API_URL` 등록 요청

승인하시면 빌드 시작합니다.
