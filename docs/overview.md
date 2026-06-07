# 프로젝트 개요

## 1. 주제

League of Legends e스포츠 팀을 운영하는 매니지먼트 시뮬레이션 게임

사용자는 LCK 팀의 감독/프런트가 되어 스토브리그, 로스터 구성, 계약, 훈련, 전략 선택, 경기 진행, 대회 일정 관리, 포스트시즌 진출을 관리

Football Manager식 스포츠 매니지먼트 구조와 LoL e스포츠 시즌 구조를 결합하는 것이 핵심

## 2. 사용 범위

이 프로젝트는 개인 프라이빗 콘텐츠를 전제로 실제 LoL, LCK, MSI, Worlds, 팀명, 선수명을 사용

공개 저장소에는 실제 팀 로고, 선수 사진, Riot Games 에셋 파일을 직접 포함하지 않는 방향을 권장

실제 이미지가 필요하면 사용자가 개인 환경에서 URL 기반 커스텀 테마로 연결하는 구조를 후순위로 검토

## 3. 핵심 경험

```text
커리어 시작
-> 스토브리그
-> 로스터 확정
-> LCK Cup
-> First Stand
-> LCK Rounds 1-2
-> MSI
-> LCK Rounds 3-4 또는 3-5
-> Asian Games 또는 Worlds
-> 시즌 종료
-> 다음 시즌
```

플레이어가 느껴야 하는 핵심 감각:

- 내가 꾸린 선발 5인이 실제 경기 결과에 영향을 줌
- 전략/훈련/밴픽 선택이 승률과 결과 설명에 반영됨
- 일정과 대회 흐름이 실제 LoL e스포츠 시즌처럼 이어짐
- 하루 진행과 경기 진행 사이에 분절감이 있음
- 순위표, 일정, 토너먼트 브래킷을 보며 시즌 서사를 따라감

## 4. 대상 사용자

주요 사용자:

- LoL e스포츠 팬
- Football Manager식 스포츠 운영 게임을 좋아하는 사용자
- 로스터 구성과 시즌 운영을 즐기는 사용자

보조 사용자:

- 밴픽/메타/전략 상성을 좋아하는 사용자
- 복잡한 시뮬레이션보다 가볍지만 설득력 있는 매니저 게임을 원하는 사용자

## 5. 현재 구현 방향

- React/Vite/TypeScript 기반 프론트엔드 게임
- 런타임 AI 없이 정적 데이터와 로컬 상태를 기반으로 진행
- 추후 MongoDB 저장 구조 연결 목표
- UI는 16:9 가로 화면 우선
- 전체 프레임은 고정하고, 필요한 목록이나 패널만 내부 스크롤
- 도메인 로직은 `src/domain`에 분리
- 상태 변경은 reducer/action과 진행 엔진으로 분리
- 테스트는 단위/통합/시스템/인수 4단계로 유지

## 6. 현재 구현된 범위

- 커리어 생성
- 스토브리그 이후 LCK Cup 활성화
- LCK 10팀 고정
- 로스터 확정
- 선발 5인 관리
- 드래그 앤 드롭 선수 교체
- 선수 상태: 폼, 피로도, 5단계 사기
- 전략/훈련 선택
- 상대 분석
- 밴픽 점수 기반 시리즈 시뮬레이션 초안
- 날짜 단위 진행
- 5초 진행중 오버레이
- LCK Cup 진행
- LCK Rounds 1-2 정규시즌
- LCK Rounds 1-2 포스트시즌
- First Stand 진행 엔진과 실제 결과 UI
- MongoDB 수동 저장/불러오기
- 시즌 캘린더 로드맵/달력 보기

## 7. 장기 목표

- 1시즌 완주 가능한 MVP
- 3시즌 이상 반복 플레이 가능한 안정성
- 최대 20시즌 커리어 구조
- 저장/불러오기
- 장기 선수 성장, 은퇴, 군 입대, 유망주 생성
- 국제전과 Worlds 고도화
- 밴픽/챔피언/메타 시스템 확장
- 데이터 밸런싱

## 8. 상세 문서

- [development-checklist.md](./development-checklist.md): 단일 공식 체크리스트
- [mvp-scope.md](./mvp-scope.md): MVP 범위와 제외 범위
- [season-calendar.md](./season-calendar.md): 시즌과 대회 구조
- [players-contracts.md](./players-contracts.md): 선수/계약/로스터 설계
- [match-simulation.md](./match-simulation.md): 경기 시뮬레이션 설계
- [data-storage.md](./data-storage.md): 데이터 모델과 저장 전략
- [ui-design-decisions.md](./ui-design-decisions.md): UI 결정사항
- [risks-and-ai-workflow.md](./risks-and-ai-workflow.md): 리스크와 AI 협업 흐름
- [estimated-effort.md](./estimated-effort.md): 예상 소요시간
- [open-questions.md](./open-questions.md): 남은 결정사항
