# Codex Handoff

다른 ChatGPT/Codex 계정이나 에이전트가 `moba-esports-manager-lite`를 과도한 컨텍스트 없이 이어받기 위한 실전용 인수인계 문서.

최종 업데이트: 2026-06-10

## 프로젝트 위치

```text
C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite
```

GitHub 저장소:

```text
https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42
```

## 운영 규칙

- 작업 시작 전 `git status --short --branch`를 반드시 확인한다.
- 먼저 `README.md`, `CODEX_HANDOFF.md`, `docs/development-checklist.md`, `IMPLEMENTATION_ORDER.md`를 읽는다.
- 이 파일은 최신 상태와 다음 작업을 위한 요약 문서다. 긴 이력은 남기지 않는다.
- 의미 있는 작업을 마치면 이 파일의 `현재 상태`, `다음 작업`, `최근 작업 로그`를 갱신한다.
- 체크박스는 `docs/development-checklist.md`에만 둔다.
- 본인이 만들지 않은 변경은 되돌리지 않는다.
- 코드/UI 수정 후 가능한 한 `npm.cmd run build`, `npm.cmd test` 결과를 기록한다.
- 문서만 수정한 경우 build/test를 생략할 수 있고, 생략 이유를 적는다.
- Windows PowerShell에서는 `npm` 대신 `npm.cmd`를 사용한다.
- `.env.local`에는 MongoDB secret이 있으므로 문서, 커밋 메시지, 최종 응답에 실제 URI나 비밀번호를 쓰지 않는다.

## 최우선 목표

기말 프로젝트 기준 최우선 목표는 `LCK 3시즌 작동`이다.

완료 기준:

- 2026 아시안게임 시즌 완주
- 2027 일반 시즌 완주
- 2028 일반 시즌 완주
- 2028 Worlds 종료 후 시즌 요약/스토브리그 도달
- 2029 진입 직전 상태까지 안정성 확인
- 저장/불러오기와 자동 저장이 3시즌 동안 깨지지 않음

현재 진척도:

- 1시즌 MVP 기준: 완료
- 기말 프로젝트 LCK 3시즌 기준: 100% 내외
- 정교한 개인 프로젝트 v1 기준: 약 50~58%

## 현재 상태

### 앱/아키텍처

- React, Vite, TypeScript 기반 League of Legends e스포츠 매니저 게임.
- URL 라우팅과 대회/캘린더 하위 URL 라우팅 구현.
- `/inbox` 메시지함 구현. 진행/경기/스토브리그 로그에서 중요한 커리어 메시지를 생성하고, 좌측 메뉴 배지와 메인 허브 최근 메시지 패널로 연결.
- `/inbox/:subPage`, `/offseason/:subPage`, `/settings` 구현. 좌측 하위 메뉴는 실제 URL/필터/섹션 이동으로 연결했고, 데이터 저장/시즌 결산의 의미 없는 하위 메뉴는 제거.
- 홈 하위 메뉴는 `/hub#dashboard`, `/hub#recent-messages`, `/hub#schedule` 해시 이동으로 연결.
- 메시지 도메인은 `src/domain/messages`에 분리했으며, 언론사 뉴스/선수 인터뷰/랜덤 뉴스/반응형 장문 뉴스는 source/type 확장 여지를 남겨둠.
- `LCK 구단 정보` route 구현: `/teams` 목록, `/teams/:teamId` 상세 스카우팅 화면.
- `App.tsx`는 provider/router 조립 중심으로 축소.
- `AppContent`, route renderer, autosave/navigation/progress/Asian Games decision hook 분리.
- 최상단 `AppErrorBoundary`와 커리어 필요 fallback 화면을 추가해 렌더링 예외/직접 URL 진입 시 빈 화면으로 죽는 상황을 완화.
- `GameProvider`는 `useSyncExternalStore` 기반 selector store 사용.
- `useGameSelector`, `useGameDispatch`, 호환용 `useGameState`/`useGame` 유지.
- reducer/action handler는 `src/app/state`로 분리.
- 서버 저장 API는 `Controller -> Service -> Repository -> DB` 계층으로 분리.
- `docs/architecture.md`에 서버/App/reducer/player domain 배치 기준 정리.

### 저장

- Express API 서버와 MongoDB Atlas `careerSaves` 저장/불러오기 구현.
- 저장 목록 조회, 수동 저장, 새 저장, 불러오기, 첫 자동 저장, 체크포인트 자동 저장 구현.
- 저장 관리는 `/saves` 전용 `데이터 저장` 화면으로 이동했고, 상단바에는 자동 저장 상태 배지만 남김.
- `/saves` 저장 슬롯 삭제 기능 구현. 삭제 확인 모달, DELETE API 연결, 삭제 후 목록 새로고침, 현재 active save 삭제 시 active save meta 초기화를 처리한다.
- 커리어 시작 전 화면의 저장/불러오기 패널은 유지.
- 저장 `revision` 기반 충돌 감지와 409 피드백 구현.
- 자동 저장 fingerprint는 로스터, 주간 전략/훈련, 대회 상태, 경기 기록, 시즌 히스토리/오프시즌 요약, 오프시즌, Worlds, 선수 생애주기/상태/시장가치 변화를 반영.
- 오래된 저장 데이터는 불러오기 시점에 `normalizeCareerSave`로 런타임 정규화해 optional 누락 필드에 기본값을 채움.
- 로컬 개발/테스트용 `ownerId`는 `local-dev`.
- production 배포판은 브라우저별 `betaOwnerId`를 `localStorage`에 자동 생성해 친구들의 저장 목록이 서로 섞이지 않게 한다.
- 로그인 사용자별 저장과 정식 운영용 DB/권한 분리는 미완성.
- Express production 서버는 Vite `dist/` 정적 파일과 `/api` 저장 API를 함께 제공하며, React Router 직접 URL 새로고침을 SPA fallback으로 처리한다.
- Render health check용 `/api/health`는 서버 생존 확인만 빠르게 반환하고, MongoDB 연결 확인은 `/api/health/database`에서 별도로 수행한다.

### 시즌/대회

- 2026은 아시안게임 시즌, 2027/2028은 일반 시즌으로 분기.
- LCK Cup, First Stand, LCK Rounds 1-2, MSI, LCK Rounds 3-4, Asian Games, Worlds 구현.
- 일반 시즌용 LCK Rounds 3-5 구현.
- MSI 성적 기반 Worlds 보너스 시드와 Worlds 20팀 참가 풀 구현.
- Worlds Play-In, Group Stage, Knockout, 우승팀 저장 구현.
- 시즌 종료 후 시즌 요약, 계약 연차 감소, 28일/4주 스토브리그, 다음 시즌 LCK Cup 진입 구현.
- 시즌 히스토리/3시즌 결산 UI 구현: 시즌 타임라인, 대회 결과, 스토브리그 결과, 주요 선수 변화 표시.
- `progressCareer` reason trace 구현: 진행 전/후 snapshot, action, block reason, changed 여부 기록.
- 장기 진행 debug runner 구현: 2027 LCK Cup 시작 상태에서 2028 LCK Cup 진입, 2028 LCK Cup 시작 상태에서 2029 LCK Cup 진입까지 관통 검증.
- 2026 시작 상태에서 2029 LCK Cup 진입까지 3시즌 자동 debug runner 검증 완료.
- debug runner는 커리어 무결성 검사로 중복 match id, 잘못된 match record schedule 참조, 일반 시즌 Asian Games 누수, 누락 선수 참조를 실패로 처리.

### 로스터/선수

- 2026 LCK 10개팀 1군+2군 선수 데이터 import 완료.
- `lck2026RosterSeeds`, `lck2026RatingOverrides`, `lck2026Players` 구조로 실제 명단 seed와 게임용 능력치 분리.
- 2026 LCK 1군 61명 선수 사진 1차 적용 완료.
  - 사진은 Leaguepedia 선수 페이지 대표 이미지를 WebP로 내려받아 `public/assets/players/lck/2026/main/`에 저장.
  - `src/data/lck2026PlayerPortraits.ts`에서 로컬 asset 경로와 원본 선수 페이지 URL을 관리.
  - 일부 사진은 현재 시즌 증명사진이 아니라 Leaguepedia 대표/과거 사진일 수 있으므로 후속 교체 가능.
- LCK 팀 로고 10개와 LCK 리그 로고 1개 1차 적용 완료.
  - 팀 로고는 Leaguepedia 2026 LCK 페이지의 최신 팀 아이콘을 WebP로 내려받아 `public/assets/logos/lck/teams/2026/`에 저장.
  - LCK 로고는 Wikimedia Commons SVG를 `public/assets/logos/lck/lck-logo.svg`에 저장.
  - `lck2026Teams`에서 `logoUrl`, `logoSourceUrl`을 관리하고, 공통 `TeamLogo`가 로딩 실패 시 약칭 fallback을 표시한다.
