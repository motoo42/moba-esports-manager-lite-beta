# Codex Handoff

이 문서는 다른 ChatGPT/Codex 계정에서 프로젝트를 이어받기 위한 인수인계 문서

최종 업데이트: 2026-06-07

## 프로젝트 위치

```text
C:\Users\hoyai\Desktop\KJH\coding\moba-esports-manager-lite
```

GitHub 저장소:

```text
https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42
```

## 핸드오프 운영 규칙

이 파일은 고정 문서가 아니라 여러 Codex 계정과 에이전트가 이어받기 위한 살아있는 작업 로그다.

모든 에이전트는 개발, 문서 정리, 테스트 수정, 설계 결정 같은 의미 있는 작업을 마칠 때마다 이 파일을 업데이트한다.

업데이트 원칙:

- 대화 전체를 붙여넣지 말고, 다음 에이전트가 바로 이어받을 수 있는 결정과 결과만 요약
- 위쪽의 `현재 구현 상태`, `현재 작업트리 주의`, `다음 권장 작업`은 항상 최신 상태로 유지
- 아래쪽의 `작업 로그`에는 세션별 기록을 최신순으로 추가
- 작업 로그에는 날짜, 작업 범위, 변경 파일, 검증 결과, 남은 문제, 다음 추천 작업을 적기
- 미완성 상태로 멈춘 경우에는 어떤 파일이 어떤 상태까지 수정됐는지 명확히 기록
- 본인이 만들지 않은 변경은 되돌리지 말고, 필요하면 `현재 작업트리 주의`에 구분해서 남기기
- 문서만 수정한 경우에는 build/test를 생략할 수 있지만, 생략 이유를 로그에 적기
- 코드나 UI를 수정한 경우에는 가능한 한 `npm.cmd run build`, `npm.cmd test` 결과를 기록
- Windows PowerShell에서 `npm`이 실행 정책에 막히면 `npm.cmd`를 사용

## 다중 에이전트 작업 루틴

새 계정이나 새 에이전트는 다음 순서로 시작한다.

1. `git status --short --branch`로 작업트리 상태 확인
2. `CODEX_HANDOFF.md`의 운영 규칙, 현재 구현 상태, 작업 로그 최신 항목 확인
3. `docs/development-checklist.md`와 `IMPLEMENTATION_ORDER.md`로 다음 목표 확인
4. 작업 범위를 하나로 좁히고, 관련 도메인/UI/테스트 파일만 추가로 읽기
5. 구현 후 build/test/스크린샷 등 검증 수행
6. `docs/development-checklist.md`와 `CODEX_HANDOFF.md`를 최신화
7. 최종 응답에는 변경 요약, 검증 결과, 남은 리스크를 짧게 보고

컨텍스트 절약 원칙:

- 전체 문서를 매번 모두 읽기보다 이 파일의 최신 상태와 작업 로그를 먼저 본다
- 큰 파일은 필요한 함수, 타입, 테스트 이름을 `rg`로 좁혀 읽는다
- 새 설계 결정을 내렸다면 이 파일과 관련 docs에 짧게 남긴다
- 작업 로그는 길게 쓰지 않는다. 다음 에이전트가 1~2분 안에 이어받을 수 있는 밀도로 유지한다

## 먼저 읽을 문서

1. `README.md`
2. `CODEX_HANDOFF.md`
3. `docs/development-checklist.md`
4. `IMPLEMENTATION_ORDER.md`
5. `docs/ui-design-decisions.md`
6. `docs/season-calendar.md`
7. `docs/match-simulation.md`
8. `docs/msi-format.md`
9. `skills/index.md`

## 기말 프로젝트 신규 목표

현재 최우선 실행 목표는 `기말 프로젝트: LCK 3시즌 작동`이다.

완료 기준:

- 2026 아시안게임 시즌을 끝까지 진행
- 2027 일반 시즌을 끝까지 진행
- 2028 일반 시즌을 끝까지 진행
- 2028 Worlds 종료 후 시즌 요약과 스토브리그까지 안정적으로 도달
- 2029 시즌 실제 플레이 완성이 아니라, 2029 진입 직전 상태까지 안정성을 확인
- 저장/불러오기와 자동 저장이 3시즌 동안 깨지지 않음

기존 `정교한 개인 프로젝트 v1`과 `20시즌 안정 작동` 목표는 유지하되, 당분간 모든 작업 우선순위는 이 3시즌 목표 기준으로 정렬한다.

3시즌 목표 기준 현재 진척도 추정은 약 70~78%다. 2026 한 시즌은 대부분 닫혔고 전체 선수 데이터 import, 1차 능력치 세부조정, 시즌 템플릿 분기, 일반 시즌 LCK Rounds 3-5도 완료됐지만, 2027/2028 전체 시즌 연결과 장기 진행 테스트가 필요하다.

## 현재 구현 상태

프로젝트는 React/Vite/TypeScript 기반 League of Legends e스포츠 매니저 게임

완료된 핵심:

- 실제 URL 기반 라우팅
- 대회/캘린더 세부 메뉴 URL 하위페이지 라우팅
- FM식 16:9 메인 프레임
- 커리어 생성
- 스토브리그 이후 LCK Cup 활성화
- 1군/2군 로스터와 선발 5인 관리
- 드래그 앤 드롭 선발 교체
- 선수 상태: 폼, 피로도, 5단계 사기
- 주간 전략/훈련 강도
- 밴픽 점수 기반 시리즈 시뮬레이션 초안
- 날짜 단위 진행 엔진
- 5초 진행중 오버레이
- LCK Cup 진행
- LCK Rounds 1-2 정규시즌 일정 생성/진행
- LCK Rounds 1-2 포스트시즌 6팀 싱글 엘리미네이션
- LCK Rounds 1-2 대회 현황 UI
- First Stand 국제전 화면 골격
- First Stand 실제 진행 엔진
- First Stand UI 실제 결과 연동: 조별 순위표, 일정/결과, 4강/결승 브래킷, 현재 라운드, 우리 팀 하이라이트
- LCK Cup 완료 후 First Stand, First Stand 완료 후 LCK Rounds 1-2 전환
- MongoDB Atlas 연결
- Express API 서버와 `careerSaves` 저장/불러오기
- 커리어 생성 화면 저장 목록 조회
- 상단바 수동 저장/새 저장/불러오기 UI
- 커리어 생성 직후 첫 자동 저장
- 주요 진행 체크포인트 자동 저장: 로스터 확정, 날짜 진행, 경기 기록, 대회 상태 전환
- 저장 `revision` 기반 충돌 감지와 409 피드백
- MSI 2026 포맷 도메인 엔진
- LCK Rounds 1-2 완료 후 MSI 활성화
- MSI 플레이인, 상위조/하위조 브래킷 진행, 우승팀/준우승팀 저장
- MSI 전용 대회 현황 UI: Overview, Schedule, Bracket
- MSI 플레이인, 상위조, 하위조, Grand Finals 화면 표시
- MSI 현재 라운드, BO5, 우리 팀 경기/슬롯 하이라이트
- MSI 1366x768 16:9 브라우저 검증
- MSI 브래킷 가로 잘림과 Play-In 제목 겹침 수정
- MSI 성적 기반 Worlds 보너스 시드 2개 리그 판정
- `SeasonState.worldsQualification`에 리그별 MSI 최고 성적, 보너스 리그, LCK 1~4시드 해석, Worlds 참가팀 풀 저장
- LCK가 MSI 보너스 리그면 Rounds 3-4 최종 4위를 Worlds 진출팀으로 승격
- Worlds 20팀 참가 풀 구성: LCK/LPL/LCS/LEC 기본 3팀, LCP/CBLOL 기본 2팀, MSI 보너스 2팀, LCQ placeholder 2팀
- `LTA` 표기를 `LCS`로 통일하고 legacy `LTA` 저장값은 helper에서 `LCS`로 해석
- MSI Overview/Summary, LCK Rounds 3-4 후속 경로, Worlds 기본 화면에 Worlds 보너스/참가 풀 요약 표시
- Worlds 실제 진행 엔진: Play-In 8팀, Group Stage 16팀, Knockout 8팀, 결승 우승팀 저장
- Worlds 조 편성은 같은 리그 중복 금지를 우선하고, 불가능한 경우 최소 중복 fallback 사용
- Worlds 유저 팀 경기만 match-preview로 진입하고, 유저 팀이 없거나 탈락한 이후 경기는 AI 자동 처리
- Worlds 대회 현황 UI: Overview, Schedule, Groups, Bracket
- Worlds 하위 URL: `/competitions/worlds/overview`, `/competitions/worlds/schedule`, `/competitions/worlds/groups`, `/competitions/worlds/bracket`
- Worlds 완료 후 시즌 종료/오프시즌 전환
- 시즌 요약 화면: 대회별 결과, 최종 승패/ELO, Worlds 우승팀, 계약 만료 현황
- 계약 연차 감소와 28일/4주 스토브리그 진입
- `/summary`는 시즌 결과 확인과 스토브리그 진입 허브로 축소
- `/offseason` 신규 화면: 4주 타임라인, 내 팀 계약, FA 시장, 로스터 현황, 이적 로그
- 스토브리그 1주차 팀 내 재계약/방출, 2~4주차 FA 계약 경쟁, 28일차 최종 등록
- 오프시즌 상단 진행 버튼은 active 스토브리그에서 `다음날`로 하루씩 진행
- FA 제안은 다음날 AI 경쟁 제안과 비교해 유저/AI 영입 결과를 결정
- AI FA 영입 결과는 선수 `currentTeam`과 이적 로그에 반영
- 미래 AI-AI/AI-유저 거래협상 확장을 위한 `OffseasonOffer` 구조 준비
- 2026 LCK 10개팀 1군+2군 선수 데이터 import
- `lck2026RosterSeeds` + `lck2026RatingOverrides` + `lck2026Players` 구조로 실제 명단과 게임용 능력치 초안을 분리
- 기존 sample 핵심 선수의 id/능력치는 보존하고, currentTeam/rosterTier/source/age는 2026 roster 기준으로 보강
- 2026 LCK 10개팀 1군+2군 능력치 1차 세부조정: 사용자 메모 기반 핵심 선수 보정, 나머지 선수 밸런싱 패스, 검토표 생성
- LCK 2026 Rounds 1-2 실제 스탯 기반 순수 후보 능력치 비교표 생성: `docs/lck-2026-stat-rating-comparison.md`
- 실제 게임 적용 능력치는 메모 기반 테이블 유지. 스탯 기반 후보표는 참고용으로만 보관
- Kingen/Pyosik/Clozer/Life/Peter/Quantum/Clear/Raptor/VicLa/Daystar/Jiwoo 추가 메모 기반 보정과 전체 2군 검토표 반영
- 최종 미세 조정: Jaehyuk 66/84, Sharvel 75/85, Canyon 87/88로 확정. 선수 스탯 조정 단계는 완료로 간주
- PR 직전 2군 최종 밸런싱: Academy TOP6를 Sharvel, Cloud, Guti, Haetae, Garden, Wayne으로 고정. Gen.G/Hanjin BRION CL은 낮은 어빌/POT, T1/DK/NS CL은 강세 반영
- 새 커리어 생성 시 `lck2026Players` 전체 풀 사용
- 로스터 빌더 팀/포지션/1군·2군/검색 필터 추가
- `SeasonProfile` 기반 시즌 분기: 2026은 아시안게임 시즌, 2027/2028은 일반 시즌
- 일반 시즌 생성 시 `lck-rounds-3-5` 포함, `asian-games` 제외
- 일반 시즌 MSI 완료 후 `lck-rounds-3-5` 활성화 발판 연결
- 일반 시즌 LCK Rounds 3-5 실제 경기 엔진: Legend/Rise 그룹, 기록 승계, 8주 60경기 BO3 Fearless
- Rounds 3-5 이후 Season Play-In/LCK Playoffs 실제 경기 생성
- Rounds 3-5 포스트시즌 최종 1~4위 저장과 Worlds 진출권 연결
- Rounds 3-5 대회 현황 UI: 그룹 순위표, 일정/결과, 후속 경로 탭
- 다음 시즌 시작: 선수 나이/상태 롤오버, 승패 리셋, ELO 유지, 다음 시즌 LCK Cup 활성화
- 아시안게임 시즌 LCK Rounds 3-4 정규 그룹 리그
- Rounds 1-2 순위 기준 Legend/Rise 그룹 분리와 기록 승계
- Rounds 3-4 5주 40경기 BO3 Fearless 일정 생성
- MSI 완료 후 아시안게임 시즌 Rounds 3-4 전환
- Rounds 3-4 대회 현황 UI: 그룹 순위표, 일정/결과, 후속 경로 탭
- Rounds 3-4 데스크톱/모바일 브라우저 레이아웃 검증
- Rounds 3-4 이후 Season Play-In 실제 경기 생성
- Rounds 3-4 이후 LCK Playoffs 상위조/하위조 브래킷 실제 경기 생성
- Rounds 3-4 포스트시즌 최종 1~4위 저장
- Rounds 3-4 후속 경로 UI 실제 플레이인/플레이오프 결과 연동
- Asian Games 2026 대표 6인 자동 선발
- Asian Games 개막 6일 전 직접 플레이/자동 진행 선택 모달
- Asian Games 8개 국가 8강 토너먼트, 4강, 동메달전, 결승 진행
- Asian Games 직접 플레이 선택 시 한국 경기만 플레이 흐름 진입
- Asian Games 자동 진행 선택 시 한국 경기 포함 AI 자동 처리
- Asian Games 금/은/동 결과 저장
- 대한민국 금메달 시 대표 6인 병역 상태 `completed` 적용
- Asian Games 완료 후 Worlds `available` 전환
- Asian Games 대회 현황 UI: Overview, Schedule, Bracket
- Asian Games 브래킷 데스크톱/모바일 Playwright 검증
- Asian Games 브래킷 피라미드 배치와 메달 색상 UI 보강

