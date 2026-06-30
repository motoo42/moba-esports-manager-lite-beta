# PR #2 implement LCK season flow and 2026 roster systems

- State: `MERGED`
- Author: motoo42
- Created: 2026-06-07T11:33:43Z
- Merged: 2026-06-09T05:39:21Z
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/pull/2

## Body

## Summary

이 PR은 초기 League of Legends e스포츠 매니저 프로토타입을 2026 시즌 기준으로 플레이 가능한 MVP 수준까지 확장하고, 기말 프로젝트 목표인 “LCK 3시즌 작동”을 준비하기 위한 작업입니다.

주요 범위는 시즌 진행, 대회 엔진, MongoDB 기반 커리어 저장, 스토브리그, 2026 LCK 로스터 데이터, 선수 능력치 밸런싱, 그리고 프로젝트 핸드오프/계획 문서 정리입니다.

## What Changed

### 시즌 및 커리어 흐름

- 실제 URL 기반 라우팅과 대회/캘린더 세부 하위 페이지 라우팅을 추가했습니다.
- 로스터 구성 이후 날짜 단위로 시즌을 진행하는 커리어 루프를 확장했습니다.
- LCK Cup, First Stand, LCK Rounds 1-2, MSI, LCK 후반 라운드, Asian Games, Worlds, 시즌 요약, 스토브리그, 다음 시즌 진입까지 이어지는 시즌 상태 전환을 구현했습니다.
- `SeasonProfile` 기반 시즌 분기를 추가했습니다.
  - 2026년은 아시안게임 시즌입니다.
  - 2027년과 2028년은 일반 시즌입니다.
- 다음 시즌 전환의 기본 처리를 추가했습니다.
  - 선수 나이/상태 롤오버
  - 팀 승패 초기화
  - ELO 유지
  - 다음 시즌 LCK Cup 활성화

### 대회 엔진 및 대시보드

- 다음 대회들의 실제 진행 엔진과 UI 연동을 구현했습니다.
  - LCK Cup
  - LCK Rounds 1-2
  - First Stand
  - MSI
  - 2026 아시안게임 시즌용 LCK Rounds 3-4
  - 일반 시즌용 LCK Rounds 3-5
  - Asian Games
  - Worlds
- LCK Rounds 1-2 포스트시즌, Rounds 3-4 포스트시즌, 일반 시즌 Rounds 3-5 포스트시즌 흐름을 추가했습니다.
- MSI 성적 기반 Worlds 보너스 시드 판정과 Worlds 20팀 참가 풀 생성을 구현했습니다.
- Worlds Play-In, Group Stage, Knockout, 우승팀 저장 흐름을 구현했습니다.
- 대회별 Overview, Standings/Groups, Schedule, Tournament/Bracket 탭과 URL 하위 페이지를 추가했습니다.
- MSI와 Asian Games 브래킷 UI를 개선했습니다.

### 저장 시스템

- Express API 서버와 MongoDB native driver 연동을 추가했습니다.
- `careerSaves` 기반 커리어 저장/불러오기를 구현했습니다.
- 커리어 생성 화면에서 저장 목록을 불러올 수 있게 했습니다.
- 수동 저장, 새 저장, 불러오기, 첫 자동 저장, 주요 진행 체크포인트 자동 저장을 추가했습니다.
- `revision` 기반 저장 충돌 감지와 409 피드백을 추가했습니다.
- 실제 MongoDB URI 같은 로컬 시크릿은 추적 파일에 포함하지 않고, ignored env 파일에서만 다루도록 정리했습니다.

### 스토브리그 및 시즌 종료

- 시즌 요약 화면에 대회 결과, 최종 팀 승패/ELO, Worlds 우승팀, 계약 만료 정보를 표시했습니다.
- `/offseason` 라우트와 28일/4주 스토브리그 시장 흐름을 추가했습니다.
- 1주차 재계약/방출 처리를 추가했습니다.
- 2~4주차 FA 제안 및 AI 경쟁 흐름을 추가했습니다.
- 향후 AI-AI, AI-유저 이적 협상 확장을 고려한 제안 구조를 준비했습니다.
- 스토브리그 로그와 다음 시즌 진입 전 로스터 검증을 추가했습니다.