- 사용자 메모 기반 핵심 선수 능력치 1차 세부조정 완료.
- 스탯 기반 후보표는 참고용 문서로만 보관.
- LCK 팀 밸런스는 `S~C` 4단계 프로필로 관리. 2026 기본값에 팀별 ELO, strength, 예산, 팀 매력도 보정이 들어감.
- 2026 LCK 팀 예산은 사용자 확정값으로 낮춤: HLE 90억, Gen.G 88억, T1 90억, KT 55억, DK 48억, NS 43억, BRO 37억, DN 37억, BFX 35억, DRX 33억.
- 2026 선수 연봉은 `src/data/lck2026SalaryOverrides.ts`에서 최종 override로 관리하며, 팀 연봉계수 적용 이후 마지막 단계에서 `salaryExpectation`/`cost`에 반영한다.
- 1군 연봉 내림차순 문서는 `docs/lck-2026-main-salary-list.md`에 정리했다.
- 2027/2028 다음 시즌 진입 시 직전 LCK 순위가 기대 순위보다 높거나 낮으면 ELO/예산/strength가 소폭 보정됨.
- 연봉/예산 내부 단위는 `1 = 1천만원`, 예: `130 = 13억`. UI 표시에는 한국식 금액 formatter를 사용.
- `src/domain/players`에 선수 상태, 계약, 시장가치, 시즌 롤오버 helper 분리.
- UI에는 `overall`, `ability`, `potential`, `OVR`, `POT` 같은 내부 능력치 숫자를 직접 노출하지 않고 흰색 별점 기반 `평가`만 표시한다.
- `src/domain/players/playerEvaluation.ts`가 숨겨진 선수 품질, 완만한 폼 보정, 사기, 피로도를 합산해 평가 점수와 0.5~5.0성 별점을 계산한다.
- `evaluationForm`은 `previous * 0.85 + form * 0.15`로 완만하게 갱신하고, 별점 경계에는 1점 완충을 둬 경계값 근처 흔들림만 줄인다.
- 공통 `EvaluationStars`, `PlayerCard` 컴포넌트로 로스터, 허브, 스토브리그, 로스터 빌더의 선수 카드 표기를 통일한다.
- 타팀 로스터/스카우팅 화면은 `PlayerCard`와 `평가` 별점을 재사용해 선발 5인, 1군 후보, 2군 일부를 읽기 전용으로 표시한다.
- LCK 순위표 팀명과 메인 허브의 다음 상대 링크는 LCK 구단 상세 화면으로 연결된다.
- 다음 시즌 전환 시 나이 증가, 상태 회복, 성장/하락, 시장가치 기반 `salaryExpectation`/`cost`, 은퇴 후보 플래그 반영.
- 오프시즌 시작 시 은퇴 대상과 병역 `pending` 선수는 계약/선발/로스터/FA 시장에서 제외.
- 3시즌 기말 목표에서는 신규 유망주 생성 로직을 만들지 않고, 3군/FA/해외리거/가상선수 공급 방식은 장기 과제로 보류.

### 스토브리그

- 새 커리어는 `/offseason`의 2026 프리시즌 스토브리그에서 시작한다.
- 2026 프리시즌은 `OffseasonState.context = "preseason"`으로 구분한다.
- 선택 팀의 2026 기존 선수단은 1주차 만료계약 후보로 시작하고, 프리시즌 FA 시장은 실제 무소속 FA와 방출 선수만 표시한다. 타팀 소속 선수 접촉은 후속 `midseason market / transfer` 범위로 남긴다.
- 프리시즌 28일차 등록 조건은 선발 5명, 아카데미 계약 선수 5명 이상, 총원/예산 준수다.
- 프리시즌 종료 후에는 다음 시즌으로 넘어가지 않고 같은 2026 시즌의 LCK Cup을 활성화한다.
- `/summary`는 시즌 결과 확인과 스토브리그 진입 허브.
- `/offseason`은 28일/4주 날짜 진행형 시장.
- `/offseason`은 커리어가 있으면 항상 접근 가능하다. 실제 시장 기간이 아니면 읽기 전용 닫힌 시장 정보 화면으로 FA 명단, 예산/로스터 요약, 다음 시장 일정, 최근 이적 로그를 보여준다.
- MSI 전후 단기 영입/방출/트레이드 시장은 아직 구현하지 않았고, 닫힌 시장 화면에서 후속 확장 예정으로 안내한다.
- 1주차: 팀 내 재계약/방출. 재계약 제안은 하루 단위 pending 후 수락/거절 판정.
- 2~4주차: FA 계약 제안과 AI 경쟁. 선수는 유저/AI 제안을 모두 거절할 수 있고, 마감이 가까울수록 요구 조건이 완만하게 낮아짐.
- FA/재계약 제안에는 `1군 주전`, `식스맨`, `2군` 제안 역할을 저장한다.
- FA 영입 경쟁에서 유저가 승리하면 즉시 등록하지 않고 `confirmation-pending` 상태가 되며, 유저가 최종 영입 확정/취소를 선택한다.
- FA 영입 확정 시 예산 초과와 같은 포지션 4명째 영입을 차단한다. 제안 단계에서는 예산 초과 제안도 가능하다.
- 유저 팀 관련 스토브리그 로그는 `isUserTeamRelated`로 하이라이트한다.
- 28일차: 최종 로스터 검증 후 다음 시즌 진입.
- `OffseasonOffer`는 future `transfer` kind까지 고려한 구조.
- AI 팀은 FA 풀 기반으로 포지션 부족을 자동 보강하고, AI-AI/AI-유저 트레이드 협상은 후속 고도화로 남김.
- 계약 제안은 공통 `계약 제안 모달`에서 처리.
- 스토브리그는 사용자가 매우 중요하게 보는 핵심 시스템이며, 후속 고도화 우선순위가 높다.

## 중요한 설계 결정

- 개인 프로젝트이므로 실제 League of Legends, LCK, MSI, Worlds, First Stand, Asian Games, 실제 팀명/선수명 사용.
- 현재 베타 테스트 편의를 위해 2026 LCK 1군 선수 사진과 LCK 팀/리그 로고 asset을 repo에 포함했다. 공개 배포/제출 전에는 저작권 리스크를 재검토하고, 필요하면 asset을 제외하거나 대체 이미지/fallback으로 전환한다.
- UI는 16:9 가로 화면 우선, 전체 프레임 고정, 패널 내부 스크롤 우선.
- 좌측 메뉴는 `관리`, `시즌`, `시스템` 그룹으로 나눈 한글 라벨 중심 사이드바. `HB`, `MS` 같은 약어는 제거하고 inline SVG 아이콘을 사용.
- 모바일은 전체 반응형 지원이 아니라 작은 화면/세로 화면 미지원 안내 오버레이 정책. PC/노트북 또는 태블릿 가로 화면 이용을 권장.
- 계약 타입은 1년, 2년, 1+1년.
- 훈련 강도는 `고강도 훈련`, `일반 훈련`, `가벼운 훈련`, `휴식`.
- 전략은 공격/템포/운영/시야/후반/균형 계열.
- 사기는 숫자 대신 `최상`, `중상`, `중`, `중하`, `최하`.
- 선발 교체, 콜업, 콜다운 조작 자체는 사기를 바꾸지 않는다. 사기 변화는 실제 경기 후 현재 선발 출전/결과 기준으로 처리한다.
- Americas 리그 표기는 `LCS`; legacy `LTA` 저장값은 helper에서 호환 처리.
- Worlds는 20팀 모델: LCK/LPL/LCS/LEC 기본 3팀, LCP/CBLOL 기본 2팀, MSI 보너스 2팀, LCQ placeholder 2팀.
- Worlds 포맷은 Play-In 8팀 -> Group Stage 16팀 -> Knockout 8팀.
- 2026 Asian Games 대표 6인은 자동 선발, 플레이 여부는 대회 전 한 번 선택.
- 대한민국 Asian Games 금메달 시 대표 6인의 `militaryServiceStatus`를 `completed`로 변경.
- 대회/캘린더 내부 탭은 저장 상태가 아니라 URL path segment로 제어.
- 주요 route 이동 시 중앙 콘텐츠 스크롤을 자동으로 상단 복귀시켜, 이전 화면 스크롤 위치가 다음 화면 첫 인상을 망치지 않게 처리.

## 주요 코드 위치