아직 미완성:

- 로그인/사용자별 저장
- 배포용 MongoDB 환경 분리
- 저장 데이터 버전 마이그레이션 정책
- 스토브리그 2차 고도화: 실제 전체 선수 데이터 기반 AI 로스터 전력 반영, AI-AI/AI-유저 거래협상 UI, 선수 선호도/경쟁 입찰
- Asian Games 대표 차출 폼/피로도 이벤트
- 장기 커리어 이벤트
- 데이터 확장과 밸런싱

## 중요한 설계 결정

- 개인 프라이빗 프로젝트이므로 실제 League of Legends, LCK, MSI, Worlds, 팀명, 선수명을 사용
- 공개 저장소에는 실제 팀 로고/선수 사진 같은 에셋 파일을 직접 포함하지 않는 방향 권장
- 첫 시즌은 2026 시즌
- 2026 시즌부터 아시안게임 시즌으로 시작하고, 이후 4년마다 아시안게임 시즌
- 게임 시작 시 LCK Cup은 inactive 상태
- 스토브리그와 로스터 확정 후 LCK Cup 활성화
- LCK 팀은 10팀 고정
- 로스터는 팀당 1군+2군 10~15명
- 실제 경기 선발은 5명
- 계약 타입은 1년, 2년, 1+1년
- 훈련 강도는 `고강도 훈련`, `일반 훈련`, `가벼운 훈련`, `휴식`
- 전략은 `공격 지향`, `템포 지향`, `운영 지향`, `시야 중심형`, `후반 설계형`, `균형 전술`
- 사기는 숫자 대신 `최상`, `중상`, `중`, `중하`, `최하`
- UI는 16:9 가로 화면 우선
- 전체 페이지 스크롤보다 패널 내부 스크롤 우선
- MVP 저장은 `careerSaves` 컬렉션에 `CareerSave` 전체를 저장하는 단순형 구조
- 저장 문서에는 추후 같은 세계관 멀티유저 모드를 고려해 `mode`, `worldId`, `participants`, `ownerId`, `revision`을 포함
- 현재 개발용 저장 소유자는 `local-dev`; 배포 전 실제 로그인 사용자 ID로 교체 필요
- 현재 `.env.local`은 Node SRV DNS 실패 때문에 SRV URI 대신 non-SRV Atlas host list URI를 사용
- 자동 저장은 활성 저장 슬롯이 있으면 update, 없으면 `{팀명} S{시즌} Autosave` 슬롯을 create
- 자동 저장 체크포인트는 커리어 생성 직후, 로스터 확정, 날짜 진행, 경기 기록 수 변화, 대회 상태/스테이지 변화
- 전략/훈련/선발 변경 즉시 자동 저장은 이번 범위에서 제외
- 불러오기 직후에는 같은 상태를 다시 덮어쓰지 않도록 다음 자동 저장 1회를 건너뜀
- 저장 업데이트는 `expectedRevision`을 보내며, 서버 revision과 다르면 409 `Save revision conflict`를 반환하고 병합하지 않음
- MSI는 First Stand 8팀 조별리그 구조를 재사용하지 않고, 2026 MSI 기준 11팀 포맷으로 구현
- MSI는 CBLOL 제외 각 지역 2팀 + CBLOL 우승팀 1팀 참가
- MSI는 1시드 6팀 + First Stand 우승 리그 2시드 팀이 브래킷 직행, 나머지 2시드 4팀이 플레이인 진행
- MSI 브래킷 스테이지는 8팀 상위조/하위조 더블 엘리미네이션
- MSI 세부 규칙은 `docs/msi-format.md`를 기준으로 확인
- MSI에서 상위 성적을 기록한 2개 리그는 Worlds 추가 시드 1장을 받을 수 있음
- MSI 리그 성적 판정은 같은 리그 참가팀 중 더 높은 성적을 기록한 1팀만 기준으로 함
- MSI 성적 기반 보너스 시드 판정은 구현되어 `worldsQualification`에 저장됨
- LCK가 MSI 추가 시드 조건을 만족하면 LCK 포스트시즌 4위도 Worlds 진출팀으로 승격
- LCK가 MSI 추가 시드 조건을 만족하지 못하면 LCK 포스트시즌 4위는 `조건 미충족`으로 표시하고 Worlds 참가 풀에서 제외
- Worlds 참가팀 풀은 20팀 모델로 확정: LCK/LPL/LCS/LEC 기본 3팀, LCP/CBLOL 기본 2팀, MSI 보너스 2팀, LCQ placeholder 2팀
- Worlds 포맷은 Play-In 8팀 -> Group Stage 16팀 -> Knockout 8팀 -> 우승팀 저장
- Worlds Group Stage 직행 12팀은 LCK/LPL/LCS/LEC 1~3시드
- Worlds Play-In 8팀은 LCP 1~2시드, CBLOL 1~2시드, MSI 보너스 2팀, LCQ placeholder 2팀
- Worlds Play-In은 4팀 2개 조 BO1 싱글 라운드 로빈, 각 조 상위 2팀 진출
- Worlds Group Stage는 4팀 4개 조 BO1 더블 라운드 로빈, 각 조 상위 2팀 진출
- Worlds Knockout은 8강/4강/결승 전 경기 BO5
- Worlds 8강 대진은 `A1 vs B2`, `B1 vs A2`, `C1 vs D2`, `D1 vs C2`
- Worlds 조 편성은 deterministic seed 기반으로 같은 리그 중복 금지를 우선하고, 불가능할 때만 최소 중복 fallback 사용
- Worlds 완료 후 다음 진행/리뷰 정리에서 시즌 요약을 1회 생성하고 `seasonHistory`에 저장
- 시즌 종료 시 계약 `remainingYears`를 1 감소시키고 0년 선수는 `SeasonState.offseason.expiredContractPlayerIds`에 기록
- 현재 스토브리그 1차는 28일/4주 날짜 진행형. 1주차는 재계약/방출, 2~4주차는 FA 계약 경쟁, 28일차는 최종 등록
- 스토브리그 active 상태에서는 상단 진행 버튼이 `다음날`로 표시되고 하루씩 진행
- 재계약 수락 기준은 요구액의 90% 이상. 요구액은 `salaryExpectation`과 계약 기간 보정 1년 1.00 / 2년 1.08 / 1+1년 1.04 기준
- FA 제안은 즉시 확정하지 않고 다음날 AI 경쟁 제안과 비교. 승자는 제안 점수로 결정하고 AI 승리 시 선수 `currentTeam`을 AI 팀명으로 갱신
- `OffseasonOffer`는 `contract`와 future `transfer` kind를 갖도록 설계해 AI-AI/AI-유저 거래협상 확장 여지를 둠
- 이번 범위의 FA seed는 실제 이름 기반 최소 데이터이며, 현실 계약 상태와 1:1로 맞추지 않음
- 선수 능력치는 `src/data/lck2026RatingOverrides.ts`에서 핵심 선수만 수동 보정하는 방식
- 다음 큰 구조 작업은 시즌 템플릿/연도별 분기
- 스토브리그는 사용자가 인게임 엔진보다도 중요하게 보는 핵심 시스템이며, 이후 선수 선호도/경쟁 입찰/거래협상/AI 전력 반영으로 계속 고도화 예정
- 다음 시즌 시작 시 팀 승패는 0으로 리셋, ELO는 유지, 선수는 나이 +1/피로 0/컨디션 회복/폼 중간값 보정
- 다음 시즌 전환은 스토브리그 최종 등록 조건 통과 후 새 시즌 LCK Cup을 활성화하는 방식
- 코드와 문서의 Americas 리그 표기는 `LCS`를 사용하고, 기존 저장값의 `LTA`는 helper에서 호환 처리
- 아시안게임 시즌 LCK Rounds 3-4는 2026 LCK 공식 규칙을 기준으로 구현
- Rounds 3-4는 Rounds 1-2 최종 순위 기준 상위 5팀 Legend, 하위 5팀 Rise로 분리
- Rounds 1-2 승패/세트 기록은 Rounds 3-4 순위표에 그대로 승계
- Rounds 3-4는 그룹 내부 5팀 더블 라운드로빈, 팀당 8경기, 총 40경기, BO3 Fearless
- Rounds 3-4 정규 그룹 종료 시 Legend 1-5위와 Rise 1-3위를 Season Play-In/Playoffs 경로 후보로 저장
- Season Play-In은 Legend 5위, Rise 1~3위가 참가하고 2팀이 Playoffs에 합류
- Playoffs는 Legend 1~4위와 Season Play-In 통과 2팀이 참가하는 상위조/하위조 브래킷
- Season Play-In/Playoffs 모든 경기는 BO5 Fearless
- Playoffs 종료 후 최종 1~4위를 저장. 1~3위는 기본 Worlds 후보, 4위는 MSI 추가 시드 조건부 후보
- Asian Games는 8개 국가 토너먼트로 구현
- Asian Games 참가국은 대한민국, 중국, 대만, 일본, 홍콩, 베트남, 인도, 마카오
- Asian Games 8강 대진은 대한민국 vs 마카오, 일본 vs 홍콩, 중국 vs 인도, 대만 vs 베트남
- Asian Games 결승은 BO5, 8강/4강/동메달전은 BO3
- Asian Games 대표 6인은 개막 7일 전 자동 선발하고, 개막 6일 전 플레이 여부를 한 번만 선택
- 대표 선발은 LCK 선수 풀 전체 기준으로 TOP/JGL/MID/BOT/SUP 각 최고 폼 1명과 남은 후보 중 최고 폼 1명
- 동률은 `overall`, `potential`, `id` 순으로 해소
- 직접 플레이 선택 시 한국 경기만 match-preview/플레이 흐름으로 진입하고, 스타팅 5인은 자동 고정
- 자동 진행 선택 시 한국 경기 포함 모든 Asian Games 경기를 AI 경기로 처리
- 대한민국 금메달 시 대표 6인의 `militaryServiceStatus`를 `completed`로 변경
- Asian Games 완료 후 Worlds를 `available` 상태로 전환
- 대회/캘린더 내부 탭은 저장 상태에 넣지 않고 URL path segment로만 제어
- 기존 `/competitions/:id`, `/calendar`는 유지하며 기본 탭을 표시
- 잘못된 대회/캘린더 하위 URL은 리다이렉트하지 않고 해당 화면의 기본 탭을 표시

## 주요 코드 위치

```text
src/app/App.tsx
src/app/GameProvider.tsx
src/app/gameReducer.ts
src/app/routes.ts
src/domain/game-progress/progressCareer.ts
src/domain/season/progressSeason.ts
src/domain/season/standingsEngine.ts
src/domain/season/firstStandFormat.ts
src/domain/season/lckCupFormat.ts
src/domain/season/lckRounds12Format.ts
src/domain/season/lckRounds12Playoffs.ts
src/domain/season/lckRounds34Format.ts
src/domain/season/lckRounds34Postseason.ts
src/domain/season/msiFormat.ts
src/domain/season/asianGamesFormat.ts
src/domain/season/worldsFormat.ts
src/domain/season/worldsQualification.ts
src/domain/season/seasonEnd.ts
src/domain/match-simulation/simulateMatch.ts
src/domain/series/simulateSeries.ts
src/domain/draft/runSimpleDraft.ts
src/services/careerSavesApi.ts
src/features/save-manager/SaveManager.tsx
src/features/competition-dashboard/CompetitionDashboard.tsx
src/features/season-summary/SeasonSummary.tsx
src/features/roster-management/SeasonRosterManager.tsx
src/shared/layout/AppShell.tsx
src/shared/styles/global.css
src/types/game.ts
server/config.ts
server/mongo.ts
server/careerSaves.ts
server/index.ts
server/checkMongoConnection.ts
```

