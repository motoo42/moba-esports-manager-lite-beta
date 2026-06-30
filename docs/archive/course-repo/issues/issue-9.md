# #9 팀 / LCK 로고 에셋 적용

- State: `CLOSED`
- Author: motoo42
- Created: 2026-06-09T05:57:50Z
- Closed: 2026-06-09T17:47:37Z
- Labels: 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/9

## Body

## 배경

현재 게임 내에서 팀 정체성을 보여주는 시각 요소가 부족하다.  
LCK 10개 팀과 LCK 자체 로고를 적용하면 팀 선택, 로스터, 대회 화면, 스카우팅 화면의 완성도가 크게 올라간다.

## 작업 내용

- LCK 10개 팀 로고 에셋 준비
- LCK 로고 에셋 준비
- 로고 저장 위치와 파일명 규칙 정리
  - 예: `public/assets/teams/lck/2026/t1.webp`
  - 예: `public/assets/leagues/lck.webp`
- 팀 데이터에 `logoUrl` 또는 동등한 필드 추가
- 팀 선택 화면에 팀 로고 표시
- 로스터 / 스카우팅 / 대회 현황에서 팀 로고 표시
- 로고 누락 시 fallback UI 제공
- 로고 출처와 저작권 주의사항 문서화

## 완료 기준

- LCK 10개 팀이 게임 내 주요 화면에서 로고로 식별된다.
- 로고가 없어도 화면이 깨지지 않는다.
- 팀 선택 화면의 시각적 완성도가 개선된다.
- `npm.cmd test`, `npm.cmd run build` 통과

## Comments (0)