```text
src/app/App.tsx
src/app/AppContent.tsx
src/app/AppRouteRenderer.tsx
src/app/GameProvider.tsx
src/app/autoSaveCheckpoint.ts
src/app/hooks/
src/app/state/
src/pages/SaveManagerPage.tsx
src/domain/game-progress/progressCareer.ts
src/domain/game-progress/careerProgressDebugRunner.ts
src/domain/season/
src/domain/players/
src/domain/match-simulation/
src/domain/series/
src/domain/draft/
src/data/lck2026RosterSeeds.ts
src/data/lck2026RatingOverrides.ts
src/data/lck2026PlayerPortraits.ts
src/data/lck2026Players.ts
public/assets/players/lck/2026/main/
public/assets/logos/lck/
src/shared/ui/PlayerPortrait.tsx
src/shared/ui/TeamLogo.tsx
src/features/competition-dashboard/CompetitionDashboard.tsx
src/features/lck-team-info/LckTeamInfo.tsx
src/features/offseason/OffseasonMarket.tsx
src/features/roster-management/SeasonRosterManager.tsx
src/features/season-summary/SeasonSummary.tsx
src/services/careerSavesApi.ts
src/types/game.ts
server/app.ts
server/index.ts
tsconfig.server.build.json
docs/beta-deploy-guide.md
docs/beta-tester-guide.md
server/controllers/
server/services/
server/repositories/
server/db/
server/validators/
```

## 검증 명령

```bash
npm.cmd run build
npm.cmd test
npm.cmd run server:check
npm.cmd run test:system
npm.cmd run test:acceptance
```

Playwright Chromium이 없다는 오류가 나면:

```bash
npx.cmd playwright install chromium
```

UI 변경 후 가능하면 16:9와 모바일 폭을 확인한다.

## 현재 작업트리 주의

- 2026-06-08 기준 서버 Layered Architecture, `App.tsx` 분리, reducer/action handler 분리, Context selector store, 선수 도메인 구조화, 자동저장 보강, 2027/2028 debug runner 변경이 같은 작업트리에 미커밋 상태로 쌓여 있다.
- `docs/pr-description-initial-project-history.md`는 PR 설명 복붙용 로컬 초안이며, 구조개선 작업 범위에는 포함하지 않는 것이 좋다.
- `server/careerSaves.ts`, `server/mongo.ts`는 layered architecture 전환으로 삭제되고 새 server 하위 계층 파일로 대체됐다.
- 오래된 작업 로그는 이 파일에서 압축했다. 자세한 과거 구현 여부는 `docs/development-checklist.md`와 git diff/test를 기준으로 확인한다.

## 다음 권장 작업

### 기능 작업 후보

1. `베타 테스트 피드백 반영`
   - 친구 플레이 중 진행 불가, 저장 불가, 화면 깨짐, 밸런스 문제를 최우선으로 수집/분류
   - 수정 후 Render 배포 링크에서 실제 새 빌드가 반영되는지 확인
2. `스토브리그/연봉 밸런스 2차`
   - 실제 베타 플레이 피드백을 바탕으로 예산 압박감, AI 영입, 식스맨 운영 난이도를 다시 조정

### 최근 완료된 베타 전 재정비

- `#21/#23/#24/#25/#26/#27/#33 베타 피드백: 좌측 메뉴 / 하위 메뉴 UX 정리`
  - 스토브리그 하위 메뉴를 `/offseason/overview`, `/offseason/free-agents`, `/offseason/schedule`, `/offseason/log`로 연결
  - 메시지함 하위 메뉴를 `/inbox`, `/inbox/important`, `/inbox/schedule`, `/inbox/transfer`로 연결
  - 홈 하위 메뉴를 대시보드/최근 메시지/다음 일정 해시 섹션 이동으로 연결
  - LCK 구단 정보는 `구단 목록`만 남기고, 데이터 저장/시즌 결산 하위 메뉴는 제거
  - 시스템 그룹에 `/settings` 설정 화면 추가
  - 좌측 메뉴 약어 아이콘을 inline SVG 아이콘으로 교체
- `#16 베타 피드백: LCK 일정 규칙 보정`
  - LCK Cup Group Battle을 2주 BO3 일반 경기와 1주 Super Week BO5 고정 경기로 압축
  - Super Week는 Baron/Elder 동일 선택 순위 팀끼리 수~일 하루 1경기, 5위 선택부터 1위 선택 순서로 진행
  - LCK Rounds 1-2는 수~일 하루 최대 2경기, 같은 팀 최소 2일 간격을 보장
  - LCK Rounds 3-4/3-5는 하루 2경기일 때 Legend 1경기 + Rise 1경기를 보장
- `#14/#15 베타 피드백: FA 목록 정합성 + 평가 별점 표시 수정`
  - FA 시장/닫힌 시장 FA 명단에서 `currentTeam`이 있는 타팀 소속 선수를 제외
  - 프리시즌 커리어 시작 시 무소속 FA seed를 포함해 진짜 FA 시장이 비지 않도록 보강
  - 유저/AI 영입 확정 또는 AI 보강으로 소속팀이 생긴 선수는 FA 제안/AI 보강 대상에서 제외
  - 평가 별점의 빈 별을 윤곽 별로 표시해 기본 카드가 전부 5성처럼 보이는 문제 수정
- `저장 데이터 삭제 + LCK 연봉/예산 1차 재조정`
  - `/saves` 저장 슬롯 삭제 버튼과 확인 모달 추가
  - 현재 active save 삭제 시 커리어는 메모리에 유지하고 active save meta만 초기화
  - 2026 LCK 팀 예산을 확정값으로 낮추고, 선수 연봉 최종 override 적용
  - T1 2군 총액은 8억, 다른 2군은 평균 1억 전후로 재조정
  - `docs/lck-2026-main-salary-list.md`에 2026 LCK 1군 연봉 내림차순 목록 작성
- `메시지함/뉴스/일정 알림 1차`
  - `/inbox` route와 좌측 `메시지함` 메뉴 추가
  - `CareerSave.messages`와 `CareerMessage` 타입 추가
  - 진행 결과, 오늘/다가오는 일정, 선수 상태 경고, 우리 팀 스토브리그 로그를 메시지로 누적
  - 메시지 dedupe와 최신 120개 보관 적용
  - 언론사 뉴스/선수 인터뷰/랜덤 뉴스는 후속 generator 확장 여지로 유지
- `팀/LCK 로고 에셋 적용`
  - LCK 팀 로고 10개와 LCK 리그 로고 1개를 로컬 asset으로 저장
  - `TeamLogo` 공통 컴포넌트 추가
  - 커리어 시작, 사이드바 내 팀 마크, LCK 구단 정보, LCK standings, 메인 허브 일정/상대 링크에 로고 표시
  - 공개 제출/정식 배포 전 로고 asset 저작권 리스크 재검토 필요
- `타팀 로스터/스카우팅 화면`
  - 좌측 시즌 그룹에 `LCK 구단 정보` 추가
  - `/teams` LCK 10개 구단 카드 목록과 `/teams/:teamId` 상세 화면 구현
  - 상세 화면은 선발 5인, 1군 후보, 2군/아카데미를 읽기 전용으로 표시
  - 내부 OVR/POT는 숨기고 공통 `PlayerCard`와 `평가` 별점을 재사용
  - LCK standings 팀명과 메인 허브 다음 상대에서 구단 상세 화면으로 이동 가능
- `선수 평가 공개 정책 + 선수 카드 리디자인`
  - UI에서 내부 OVR/POT/포텐셜 직접 표기 제거
  - 흰색 별점 `평가`와 공통 선수 카드 컴포넌트 도입
  - 선발 슬롯/후보/2군/계약/스토브리그/허브 카드의 사진, 이름, 포지션, 평가 표시 정리
- `닫힌 스토브리그 정보 화면`
  - 시즌 중에도 `/offseason` 접근 가능
  - 닫힌 시장에서는 FA/무소속 명단, 예산/로스터 요약, 다음 시장 일정, 최근 이적 로그를 읽기 전용으로 표시
  - MSI 전후 단기 시장은 후속 확장 여지로 안내
- `베타 피드백 A 묶음`
  - FA/재계약 제안 역할(`1군 주전`, `식스맨`, `2군`) 추가
  - 유저 FA 승리 후 영입 확정 대기 -> 최종 확정/취소 흐름 구현
  - 영입 확정 시 예산 초과와 포지션 4명째 영입 차단
  - 우리 팀 관련 이적 로그 하이라이트 처리
- `링크 하나로 접속 가능한 배포 구조 전환`
  - production Express 서버가 React 빌드 결과물과 `/api`를 한 도메인에서 제공
  - Render용 `npm run build`, `npm run start` 경로 추가
  - 브라우저별 beta ownerId로 친구 저장 데이터 1차 분리
  - 배포 절차는 `docs/beta-deploy-guide.md` 기준으로 안내
- `2026 시작 전 프리시즌 스토브리그`
  - 새 커리어 시작 후 `/offseason`으로 이동
  - 선택 팀 선수단 재계약/방출, LCK 전체 시장, 선발 5명+아카데미 5명 검증 반영
- `1군/2군 로스터 분리와 콜업/콜다운`
  - `/roster/main`, `/roster/academy`, `/roster/contracts` 하위페이지로 분리
  - 1군 선발/후보와 2군 인원을 분리 표시하고 콜업/콜다운 action 추가