## 검증 명령

```bash
npm.cmd run build
npm.cmd run server:check
npm.cmd test
npm.cmd run test:system
npm.cmd run test:acceptance
```

UI 작업 후에는 가능하면 16:9 스크린샷 저장

```text
test-results/ui-screenshots/
screenshots/live-preview/
```

## 현재 작업트리 주의

2026-06-05 문서 정리 작업에서 다음이 반영됨:

- `CODEX_HANDOFF.md` 신규 추가
- 프로젝트 Markdown 문서 전반 UTF-8 한국어 기준 정리
- 깨져 있던 기획 문서 복구
- 체크리스트를 `docs/development-checklist.md` 하나로 통합
- `IMPLEMENTATION_ORDER.md`는 현재 스프린트 안내판으로 축소
- `skills/*.md`를 현재 프로젝트 경로와 문서 기준으로 갱신

주의:

- 이 문서 정리 전부터 코드와 테스트 파일에 이미 진행 중인 변경이 존재함
- 새 에이전트는 `git status`를 먼저 확인하고, 본인이 만들지 않은 변경을 되돌리지 말 것
- 문서 변경만 검토할 때도 기존 코드 변경과 섞여 보일 수 있음
- `.env.local`은 Git ignored 파일이고 MongoDB secret을 포함함. 최종 응답, 문서, 커밋 메시지에 실제 URI나 비밀번호를 쓰지 말 것
- 현재 Node 드라이버의 SRV DNS 조회가 실패해 `.env.local`은 non-SRV Atlas host list URI를 사용함. `.env.example`은 계속 placeholder SRV URI로 유지

## 다음 권장 작업

0. 기말 프로젝트 LCK 3시즌 목표 문서화. 완료
1. 2026 LCK 10개팀 1군+2군 전체 선수 데이터 import. 완료
2. 시즌 템플릿/연도별 분기: 완료
3. 일반 시즌 LCK Rounds 3-5 설계와 실제 경기 구현. 완료
3.5. 사용자 능력치 세부조정: 완료. 추가 미세 조정/스탯 기반 후보표 선택은 가능하지만 4번 진행을 막는 필수 작업은 아님
4. 2027 시즌 전체 연결: 다음 작업. LCK Cup부터 Worlds, 시즌 요약, 스토브리그, 2028 전환까지
5. 스토브리그 2차 최소 고도화: AI 로스터 전력 반영, 선수 선호도, 경쟁 입찰
6. 선수 성장/하락/은퇴/유망주 최소 구조
7. 2028 시즌 반복 안정화
8. 3시즌 자동 시뮬레이션 테스트 또는 debug runner
9. 시즌 히스토리/3시즌 요약 UI
10. 저장 안정성/마이그레이션 최소 보강
11. 발표용 UI polish와 버그픽스

## 작업 로그

### 2026-06-07 - PR 직전 2군 최종 밸런싱

작업 범위:

- 사용자 최종 메모 기준으로 2026 LCK CL/2군 능력치 마지막 보정
- `Sharvel`을 `Dplus KIA` main tier에서 academy tier로 정정
- Academy TOP6 by current ability를 `Sharvel, Cloud, Guti, Haetae, Garden, Wayne`으로 고정
- Gen.G CL 전체 어빌/POT 하향: CL 최하위권 의도 반영
- Hanjin BRION CL POT 추가 하향: Gen.G와 함께 CL 하위권 의도 반영
- T1/Dplus KIA/Nongshim RedForce CL 강세를 일부 반영
- 조건 검증:
  - `Jaehyuk < Haetae`: 66 < 71
  - `Bluffing < Cloud`: 71 < 73
  - `Sharvel` rosterTier: academy
- `docs/lck-2026-rating-review.md`에 `Academy Top Overall` 섹션 추가

변경 파일:

- `src/data/lck2026RosterSeeds.ts`
- `src/data/lck2026RatingOverrides.ts`
- `docs/lck-2026-rating-review.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test` 통과: 34 files, 130 tests
- `npm.cmd run build` 통과
- 참고: 빌드에서 Vite 500kB chunk size warning이 출력됐지만 기존 번들 크기성 경고이며 실패는 아님

다음 참고:

- 선수 스탯 조정 단계는 PR 직전 기준 완료
- 다음 권장 작업은 4번 2027 시즌 전체 연결

### 2026-06-07 - 선수 스탯 조정 단계 최종 마무리

작업 범위:

- 사용자 최종 메모 기반으로 선수 능력치 미세 조정
- Jaehyuk: 현재 어빌/오버롤 66으로 하향, POT 84 유지
- Sharvel: 현재 어빌/오버롤 75로 상향, POT 85 유지
- Canyon: 현재 어빌/오버롤 87로 상향, POT 88로 정리
- `docs/lck-2026-rating-review.md` 재생성
- 검토표에 `Player rating adjustment stage is considered complete as of 2026-06-07 unless the user reopens it.` 문구 추가

변경 파일:

- `src/data/lck2026RatingOverrides.ts`
- `docs/lck-2026-rating-review.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test` 통과: 34 files, 130 tests
- `npm.cmd run build` 통과
- 참고: 빌드에서 Vite 500kB chunk size warning이 출력됐지만 기존 번들 크기성 경고이며 실패는 아님

다음 참고:

- 선수 스탯 조정 단계는 완료
- 다음 권장 작업은 4번 2027 시즌 전체 연결

### 2026-06-07 - 메모 기반 능력치표 추가 고도화 및 2군 표 보강

작업 범위:

- 사용자가 스탯 기반 후보표는 보관만 하고 실제 적용은 메모 기반 능력치표를 사용하기로 결정
- `src/data/lck2026RatingOverrides.ts`에서 추가 지정 선수 보정
- 보정 내용:
  - Kingen, Pyosik, Clozer: 현재 어빌은 각 라인 10위권 근처로 두고 POT은 전성기/커리어 고점 기준으로 상향
  - Life/Peter/Quantum: 서폿 10~12위권 순서가 보이도록 Peter 70, Life 69, Quantum 68로 정리
  - Clear: 탑 중하위권
  - Raptor: 정글 6~7위권, 약간 높은 POT
  - VicLa: 미드 중하위권, 약간 높은 POT
  - Daystar: 미드 하위권
  - Jiwoo: LazyFeel과 비슷한 어빌, POT은 LazyFeel보다 약간 낮게 설정
- `docs/lck-2026-rating-review.md` 재생성
  - `Memo-Based OVR 80+ Snapshot`
  - `User Focus Adjustments`
  - `Academy Summary By Team`
  - `Academy Top By Role`
  - `Academy Player Table`
  - `Full Player Table`
- `docs/lck-2026-stat-rating-comparison.md`는 참고 후보로 유지하되 실제 데이터에는 미적용

변경 파일:

- `src/data/lck2026RatingOverrides.ts`
- `docs/lck-2026-rating-review.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test` 통과: 34 files, 130 tests
- `npm.cmd run build` 통과
- 참고: 빌드에서 Vite 500kB chunk size warning이 출력됐지만 기존 번들 크기성 경고이며 실패는 아님

다음 참고:

- 현재 게임 적용값은 메모 기반 능력치표
- 추가 세부 조정이 없다면 4번 2027 시즌 전체 연결로 진행 가능

### 2026-06-07 - LCK 2026 실제 스탯 기반 능력치 후보표 생성

작업 범위:

- 사용자가 제공한 `붙여넣은 텍스트.txt`의 LCK 2026 Rounds 1-2 선수 스탯 표를 파싱
- 표 상태 확인: 탭 구분 26개 컬럼, 62명 선수 행, 현재 `lck2026Players`와 62/62 매칭
- 기존 사용자 메모 기반 능력치는 수정하지 않고, 순수 스탯 기반 후보표를 별도 문서로 생성
- 산정 기준:
  - 이전 채팅의 선수별 스카우팅 메모는 제외
  - 포지션별 정규화로 역할 차이 보정
  - 출전 경기 수가 적은 선수는 평균 쪽으로 shrink 처리하고 confidence 표시
  - Chovy = 90, Siwoo = 80으로 overall 보정
  - 첨부 표에는 전체 2군/CL 스탯이 없어 통계 행이 없는 46명은 임의 산정하지 않고 미산정 목록으로 분리
- 현재 사용자 메모 기반 테이블과 순수 스탯 기반 후보 테이블을 비교 가능하게 정리

변경 파일:

- `docs/lck-2026-stat-rating-comparison.md`
- `CODEX_HANDOFF.md`

검증:

- 문서 생성 스크립트에서 62/62 stat row 매칭 확인
- `rg "Stat OVR|Chovy|Siwoo|Players Not Rated|Parse result|Largest Overall" docs/lck-2026-stat-rating-comparison.md`로 주요 섹션 확인
- 실제 게임 능력치 데이터(`src/data/lck2026RatingOverrides.ts`)는 변경하지 않았으므로 `npm.cmd test`, `npm.cmd run build`는 실행하지 않음

다음 참고:

- 사용자가 현재 메모 기반 테이블과 스탯 기반 후보표 중 어느 쪽을 적용할지 선택해야 함
- 스탯 기반 후보를 적용할 경우 POT은 순수 스탯에서 직접 산정되지 않으므로 나이/유망주 규칙을 다시 얹는 후처리가 필요
- 전체 2군 능력치를 순수 스탯 기반으로 재산정하려면 별도 LCK CL 스탯 표가 필요

### 2026-06-07 - 3.5 능력치 세부조정 하위 5팀 적용 및 1차 완료

작업 범위:

- 사용자 메모 기준으로 하위 5팀 주요 선수 능력치 override 적용
- 대상 팀: Hanjin BRION, BNK FEARX, Nongshim RedForce, Kiwoom DRX, DN SOOPers
- 지정 선수 반영:
  - Casting: LCK 탑 중위권, 약간 높은 POT
  - Teddy: LCK 원딜 4위권, 한타/멘탈 약간 강점
  - Kellin: LCK 서폿 4위권, 라인전/멘탈 약간 강점
  - Taeyoon: LCK 원딜 중위권, 멘탈/한타 약간 강점
  - Ucal: LCK 미드 중위권, 피지컬 약간 강점
  - LazyFeel: LCK 원딜 하위권, 약간 높은 POT
  - Scout: LCK 미드 중위권, 운영/멘탈 약간 강점
  - Diable: LCK 원딜 4위권, 높은 POT
  - Lehends: LCK 서폿 중위권, 운영/멘탈 약간 강점
  - DuDu: LCK 탑 중위권, 멘탈/라인전 약간 강점
- DN SOOPers의 나머지 팀원은 LCK 9위권 이하급으로 낮게 밸런싱
- 2군 주요 선수 반영:
  - Bluffing: 2군 서폿 2위급, 높은 POT
  - Guti: 2군 미드 1위, 약간 높은 POT
  - Cloud: 2군 서폿 1위, 높은 POT
  - Sharvel: 2군 정글 1위, 약간 높은 POT
  - Jaehyuk: 2군 탑 1위권, 약간 높은 POT
- 사용자가 언급한 `Vincenzo`는 현재 `lck2026RosterSeeds`에 존재하지 않아 이번 override에는 미반영
- `docs/lck-2026-rating-review.md`를 최신 전체 능력치 표로 재생성
- `docs/development-checklist.md`, `IMPLEMENTATION_ORDER.md`, 이 핸드오프의 다음 작업을 4번 2027 시즌 전체 연결로 갱신

변경 파일:

