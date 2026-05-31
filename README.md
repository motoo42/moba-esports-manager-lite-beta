# esports-manager-lite-motoo42

League of Legends e스포츠 팀 매니지먼트 시뮬레이션 게임입니다.

사용자는 LCK 팀의 감독/프런트가 되어 스토브리그, 로스터 구성, 계약, 훈련, 전략 선택, 경기 진행, 대회 일정 관리, 포스트시즌 진출 등을 관리합니다. Football Manager 스타일의 메인 허브와 LoL e스포츠 시즌 구조를 결합한 개인 프로젝트입니다.

## 프로젝트 목표

- LCK 기반 e스포츠 매니지먼트 게임 프로토타입 구현
- 실제 시즌 흐름과 유사한 대회 구조 설계
- 로스터, 계약, 선수 상태, 전략, 훈련, 밴픽 요소를 점진적으로 확장
- AI Agent와 협업하는 개발 워크플로우 정리
- 3주 이후에도 유지보수와 기능 확장이 가능한 구조 만들기

## 주요 기능

- 커리어 생성
- 스토브리그와 로스터 확정
- 1군/2군 기반 선수 관리
- 계약 타입 관리: 1년, 2년, 1+1년
- 선수 상태 관리: 폼, 피로도, 사기
- 주간 전략과 훈련 강도 설정
- 선발 5인 드래그 앤 드롭 교체
- LCK Cup 진행
- LCK Rounds 1-2 정규시즌 일정 생성 및 진행
- 대회 순위표, 일정/결과, 토너먼트 UI
- 밴픽 점수 기반 경기 시뮬레이션 초안

## 기술 스택

- React
- TypeScript
- Vite
- Vitest
- Playwright
- @dnd-kit/core

## 실행 방법

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
```

테스트:

```bash
npm test
```

## 개발 관리 방식

본 프로젝트는 다음 브랜치 전략을 기준으로 관리합니다.

```text
main
└── dev
    └── feature/*
```

- `main`: 제출 및 안정 버전
- `dev`: 개발 통합 브랜치
- `feature/*`: 기능별 작업 브랜치

기능 개발은 GitHub Issue로 작업 단위를 나눈 뒤 진행합니다. 기능별 작업은 `feature-ooo` 또는 `feature/ooo` 브랜치에서 진행하고, 완료 후 `dev` 브랜치로 Pull Request를 생성합니다.

## GitHub Issue 관리

개발 task는 GitHub Issue로 등록해 관리합니다.

예상 Issue 예시:

- 프로젝트 기획서 정리
- Agent workflow 초안 작성
- 커리어 생성과 스토브리그 흐름 구현
- 로스터/계약 관리 구현
- LCK Cup 진행 구현
- LCK Rounds 1-2 진행 구현
- 대회 현황 UI 구현
- 포스트시즌 진행 구현
- 핵심 도메인 테스트 정리

## GitHub Wiki 관리

기획과 문서는 GitHub Wiki에 정리합니다.

Wiki에 정리할 항목:

- 프로젝트 기획서
- 서비스 주제와 핵심 기능
- 기술 스택 선택 이유
- 화면 흐름과 페이지 구성
- Agent 개발 workflow
- 작업 단위 분리 기준
- AI 요청 프롬프트 패턴
- 직접 검증해야 할 체크포인트
- 주간 회고

## Agent 개발 Workflow 초안

1. 작업 목표를 작은 단위로 나눈다.
2. 구현 전 필요한 정책과 UI 결정을 먼저 정리한다.
3. Codex에게 구현 범위와 컨펌 사항을 요청한다.
4. 구현 후 빌드와 테스트를 실행한다.
5. UI 변경은 16:9 기준 스크린샷으로 검증한다.
6. 완료된 작업은 체크리스트와 구현 순서 문서에 반영한다.
7. 기능 단위로 커밋하고 Pull Request를 생성한다.

## 현재 상태

현재 프로젝트는 개인 프로젝트 개발 중간 단계입니다. LCK Cup과 LCK Rounds 1-2의 핵심 흐름, 대회 현황 UI, 로스터 관리, 선수 상태, 전략/훈련, 밴픽 기반 시뮬레이션 초안이 구현되어 있습니다.

이후 구현 예정:

- LCK Rounds 1-2 포스트시즌 경기 진행
- First Stand
- MSI
- Asian Games
- Worlds
- 시즌 종료와 다음 시즌 전환
- 저장/불러오기
- 데이터 확장과 밸런싱

## 참고 문서

- `IMPLEMENTATION_ORDER.md`
- `롤게임/development-checklist.md`
- `롤게임/overview.md`
- `롤게임/mvp-scope.md`
- `롤게임/season-calendar.md`