- `베타 피드백 B 묶음`
  - 커리어 시작 화면을 LCK 10개 팀 카드 선택으로 변경
  - Ghost를 KT Rolster academy support로 수정
  - 선발 교체/콜업/콜다운 조작의 즉시 사기 변화를 제거

### 남은 기말 프로젝트 뭉탱이

- 5번: 스토브리그 2차 최소 고도화 완료. 후속 심화는 트레이드/협상 고도화
- 6번: 성장/하락/은퇴/군입대 최소 구조 완료. 신규 유망주 생성은 3시즌 목표 이후 장기 과제
- 7번: 2028 시즌 반복 안정화 완료
- 8번: 3시즌 자동 시뮬레이션 테스트 완료
- 9번: 시즌 히스토리/3시즌 요약 UI 완료
- 10번: 저장 안정성/마이그레이션 최소 보강 완료
- 11번: 안정성 하드닝 완료
- 후속: UI 검토와 화면 polish 1차 완료
- 베타 전 재정비 1번: 리렌더링/Route 왕복 버그 수정 완료
- 베타 전 재정비 2번: 2026 시작 전 프리시즌 스토브리그 완료
- 베타 전 재정비 3번: 1군/2군 로스터 분리와 콜업/콜다운 완료
- 베타 전 재정비 4번: 닫힌 스토브리그 정보 화면 완료
- 베타 전 재정비 5번: 타팀 로스터/스카우팅 화면 완료
- 베타 전 재정비 6번: 선수 평가 공개 정책 + 선수 카드 리디자인 완료
- 베타 전 재정비 7번: 메시지함/뉴스/일정 알림 1차 완료

## 최근 작업 로그

### 2026-06-10 - 베타 전 재정비 7번: 메시지함/뉴스/일정 알림 1차

작업 범위:

- `CareerSave.messages?: CareerMessage[]` 추가
- `src/domain/messages`에 메시지 생성, dedupe, 최대 120개 보관, 읽음 처리 helper 추가
- `/inbox` route, `InboxPage`, 필터/목록/상세/모두 읽음 UI 추가
- 좌측 `관리` 그룹에서 `홈`과 `메시지함`을 분리하고 읽지 않은 중요 메시지 배지 표시
- 메인 허브에 최근 메시지 패널과 `메시지함으로 이동` 버튼 추가
- 진행 결과에서 경기 결과/일정/선수 상태 메시지 생성
- 우리 팀 관련 스토브리그 로그를 `transfer` 메시지로 복사
- 언론사 뉴스, 선수 인터뷰, 랜덤 뉴스, 반응형 장문 뉴스는 후속 확장 source/type만 열어둠

검증:

- `npm.cmd test -- tests/unit/routes.test.ts tests/unit/messages.test.ts tests/integration/inbox.test.tsx tests/integration/app-routing.test.tsx` 통과
- `npm.cmd run build` 통과. Vite chunk-size 경고는 기존 번들 크기 경고

다음 작업:

- 베타 테스트 피드백 반영

### 2026-06-10 - 저장 데이터 삭제 + LCK 연봉/예산 1차 재조정

작업 범위:

- `SaveManager`에 저장 슬롯 삭제 버튼과 삭제 확인 모달 추가
- 프론트 저장 API에 `DELETE /api/saves/:saveId` 연결
- 삭제 성공 시 저장 목록을 새로고침하고, 삭제 대상이 현재 active save이면 active save meta를 비움
- 2026 LCK 팀 예산을 사용자 확정값으로 재조정
- `src/data/lck2026SalaryOverrides.ts`에 선수별 최종 연봉 override 추가
- `lck2026Players` 생성 시 팀 multiplier 이후 최종 override가 적용되도록 연결
- `docs/lck-2026-main-salary-list.md`에 2026 LCK 1군 연봉 내림차순 목록과 팀별 총액표 작성

검증:

- `npm.cmd test -- tests/integration/save-manager.test.tsx tests/unit/lck-2026-players.test.ts tests/unit/money-format.test.ts` 통과
- `npm.cmd test -- tests/unit/player-lifecycle.test.ts tests/unit/season-end.test.ts tests/unit/career-progress-debug-runner.test.ts` 통과
- `npm.cmd test` 통과: 51 files / 231 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 기존 번들 크기 경고

남은 문제:

- 실제 베타 플레이에서 예산 압박감과 스토브리그 영입 난이도 피드백을 받아 2차 조정 필요

### 2026-06-09 - #9 팀/LCK 로고 에셋 적용

작업 범위:

- Leaguepedia 2026 LCK 팀 아이콘 10개를 WebP 로컬 asset으로 저장
- Wikimedia Commons LCK 로고 SVG 저장
- `lck2026Teams`에 `logoUrl`, `logoSourceUrl` 추가
- `TeamLogo` 공통 컴포넌트 추가
- 커리어 시작 팀 카드, 좌측 내 팀 마크, LCK 구단 정보 목록/상세, LCK standings, 메인 허브 일정/상대 링크에 로고 표시

검증:

- `npm.cmd test -- tests/unit/lck-2026-players.test.ts tests/integration/team-logo.test.tsx tests/integration/career-setup.test.tsx tests/integration/lck-team-info.test.tsx tests/integration/competition-dashboard.test.tsx` 통과

다음 작업:

- 저장 데이터 삭제와 연봉/예산 1차 재조정 완료 후 베타 테스트 피드백 반영

### 2026-06-09 - 베타 전 재정비 5번: 타팀 로스터/스카우팅 화면

작업 범위:

- `AppRoute`에 `lck-team-info` 추가
- `/teams`, `/teams/:teamId` 라우팅 추가
- 좌측 `시즌` 그룹에 `LCK 구단 정보` 메뉴 추가
- `src/features/lck-team-info/LckTeamInfo.tsx` 추가
- LCK 10팀 카드 목록과 구단별 읽기 전용 상세 화면 구현
- 상세 화면에 팀 요약, 최근 LCK standing, 선발 5인, 1군 후보, 2군/아카데미 표시
- LCK standings 팀명과 메인 허브 다음 상대 팀 링크를 구단 상세 화면으로 연결
- 선수 표기는 `PlayerCard`/`평가` 별점만 사용하고 내부 OVR/POT는 노출하지 않음

검증:

- `npm.cmd test -- tests/unit/routes.test.ts tests/integration/lck-team-info.test.tsx tests/integration/app-routing.test.tsx` 통과
- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과

다음 작업:

- 메시지함/뉴스/일정 알림 1차 구현

### 2026-06-09 - 베타 전 재정비 6번: 선수 평가 공개 정책 + 선수 카드 리디자인

작업 범위:

- `PlayerStatus`에 optional `evaluationForm`, `evaluationStars` 추가
- `src/domain/players/playerEvaluation.ts`에 평가 점수, 별점 경계, hysteresis, smoothing helper 추가
- `normalizeCareerSave`와 선수 시즌 롤오버에서 오래된 저장/새 시즌 상태에 평가 필드 보강
- `EvaluationStars`, `PlayerCard` 공통 UI 추가
- 로스터 1군/2군/계약, 메인 허브 선발 5인, 스토브리그, 로스터 빌더, 선수 상세 모달에서 OVR/POT 직접 노출 제거
- 선발 슬롯 카드와 사진 영역 CSS를 고정 높이/비율 중심으로 조정해 사진/텍스트/평가가 밀리지 않도록 수정

검증:

- `npm.cmd test -- tests/unit/player-evaluation.test.ts tests/unit/career-save-normalization.test.ts` 통과
- `npm.cmd test -- tests/integration/season-roster-manager.test.tsx tests/integration/offseason-market.test.tsx tests/integration/roster-builder.test.tsx` 통과
- `npm.cmd test` 통과: 47 files / 207 tests
- `npm.cmd run build` 통과. Vite chunk-size 경고는 기존 경고
- `screenshots/live-preview/roster-main-evaluation-cards.png`, `roster-academy-evaluation-cards.png`, `roster-contracts-evaluation-cards.png`, `offseason-evaluation-cards.png`, `hub-starter-evaluation-cards.png` 캡처 확인
- 시각 확인 결과 선발 슬롯/후보/2군/허브 카드의 사진, 이름, 평가 별점 잘림 없음

다음 작업:

- 타팀 로스터/스카우팅 화면 추가

### 2026-06-09 - 베타 전 재정비 4번: 닫힌 스토브리그 정보 화면

작업 범위:

- `/offseason`을 커리어가 있으면 항상 접근 가능한 스토브리그 허브로 변경
- 실제 시장 기간이 아니면 닫힌 시장 정보 화면을 렌더링
- 닫힌 시장 화면에 시장 개요, 내 팀 예산/연봉/1군/2군 요약, FA 명단 필터, 일정 안내, 최근 이적 로그 표시
- 닫힌 시장에서는 협상/방출/영입 확정 버튼을 노출하지 않음
- MSI 전후 단기 시장은 후속 확장 예정으로 안내

