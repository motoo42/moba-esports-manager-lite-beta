# #16 [P04] LCK 정규시즌 경기 일정 간격 규칙 보정

- State: `CLOSED`
- Author: motoo42
- Created: 2026-06-09T18:16:04Z
- Closed: 2026-06-09T20:16:15Z
- Labels: `bug` `critical` 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/16

## Body

## 원본 항목
7번

## 문제
LCK 경기는 수/목/금/토/일에 열리고, 같은 팀은 최소 이틀 간격을 두고 경기해야 한다. 현재 일부 일정에서 이 조건을 만족하지 않는 케이스가 발생한다.

## 기대 동작
- 경기 가능 요일은 수~일로 제한된다.
- 같은 팀의 경기는 최소 이틀 간격을 둔다. 예: 수-금, 금-일 등은 가능하지만 연속일 경기는 피한다.
- LCK Rounds 1-2, Rounds 3-4, Rounds 3-5 일정 생성에 같은 원칙을 적용한다.

## 완료 기준
- 일정 생성 후 모든 팀별 경기일 간격 검증 테스트가 통과한다.
- 수~일 외 날짜에 LCK 경기가 배정되지 않는다.
- 기존 시즌 debug runner가 계속 통과한다.

## Comments (0)