### 2026 LCK 선수 데이터 및 능력치 작업

- 2026 LCK 10개팀 1군+2군 로스터 seed 데이터를 추가했습니다.
- 로스터 생성 구조를 다음 세 파일로 분리했습니다.
  - `lck2026RosterSeeds`
  - `lck2026RatingOverrides`
  - `lck2026Players`
- 새 커리어 생성과 로스터 빌더가 확장된 2026 LCK 선수 풀을 사용하도록 변경했습니다.
- 로스터 빌더에 팀, 포지션, 1군/2군, 검색 필터를 추가했습니다.
- 사용자 스카우팅 메모를 기반으로 메모 기반 선수 능력치를 조정했습니다.
- 실제 스탯 기반 능력치 후보표를 참고용으로 별도 저장했습니다.
- 실제 게임 데이터는 메모 기반 능력치표를 사용하도록 유지했습니다.
- 2군/CL 밸런싱을 최종 정리했습니다.
  - 현재 어빌 기준 Academy TOP6: Sharvel, Cloud, Guti, Haetae, Garden, Wayne
  - Gen.G와 Hanjin BRION CL은 하위권 2군으로 낮게 책정했습니다.
  - T1, Dplus KIA, Nongshim RedForce 2군 강세는 일부 반영했습니다.
- 능력치 검토 문서를 추가했습니다.
  - `docs/lck-2026-rating-review.md`
  - `docs/lck-2026-stat-rating-comparison.md`

### 문서 및 에이전트 핸드오프

- `CODEX_HANDOFF.md`를 향후 Codex/에이전트가 이어받기 위한 핵심 핸드오프 문서로 업데이트했습니다.
- `docs/development-checklist.md`를 단일 공식 체크리스트로 정리했습니다.
- `IMPLEMENTATION_ORDER.md`를 현재 스프린트 안내 문서로 업데이트했습니다.
- 기말 프로젝트 우선 목표를 “LCK 3시즌 작동”으로 공식화했습니다.
- 더 정교한 개인 프로젝트 버전과 20시즌 안정 작동 목표는 장기 목표로 유지하되, 현재 우선순위는 3시즌 목표 기준으로 재정렬했습니다.

## Current Project Status

- 1시즌 MVP는 사실상 완료된 상태입니다.
- 기말 프로젝트 목표인 LCK 3시즌 작동 기준 현재 진척도는 약 70~78%로 보고 있습니다.
- 2026 시즌 흐름은 대부분 닫힌 상태입니다.
- 2027년과 2028년 시즌은 전체 연결과 장기 진행 검증이 아직 필요합니다.

## Notes for Review

- 이 PR은 장기간 진행된 feature 브랜치의 대규모 통합 PR입니다.
- `main` 브랜치와 충돌이 있을 수 있어 merge 전 conflict resolution이 필요할 수 있습니다.
- 실제 MongoDB 연결 시크릿은 추적 파일에 포함하지 않았습니다.
- `.env.example`은 placeholder 용도로 유지합니다.
- 실제 게임 적용 능력치는 메모 기반 테이블을 사용합니다.
- 스탯 기반 능력치표는 비교/참고용 문서로만 보관했습니다.

## Next Steps

- 2027 시즌 전체 연결 및 검증
- 2028 시즌 반복 안정화
- 3시즌 자동 시뮬레이션 테스트 또는 debug runner 추가
- 시즌 히스토리와 3시즌 요약 UI 추가
- 장기 커리어를 위한 저장 마이그레이션/스키마 안정성 보강
- 스토브리그 시스템 추가 고도화
  - AI 로스터 전력 반영
  - 선수 선호도
  - 경쟁 입찰
  - 향후 이적 협상 로직

## Comments (0)