검증:

- `npm.cmd test -- tests/integration/offseason-market.test.tsx tests/integration/app-routing.test.tsx` 통과
- `npm.cmd test -- tests/unit/offseason-market.test.ts` 통과
- `npm.cmd test` 통과
- `npm.cmd run build` 통과

다음 작업:

- 타팀 로스터/스카우팅 화면 추가

### 2026-06-09 - README 최신화

작업 범위:

- README를 현재 베타 배포 링크, LCK 3시즌 작동 완료 상태, 프리시즌 스토브리그, 1군/2군 로스터, A/B 베타 피드백 반영 기준으로 갱신
- 로컬 실행, Render 배포, 검증 명령, 남은 주요 과제를 현재 프로젝트 상태에 맞게 정리

검증:

- 문서 작업이므로 build/test 생략

### 2026-06-09 - 베타 피드백 A 묶음: 스토브리그 계약 UX 안정화

작업 범위:

- FA/재계약 계약 제안 모달에 `1군 주전`, `식스맨`, `2군` 제안 역할 추가
- 유저가 FA 영입 경쟁에서 승리하면 즉시 등록하지 않고 `confirmation-pending` 상태로 보관
- FA 영입 확정/취소 action과 도메인 로직 추가
- 영입 확정 시 예산 초과와 같은 포지션 4명째 영입 차단
- 영입 확정 대기 UI와 우리 팀 이적 로그 하이라이트 추가
- 메시지함/뉴스 1차 구현 때 우리 팀 이적 로그를 메시지함에도 노출하도록 후속 작업에 기록

검증:

- `npm.cmd test -- tests/unit/offseason-market.test.ts` 통과
- `npm.cmd test -- tests/integration/offseason-market.test.tsx` 통과
- `npm.cmd test -- tests/unit/career-progress-debug-runner.test.ts` 통과

다음 작업:

- 닫힌 스토브리그 정보 화면 또는 타팀 로스터/스카우팅/선수 카드/메시지함 묶음

### 2026-06-09 - 베타 피드백 B 묶음: 커리어 시작/로스터 기초 수정

작업 범위:

- 커리어 시작 화면에서 직접 팀명 입력을 숨기고 LCK 10개 팀 카드 선택 UI로 변경
- 팀 카드에 약칭, 티어, 전력, 예산, 예상 순위 표시
- Ghost를 `KT Rolster / academy / support`로 수정
- 선발 교체, 콜업, 콜다운 action에서 즉시 사기 상승을 제거
- 실제 경기 후 사기 변화는 기존 경기 결과 기반 로직을 유지

검증:

- `npm.cmd test -- tests/integration/career-setup.test.tsx tests/unit/player-status.test.ts tests/unit/roster-actions.test.ts tests/unit/lck-2026-players.test.ts` 통과
- `npm.cmd test -- tests/integration/app-routing.test.tsx tests/integration/roster-builder.test.tsx tests/integration/season-roster-manager.test.tsx` 통과

다음 작업:

- A 묶음: 스토브리그 계약 UX 안정화

### 2026-06-09 - 베타 테스터 안내 문서 추가

작업 범위:

- 친구에게 직접 전달할 수 있는 `docs/beta-tester-guide.md` 추가
- 접속 링크, 권장 환경, 저장 데이터 분리 주의, 10분/30분/장기 테스트 시나리오, 버그 제보 양식, 현재 알려진 미완성 항목 정리
- 기존 `docs/beta-test-guide.md` 상단에 테스터용 안내서 링크 추가

검증:

- 문서 작업이므로 build/test 생략

### 2026-06-09 - 베타 전 재정비 8번: 링크 하나로 접속 가능한 배포 구조 전환

작업 범위:

- production Express 서버에서 Vite `dist/` 정적 파일 서빙 추가
- `/api`가 아닌 React Router 경로는 `index.html`로 돌려보내는 SPA fallback 추가
- `tsconfig.server.build.json` 추가
- `package.json`에 `build:client`, `build:server`, `start` 스크립트 추가
- production 기본 host를 `0.0.0.0`로 변경해 Render Web Service에서 listen 가능하게 정리
- 배포판 저장 API는 `localStorage` 기반 브라우저별 `betaOwnerId`를 자동 생성하도록 변경
- `.env.example`에 `VITE_SAVE_OWNER_ID`, `SERVE_CLIENT`, `CLIENT_DIST_DIR` 추가
- `docs/beta-deploy-guide.md` 추가
- `docs/beta-test-guide.md`는 Render 배포 방식을 우선으로 안내하고, Cloudflare Quick Tunnel 방식은 보조/로컬 테스트 방식으로 표시

Render 설정값:

```text
Build Command: npm install --include=dev && npm run build
Start Command: npm run start
NODE_ENV=production
NODE_VERSION=20.19.0
MONGODB_URI=Render 환경변수에만 입력
MONGODB_DB_NAME=moba_esports_manager_beta
VITE_API_BASE_URL=/api
```

배포 health check 보강:

- `/api/health`는 MongoDB에 의존하지 않는 liveness endpoint.
- `/api/health/database`는 MongoDB ping과 `careerSaves` index 확인용 endpoint.
- Render가 `Waiting for internal health check`에서 멈추면 health path는 `/api/health`로 두고, DB 문제는 `/api/health/database`로 따로 확인한다.

다음 작업:

- 베타 전 재정비 4번: 닫힌 스토브리그 정보 화면

### 2026-06-08 - 베타 전 재정비 3번: 1군/2군 로스터 분리와 콜업/콜다운

작업 범위:

- `/roster/main`, `/roster/academy`, `/roster/contracts` 하위페이지 라우팅 추가
- 좌측 `로스터 관리` 하위메뉴의 `선발 5인`, `계약`, `2군`을 실제 URL 이동으로 연결
- `mainRosterPlayerIds`는 선발 5인+1군 후보, `academyRosterPlayerIds`는 2군 등록 선수로 의미 정리
- `call-up-player`, `send-down-player` action creator와 reducer handler 추가
- 선발 교체는 1군 후보만 드래그 가능하고, 2군 선수는 먼저 콜업해야 선발 경쟁 가능
- 현재 선발 선수는 바로 콜다운할 수 없고, 같은 포지션 1군 후보로 선발 교체 후 콜다운 가능
- 계약 화면에서 계약 선수의 잔여 연수, 연봉, 1군/2군 배치와 예산 요약 표시
- 프리시즌 최종 검증은 선발 5명, 1군 등록 5명, 2군 등록 5명, 예산 기준으로 정리
- 저장 정규화에서 레거시 1군/2군 누락값을 계약/선발 슬롯 기준으로 보정

검증:

- `npm.cmd test -- tests/unit/routes.test.ts tests/unit/roster-actions.test.ts tests/integration/season-roster-manager.test.tsx` 통과: 3 files / 14 tests
- `npm.cmd test -- tests/unit/offseason-market.test.ts tests/integration/app-routing.test.tsx tests/integration/roster-builder.test.tsx tests/integration/offseason-market.test.tsx` 통과: 4 files / 34 tests

다음 작업:

- 베타 전 재정비 4번: 닫힌 스토브리그 정보 화면

### 2026-06-08 - 베타 전 재정비 2번: 2026 프리시즌 스토브리그 시작 구조

작업 범위:

- 새 커리어 시작 직후 `/roster`에서 10명을 즉시 고르는 구조 제거
- `OffseasonState.context`를 `preseason | postseason`으로 확장
- `createInitialCareer`가 2025-12-17 시작, 28일/4주 프리시즌 오프시즌 상태를 생성하도록 변경
- 선택 팀의 2026 기존 선수단을 만료계약 후보로 배치하고, 선발 5인은 포지션별 최고 OVR로 임시 등록
- 프리시즌 FA 탭에 LCK 전체 시장 후보를 표시하고 검색/팀/포지션/1군·2군 필터 추가
- 프리시즌 28일차에는 선발 5명, 아카데미 5명, 총원/예산 검증 후 2026 LCK Cup 활성화
- 포스트시즌 오프시즌은 기존처럼 다음 시즌 LCK Cup으로 이동
- `/roster`는 프리시즌 중에도 즉시선발 빌더가 아니라 계약 선수 기반 선발 조정 화면을 렌더링
- 레거시 `phase="stove-league"` 초기 저장은 불러오기 정규화 시 새 프리시즌 오프시즌 구조로 변환

검증:

- `npm.cmd test -- tests/unit/season-state.test.ts tests/unit/offseason-market.test.ts tests/integration/app-routing.test.tsx tests/integration/offseason-market.test.tsx tests/integration/roster-builder.test.tsx` 통과: 5 files / 41 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking

다음 작업:

- 베타 전 재정비 3번: 1군/2군 로스터 분리와 콜업/콜다운 구조 완료