- `src/data/lck2026RatingOverrides.ts`
- `docs/lck-2026-rating-review.md`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`
- `tests/integration/competition-dashboard.test.tsx`

검증:

- `npm.cmd test -- tests/unit/lck-2026-players.test.ts` 통과: 1 file, 6 tests
- `npm.cmd test` 통과: 34 files, 130 tests
- `npm.cmd run build` 통과
- 참고: 빌드에서 Vite 500kB chunk size warning이 출력됐지만 기존 번들 크기성 경고이며 실패는 아님

남은 문제:

- 추가 미세 조정 후보는 남아 있으나, 3.5 필수 범위는 1차 완료
- 추가로 사용자가 정하면 좋은 후보: Kingen, Pyosik, Clozer, Life/Peter, Clear/Raptor, VicLa/Daystar, Jiwoo

다음 추천 작업:

- 4번 2027 시즌 전체 연결: LCK Cup부터 Worlds, 시즌 요약, 스토브리그, 2028 전환까지 실제 장기 흐름 검증/보강

### 2026-06-07 - 3.5 능력치 세부조정 상위 5팀 적용

작업 범위:

- 사용자 메모 기준으로 상위 5팀 1군 선수 능력치 override 적용
- 대상 팀: Hanwha Life Esports, T1, Gen.G, KT Rolster, Dplus KIA
- 포지션 내 어빌 순위와 선수별 특징을 `ability`, `overall`, `mechanics`, `macro`, `laning`, `teamfight`, `mental`, `championPool`에 반영
- 포텐셜은 이번 산정 기준으로 2000~2002년생은 대체로 현재 어빌 근처, 1999년생 이하/2003년생 이상은 어빌보다 높게 책정
- 상위 5팀 2군/백업 선수는 주전보다 낮은 현재값과 유망주 중심 POT으로 재조정
- `docs/lck-2026-rating-review.md`를 최신 능력치 표로 재생성
- 기존 테스트가 “sample 선수는 rating도 보존”한다고 가정하던 부분을 “id는 보존하되 rating override는 허용”하도록 갱신

변경 파일:

- `src/data/lck2026RatingOverrides.ts`
- `docs/lck-2026-rating-review.md`
- `tests/unit/lck-2026-players.test.ts`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/unit/lck-2026-players.test.ts` 통과: 1 file, 6 tests

남은 문제:

- 하위 5팀 능력치 세부조정은 아직 미적용
- 하위 5팀 적용 후 `docs/lck-2026-rating-review.md`를 다시 확인하고 3.5 완료 처리 필요

다음 추천 작업:

- 3.5 사용자 능력치 세부조정 계속: 하위 5팀 1군 특징을 받아 override 적용

### 2026-06-07 - 3.5 사용자 능력치 세부조정용 검토표 생성

작업 범위:

- `src/data/lck2026Players.ts`에서 생성된 최종 2026 LCK 선수 108명의 현재 능력치 표 생성
- 상위 OVR 25명과 전체 선수 표를 팀/티어/포지션 순서로 정리
- OVR, ABI, POT, MEC, MAC, LAN, TF, MEN, POOL, Salary, 기존 override 적용 여부 표시
- 실제 조정은 아직 수행하지 않았고, 사용자가 표를 보고 `src/data/lck2026RatingOverrides.ts`를 수정하는 단계로 남김

변경 파일:

- `docs/lck-2026-rating-review.md`
- `CODEX_HANDOFF.md`

검증:

- 문서/검토표 생성 작업이라 build/test는 실행하지 않음
- 표 생성 결과: 108 players

남은 문제:

- 자동 생성 능력치라 Chovy 등 일부 핵심 선수의 값이 현실 기대치보다 낮거나, 특정 선수의 `ability`와 `overall` 간 괴리가 있을 수 있음
- 사용자가 `docs/lck-2026-rating-review.md`를 보고 핵심 선수 위주로 `src/data/lck2026RatingOverrides.ts`를 직접 보정해야 함

다음 추천 작업:

- 3.5 사용자 능력치 세부조정 계속: 핵심 1군 주전과 주요 유망주 override 작성

### 2026-06-07 - 일반 시즌 LCK Rounds 3-5 실제 경기 구현

작업 범위:

- 일반 시즌 `lck-rounds-3-5` 정규시즌 엔진 추가
- Rounds 1-2 최종 순위 기준 Legend/Rise 그룹 5팀씩 분리
- Rounds 1-2 승패/세트 기록을 Rounds 3-5 순위표에 승계
- Rounds 3-5 정규시즌: 그룹 내부 5팀 트리플 라운드 로빈, 팀당 12경기, 총 60경기, BO3 Fearless, 8주 편성
- 일반 시즌 MSI 완료 후 `activateLckRounds35`가 실제 일정과 순위표를 생성하도록 교체
- Rounds 3-5 Season Play-In/LCK Playoffs 구현: Rounds 3-4 포스트시즌 구조를 Rounds 3-5 전용 match id/competition id로 재사용
- Rounds 3-5 포스트시즌 최종 1~4위 저장
- Rounds 3-5 종료 후 `applyLckWorldsQualification`으로 Worlds LCK 1~4시드 해석과 참가 풀 갱신
- 일반 시즌은 Asian Games 없이 Worlds로 이어지는 흐름 유지
- Competition Dashboard가 `lck-rounds-3-5` 순위표/일정/후속 경로를 표시하도록 확장
- 좌측 대회 서브메뉴에서 `lck-rounds-3-5`도 순위표/일정/진출 경로 하위 페이지를 표시

변경 파일:

- `src/domain/season/lckRounds35Format.ts`
- `src/domain/season/lckRounds35Postseason.ts`
- `src/domain/season/createInitialSeasonState.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/domain/season/index.ts`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/layout/AppShell.tsx`
- `tests/unit/lck-rounds-35-format.test.ts`
- `tests/unit/season-state.test.ts`
- `tests/integration/competition-dashboard.test.tsx`
- `CODEX_HANDOFF.md`
- `docs/development-checklist.md`
- `docs/season-calendar.md`
- `docs/open-questions.md`
- `IMPLEMENTATION_ORDER.md`

검증:

- `npm.cmd test -- tests/unit/lck-rounds-35-format.test.ts tests/unit/season-state.test.ts` 통과: 2 files, 12 tests
- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과: 1 file, 12 tests
- `npm.cmd test` 통과: 34 files, 130 tests
- `npm.cmd run build` 통과
- Browser 확인: `http://127.0.0.1:5177/` 로드 성공, 콘솔 error 0건, 커리어 없는 `/competitions/lck-rounds-3-5/standings` 직접 진입은 시작 화면으로 정상 redirect

남은 문제:

- Rounds 3-5 자체는 구현됐지만, 2027 시즌 전체를 LCK Cup부터 Worlds/오프시즌까지 자동으로 관통하는 장기 검증은 아직 4번/8번 작업 범위
- 사용자가 4번 시작 전에 `src/data/lck2026RatingOverrides.ts`에서 핵심 선수 능력치를 직접 세부조정해야 함

다음 추천 작업:

- 3.5 사용자 능력치 세부조정: `src/data/lck2026RatingOverrides.ts`에서 핵심 선수 능력치 보정

### 2026-06-07 - 시즌 템플릿/연도별 분기

작업 범위:

- `SeasonProfile` 계층 추가: seasonNumber 기준 yearLabel, calendarType, hasAsianGames, lateSeasonCompetitionId, postMsiCompetitionId, competitionIds 해석
- 2026은 아시안게임 시즌, 2027/2028은 일반 시즌으로 생성되도록 시즌 초기화 구조 정리
- 아시안게임 주기는 기존 정책대로 `(year - 2026) % 4 === 0` 유지
- 일반 시즌 생성 시 `lck-rounds-3-5`를 포함하고 `asian-games` 상태/대회는 생성하지 않음
- 일반 시즌 MSI 완료 후 `lck-rounds-3-5`가 active 상태로 전환되는 발판 추가
- Rounds 3-5 실제 경기 엔진/포스트시즌/Worlds 시드 연결은 다음 3번 작업으로 유지
- 3번과 4번 사이에 `3.5 사용자 능력치 세부조정` 체크포인트 추가

변경 파일:

- `src/types/game.ts`
- `src/domain/season/seasonProfile.ts`
- `src/domain/season/createInitialSeasonState.ts`
- `src/domain/season/index.ts`
- `src/domain/game-progress/progressCareer.ts`
- `tests/unit/season-state.test.ts`
- `tests/unit/season-end.test.ts`
- `CODEX_HANDOFF.md`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`

검증:

- `npm.cmd test -- tests/unit/season-state.test.ts tests/unit/season-end.test.ts` 통과: 2 files, 11 tests
- `npm.cmd test` 통과: 33 files, 123 tests
- `npm.cmd run build` 통과
- 참고: Vitest에서 React Router v7 future flag 안내가 stderr에 출력됐고, Vite build에서 500kB 초과 chunk 경고가 출력됐지만 실패는 아님

남은 문제:

- 일반 시즌 `lck-rounds-3-5`는 현재 활성화 발판만 있고, 실제 일정/경기/포스트시즌 엔진은 아직 미구현
- 3번 완료 후 4번 시작 전에 사용자가 `lck2026RatingOverrides.ts`에서 능력치를 직접 세부조정해야 함

다음 추천 작업:

- 일반 시즌 LCK Rounds 3-5 실제 경기 구현

### 2026-06-07 - 2026 LCK 10개팀 1군+2군 선수 데이터 import

작업 범위:

- Leaguepedia LCK/LCK CL 2026 Rounds 1-2 roster 기준으로 10개팀 1군+2군 선수 seed 추가
- 코치/스태프는 제외하고 선수만 포함
- `Player`에 optional `realName`, `nativeName`, `rosterTier`, `source` 메타 필드 추가
- `src/data/lck2026RosterSeeds.ts`에 실제 명단 중심 seed 추가
- `src/data/lck2026RatingOverrides.ts`에 사용자가 직접 만질 수 있는 sparse 능력치 override 추가
- `src/data/lck2026Players.ts`에서 roster seed, 팀 strength, override, 기존 sample 선수 보존값을 합쳐 최종 `Player[]` 생성
- 새 커리어 생성 시 기존 `samplePlayers` 대신 `lck2026Players` 사용
- 로스터 빌더에 팀/포지션/1군·2군/검색 필터 추가
- 실제 roster에 포함된 선수는 기존 FA seed와 중복되지 않도록 실제 roster 데이터를 우선

변경 파일:

- `src/types/game.ts`
- `src/data/lck2026RosterSeeds.ts`
- `src/data/lck2026RatingOverrides.ts`
- `src/data/lck2026Players.ts`
- `src/domain/career/createInitialCareer.ts`
- `src/features/roster-builder/PlayerMarket.tsx`
- `src/shared/styles/global.css`
- `tests/unit/lck-2026-players.test.ts`
- `tests/integration/roster-builder.test.tsx`
- `tests/unit/offseason-market.test.ts`
- `tests/integration/offseason-market.test.tsx`

검증:

- `npm.cmd test -- tests/unit/lck-2026-players.test.ts tests/integration/roster-builder.test.tsx` 통과: 9 tests
- `npm.cmd test -- tests/unit/asian-games-format.test.ts tests/unit/offseason-market.test.ts tests/integration/offseason-market.test.tsx` 통과: 15 tests
- `npm.cmd test` 통과: 33 files, 120 tests
- `npm.cmd run build` 통과
- Browser `http://127.0.0.1:5176/roster` 검증: T1/MID/Main 필터 후 `Showing 1 / 108 players`, desktop overflow 없음
- Playwright 1280x720 및 390x720 검증: body/shell/main horizontal overflow 없음
- 스크린샷 저장:
  - `test-results/ui-screenshots/roster-builder-lck2026-1280x720.png`
  - `test-results/ui-screenshots/roster-builder-lck2026-390x720.png`

남은 문제:

- 능력치는 게임 밸런스용 자동 생성 초안이며, 사용자가 `lck2026RatingOverrides.ts`에서 핵심 선수 위주로 추가 보정 예정
- AI 팀 로스터 변화가 다음 시즌 전력에 직접 반영되는 작업은 아직 5번 스토브리그 2차 범위

다음 추천 작업:

- 시즌 템플릿/연도별 분기: 2026 아시안게임 시즌, 2027/2028 일반 시즌 구분

### 2026-06-07 - 기말 프로젝트 LCK 3시즌 목표 공식화

작업 범위:

- 신규 최우선 목표를 `기말 프로젝트: LCK 3시즌 작동`으로 문서화
- 완료 기준을 2028 Worlds 종료 후 시즌 요약/스토브리그까지 도달해 2029 진입 직전 상태를 확인하는 것으로 고정
- 기존 개인 프로젝트 v1과 20시즌 안정 작동 목표는 유지하되, 단기 우선순위는 3시즌 목표 기준으로 재정렬
- 0~11번 작업 뭉탱이 흐름을 다음 권장 작업에 반영

변경 파일:

