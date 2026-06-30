# #14 [P02] FA 시장 목록에서 타팀 소속 선수 제거

- State: `CLOSED`
- Author: motoo42
- Created: 2026-06-09T18:16:01Z
- Closed: 2026-06-09T20:15:39Z
- Labels: `bug` `critical` 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/14

## Body

## 원본 항목
4번

## 문제
FA 시장 목록에 이미 다른 팀 소속이 된 선수가 계속 표시된다.

## 기대 동작
- FA/무소속 선수만 FA 시장 목록에 표시된다.
- 이미 AI 팀 또는 유저 팀에 계약된 선수는 FA 목록에서 사라진다.
- 닫힌 시장 정보 화면에서도 동일한 기준을 적용한다.

## 완료 기준
- currentTeam이 존재하거나 active contract가 있는 선수는 FA 목록에 나오지 않는다.
- FA 영입 확정/AI 영입 이후 목록이 즉시 갱신된다.
- 관련 단위/통합 테스트가 추가된다.

## Comments (0)