### 2026-06-08 - 리렌더링/Route 왕복 버그 수정

작업 범위:

- URL을 실제 화면 렌더링의 단일 기준으로 정리
- `useRouteSynchronization`에서 reducer route state가 URL을 다시 덮어쓰던 effect 제거
- 커리어 보호 route, 알 수 없는 path, root path 복구는 URL -> reducer 단방향 sync로 유지
- `AppContent`/`AppShell`/`AppRouteRenderer`가 URL에서 파싱한 route/subPage 기준으로 렌더링하도록 변경
- 메인 허브, 캘린더, 시즌 요약, 스토브리그, 경기 준비 화면 내부 버튼을 `navigate()` 중심 명시적 이동으로 통일
- 커리어 시작, 로스터 확정, 스토브리그 진입, 진행 결과 후 화면 전환은 post-action navigation으로 한 번만 처리
- 개발용 `routeDebugTrace` helper 추가. 최근 route transition의 source/from/to/reason을 기록하지만 production UI에는 노출하지 않음

검증:

- `npm.cmd test -- tests/unit/routes.test.ts tests/integration/app-routing.test.tsx` 통과: 2 files / 16 tests
- `npm.cmd test -- tests/integration/app-autosave.test.tsx tests/integration/save-manager.test.tsx` 통과: 2 files / 5 tests
- `npm.cmd test` 통과: 44 files / 183 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- 브라우저에서 `Start career -> /roster`, 좌측 홈 `-> /hub`, 메인 허브 내부 `로스터 관리 -> /roster`, `대회 현황 -> /competitions`, `시즌 일정 -> /calendar` 이동이 되돌아가지 않는 것을 확인

다음 작업:

- 베타 전 재정비 2번: 2026 시작 전 프리시즌 스토브리그로 커리어 시작 구조 변경

### 2026-06-08 - 베타 가이드 외부 공유 방식 보강

작업 범위:

- `docs/beta-test-guide.md`를 친구 베타 운영자가 그대로 따라 할 수 있게 재작성
- 같은 와이파이를 쓰지 않는 조건을 기본으로 반영
- cmd 3개 실행 방식 추가: API 서버, Vite 클라이언트, Cloudflare Quick Tunnel
- `vite.config.ts`에 `/api` proxy 추가
- `src/services/careerSavesApi.ts` 기본 API base를 `/api`로 변경하고 상대 경로 요청을 지원
- `.env.example`의 `VITE_API_BASE_URL` 기본값을 `/api`로 변경
- README, 저장 문서, 구현 순서 문서의 베타 안내를 Cloudflare Quick Tunnel 기준으로 정리

검증:

- `npm.cmd test -- tests/integration/save-manager.test.tsx tests/integration/app-autosave.test.tsx` 통과
- `npm.cmd test -- tests/unit/routes.test.ts` 통과
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- `npm.cmd test` 통과: 44 files / 182 tests
- `npm.cmd run server:check` 통과: MongoDB `moba_esports_manager.careerSaves` 연결 OK

남은 문제:

- 실제 베타 실행 중 Quick Tunnel 접속/저장 동작을 육안 확인해야 함
- 장기 운영/정식 배포는 Quick Tunnel이 아니라 별도 호스팅으로 전환 필요

### 2026-06-08 - 친구 베타 테스트 준비 1차

작업 범위:

- `docs/beta-test-guide.md` 추가
- 베타 목표, 지원 환경, 실행 전 체크리스트, cmd 3개 실행 방식 정리
- 같은 와이파이를 쓰지 않는 친구 베타 기준으로 Cloudflare Quick Tunnel 공개 URL 공유 흐름 정리
- Vite `/api` proxy 추가와 `VITE_API_BASE_URL=/api` 기준 안내
- 친구에게 보낼 짧은 안내문 작성
- 10분 빠른 테스트, 30분 기본 플레이, 장기 흐름 테스트 시나리오 작성
- 5점 척도 피드백 양식과 버그 리포트 양식 작성
- 현재 베타 제한사항 정리: 모바일 세로 화면 미지원, `local-dev` 저장 공유, 임시 선수 사진 asset, 로그인/멀티플레이 미지원
- 서버 베타 설정 보강: `HOST`, `CORS_ORIGINS` env 추가. 기본값은 기존 localhost 개발 흐름 유지
- README와 저장 문서에 베타 가이드/저장 메뉴/서버 env 변경 반영

검증:

- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- `npm.cmd test` 통과: 44 files / 182 tests
- `npm.cmd run server:check` 통과: MongoDB `moba_esports_manager.careerSaves` 연결 OK

남은 문제:

- 실제 친구 베타 실행 후 피드백 분류와 수정
- 정식 배포 방식은 아직 미정. 현재 친구 베타는 Cloudflare Quick Tunnel 임시 URL 기준

### 2026-06-08 - 데이터 저장 메뉴 분리 UI

작업 범위:

- `/saves` route와 `save-manager` AppRoute 추가
- 좌측 메인 메뉴에 `SV` 아이콘의 `데이터 저장` 항목 추가
- 상단바의 저장/새 저장/불러오기/새로고침 버튼 제거
- 상단바에는 자동 저장 상태 배지만 표시
- 기존 `SaveManager`는 커리어 시작 전 화면과 `/saves` 전용 화면에서 panel 형태로 재사용
- 커리어 없는 상태에서 `/saves` 직접 진입 시 기존 보호 흐름처럼 커리어 시작 화면으로 복구

검증:

- `npm.cmd test -- tests/unit/routes.test.ts tests/integration/app-routing.test.tsx tests/integration/save-manager.test.tsx tests/integration/app-autosave.test.tsx` 통과: 4 files / 20 tests
- `npm.cmd test` 통과: 44 files / 182 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- 스크린샷: `screenshots/live-preview/save-manager-menu.png`

남은 문제:

- 친구 베타 테스트 준비가 다음 작업

### 2026-06-08 - 좌측 메뉴 그룹형 한글 사이드바 개선

작업 범위:

- 기존 약어-only 좌측 레일과 별도 하위 메뉴 패널을 하나의 넓은 사이드바로 통합
- 메뉴 구조를 `관리`, `시즌`, `시스템` 그룹으로 재배치
- 메뉴 항목을 `홈`, `로스터 관리`, `전략 / 훈련`, `대회 현황`, `시즌 캘린더`, `스토브리그`, `데이터 저장`, `시즌 결산` 한글 라벨로 표시
- 약어는 작은 보조 아이콘으로 유지
- 선택된 메뉴의 하위 항목은 해당 메뉴 아래에 inline으로 펼쳐 표시
- 더 이상 쓰이지 않던 `스카우트` placeholder 메뉴 제거

검증:

- `npm.cmd test -- tests/integration/app-routing.test.tsx tests/integration/app-autosave.test.tsx tests/integration/save-manager.test.tsx` 통과: 3 files / 13 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- 스크린샷: `screenshots/live-preview/sidebar-menu-groups.png`

남은 문제:

- 친구 베타 테스트 준비가 다음 작업

### 2026-06-08 - UI 검토와 화면 polish 1차

작업 범위:

- 주요 16:9 화면과 작은 화면 미지원 오버레이를 Playwright로 재캡처해 확인
- route/subPage 이동 시 중앙 콘텐츠 스크롤이 이전 화면 위치를 유지하던 문제 수정
- 전략/훈련 화면의 오래된 G2/LEC 샘플 상대 리포트를 실제 다음 경기 기준 리포트로 교체
- 최근 경기 기록 문구를 한국어 플로우에 맞게 정리
- 캘린더 로드맵의 한 달짜리 대회 날짜가 좁은 카드에서 잘려 보이던 문제를 같은 달 compact range 표기로 수정
- jsdom 환경에는 `HTMLElement.scrollTo`가 없을 수 있어 `scrollTop/scrollLeft` fallback 추가

스크린샷:

- `screenshots/live-preview/ui-polish-final/01-hub-top.png`
- `screenshots/live-preview/ui-polish-final/02-strategy.png`
- `screenshots/live-preview/ui-polish-final/03-calendar-roadmap.png`
- `screenshots/live-preview/ui-polish-final/04-calendar-month.png`
- `screenshots/live-preview/ui-polish-final/05-mobile-guard.png`

검증:

- `npm.cmd test -- tests/unit/season-calendar-dates.test.ts tests/integration/strategy-panel.test.tsx` 통과
- `npm.cmd test -- tests/integration/app-routing.test.tsx tests/integration/app-autosave.test.tsx` 통과
- `npm.cmd test` 통과: 44 files / 179 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking

남은 문제:

- 베타 테스트 전 실행 안내/테스트 시나리오/피드백 수집 문서 정리가 필요
- 추가 UI polish는 베타 피드백을 받은 뒤 우선순위를 다시 잡는 편이 좋음

### 2026-06-08 - 2026 LCK 1군 선수 사진 구조 + UI 적용