- `CODEX_HANDOFF.md`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`

검증:

- 문서 작업이므로 `npm.cmd test`, `npm.cmd run build`는 실행하지 않음
- `rg` 기반으로 신규 목표 문구, 체크박스 위치, 민감 정보 미포함 여부만 확인 예정

남은 문제:

- 다음 작업인 2026 LCK 10개팀 1군+2군 전체 선수 데이터 import는 아직 시작하지 않음

다음 추천 작업:

- 2026 LCK 10개팀 1군+2군 전체 선수 데이터 import 설계와 구현

### 2026-06-07 - 고도화 스토브리그 1차 구현

작업 범위:

- 시즌 요약 `/summary`를 시즌 결과 확인과 `스토브리그 진입` 허브로 축소
- 신규 `/offseason` route와 좌측 `스토브리그` 메뉴 추가
- `SeasonState.offseason`에 28일/4주 market 상태 추가: currentDay/currentWeek, FA 풀, pending/resolved offer, 로그, 방출/영입/해결 선수 목록
- `OffseasonOffer`에 `contract`와 future `transfer` kind를 두어 향후 AI-AI/AI-유저 거래협상 확장 기반 마련
- 1주차 재계약/방출 구현: 계약 기간+제안 연봉, 요구액 90% 이상 수락, 방출 시 FA 풀 이동
- 2~4주차 FA 계약 경쟁 구현: 유저 제안은 다음날 AI 경쟁 제안과 점수 비교 후 확정
- AI가 FA 경쟁에서 이기면 선수 `currentTeam`을 AI 팀명으로 갱신하고 로그 기록
- 28일차 진행 시 로스터 검증을 통과하면 다음 시즌 LCK Cup으로 전환, 실패하면 `/offseason`에 사유 표시
- 테스트용 최소 실제 이름 기반 FA seed 추가. 다음 작업의 2026 LCK 10개팀 1군+2군 전체 선수 데이터 import와 충돌하지 않도록 별도 seed 파일로 분리
- 오프시즌 active 상태에서 상단 진행 버튼을 `다음날`로 허용하고, summary 상태에서는 비활성 `진행`으로 표시

변경 파일:

- `src/types/game.ts`
- `src/data/offseasonFreeAgents.ts`
- `src/domain/season/offseasonMarket.ts`
- `src/domain/season/seasonEnd.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/app/routes.ts`
- `src/app/gameReducer.ts`
- `src/app/App.tsx`
- `src/shared/layout/AppShell.tsx`
- `src/features/season-summary/SeasonSummary.tsx`
- `src/features/offseason/OffseasonMarket.tsx`
- `src/pages/SeasonSummaryPage.tsx`
- `src/pages/OffseasonPage.tsx`
- `src/shared/styles/global.css`
- `tests/unit/offseason-market.test.ts`
- `tests/unit/season-end.test.ts`
- `tests/unit/routes.test.ts`
- `tests/integration/offseason-market.test.tsx`
- `tests/integration/season-summary.test.tsx`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test` 통과: 32 files, 113 tests
- `npm.cmd run build` 통과
- Browser 1280x720 검증: `/summary`, `/offseason` 임시 preview에서 body/shell/main/page 가로 오버플로우 없음
- Playwright 390x720 검증: summary/offseason 가로 오버플로우 없음
- 모바일 검증 스크린샷 저장: `test-results/ui-screenshots/offseason-summary-390x720.png`, `test-results/ui-screenshots/offseason-offseason-390x720.png`
- 검증용 임시 파일 `tmp-offseason-preview.html`, `src/tmpOffseasonPreview.tsx`, `tmp-offseason-vite*.log`는 검증 후 삭제

남은 문제:

- 이번 작업은 테스트용 최소 실제 이름 FA seed만 추가함. 2026 LCK 10개팀 1군+2군 전체 선수 데이터 import는 다음 작업
- AI 영입 결과는 `currentTeam`과 로그에 남지만, 아직 다음 시즌 경기 전력/팀 strength에 반영하지 않음
- AI-AI/AI-유저 거래협상 UI, 선수 선호도, 경쟁 입찰, 장기 계약 세부 조건은 후속 고도화 범위

다음 추천 작업:

- 2026 LCK 10개팀 1군+2군 전체 선수 데이터 import 및 기존 sample/FA seed와의 중복 병합 정책 확정

### 2026-06-07 - 시즌 종료/시즌 요약/다음 시즌 전환 구현

작업 범위:

- Worlds 완료 후 다음 진행/리뷰 정리에서 시즌을 `offseason` 또는 `completed`로 전환
- `SeasonState.offseason` optional 상태 추가: 완료 시즌, 다음 시즌 번호, 만료 계약 선수, 재계약 완료 선수, 브리지 상태 저장
- `SeasonSummary` optional 확장: 연도, 완료일, 최종 승패, 대회별 결과, Worlds 우승팀, 만료 계약 선수 저장
- 시즌 종료 시 계약 연차를 1 감소시키고 0년 선수는 만료 목록에 기록
- `/summary` 화면을 시즌 요약/다음 시즌 준비 허브로 확장
- 만료 선수만 계약 타입을 다시 선택하는 재계약 브리지 UI 추가
- 재계약 완료 또는 만료 선수 없음 상태에서 다음 시즌 시작 가능
- 다음 시즌 시작 시 선수 나이 +1, 피로 0, 사기 중립, 컨디션 회복, 폼 중간값 보정
- 다음 시즌 시작 시 팀 승패는 0으로 리셋하고 ELO는 유지
- 다음 시즌은 현재 간소화 스토브리그와 충돌하지 않도록 브리지 완료 후 새 LCK Cup을 바로 활성화
- 사용자가 스토브리그를 매우 중요하게 보는 점을 반영해, 현재 재계약 UI가 최종 스토브리그가 아니라 후속 고도화 전 임시 브리지임을 문서화

변경 파일:

- `src/types/game.ts`
- `src/domain/season/seasonEnd.ts`
- `src/domain/season/index.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/domain/career/createInitialCareer.ts`
- `src/app/App.tsx`
- `src/app/gameReducer.ts`
- `src/pages/SeasonSummaryPage.tsx`
- `src/features/season-summary/SeasonSummary.tsx`
- `src/shared/layout/AppShell.tsx`
- `src/shared/styles/global.css`
- `tests/unit/season-end.test.ts`
- `tests/integration/season-summary.test.tsx`
- `docs/development-checklist.md`
- `docs/season-calendar.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/unit/season-end.test.ts` 통과: 4 tests
- `npm.cmd test -- tests/integration/season-summary.test.tsx` 통과: 2 tests
- `npm.cmd test` 통과: 30 files, 103 tests
- `npm.cmd run build` 통과
- in-app Browser 임시 프리뷰 확인: 1280폭 `bodyOverflowX=false`, `summaryOverflowX=false`, 제목/재계약/다음 시즌 버튼 표시
- in-app Browser 임시 프리뷰 확인: 390px `bodyOverflowX=false`, `summaryOverflowX=false`, `renewalRowsOverflow=false`
- 검증용 임시 파일 `tmp-season-summary-preview.html`, `src/tmpSeasonSummaryPreview.tsx`, `tmp-season-summary-vite*.log`는 검증 후 삭제

남은 문제:

- 재계약 브리지는 최종 스토브리그가 아님
- FA 시장, 신규 영입, 방출, 연봉 협상, AI 팀 이적 시장은 다음 대형 작업에서 구현 필요
- 일반 시즌 LCK Rounds 3-5는 아직 미구현

다음 추천 작업:

- 고도화 스토브리그를 별도 대형 작업으로 설계/구현
- 이후 일반 시즌 LCK Rounds 3-5와 장기 커리어 이벤트로 확장

### 2026-06-07 - Worlds 실제 경기 포맷/스케줄/우승팀 저장 구현

작업 범위:

- 확정된 `worldsQualification.entrants` 20팀 참가 풀을 실제 Worlds 대회로 활성화
- `SeasonState.worlds` optional 상태 추가: 진행 상태, Play-In 조, Group Stage 조, Knockout 진출팀, 결승/우승/준우승/4강 결과 저장
- Worlds 포맷 구현: Play-In 8팀, Group Stage 16팀, Knockout 8팀, 결승 우승팀 저장
- Play-In은 4팀 2개 조 BO1 싱글 라운드 로빈, 각 조 상위 2팀 진출
- Group Stage는 4팀 4개 조 BO1 더블 라운드 로빈, 각 조 상위 2팀 진출
- Knockout은 8강/4강/결승 전 경기 BO5, 8강 대진은 `A1 vs B2`, `B1 vs A2`, `C1 vs D2`, `D1 vs C2`
- deterministic seed 기반 조 편성 구현. 같은 리그 중복 금지를 우선하고, 불가능할 때만 최소 중복 fallback 허용
- Asian Games 완료 후 다음 진행에서 Worlds 활성화 연결
- Worlds 유저 팀 경기만 기존 match-preview 플레이 흐름으로 진입하고, 유저 팀이 없거나 탈락하면 AI 자동 진행
- Worlds Dashboard를 Overview, Schedule, Groups, Bracket 탭으로 확장
- `/competitions/worlds/overview`, `/competitions/worlds/schedule`, `/competitions/worlds/groups`, `/competitions/worlds/bracket` 하위 URL과 좌측 서브메뉴 연결
- 체크리스트/시즌 캘린더/구현 순서 안내판을 Worlds 완료 기준으로 갱신

변경 파일:

- `src/types/game.ts`
- `src/domain/season/worldsFormat.ts`
- `src/domain/season/index.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/layout/AppShell.tsx`
- `src/shared/styles/global.css`
- `tests/unit/worlds-format.test.ts`
- `tests/unit/routes.test.ts`
- `tests/integration/competition-dashboard.test.tsx`
- `docs/development-checklist.md`
- `docs/season-calendar.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/unit/worlds-format.test.ts` 통과: 5 tests
- `npm.cmd test -- tests/unit/worlds-format.test.ts tests/unit/routes.test.ts tests/integration/competition-dashboard.test.tsx` 통과: 3 files, 20 tests
- `npm.cmd test` 통과: 28 files, 97 tests
- `npm.cmd run build` 통과
- in-app Browser 확인: Worlds Bracket 프리뷰에서 `Worlds Knockout`, `Quarterfinals`, `Worlds Champion` 표시, 1280폭 `bodyOverflowX=false`, `bracketOverflowX=false`
- Playwright 확인: Worlds Bracket 390px `bodyOverflowX=false`, `bracketOverflowX=false`
- Playwright 확인: Worlds Groups 1280x720과 390x844 모두 `bodyOverflowX=false`, `groupsOverflowX=false`
- 검증용 임시 파일 `tmp-worlds-preview.html`, `src/tmpWorldsPreview.tsx`, `tmp-worlds-vite*.log`는 검증 후 삭제

남은 문제:

- Worlds 우승 후 시즌 요약/시즌 종료/오프시즌/다음 시즌 전환은 아직 없음
- LCQ placeholder 2장의 실제 출처는 아직 미정
- 일반 시즌 LCK Rounds 3-5의 MSI 이후 Worlds 연결은 아직 미구현
- Worlds 브래킷 연결선/진출 화살표 시각화와 국제대회 공통 컴포넌트 추출은 후속 고도화 후보

다음 추천 작업:

- 시즌 종료/시즌 요약/다음 시즌 전환 구현

### 2026-06-07 - MSI 기반 Worlds 시드/참가팀 풀 구현

작업 범위:

- MSI 완료 결과를 기준으로 Worlds 보너스 시드 상위 2개 리그를 판정
- 리그 성적은 같은 리그 MSI 참가팀 중 최고 성적 1팀만 사용
- MSI 팀별 성적 순위 기준 구현: 우승, 준우승, Lower Final 패자, Lower Round 3 패자, Lower Round 2 패자, Lower Round 1 패자, Play-In Final 패자, Play-In Semifinal 패자
- 같은 탈락 라운드는 `initialSeed` 우선으로 정렬
- `SeasonState.worldsQualification` optional 상태 추가
- LCK Rounds 3-4 최종 1~3위는 Worlds 기본 진출, LCK가 MSI 보너스 리그면 4위까지 진출로 해석
- Worlds 20팀 참가 풀 저장: LCK/LPL/LCS/LEC 기본 3팀, LCP/CBLOL 기본 2팀, MSI 보너스 2팀, LCQ placeholder 2팀
- LTA 표기를 LCS로 통일하고 legacy `LTA`/`lta` 저장값은 helper에서 LCS로 해석
- MSI Overview/Summary, LCK Rounds 3-4 후속 경로, Worlds 기본 화면에 Worlds 보너스/참가 풀 요약 표시
- Worlds 실제 경기 포맷/스케줄/우승팀 저장은 다음 작업으로 유지

변경 파일:

