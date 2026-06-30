# #10 연봉 / 예산 밸런싱 추가 조정

- State: `CLOSED`
- Author: motoo42
- Created: 2026-06-09T05:58:11Z
- Closed: 2026-06-09T17:47:37Z
- Labels: 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/10

## Body

## 배경

현재 연봉과 팀 예산 수치가 게임 플레이 기준으로 다소 과하게 느껴진다.  
특히 2군 선수 연봉이 높고, 1군 연봉과 팀 총예산도 추가 조정이 필요하다.

## 작업 내용

- 현재 선수 연봉 분포 점검
- 1군 선수 연봉 스케일 재조정
- 2군 선수 연봉 스케일 하향 조정
- 팀별 예산 재조정
- S/A/B/C 팀 티어별 예산 차이 재검토
- 팀별 `salaryMultiplier`, `budget`, `appealModifier` 재검토
- 스토브리그에서 예산 압박이 실제로 느껴지는지 확인
- 2027/2028 시즌 성적 보정이 예산을 과하게 부풀리지 않는지 확인
- UI 금액 표기와 내부 숫자 단위가 일관적인지 확인

## 완료 기준

- 2군 선수 연봉이 과하게 높지 않다.
- 상위권 팀은 예산 여유가 있지만 무한 영입은 불가능하다.
- 하위권 팀은 예산 압박이 느껴진다.
- 유저가 스토브리그에서 예산을 고려해 선택해야 한다.
- `npm.cmd test`, `npm.cmd run build` 통과

## Comments (0)