작업 범위:

- `Player`에 optional `portraitUrl`, `portraitSourceUrl` 추가
- 2026 LCK 1군 61명 Leaguepedia 대표 이미지를 WebP로 다운로드
- `public/assets/players/lck/2026/main/`에 로컬 정적 asset 저장
- `src/data/lck2026PlayerPortraits.ts` 추가
- `lck2026Players` 생성 시 1군 portrait 합성
- `normalizeCareerSave`가 레거시 저장에도 현재 seed portrait를 재보강
- 공통 `PlayerPortrait` 컴포넌트 추가
- 로스터 빌더 선수 카드/계약 행/포지션 슬롯, 메인 허브 선발 5인, 시즌 중 로스터 관리 선발/후보 카드, 선수 상세 모달에 portrait 표시

주의:

- 일부 사진은 Leaguepedia 선수 페이지 대표/과거 사진이다.
- 베타 테스트용 asset이므로 공개 배포/제출 전에 저작권/포함 여부를 재검토한다.

검증:

- `npm.cmd test -- tests/unit/lck-2026-players.test.ts tests/unit/career-save-normalization.test.ts tests/integration/player-portrait.test.tsx tests/integration/roster-builder.test.tsx tests/integration/season-roster-manager.test.tsx` 통과
- `npm.cmd test` 통과: 44 files / 178 tests
- `npm.cmd run build` 통과. Vite 500kB chunk warning만 남음
- 스크린샷:
  - `screenshots/live-preview/roster-player-portraits.png`
  - `screenshots/live-preview/season-roster-player-portraits.png`

### 2026-06-08 - 모바일 정책 + 팀 밸런싱

작업 범위:

- 모바일 세로/소형 화면 미지원 안내 오버레이 추가. 데스크톱/큰 가로 화면은 기존 UI 유지
- LCK 팀 밸런스 프로필 추가: `S~C` 티어, 팀별 ELO, strength, 예산, 연봉계수, appeal modifier
- BNK FEARX는 B 티어, DN SOOPers는 C 티어로 반영하고 D 티어는 사용하지 않음
- 새 커리어 유저 팀 예산/ELO가 팀 프로필에서 시작되도록 변경. 커스텀 팀은 T1 프로필 상속
- 선수 연봉 산정에 팀별 연봉계수 적용
- 다음 시즌 진입 시 직전 LCK 성적 기반 ELO/예산/strength 소폭 보정 적용
- 로스터 빌더, 스토브리그, 시즌 요약의 연봉/예산 표시를 `130 = 13억` 기준 한국식 금액으로 변경

검증:

- `npm.cmd test -- tests/unit/lck-2026-players.test.ts tests/unit/money-format.test.ts tests/unit/season-end.test.ts` 통과: 16 tests
- `npm.cmd test -- tests/integration/offseason-market.test.tsx` 통과: 2 tests
- `npm.cmd test` 통과: 42 files, 172 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking

남은 문제:

- 전체 화면 polish, 선수 사진, 베타 테스트 준비는 후속 작업

### 2026-06-08 - 11번 안정성 하드닝

작업 범위:

- `AppErrorBoundary` 추가로 렌더링 예외 발생 시 흰 화면 대신 복구 안내 표시
- 커리어가 없는 상태에서 주요 페이지가 `null`로 사라지지 않도록 커리어 필요 fallback 화면 추가
- 보호된 직접 URL(`/hub`, `/summary`, `/offseason`, `/calendar/calendar`, `/competitions/worlds/bracket`) 진입 테스트 추가
- `validateCareerIntegrity` helper 추가: 중복 schedule/record id, 잘못된 record->schedule 참조, 일반 시즌 Asian Games 누수, 누락 선수 참조 검사
- debug runner가 목표 상태에 도달했더라도 무결성 위반이 있으면 실패하도록 보강

검증:

- `npm.cmd test -- tests/unit/career-integrity.test.ts tests/unit/career-progress-debug-runner.test.ts tests/integration/app-error-boundary.test.tsx tests/integration/app-routing.test.tsx` 통과: 18 tests
- `npm.cmd test` 통과: 41 files, 167 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- 테스트 컴포넌트 타입 보정 후 `npm.cmd test -- tests/integration/app-error-boundary.test.tsx` 재확인 통과
- `npm.cmd run server:check` 통과: MongoDB `moba_esports_manager.careerSaves` 연결 OK

남은 문제:

- UI 전체 검토, 16:9/모바일 폭 polish, 화면별 시각 조정은 후속 작업으로 분리

### 2026-06-08 - 10번 저장 안정성/마이그레이션 최소 보강

작업 범위:

- `normalizeCareerSave` 런타임 정규화 helper 추가
- 저장 API load/create/update 응답에서 `career` payload를 정규화하도록 연결
- 오래된 저장 데이터의 `weeklyPlan`, `seasonHistory`, `internationalOpponents`, 선수 생애주기/status, 오프시즌 배열/제안/로그 누락을 기본값으로 복구
- 자동 저장 fingerprint에 시즌 히스토리와 오프시즌 요약 변화를 포함
- schemaVersion DB 일괄 마이그레이션은 보류하고, 기말 프로젝트 범위에서는 불러오기 시점 fallback 정책으로 확정

검증:

- `npm.cmd test -- tests/unit/career-save-normalization.test.ts tests/unit/auto-save-checkpoint.test.ts tests/unit/career-progress-debug-runner.test.ts tests/integration/save-manager.test.tsx` 통과: 16 tests
- `npm.cmd test` 통과: 39 files, 156 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- `npm.cmd run server:check` 통과: MongoDB `moba_esports_manager.careerSaves` 연결 OK

남은 문제:

- 로그인 사용자별 `ownerId` 연결과 배포용 DB 분리는 후순위
- 후속 UI 검토와 화면 polish가 기말 목표의 마지막 정리 작업

### 2026-06-08 - 9번 시즌 히스토리/3시즌 결산 UI

작업 범위:

- `SeasonSummary`에 optional `offseasonSummary` 추가
- 스토브리그 종료 후 다음 시즌 진입 시 직전 시즌 summary에 재계약/방출/영입/은퇴/군입대/AI 보강/주요 로그 요약 저장
- `/summary`를 시즌 타임라인 기반 결산 화면으로 확장
- 선택한 시즌의 유저 팀 성적, LCK 결과, Worlds 우승팀, 대회별 결과, 스토브리그 흔적, 주요 선수 변화를 표시
- UI 톤은 발표용 증거 화면보다 플레이어가 커리어 엔딩과 시즌 결산을 보는 느낌으로 조정

검증:

- `npm.cmd test -- tests/unit/season-end.test.ts tests/unit/career-progress-debug-runner.test.ts tests/integration/season-summary.test.tsx` 통과: 14 tests
- `npm.cmd test` 통과: 38 files, 153 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- 브라우저로 `/summary` 직접 진입 시 커리어 상태가 없어 루트로 보호 이동하며 콘솔 에러 없음

남은 문제:

- 3시즌 저장/불러오기와 schemaVersion 최소 마이그레이션은 10번 작업
- 발표용 polish와 실제 화면 캡처 확인은 11번 작업

### 2026-06-08 - 8번 3시즌 자동 시뮬레이션 테스트

작업 범위:

- debug runner가 2026 Asian Games 참가 방식 선택 게이트를 자동 진행 모드로 처리하도록 보강
- 2026 LCK Cup 시작 상태에서 2029 LCK Cup 진입까지 한 번에 관통하는 단위 테스트 추가
- 2026에는 Asian Games와 LCK Rounds 3-4가 포함되고, 2027/2028 일반 시즌에는 Asian Games가 남지 않는지 검증
- 3시즌 진행 후 `worlds`, `worldsQualification`, Asian Games 상태가 다음 시즌으로 누수되지 않는지 확인
- 최종 시즌 상태의 schedule/match record id 중복 검사 유지

검증:

- `npm.cmd test -- tests/unit/career-progress-debug-runner.test.ts` 통과: 6 tests
- `npm.cmd test` 통과: 38 files, 151 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking

남은 문제:

- 3시즌 히스토리/요약 UI는 이후 9번 작업에서 완료
- 3시즌 저장/불러오기와 schemaVersion 최소 마이그레이션은 10번 작업

### 2026-06-08 - 스토브리그 협상 분위기 시스템 보강

작업 범위:

- 계약 협상 UI에서 `현재 최소 수락선`, `수락권`, `거절 위험` 노출 제거
- 유저에게는 선수 측 공개 요구액, 제안 연봉, 협상 분위기만 표시
- 숨겨진 최소 수락선은 협상 분위기와 시장 마감일에 따라 소폭 조정
- 반복 거절은 분위기를 낮추고, 최소 수락선에 가까운 거절은 페널티를 줄이도록 계산
- 분위기 게이지 색상은 0% 빨강, 50% 흰색, 100% 초록으로 보간
- `OffseasonOffer`에 optional `visibleDemand`, `moodScore` 저장