- `src/types/game.ts`
- `src/domain/season/worldsQualification.ts`
- `src/domain/season/msiFormat.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/season/index.ts`
- `src/domain/draft/createDraftTeams.ts`
- `src/domain/season/firstStandFormat.ts`
- `src/data/competitions.ts`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `tests/unit/worlds-qualification.test.ts`
- `tests/unit/msi-format.test.ts`
- `tests/unit/lck-rounds-34-format.test.ts`
- `tests/integration/competition-dashboard.test.tsx`
- `docs/msi-format.md`
- `docs/season-calendar.md`
- `docs/development-checklist.md`
- `docs/open-questions.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test` 통과: 27 files, 91 tests
- `npm.cmd run build` 통과
- in-app Browser 임시 프리뷰 확인: MSI Worlds Bonus 카드, LCK Rounds 3-4 Worlds 4시드 확정 표시, Worlds 참가 풀 20 teams/LCK 4시드 포함 표시 확인
- in-app Browser 1280 폭 확인: `bodyOverflowX=false`
- 브라우저 검증용 임시 파일 `tmp-worlds-preview.html`, `src/tmpWorldsPreview.tsx`는 검증 후 삭제

남은 문제:

- Worlds 참가팀 풀은 확정됐지만 실제 Play-In/Group/Knockout 스케줄과 경기 진행은 아직 없음
- LCQ placeholder 2장의 실제 출처는 다음 Worlds 구현에서 결정 필요
- 일반 시즌 LCK Rounds 3-5의 Worlds 연결은 Rounds 3-5 구현 시 같은 `worldsQualification` 구조 재사용 예정

다음 추천 작업:

- Worlds 실제 경기 포맷과 스케줄 구현

### 2026-06-07 - 대회/캘린더 세부 메뉴 URL 하위페이지화

작업 범위:

- 대회 현황 내부 탭과 캘린더 탭을 URL path segment로 제어하도록 라우팅 확장
- `/competitions/:id/:subPage`, `/calendar/:subPage` 파싱과 경로 생성 추가
- 기존 `/competitions/:id`, `/calendar`는 기본 탭을 표시하도록 유지
- 잘못된 하위 URL은 리다이렉트하지 않고 해당 화면 기본 탭을 표시
- CompetitionDashboard와 SeasonCalendar를 URL-controlled 탭 + direct render fallback state 구조로 변경
- 좌측 대회/캘린더 서브메뉴를 실제 구현된 하위페이지만 표시하고 해당 URL로 이동하도록 변경
- README와 개발 체크리스트 라우팅 항목 최신화

변경 파일:

- `src/app/routes.ts`
- `src/app/App.tsx`
- `src/shared/layout/AppShell.tsx`
- `src/pages/CompetitionDashboardPage.tsx`
- `src/pages/SeasonCalendarPage.tsx`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/features/season-calendar/SeasonCalendar.tsx`
- `tests/unit/routes.test.ts`
- `tests/integration/competition-dashboard.test.tsx`
- `tests/integration/season-calendar.test.tsx`
- `tests/integration/app-routing.test.tsx`
- `README.md`
- `docs/development-checklist.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test` 통과: 26 files, 85 tests
- `npm.cmd run build` 통과
- in-app Browser 확인: 커리어 시작 후 캘린더 서브메뉴 `달력` 클릭 시 `/calendar/calendar`로 이동, 달력 화면과 활성 서브메뉴 표시 확인
- `/competitions/asian-games/bracket` 직접 표시는 커리어 상태가 필요한 화면이라 route unit test와 CompetitionDashboard controlled subPage 통합 테스트로 검증

남은 문제:

- 없음. 저장 DB 구조와 `SeasonState`에는 세부 탭 상태를 추가하지 않음

다음 추천 작업:

- MSI 성적 기반 Worlds 추가 시드 판정 구현 후 Worlds 최소 포맷 구현

### 2026-06-07 - Asian Games 브래킷 UI 피라미드/메달 색상 보강

작업 범위:

- Asian Games Bracket 탭의 8강/4강/결승/동메달전 배치를 명시적 토너먼트 피라미드 그리드로 보강
- 8강 1/2경기 사이에 4강 1경기, 8강 3/4경기 사이에 4강 2경기가 오도록 슬롯 위치와 연결선 조정
- 4강 승자 흐름이 결승으로 이어지는 세로/가로 연결선 추가
- 메달 카드가 미정 상태와 결과 확정 상태 모두에서 금/은/동 색상으로 보이도록 스타일 분리
- UI 문구 변경에 맞춰 CompetitionDashboard 통합 테스트 기대값 수정

변경 파일:

- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `tests/integration/competition-dashboard.test.tsx`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd run build` 통과
- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과: 1 file, 5 tests
- in-app Browser 프리뷰 확인: 1280 폭에서 matchCount 8, body 가로 오버플로우 없음, 미정 메달 색상 적용
- Playwright 1280x720 확인: 4강 슬롯이 8강 1/2, 3/4경기 사이에 위치, 결승 슬롯이 4강 사이에 위치, 미정/확정 메달 색상 적용
- Playwright 390x844 확인: body 가로 오버플로우 없음, 브래킷 프레임 내부 가로 스크롤 정상, 피라미드 슬롯 위치 유지
- 검증 스크린샷 저장: `test-results/ui-screenshots/asian-games-bracket-pyramid-1280x720.png`
- 검증 스크린샷 저장: `test-results/ui-screenshots/asian-games-bracket-pyramid-390x844.png`

남은 문제:

- 없음. 임시 Playwright 프리뷰 HTML은 검증 후 삭제

다음 추천 작업:

- MSI 성적 기반 Worlds 추가 시드 판정 구현 후 Worlds 최소 포맷 구현

### 2026-06-07 - Asian Games 2026 구현

작업 범위:

- `SeasonState.asianGames` optional 상태 추가: 대표 선발, 선택 상태, 진행 방식, 대표 6인, 금/은/동 결과 저장
- Asian Games 2026 전용 도메인 모듈 추가
- 개막일 2026-09-08, 대표 선발일 2026-09-01, 진행 방식 질문일 2026-09-02 기준 적용
- 이전 대회 종료가 대표 선발일을 지난 경우 전환 즉시 대표 선발, 다음 진행일에 선택 질문
- LCK 선수 풀 전체에서 TOP/JGL/MID/BOT/SUP 최고 폼 1명씩 + 남은 후보 최고 폼 1명 선발
- 8개 국가 8강 토너먼트 구현: 대한민국, 중국, 대만, 일본, 홍콩, 베트남, 인도, 마카오
- 8강/4강/동메달전 BO3, 결승 BO5 구현
- 직접 플레이 선택 시 한국 경기만 match-preview로 진입
- 자동 진행 선택 시 한국 경기 포함 모든 Asian Games 경기를 AI 자동 처리
- 한국 대표팀 전력은 자동 선발 스타팅 5인과 현재 전략/훈련 성향을 반영
- 대한민국 금메달 시 대표 6인 `militaryServiceStatus = "completed"` 보상 적용
- Asian Games 완료 후 Worlds `available` 전환
- App 진행 버튼 잠금과 직접 플레이/자동 진행 선택 모달 추가
- CompetitionDashboard Asian Games Overview/Schedule/Bracket 추가
- 자동 저장 체크포인트에 Asian Games 상태 fingerprint 포함
- `docs/development-checklist.md`, `docs/season-calendar.md`, `IMPLEMENTATION_ORDER.md`, `CODEX_HANDOFF.md` 최신화

변경 파일:

- `src/types/game.ts`
- `src/domain/season/asianGamesFormat.ts`
- `src/domain/season/createInitialSeasonState.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/season/index.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/app/App.tsx`
- `src/app/gameReducer.ts`
- `src/shared/layout/AppShell.tsx`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `tests/unit/asian-games-format.test.ts`
- `tests/integration/competition-dashboard.test.tsx`
- `docs/development-checklist.md`
- `docs/season-calendar.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test` 통과: 23 files, 75 tests
- `npm.cmd run build` 통과
- Playwright 검증용 임시 프리뷰 HTML 생성 후 삭제
- Playwright 1280x720 Asian Games 브래킷 확인: 외부 가로 오버플로우 없음, matchCount 8, blankBoard false
- Playwright 390x844 Asian Games 브래킷 확인: body 가로 오버플로우 없음, 브래킷 프레임 내부 스크롤 정상, matchCount 8, blankBoard false
- 검증 스크린샷 저장: `test-results/ui-screenshots/asian-games-bracket-1280x720.png`
- 검증 스크린샷 저장: `test-results/ui-screenshots/asian-games-bracket-390x844.png`

남은 문제:

- Asian Games 대표 차출로 인한 폼/피로도 이벤트는 이번 범위에서 제외
- 해외 국가는 상세 선수 로스터 없이 고정 국가 전력값으로 처리
- 당시 기준 MSI 성적 기반 Worlds 추가 시드 실제 판정은 없었고, 이후 2026-06-07 작업에서 해결됨
- Worlds 포맷과 시즌 종료/다음 시즌 전환은 아직 없음

다음 추천 작업:

- MSI 성적 기반 Worlds 추가 시드 판정 구현 후 Worlds 최소 포맷 구현

### 2026-06-06 - LCK Rounds 3-4 Season Play-In/Playoffs 구현

작업 범위:

- Rounds 3-4 정규 그룹 종료 후 즉시 완료 처리하던 흐름을 Season Play-In 생성 흐름으로 변경
- Season Play-In 구현: Legend 5위 vs Rise 1위, Rise 2위 vs Rise 3위, 최종 진출전
- LCK Playoffs 구현: Legend 1~4위 + Season Play-In 통과 2팀의 상위조/하위조 브래킷
- 모든 Rounds 3-4 포스트시즌 경기는 BO5 Fearless로 생성
- Grand Final 종료 후 최종 1~4위를 `qualifiedTeamIds`/`qualifiedTeamNames`에 저장
- 최종 4위는 MSI 추가 시드 조건부 Worlds 후보로 UI와 문서에 표시
- CompetitionDashboard의 Rounds 3-4 `진출 경로` 탭을 실제 경기/결과/현재 라운드/Worlds 후보 표시로 확장
- `docs/season-calendar.md`, `docs/development-checklist.md`, `IMPLEMENTATION_ORDER.md`, `CODEX_HANDOFF.md` 최신화

변경 파일:

- `src/domain/season/lckRounds34Postseason.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/season/index.ts`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `src/data/competitions.ts`
- `tests/unit/lck-rounds-34-format.test.ts`
- `tests/integration/competition-dashboard.test.tsx`
- `docs/season-calendar.md`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/unit/lck-rounds-34-format.test.ts` 통과: 5 tests
- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과: 4 tests
- `npm.cmd test -- tests/unit/lck-rounds-12-format.test.ts tests/unit/msi-format.test.ts tests/unit/season-progress.test.ts` 통과: 13 tests
- `npm.cmd test` 통과: 22 files, 68 tests
- `npm.cmd run build` 통과
- Playwright 로컬 검증: `http://127.0.0.1:5173/tmp-r34-preview.html` 임시 미리보기로 완료된 Rounds 3-4 포스트시즌 UI 확인 후 파일 삭제
- Playwright 1280x720 확인: 외부 가로 오버플로우 없음, 브래킷 프레임 내부 가로 스크롤 정상, Grand Final 표시 확인
- Playwright 390x844 확인: 외부 가로 오버플로우 없음, 브래킷 프레임 내부 가로 스크롤 정상
- 검증 스크린샷 저장: `test-results/ui-screenshots/lck-rounds-34-live-postseason-1280x720.png`
- 검증 스크린샷 저장: `test-results/ui-screenshots/lck-rounds-34-live-postseason-390x844.png`

남은 문제:

- MSI 결과로 어느 리그가 Worlds 추가 시드를 받는지 실제 판정하는 로직은 아직 없음
- Asian Games 포맷과 실제 진행 엔진은 아직 없음
- 일반 시즌 LCK Rounds 3-5는 아직 미구현

다음 추천 작업:

- Asian Games 2026 최소 포맷 결정과 구현

### 2026-06-06 - MSI 성적 기반 Worlds 추가 시드 메모 반영

작업 범위:

- 사용자가 MSI 상위 성적 2개 리그 Worlds 추가 시드 규칙 확정
- 리그 성적 판정은 MSI 참가팀 중 해당 리그 최고 성적 1팀 기준으로 기록
- LCK가 조건을 만족하면 LCK 4위도 Worlds 진출 가능하므로 Season Play-In/Playoffs 최종 4위 저장 요구 추가
- `docs/msi-format.md`, `docs/season-calendar.md`, `docs/development-checklist.md`, `IMPLEMENTATION_ORDER.md`, `CODEX_HANDOFF.md`에 반영

