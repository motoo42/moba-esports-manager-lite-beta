# MOBA Esports Manager Lite

League of Legends e스포츠 팀 운영 매니지먼트 시뮬레이션 게임

사용자는 LCK 팀의 감독/프런트가 되어 프리시즌 스토브리그, 로스터 구성, 1군/2군 관리, 계약 협상, 훈련, 전략 선택, 경기 진행, 대회 일정 관리, 시즌 결산을 진행한다. Football Manager식 매니지먼트 흐름과 LoL e스포츠 시즌 구조를 결합해 LCK와 국제대회 흐름을 게임 형태로 재구성하는 프로젝트다.

## 베타 링크

현재 베타 링크는 일부 테스트 인원에게만 별도로 공유한다.

Render 무료 플랜 특성상 처음 접속할 때 서버가 잠들어 있을 수 있다. 별도로 전달받은 링크 접속 후 화면이 바로 뜨지 않으면 30초 정도 기다린 뒤 새로고침한다.

현재 권장 환경은 PC/노트북 Chrome 또는 Edge, 1280x720 이상 가로 화면이다. 모바일 세로 화면과 너무 작은 화면은 정식 지원하지 않는다.

## 프로젝트 목표

- LCK 기반 e스포츠 매니지먼트 게임 프로토타입 구현
- 2026, 2027, 2028 LCK 3시즌이 실제로 진행되는 커리어 루프 완성
- 스토브리그, 로스터, 선수 상태, 전략/훈련, 경기, 대회, 저장 시스템 연결
- AI Agent와 협업하는 개발 워크플로우와 체크리스트 정리
- 기말 프로젝트 이후 개인 장기 목표로 20시즌 안정 작동까지 확장

## 주요 기능

- LCK 10개 팀 선택 기반 커리어 시작
- 2026 프리시즌 28일/4주 스토브리그
- 1군 선발/후보, 2군 아카데미, 계약 현황 분리 관리
- 콜업/콜다운과 선발 5인 드래그 앤 드롭 교체
- 계약 타입: 1년, 2년, 1+1년
- FA/재계약 협상, 제안 역할, 영입 확정/취소, AI 계약 경쟁
- 선수 상태 관리: 폼, 피로도, 5단계 사기
- 주간 전략과 훈련 강도 설정
- 밴픽 점수 기반 경기 시뮬레이션
- 실제 URL 기반 화면 이동과 대회/캘린더/로스터 하위 페이지
- LCK Cup, First Stand, LCK Rounds 1-2, MSI 진행
- 2026 Asian Games 시즌 LCK Rounds 3-4, 일반 시즌 LCK Rounds 3-5 진행
- Asian Games 대표 선발, 플레이 여부 선택, 메달/병역 보상
- Worlds 20팀 참가 풀, Play-In, Group Stage, Knockout, 우승팀 저장
- 시즌 요약, 3시즌 히스토리, 오프시즌 결과 기록
- MongoDB 기반 수동 저장, 새 저장, 불러오기, 자동 저장, 저장 충돌 감지
- Render 단일 링크 베타 배포 구조

## 현재 구현 상태

현재 프로젝트는 1시즌 MVP를 넘어, 기말 프로젝트 목표인 `LCK 3시즌 작동`을 달성한 상태다.

검증 기준:

- 2026 아시안게임 시즌 완주
- 2027 일반 시즌 완주
- 2028 일반 시즌 완주
- 2028 Worlds 종료 후 시즌 요약/스토브리그 도달
- 2029 LCK Cup 진입 직전 상태까지 debug runner로 확인

최근 베타 전 재정비:

- 리렌더링/route 왕복 버그 수정
- 2026 시작 전 프리시즌 스토브리그 구조 변경
- 1군/2군 로스터 분리와 콜업/콜다운 구조 추가
- LCK 10개 팀 선택 기반 커리어 시작 화면
- Ghost 포지션 SUP 수정
- 로스터 조작 자체로 사기가 변하지 않도록 수정
- 스토브리그 계약 제안 역할, 영입 확정 대기, 예산/포지션 제한 추가
- 데이터 저장 전용 메뉴와 그룹형 한글 사이드바 정리
- 2026 LCK 1군 선수 사진 1차 적용
- 모바일 미지원 안내와 팀 밸런싱 1차 적용

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

## 로컬 실행

Node.js 20.19 이상을 권장한다.

```bash
npm.cmd install
```

MongoDB 연결에는 Git에 커밋하지 않는 `.env.local`이 필요하다. 공개 가능한 변수 예시는 `.env.example`을 참고한다.

개발 중에는 서버와 클라이언트를 각각 실행한다.

```bash
npm.cmd run dev:server
npm.cmd run dev:client
```

기본 로컬 주소:

```text
http://127.0.0.1:5173/
http://127.0.0.1:4000/api/health
```

## 배포

production에서는 Express 서버 하나가 Vite 빌드 결과물과 `/api` 저장 API를 함께 제공한다.

Render Web Service 기준 명령:

```bash
npm install --include=dev && npm run build
npm run start
```

필수 환경변수:

```text
NODE_ENV=production
NODE_VERSION=20.19.0
MONGODB_URI=실제 MongoDB Atlas URI
MONGODB_DB_NAME=moba_esports_manager_beta
VITE_API_BASE_URL=/api
```

주의:

- 실제 `MONGODB_URI`는 GitHub, PR, 문서, 채팅에 올리지 않는다.
- 베타 배포에서는 `VITE_SAVE_OWNER_ID`를 비워두면 브라우저별 저장 공간이 자동으로 분리된다.
- 자세한 배포 절차는 `docs/beta-deploy-guide.md`를 참고한다.

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

## 현재 남은 주요 과제

- 닫힌 스토브리그도 접근 가능한 정보 화면
- 타팀 로스터/스카우팅 화면
- FIFA식 선수 카드 리디자인
- 메시지함/뉴스/일정 알림 1차
- 우리 팀 이적 로그를 메시지함에도 노출
- 선수 사진 최신화와 저작권 리스크 정리
- 로그인/사용자별 저장 분리
- 트레이드, AI-유저 협상, 장기 스토브리그 고도화
- 챔피언/메타/밴픽 시스템 고도화
- 20시즌 장기 안정성

## 개발 관리 방식

```text
main
└── dev
    └── feature/*
```

- `main`: 제출 및 안정 버전
- `dev`: 개발 통합 브랜치
- `feature/*`: 기능별 작업 브랜치

현재 베타 배포용 개인 저장소에도 같은 커밋을 push해 Render 배포를 갱신하고 있다.

## 참고 문서

- `IMPLEMENTATION_ORDER.md`
- `docs/development-checklist.md`
- `docs/beta-deploy-guide.md`
- `docs/beta-tester-guide.md`
- `docs/beta-test-guide.md`
- `docs/architecture.md`
- `docs/season-calendar.md`
- `docs/design-guidelines.md`
- `docs/ui-design-decisions.md`
