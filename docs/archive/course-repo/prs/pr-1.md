# PR #1 초기 프로젝트 세팅

- State: `MERGED`
- Author: motoo42
- Created: 2026-05-31T11:26:53Z
- Merged: 2026-06-14T12:19:58Z
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/pull/1

## Body

## 작업 내용

### 프로젝트 초기 구성
- React / Vite / TypeScript 기반 프로젝트 구조를 구성
- Vitest, Playwright 기반 테스트 환경을 추가함
- README, .gitignore, 개발 관리 흐름을 정리함
- 기획 문서 폴더: docs

### 게임 도메인 설계
- 유명 게임인 LOL의 e스포츠의 매니저가 되어 시즌을 체험해보는 웹 기반 게임
- 국내 리그인 LCK의 시스템을 차용하여 개발함
- CareerSave, SeasonState, CompetitionState 등 핵심 세이브/시즌 상태 타입을 정리함

### 시즌 및 대회 진행
- LCK 포맷을 현실 기반 간소화 구조로 설계
- 진행 버튼 / 플레이 버튼을 날짜와 경기 여부에 따라 전환하는 구조로 만듦
- 대회 순위표, 일정, 토너먼트 브래킷 화면의 기본 구조를 확인할 수 있게 함
- 정규시즌 순위 산정 프로그램 구현 및 반영

### 로스터 및 선수 시스템
- 팀별 1군 / 2군 로스터 구조를 고려한 선수 타입
- LCK 선수 샘플 데이터
- 선발 5인 관리 화면 구현
- 드래그 앤 드롭 기반 선발 교체 흐름


### 전략 / 훈련 / 경기 시뮬레이션
- 주간 전략 및 훈련 강도 선택 구조
- 전략 스타일 간 상성 구조 설계
- 밴픽 점수를 계산하고 경기 승률 보정에 반영

### UI / 화면 구조
- 16:9 고정형 메인 허브 구조
- 전체 화면은 고정하고, 필요한 패널 내부만 스크롤되는 UI 원칙 적용
- 메인 허브, 로스터 관리, 대회 현황, 시즌 캘린더 화면의 기본 UI 구현한 상태

### 테스트 및 검증
- 주요 도메인 로직에 대한 단위 테스트를 추가
- Playwright 기반 UI 확인 및 스크린샷 검증 흐름을 사용함
- UI 스크린샷 결과물을 `test-results` 하위에 정리하며 검증함

## 브랜치 흐름

`feature/initial-project-history` -> `dev`

## Comments (0)