검증:

- 문서 결정 기록만 수행했으므로 build/test는 실행하지 않음

다음 추천 작업:

- 이 기준을 반영해 LCK Season Play-In/Playoffs 구현 컨펌 후 개발

### 2026-06-06 - LCK Rounds 3-4 정규 그룹 리그 구현

작업 범위:

- 웹 확인 기준 2026 LCK Rounds 3-4 포맷을 프로젝트에 반영
- Rounds 1-2 최종 순위 기준 상위 5팀 Legend Group, 하위 5팀 Rise Group 분리
- Rounds 1-2 승패/세트 기록을 Rounds 3-4 순위표에 그대로 승계
- 각 그룹 5팀 더블 라운드로빈으로 총 40경기 생성
- 모든 Rounds 3-4 경기는 BO3 Fearless로 생성
- MSI 완료 후 아시안게임 시즌이면 Rounds 3-4로 전환
- Rounds 3-4 완료 시 Legend 1-5위와 Rise 1-3위를 후속 후보로 저장
- CompetitionDashboard에서 Rounds 3-4 그룹 순위표, 일정/결과, 후속 경로 탭 표시
- 모바일 폭에서 LCK 순위표 팀명 칸이 0px로 눌리는 문제 수정

변경 파일:

- `src/domain/season/lckRounds34Format.ts`
- `src/domain/season/createInitialSeasonState.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/domain/season/index.ts`
- `src/types/game.ts`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `tests/unit/lck-rounds-34-format.test.ts`
- `tests/integration/competition-dashboard.test.tsx`
- `docs/development-checklist.md`
- `docs/season-calendar.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/unit/lck-rounds-34-format.test.ts` 통과: 4 tests
- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과: 3 tests
- `npm.cmd test -- tests/unit/lck-rounds-12-format.test.ts tests/unit/msi-format.test.ts tests/unit/season-progress.test.ts` 통과: 13 tests
- `npm.cmd test` 통과: 22 files, 66 tests
- `npm.cmd run build` 통과
- Browser 로컬 검증: `http://127.0.0.1:5173/tmp-r34-preview.html` 임시 미리보기로 Rounds 3-4 UI 확인 후 파일 삭제
- Browser 1280px 확인: 후속 경로 탭에서 가로 넘침 없음, clipped text 없음
- Browser 390px 확인: 순위표와 후속 경로 탭에서 가로 넘침 없음, clipped text 없음
- 검증 스크린샷 저장: `test-results/ui-screenshots/lck-rounds-34-postseason-path-1280x720.png`

남은 문제:

- Rounds 3-4 이후 Season Play-In과 LCK Playoffs 실제 경기 생성은 아직 없음
- 일반 시즌 LCK Rounds 3-5는 아직 미구현
- 당시 기준 Rounds 3-4 후속 후보는 `qualifiedTeamIds`에 저장했지만 Worlds 진출권 확정 로직은 없었고, 이후 2026-06-07 작업에서 해결됨
- 브라우저 검증용 페이지는 임시 파일로 생성 후 삭제했으며, 정식 seed/debug route는 아직 없음

다음 추천 작업:

- Asian Games 2026 최소 포맷 결정 또는 Rounds 3-4 이후 Season Play-In/Playoffs 실제 경기 생성 범위 결정

### 2026-06-06 - 저장 UX/자동 저장 보강과 MSI 브래킷 UI 수정

작업 범위:

- 앱 상단 저장 컨트롤에 자동 저장 상태 표시 추가
- 커리어 생성 직후 첫 자동 저장 슬롯 생성
- 활성 저장 슬롯이 있으면 주요 체크포인트에서 자동 업데이트
- 자동 저장 체크포인트 연결: 로스터 확정, 날짜 진행, 경기 기록 수 변화, 대회 상태/스테이지 변화
- 저장 실패는 게임 진행을 막지 않고 상태 뱃지로 표시
- 저장 서버 연결 실패는 `저장 서버 대기`, revision 충돌은 `저장 충돌: 새로고침 필요`로 표시
- 클라이언트 update 요청에 `expectedRevision` 추가
- 서버에서 stale revision update를 409로 거절하고 `currentRevision` 반환
- 수동 저장도 revision 충돌을 표시하도록 보강
- 직전 MSI UI의 고정 1980px 브래킷 보드를 반응형 그리드로 변경
- MSI Play-In / Upper / Lower / Final / Champion 섹션이 프레임 폭 안에 들어오도록 재배치
- Play-In 라운드 제목 겹침을 `Semifinals` / `Final` 축약 제목으로 수정

변경 파일:

- `src/app/App.tsx`
- `src/services/careerSavesApi.ts`
- `src/features/save-manager/SaveManager.tsx`
- `src/features/save-manager/index.ts`
- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `server/careerSaves.ts`
- `server/index.ts`
- `tests/integration/save-manager.test.tsx`
- `tests/integration/app-autosave.test.tsx`
- `docs/development-checklist.md`
- `docs/data-storage.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/integration/save-manager.test.tsx` 통과: 4 tests
- `npm.cmd test -- tests/integration/app-autosave.test.tsx` 통과: 1 test
- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과: 2 tests
- `npm.cmd test -- tests/unit/msi-format.test.ts` 통과: 4 tests
- `npm.cmd test` 통과: 21 files, 61 tests
- `npm.cmd run build` 통과
- Browser 로컬 검증: `http://127.0.0.1:5173/`에서 MSI 검증용 저장 슬롯을 일시 생성/불러오기 후 삭제
- Browser 레이아웃 수치 확인: `frameHasHorizontalOverflow=false`, `mainHasHorizontalOverflow=false`, `playInTitlesOverlap=false`, `saveStatusVisible=true`
- 검증 스크린샷 저장: `test-results/ui-screenshots/msi-bracket-autosave-1280x720.png`

남은 문제:

- 로그인 사용자별 `ownerId` 연결은 아직 없음. 현재는 `local-dev`
- 저장 데이터 `schemaVersion` 마이그레이션 정책은 아직 없음
- 전략/훈련/선발 변경 즉시 자동 저장은 이번 범위에서 제외
- MSI 브래킷 연결선/진출 화살표는 후속 고도화 후보

다음 추천 작업:

- LCK Rounds 3-4 / 3-5 설계와 구현 범위 결정

### 2026-06-06 - MSI 전용 UI 연결과 16:9 검증

작업 범위:

- `CompetitionDashboard`에 MSI 전용 대시보드 분기 추가
- MSI Overview / Schedule / Bracket 탭 구현
- MSI 참가팀 11팀을 Bracket Stage 직행팀과 Play-In 팀으로 구분 표시
- 일정/결과 탭에서 날짜별 MSI 경기, BO3/BO5, 완료 스코어, 우리 팀 경기 강조
- 브래킷 탭에서 Play-In, Upper Bracket, Lower Bracket, Grand Finals 표시
- 생성 전 라운드는 Pending 슬롯으로 표시하고, 생성된 라운드는 실제 `MatchSchedule`/`MatchRecord`에 연결
- 현재 라운드, BO5, 우리 팀 슬롯, 승자 슬롯 강조
- 1366x768 브라우저 검증용 MSI 저장 데이터를 일시 생성 후 삭제
- 검증 스크린샷 저장: `test-results/ui-screenshots/msi-bracket-1366x768.png`

변경 파일:

- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `tests/integration/competition-dashboard.test.tsx`
- `docs/development-checklist.md`
- `docs/msi-format.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과: 2 tests
- `npm.cmd run build` 통과
- `npm.cmd test` 통과: 20 files, 58 tests
- Browser 1366x768 확인: `/competitions/msi` 브래킷 탭에서 MSI Bracket Stage, Upper Bracket, Lower Bracket, Grand Finals, BO5, T1 표시 확인
- Browser 레이아웃 확인: 페이지 전체 세로 스크롤 없음, 브래킷 패널 내부 스크롤 사용

남은 문제:

- MSI 브래킷 가로 스크롤 위치 저장은 아직 없음
- 라운드 연결선/진출 화살표 시각화는 후속 고도화 후보
- 국제대회 공통 브래킷 컴포넌트 추출은 아직 하지 않음

다음 추천 작업:

- 저장 UX/자동 저장 보강 또는 LCK Rounds 3-4 / 3-5 설계

### 2026-06-06 - MSI 도메인 엔진과 시즌 전환 구현

작업 범위:

- 2026 MSI 11팀 포맷 도메인 엔진 구현
- LCK Rounds 1-2 우승팀/준우승팀을 MSI LCK 1시드/2시드로 연결
- First Stand 우승 리그의 2시드 팀을 MSI 브래킷 스테이지 직행으로 처리
- First Stand 우승 리그가 CBLOL이면 준우승 리그 2시드에게 직행권 승계
- 해외 고정 참가팀 확정: Bilibili Gaming, Top Esports, G2 Esports, Fnatic, Cloud9, FlyQuest, PSG Talon, GAM Esports, LOUD
- 플레이인 4팀 싱글 엘리미네이션 구현
- 브래킷 스테이지 8팀 상위조/하위조 더블 엘리미네이션 구현
- 플레이인 결승, Upper Final, Lower Final, Grand Finals는 BO5, 나머지는 BO3
- MSI 우승팀/준우승팀 저장
- LCK Rounds 1-2 완료 후 일반 진행 흐름에서 MSI 활성화

변경 파일:

- `src/domain/season/msiFormat.ts`
- `src/domain/season/createInitialSeasonState.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/season/index.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/data/competitions.ts`
- `tests/unit/msi-format.test.ts`
- `docs/msi-format.md`
- `docs/development-checklist.md`
- `docs/open-questions.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/unit/msi-format.test.ts` 통과: 4 tests
- `npm.cmd test -- tests/unit/msi-format.test.ts tests/unit/lck-rounds-12-format.test.ts tests/unit/first-stand-format.test.ts tests/unit/season-progress.test.ts` 통과: 4 files, 16 tests
- `npm.cmd test` 통과: 20 files, 57 tests
- `npm.cmd run build` 통과

남은 문제:

- 당시 기준 MSI 전용 브래킷 UI 작업이 남아 있었음
- 당시 기준 대회 현황 화면에서 플레이인/상위조/하위조를 보기 좋게 표시하는 작업 필요
- 이후 `2026-06-06 - MSI 전용 UI 연결과 16:9 검증` 작업에서 해결됨

다음 추천 작업:

- 당시 추천은 MSI UI 연결이었고, 이후 완료됨

### 2026-06-06 - 2026 MSI 포맷 결정 문서화

작업 범위:

- 사용자가 2026 MSI 참가 구조와 진행 방식을 확정
- First Stand 8팀 조별리그 구조 재사용 방침을 폐기하고 MSI 전용 11팀 포맷으로 변경
- `docs/msi-format.md` 신규 추가
- `docs/season-calendar.md`, `docs/open-questions.md`, `docs/development-checklist.md`, `CODEX_HANDOFF.md`에 MSI 결정 반영

확정된 MSI 기준:

- CBLOL 제외 각 지역 리그 상위 2팀씩 + CBLOL 우승팀 1팀, 총 11팀 참가
- 1시드 6팀과 2026 First Stand 우승 리그의 2시드 팀은 브래킷 스테이지 직행
- 나머지 2시드 4팀은 플레이인 스테이지부터 시작
- 플레이인은 4강 싱글 엘리미네이션, 우승팀 1팀이 브래킷 스테이지 진출
- 브래킷 스테이지는 총 8팀 상위조/하위조 더블 엘리미네이션
- 플레이인 결승, 브래킷 스테이지 후반부, Grand Finals는 BO5, 나머지는 BO3
- LCK 1시드/2시드는 LCK Rounds 1-2 포스트시즌 우승팀/준우승팀을 1차 기준으로 사용

검증:

- 문서 결정 기록만 수행했으므로 build/test는 실행하지 않음

구현 전 확인 필요:

- 해외 고정 팀명과 전력값
- First Stand 우승 리그가 CBLOL인 경우의 2시드 직행 예외 규칙
- 브래킷 스테이지 BO5 적용 범위 해석

### 2026-06-06 - MongoDB 저장/불러오기 최소 플로우 구현

작업 범위:

- Express + MongoDB native driver 기반 로컬 API 서버 추가
- `careerSaves` 컬렉션에 `CareerSave` 전체를 저장하는 MVP 구조 구현
- 추후 같은 세계관 멀티유저 모드를 고려해 `mode`, `worldId`, `participants`, `ownerId`, `revision`, `schemaVersion` 메타데이터 포함
- 커리어 생성 화면에서 저장 목록 조회 패널 표시
- 커리어 진행 중 상단바에서 수동 저장, 새 저장, 저장 불러오기 가능
- `load-career` reducer action으로 MongoDB 저장 데이터를 현재 게임 상태에 복원
- Atlas SRV URI가 Node 드라이버에서 `querySrv ECONNREFUSED`로 실패해 `.env.local`은 non-SRV Atlas host list URI로 전환
- 배포 전 MongoDB 재점검 항목을 `docs/development-checklist.md`와 `docs/data-storage.md`에 기록

변경 파일:

- `package.json`
- `package-lock.json`
- `tsconfig.server.json`
- `.env.example`
- `server/config.ts`
- `server/mongo.ts`
- `server/careerSaves.ts`
- `server/index.ts`
- `server/checkMongoConnection.ts`
- `src/vite-env.d.ts`
- `src/services/careerSavesApi.ts`
- `src/features/save-manager/SaveManager.tsx`
- `src/features/save-manager/index.ts`
- `src/app/App.tsx`
- `src/app/gameReducer.ts`
- `src/shared/layout/AppShell.tsx`
- `src/features/career-setup/CareerSetup.tsx`
- `src/pages/CareerSetupPage.tsx`
- `src/shared/styles/global.css`
- `tests/integration/save-manager.test.tsx`
- `README.md`
- `docs/data-storage.md`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd run server:check` 통과: 실제 Atlas 인증 ping과 `careerSaves` 인덱스 확인
- `GET http://127.0.0.1:4000/api/health` 통과
- `GET http://127.0.0.1:4000/api/saves?ownerId=local-dev` 통과
- `npm.cmd test -- tests/integration/save-manager.test.tsx` 통과
- `npm.cmd run build` 통과
- `npm.cmd test` 통과: 19 files, 53 tests
- `npm.cmd run test:system` 통과
- `npm.cmd run test:acceptance` 통과. 최초 병렬 실행 때는 5173 포트 충돌로 실패했고, 단독 재실행에서 통과
- `npm.cmd audit --omit=dev` 통과: production/runtime 취약점 0개
- `npm.cmd audit`는 Vite/esbuild 계열 dev 취약점 5개 보고. `npm audit fix --force`는 Vite major 업그레이드라 미적용
- Browser plugin으로 `http://127.0.0.1:5173/` 확인: 커리어 시작 화면 저장 패널, 커리어 시작 후 상단바 저장 컨트롤 렌더링 확인