검증:

- `npm.cmd test -- tests/unit/offseason-market.test.ts tests/integration/offseason-market.test.tsx` 통과
- `npm.cmd test` 통과: 38 files, 150 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- 이적시장 계약 제안 모달 스크린샷 재생성: `screenshots/live-preview/offseason-market-desktop.png`, `screenshots/live-preview/offseason-market-mobile.png`

남은 문제:

- 장기 보류 협상, 재협상 쿨다운, 선수 성격/에이전트 성향은 후속 고도화 범위

### 2026-06-08 - 7번 2028 시즌 반복 안정화

작업 범위:

- debug runner에 2028 LCK Cup 진입 상태에서 2029 LCK Cup 진입까지 관통 검증 추가
- 일반 시즌에 Asian Games state/competition이 남으면 실패하도록 기존 runner guard 재사용
- 2028 시즌 종료 후 `worlds`/`worldsQualification`이 다음 시즌으로 누수되지 않는지 테스트
- 2028 진행 후 `scheduledMatches`, competition schedule, `matchRecords` id 중복 검사 추가
- 5+6번의 pending 재계약 구조와 충돌하지 않도록 debug runner 자동 재계약 정책 보강
- runner는 1주차 7일차에 선발/최소 등록 인원을 우선 재계약하고 나머지 만료 선수는 방출해 예산 초과 반복 실패를 피함

검증:

- `npm.cmd test -- tests/unit/career-progress-debug-runner.test.ts` 통과
- `npm.cmd test -- tests/unit/season-state.test.ts tests/unit/season-end.test.ts tests/unit/offseason-market.test.ts` 통과
- `npm.cmd test` 통과: 38 files, 146 tests
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- 이적시장 계약 제안 모달 스크린샷 생성: `screenshots/live-preview/offseason-market-desktop.png`, `screenshots/live-preview/offseason-market-mobile.png`

남은 문제:

- 3시즌 자동 검증은 이후 8번 작업에서 완료
- 3시즌 요약 UI, 저장 마이그레이션, 발표용 polish는 후속 작업

### 2026-06-08 - 5+6번 스토브리그 2차와 은퇴/군입대/AI 보강

작업 범위:

- 재계약 제안을 하루 단위 pending 협상으로 변경하고 다음날 수락/거절 판정
- FA 제안에서 유저/AI 제안이 모두 기준 미달이면 선수는 FA 시장에 잔류
- 스토브리그 마감이 가까울수록 최소 수락선이 완만하게 낮아지는 helper 추가
- 공통 계약 제안 모달 추가
- 오프시즌 시작 시 은퇴/군입대 대상자를 계약/로스터/FA 풀에서 제외
- AI 팀의 FA 기반 포지션 보강과 이적 로그 반영
- 신규 유망주 생성은 3시즌 목표 이후 장기 과제로 보류

검증:

- `npm.cmd test -- tests/unit/offseason-market.test.ts tests/integration/offseason-market.test.tsx` 통과
- `npm.cmd test -- tests/unit/player-lifecycle.test.ts tests/unit/career-progress-debug-runner.test.ts` 통과
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- `npm.cmd test` 통과: 38 files, 145 tests

남은 문제:

- 2028 반복 안정화는 7번 작업
- 3시즌 전체 자동 시뮬레이션은 이후 8번 작업에서 완료
- AI-AI/AI-유저 트레이드 협상, 장기 신규 선수 공급은 후속 장기 과제

### 2026-06-08 - 핸드오프 문서 압축 정리

작업 범위:

- `CODEX_HANDOFF.md`를 최신 작업 중심으로 재구성
- 과거 장문 작업 로그를 현재 상태, 설계 결정, 다음 작업, 최근 로그 중심으로 압축
- 700줄 미만 유지 목표 반영

검증:

- 문서 작업이므로 build/test 생략
- 줄 수와 민감 정보 검색만 확인 권장

### 2026-06-08 - 4번 2027 시즌 전체 연결과 장기 진행 Debug Runner

작업 범위:

- `CareerProgressResult.trace` optional 필드 추가
- `src/domain/game-progress/careerProgressDebugRunner.ts` 추가
- debug runner가 step log, 자동 오프시즌 처리, state repeat/max step/progress block 실패 정보를 반환
- 2027 LCK Cup 시작 상태에서 Worlds, 시즌 요약, 28일 스토브리그, 2028 LCK Cup 진입까지 관통 검증

검증:

- `npm.cmd test -- tests/unit/career-progress-debug-runner.test.ts` 통과
- `npm.cmd test -- tests/unit/season-state.test.ts tests/unit/lck-rounds-35-format.test.ts tests/unit/worlds-format.test.ts tests/unit/season-end.test.ts tests/unit/career-progress-debug-runner.test.ts` 통과
- `npm.cmd run build` 통과. Vite 500kB chunk 경고는 non-blocking
- `npm.cmd test` 통과: 38 files, 140 tests

남은 문제:

- 2026 시작부터 2028 Worlds 종료 후 스토브리그까지 한 번에 도는 3시즌 자동 검증은 이후 8번 작업에서 완료
- 오프시즌 자동 처리 정책은 검증용 최소 정책이며, 실제 재미/AI 로스터 변동은 5번 작업에서 고도화 필요

### 2026-06-08 - 안정성 점검과 자동저장 보강

작업 범위:

- 2027 연결 전 안정성/디버깅/개발 효율 점검
- 자동저장 fingerprint에 선수 생애주기, 로스터, 주간 전략/훈련 반영
- First Stand 규정 모달의 과거 placeholder 문구 제거
- Windows 명령 문서 일부를 `npm.cmd` 기준으로 통일
- 자동저장 checkpoint 단위 테스트 추가

검증:

- `npm.cmd test -- tests/unit/auto-save-checkpoint.test.ts tests/integration/app-autosave.test.tsx` 통과
- `npm.cmd test` 통과: 37 files, 136 tests
- `npm.cmd run build` 통과

### 2026-06-08 - 구조개선 4종

작업 범위:

- 서버 Layered Architecture 1차 리팩터링
- `App.tsx` 1차 분리
- reducer/action handler 분리와 GameProvider Context 분리
- `useSyncExternalStore` selector store 적용
- `src/domain/players` 1차 구조화

검증:

- 각 단계별 targeted test 통과
- 최종 `npm.cmd test` 통과: 36 files, 133 tests
- 최종 `npm.cmd run build` 통과

### 2026-06-07 - 0번~3.5번 기말 목표 기반 작업

요약:

- 기말 프로젝트 목표를 `LCK 3시즌 작동`으로 공식화
- 2026 LCK 10개팀 1군+2군 전체 선수 데이터 import
- 시즌 템플릿/연도별 분기 구현
- 일반 시즌 LCK Rounds 3-5 실제 경기 구현
- 사용자 메모 기반 능력치 세부조정 완료

검증:

- 관련 단위/통합 테스트와 build 통과
- 2027 전체 관통 검증은 이후 4번 debug runner에서 완료

### 이전 주요 구현 압축 요약

- MongoDB 저장/불러오기 최소 플로우
- MSI 도메인/UI/브래킷
- LCK Rounds 3-4 정규 그룹 리그와 포스트시즌
- Asian Games 2026 도메인/UI/브래킷
- Worlds 시드/참가팀 풀과 실제 경기 포맷
- 시즌 종료/요약/다음 시즌 전환
- 스토브리그 1차 28일/4주 시장
- 대회/캘린더 세부 URL 하위페이지화

## 이어받는 에이전트용 프롬프트

```text
이 프로젝트는 League of Legends e스포츠 매니저 게임입니다.
먼저 README.md, CODEX_HANDOFF.md, docs/development-checklist.md, IMPLEMENTATION_ORDER.md를 읽고 현재 구현 상태를 파악해주세요.
기말 프로젝트 최우선 목표는 LCK 3시즌 작동입니다. 2026, 2027, 2028 시즌을 진행해 2028 Worlds 종료 후 시즌 요약/스토브리그까지 안정적으로 도달하는 것을 기준으로 작업 우선순위를 잡아주세요.
현재 2027, 2028 일반 시즌 반복은 debug runner로 검증 완료됐습니다.
2026 시작 상태에서 2029 LCK Cup 진입까지 3시즌 자동 debug runner 검증도 완료됐습니다.
다음 기능 작업 후보는 베타 테스트 피드백 반영입니다. 진행 불가, 저장 불가, 화면 깨짐, 밸런스 문제를 우선순위로 잡아주세요.
파일을 수정할 때는 사용자 변경을 되돌리지 말고, 구현 후 build/test와 필요한 UI 검증 결과를 요약해주세요.
작업을 마치면 CODEX_HANDOFF.md의 현재 상태와 최근 작업 로그를 짧게 업데이트해주세요.
```
