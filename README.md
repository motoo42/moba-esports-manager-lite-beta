# esports-manager-lite-motoo42

League of Legends e스포츠 팀 매니지먼트 시뮬레이션 게임

사용자는 LCK 팀의 감독/프런트가 되어 스토브리그, 로스터 구성, 계약, 훈련, 전략 선택, 경기 진행, 대회 일정 관리, 포스트시즌 진출을 관리한다. Football Manager식 메인 허브와 LoL e스포츠 시즌 구조를 결합한 개인 프로젝트

## 프로젝트 목표

- LCK 기반 e스포츠 매니지먼트 게임 프로토타입 구현
- 실제 시즌 흐름과 유사한 대회 구조 설계
- 로스터, 계약, 선수 상태, 전략, 훈련, 밴픽 요소를 점진적으로 확장
- AI Agent와 협업하는 개발 워크플로우 정리
- 3주 과제 이후에도 유지보수와 기능 확장이 가능한 구조 만들기

## 주요 기능

- 커리어 생성
- 스토브리그와 로스터 확정
- 1군/2군 기반 선수 관리
- 계약 타입 관리: 1년, 2년, 1+1년
- 선수 상태 관리: 폼, 피로도, 사기
- 주간 전략과 훈련 강도 설정
- 선발 5인 드래그 앤 드롭 교체
- 실제 URL 기반 화면 이동
- 진행/플레이 버튼과 5초 진행중 오버레이
- LCK Cup 진행
- LCK Rounds 1-2 정규시즌 일정 생성 및 진행
- LCK Rounds 1-2 포스트시즌 브래킷과 경기 진행
- First Stand 조별리그/토너먼트 진행
- 대회 순위표, 일정/결과, 토너먼트 UI
- 밴픽 점수 기반 경기 시뮬레이션 초안
- MongoDB 기반 수동 저장/새 저장/불러오기

## 기술 스택

- React
- TypeScript
- Vite
- React Router
- Express
- MongoDB Atlas
- Vitest
- Playwright
- @dnd-kit/core

## 실행 방법

```bash
npm install
npm run dev:server
npm run dev:client
```

MongoDB 연결에는 Git에 커밋하지 않는 `.env.local`이 필요하다. 공개 가능한 변수 예시는 `.env.example`을 참고한다.

## 검증 명령

```bash
npm.cmd run build
npm.cmd run server:check
npm.cmd test
npm.cmd run test:system
npm.cmd run test:acceptance
```

## 개발 관리 방식

```text
main
└── dev
    └── feature/*
```

- `main`: 제출 및 안정 버전
- `dev`: 개발 통합 브랜치
- `feature/*`: 기능별 작업 브랜치

기능 개발은 GitHub Issue로 작업 단위를 나눈 뒤 진행한다. 기능별 작업은 `feature/*` 브랜치에서 진행하고, 완료 후 `dev` 브랜치로 Pull Request 생성

## 현재 상태

현재 프로젝트는 1시즌 플레이 가능한 MVP를 향해 가는 중간 단계

구현된 주요 내용:

- React / Vite / TypeScript 기반 프로젝트 구조
- 실제 URL 기반 라우팅: `/`, `/hub`, `/roster`, `/match`, `/competitions`, `/competitions/:id`, `/competitions/:id/:subPage`, `/calendar`, `/calendar/:subPage`, `/summary`
- FM식 16:9 고정형 메인 허브 UI
- `GameProvider`에서 reducer/action과 진행 엔진 분리
- 커리어 생성과 스토브리그 이후 LCK Cup 활성화 흐름
- LCK 10개 팀 고정 데이터와 실제 팀명 반영
- LCK Cup 현실 기반 간소화 포맷
- LCK Rounds 1-2 정규시즌 일정 생성, 진행, 순위표 갱신
- LCK Rounds 1-2 포스트시즌 6팀 싱글 엘리미네이션
- 포스트시즌 우승팀/준우승팀 저장
- First Stand 진행 엔진과 개요/조별리그/일정/토너먼트 실제 결과 UI
- MongoDB Atlas 기반 저장 API와 수동 저장/불러오기 UI
- 로스터 관리 화면
- 선발 5인 드래그 앤 드롭 교체
- 선수 상태 관리: 폼, 피로도, 5단계 사기
- 주간 전략과 훈련 강도 설정
- 전략 스타일 간 상성 구조
- 밴픽 점수 기반 경기 시뮬레이션 초안
- 주요 도메인 로직 단위 테스트
- 시스템/인수 테스트와 16:9 스크린샷 검증 흐름

이후 구현 예정:

- 저장 자동화와 로그인/사용자별 저장
- MSI
- LCK Rounds 3-4 / 3-5
- Asian Games
- Worlds
- 시즌 종료와 다음 시즌 전환
- 선수 데이터 확장과 밸런싱
- 밴픽/챔피언/메타 시스템 고도화

## 참고 문서

- `CODEX_HANDOFF.md`
- `IMPLEMENTATION_ORDER.md`
- `docs/development-checklist.md`
- `docs/overview.md`
- `docs/mvp-scope.md`
- `docs/season-calendar.md`
- `docs/ui-design-decisions.md`
- `skills/index.md`