남은 문제:

- 자동 저장은 아직 없음
- 로그인/사용자별 `ownerId` 연결은 아직 없음. 현재는 `local-dev`
- 배포용 DB 분리, Atlas IP Access List, 운영 CORS, 운영 DB User 권한은 배포 직전에 재점검 필요
- 저장 데이터 `schemaVersion` 마이그레이션 정책은 아직 없음
- 전체 `npm audit`에는 Vite/esbuild 계열 dev 취약점 5개가 남아 있고, 강제 수정은 breaking upgrade라 아직 적용하지 않음

다음 추천 작업:

- 당시 추천 중 MSI 전용 브래킷 UI 연결은 이후 완료됨
- 저장 UX 보강: 자동 저장 시점, 저장 실패 피드백, revision 충돌 정책

### 2026-06-06 - MongoDB Atlas 새 프로젝트 URI 교체

작업 범위:

- 사용자가 새 Atlas Project/Cluster 기준 연결 문자열을 제공
- `.env.local`의 `MONGODB_URI`를 새 `moba-manager-dev` 클러스터와 `moba_app_dev` 유저 기준으로 교체
- `docs/data-storage.md`에 새 Atlas Project, Cluster, DB user, DB, collection 기준을 secret 없이 기록
- 새 클러스터 SRV 레코드와 27017 TCP 도달 여부 확인

변경 파일:

- `.env.local` (ignored, secret 포함, Git 추적 대상 아님)
- `docs/data-storage.md`
- `CODEX_HANDOFF.md`

검증:

- `_mongodb._tcp.moba-manager-dev.hqpniu1.mongodb.net` SRV 레코드 조회 성공
- shard 3개 모두 27017 TCP 연결 성공

남은 문제:

- MongoDB 드라이버 기반 인증 `ping`은 아직 수행하지 않음
- Node API 서버와 `careerSaves` 저장/불러오기 API는 아직 구현 전

다음 추천 작업:

- Express 또는 Node HTTP 서버 최소 골격, MongoDB native driver, `GET /api/health`, `GET/POST/PUT /api/saves` 구현

### 2026-06-06 - MongoDB 로컬 환경 변수 사전 준비

작업 범위:

- 사용자가 제공한 Atlas 연결 문자열을 Git에서 무시되는 `.env.local`에 저장
- Atlas 템플릿의 `<password>` 꺾쇠괄호는 실제 URI에서 제거해야 하므로 제거한 형태로 저장
- 추적 가능한 `.env.example`에는 placeholder만 추가
- `docs/data-storage.md`에 환경 변수 기준과 secret 관리 주의사항 추가
- SRV 레코드와 27017 TCP 도달 여부를 확인

변경 파일:

- `.env.local` (ignored, secret 포함, Git 추적 대상 아님)
- `.env.example`
- `docs/data-storage.md`
- `CODEX_HANDOFF.md`

검증:

- `git status --short .env.local .env.example .gitignore` 결과 `.env.local`은 표시되지 않고 `.env.example`만 untracked로 표시됨
- `_mongodb._tcp.cluster0.qkbgt7w.mongodb.net` SRV 레코드 조회 성공
- shard 3개 모두 27017 TCP 연결 성공

남은 문제:

- Atlas 콘솔에서 Database User 권한과 Network Access IP 허용 상태를 아직 직접 확인하지 않음
- 인증 연결 테스트는 아직 수행하지 않음
- 백엔드/API 서버와 MongoDB 드라이버는 아직 구현 전

다음 추천 작업:

- Atlas 콘솔에서 `Database Access`와 `Network Access`를 확인한 뒤 Node 서버 최소 골격과 `careerSaves` API를 구현

### 2026-06-05 - First Stand UI 실제 결과 연동

작업 범위:

- First Stand 개요/조별/일정/토너먼트 탭을 실제 `CompetitionState.schedule`, `MatchRecord`, 조별 순위 계산 결과에 연결
- 조별 순위표에서 실제 승패/세트 득실/경기 수 표시
- 일정 탭에서 날짜별 실제 경기, BO 포맷, 완료 스코어, 예정 상태, 우리 팀 경기 하이라이트 표시
- 토너먼트 탭에서 조별 상위 2팀 기반 4강, 준결승 승자 기반 결승 슬롯, 현재 라운드, 우승 대기/완료 상태 표시
- First Stand 대회 대시보드 통합 테스트를 새 실제 데이터 기준으로 복구

변경 파일:

- `src/features/competition-dashboard/CompetitionDashboard.tsx`
- `src/shared/styles/global.css`
- `tests/integration/competition-dashboard.test.tsx`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/integration/competition-dashboard.test.tsx` 통과
- `npm.cmd run build` 통과
- `npm.cmd test` 통과: 18 files, 51 tests
- `npm.cmd run test:system` 통과: 1 Playwright test
- `npm.cmd run test:acceptance` 통과: 1 Playwright test
- 로컬 dev 서버 `http://127.0.0.1:5173/` 브라우저 smoke check 통과

남은 문제:

- 앱 상태가 아직 reducer 내부 메모리 상태라 브라우저에서 First Stand 특정 진행 상태를 바로 주입하는 저장/디버그 경로가 없음
- First Stand 전용 16:9 스크린샷 저장은 별도 seed/save 경로가 생기면 보강 필요
- 기존 작업트리에는 이번 작업 전부터 있던 문서/코드 변경이 계속 섞여 있음

다음 추천 작업:

- MongoDB 저장 구조 설계: `CareerSave`, `SeasonState`, `CompetitionState`, `MatchRecord` 저장 단위와 불러오기 후 URL/대회 상태 복구 방식 결정

### 2026-06-05 - First Stand 진행 엔진 구현

작업 범위:

- LCK Cup 우승팀/준우승팀을 First Stand LCK 1/2시드로 배정
- 해외 대표 6팀을 고정 배치: Bilibili Gaming, Top Esports, G2 Esports, Cloud9, PSG Talon, LOUD
- Group A: LCK 1, Top Esports, G2 Esports, LOUD
- Group B: LCK 2, Bilibili Gaming, Cloud9, PSG Talon
- 조별리그 BO1 싱글 라운드 로빈 일정 생성
- 조별 순위 계산 기준 구현: 승수, 세트 득실, 세트 승수, 초기 시드
- 조 상위 2팀 4강 진출, 4강/결승 BO5 일정 자동 생성
- First Stand 우승팀/준우승팀 저장
- LCK Cup 완료 후 First Stand 활성화, First Stand 완료 후 LCK Rounds 1-2 전환 연결

변경 파일:

- `src/domain/season/firstStandFormat.ts`
- `src/domain/season/createInitialSeasonState.ts`
- `src/domain/season/progressSeason.ts`
- `src/domain/game-progress/progressCareer.ts`
- `src/domain/season/index.ts`
- `tests/unit/first-stand-format.test.ts`
- `docs/development-checklist.md`
- `IMPLEMENTATION_ORDER.md`
- `CODEX_HANDOFF.md`

검증:

- `npm.cmd test -- tests/unit/first-stand-format.test.ts` 통과
- `npm.cmd run build` 통과
- `npm.cmd test` 통과: 18 files, 51 tests

남은 문제:

- First Stand 대회 화면은 아직 placeholder 중심이므로 실제 schedule/records/standings 연동이 필요
- UI 16:9 스크린샷 검증은 이번 작업 범위가 도메인 엔진이라 생략
- 기존 작업트리에는 이번 작업 전부터 있던 문서/코드 변경이 계속 섞여 있음

다음 추천 작업:

- First Stand UI 결과 연동: 조별 순위표, 일정/결과, 4강/결승 브래킷, 현재 라운드, 우리 팀 하이라이트 연결

### 2026-06-05 - 핸드오프 운영 규칙 추가

작업 범위:

- 여러 GPT/Codex 계정 또는 다른 에이전트 모델이 번갈아 작업할 때의 핸드오프 업데이트 규칙 추가
- 새 에이전트 시작 루틴, 컨텍스트 절약 원칙, 세션별 작업 로그 작성 기준 추가
- 앞으로 의미 있는 개발/문서/테스트 작업 후 `CODEX_HANDOFF.md`를 업데이트하도록 명시

변경 파일:

- `CODEX_HANDOFF.md`

검증:

- 문서 운영 규칙만 수정했으므로 build/test는 실행하지 않음

다음 에이전트 참고:

- 앞으로 작업 완료 시 이 `작업 로그` 섹션의 최상단에 새 항목을 추가
- 구현 상태가 바뀌면 `현재 구현 상태`와 `다음 권장 작업`도 함께 갱신

## 이어받는 에이전트에게 줄 프롬프트 예시

```text
이 프로젝트는 League of Legends e스포츠 매니저 게임입니다.
먼저 README.md, CODEX_HANDOFF.md, docs/development-checklist.md, IMPLEMENTATION_ORDER.md를 읽고 현재 구현 상태를 파악해주세요.
기말 프로젝트 최우선 목표는 LCK 3시즌 작동입니다. 2026, 2027, 2028 시즌을 진행해 2028 Worlds 종료 후 시즌 요약/스토브리그까지 안정적으로 도달하는 것을 기준으로 작업 우선순위를 잡아주세요.
기존 사용자 결정은 유지하고, 새 구현 전에는 관련 도메인 파일과 UI 결정 문서를 확인해주세요.
파일을 수정할 때는 사용자 변경을 되돌리지 말고, 구현 후 build/test와 16:9 UI 검증 결과를 요약해주세요.
작업을 마치면 CODEX_HANDOFF.md의 현재 상태와 작업 로그를 업데이트해주세요.
다음 목표는 4번 2027 시즌 전체 연결입니다. 사용자 능력치 세부조정 1차는 완료됐으므로, LCK Cup부터 Worlds, 시즌 요약, 스토브리그, 2028 전환까지 실제 장기 흐름을 검증/보강하는 작업을 진행하면 됩니다. 능력치 추가 미세 조정 요청이 들어오면 `src/data/lck2026RatingOverrides.ts`와 `docs/lck-2026-rating-review.md`를 함께 갱신해주세요.
```
