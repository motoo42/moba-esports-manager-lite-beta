# MSI 포맷 설계

기준 결정일: 2026-06-06

이 문서는 2026 Mid-Season Invitational 구현 기준을 고정하기 위한 문서다. First Stand의 8팀 조별리그 포맷을 단순 재사용하지 않고, 2026 MSI 구조를 기반으로 별도 구현한다.

## 1. 설계 목표

- 2026 MSI 진행 방식을 최대한 반영
- 다른 국제대회에도 재사용할 수 있는 플레이인 + 더블 엘리미네이션 브래킷 구조 마련
- LCK 진출팀은 국내 대회 결과에서 산출
- LCK 외 해외 팀은 1차 구현에서 고정 샘플 팀으로 사용
- UI는 대회 현황의 기존 탭 구조를 유지하되, 브래킷 표현은 MSI 전용으로 확장

## 2. 참가팀

총 11팀 참가

- LCK 1시드
- LCK 2시드
- LPL 1시드
- LPL 2시드
- LEC 1시드
- LEC 2시드
- LCS 1시드
- LCS 2시드
- LCP 1시드
- LCP 2시드
- CBLOL 1시드

CBLOL은 2시드가 없고 우승팀 1팀만 참가한다.

## 3. 브래킷 스테이지 직행

브래킷 스테이지 직행 팀은 총 7팀

- 1시드 6팀
- 2026 First Stand 우승 리그의 2시드 팀

브래킷 스테이지 총 참가팀은 8팀이다.

```text
브래킷 직행 7팀
+ 플레이인 우승팀 1팀
= 브래킷 스테이지 8팀
```

First Stand 우승 리그의 2시드 팀이 직행하므로, 나머지 2시드 4팀은 플레이인 스테이지로 간다.

예시:

- First Stand 우승 리그가 LCK면 LCK 2시드가 브래킷 직행
- LPL이면 LPL 2시드가 브래킷 직행
- CBLOL이면 CBLOL 2시드가 없으므로 예외 처리 필요

CBLOL이 First Stand 우승 리그가 되는 경우의 예외 규칙은 구현 전 확인 필요

## 4. LCK 진출팀 산정

1차 구현 기준:

- LCK 1시드: LCK Rounds 1-2 포스트시즌 우승팀
- LCK 2시드: LCK Rounds 1-2 포스트시즌 준우승팀
- LCK 2시드의 브래킷 직행 여부: First Stand 우승 리그가 LCK인지로 결정

후속 확장 후보:

- 챔피언십 포인트
- LCK 후반 라운드 결과
- 직전 시즌 국제전 성과 보정

## 5. 플레이인 스테이지

참가팀:

- 브래킷 직행을 받지 못한 2시드 4팀

진행:

- 4강 싱글 엘리미네이션 토너먼트
- 4강 2경기
- 결승 1경기
- 우승팀이 브래킷 스테이지 진출

경기 방식:

- 플레이인 4강: BO3
- 플레이인 결승: BO5

## 6. 브래킷 스테이지

참가팀:

- 브래킷 직행 7팀
- 플레이인 우승팀 1팀

진행:

- 상위조/하위조 더블 엘리미네이션
- 상위조 패자는 하위조로 이동
- 하위조 패자는 탈락
- 상위조 최종 승자와 하위조 최종 승자가 Grand Finals에서 대결

첨부된 2026 MSI 대진표 이미지를 기준으로 다음 구조를 사용한다.

```text
Upper Round 1: 4경기
Upper Round 2: 2경기
Upper Final: 1경기

Lower Round 1: 2경기
Lower Round 2: 2경기
Lower Round 3: 1경기
Lower Final: 1경기

Grand Finals: 1경기
```

경기 방식:

- 기본: BO3
- 플레이인 결승: BO5
- 브래킷 스테이지 4라운드 2경기: BO5
- Grand Finals: BO5

사용자 컨펌 기준 BO5 적용 범위:

- Upper Final
- Lower Final
- Grand Finals

나머지 브래킷 스테이지 경기는 BO3로 처리한다.

## 7. 해외 고정 팀 후보

LCK 외 팀은 1차 구현에서 고정한다.

확정:

- LPL 1시드: Bilibili Gaming
- LPL 2시드: Top Esports
- LEC 1시드: G2 Esports
- LEC 2시드: Fnatic
- LCS 1시드: Cloud9
- LCS 2시드: FlyQuest
- LCP 1시드: PSG Talon
- LCP 2시드: GAM Esports
- CBLOL 1시드: LOUD

전력값은 1차 구현 기준 고정값을 사용한다. 기존 `sampleOpponents`에 같은 팀이 있으면 해당 값을 우선할 수 있다.

## 8. Worlds 추가 시드 메모

MSI 결과는 Worlds 진출권에 영향을 줄 수 있다.

사용자 확정 규칙:

- MSI에서 상위 성적을 기록한 2개 리그는 Worlds 추가 시드 1장을 받을 수 있다.
- 리그 성적 판정은 MSI에 진출한 같은 리그 팀 중 더 높은 성적을 기록한 1팀만 기준으로 한다.
- LCK 대표 중 더 높은 성적 팀이 MSI 상위 2개 리그 조건을 만족하면 LCK는 Worlds 4시드 진출권을 얻을 수 있다.
- 따라서 LCK Season Play-In/Playoffs 구현 시 최종 1~3위뿐 아니라 4위도 반드시 저장해야 한다.

구현 상태:

- 기본 Worlds 진출 확정권은 LCK 상위 3팀으로 해석한다.
- MSI 추가 시드 조건을 만족하면 LCK 4위가 Worlds 진출권 후보에서 실제 진출팀으로 승격된다.
- MSI 완료 시 `SeasonState.worldsQualification`에 리그별 최고 성적, 상위 2개 보너스 리그, Worlds 참가팀 풀을 저장한다.
- 같은 리그 참가팀은 가장 높은 성적 1팀만 리그 성적으로 사용한다.
- 같은 탈락 라운드는 MSI 참가 초기 시드가 높은 팀을 우선한다.
- 현재 Rounds 3-4 Season Play-In/Playoffs 구현에서는 LCK 포스트시즌 최종 1~4위를 보존하고, LCK 보너스 시드 여부에 따라 4위를 `qualified` 또는 `conditional-missed`로 해석한다.
- Worlds 참가팀 풀은 LCK/LPL/LCS/LEC 기본 3팀, LCP/CBLOL 기본 2팀, MSI 보너스 2팀, LCQ placeholder 2팀의 총 20팀 모델로 확정한다.
- `LTA` 표기는 `LCS`로 통일하되, 기존 저장값이나 테스트 데이터의 legacy `LTA` 값은 helper에서 `LCS`로 해석한다.

## 9. 구현 메모

MSI는 First Stand의 조별리그-토너먼트 구조를 그대로 재사용하지 않는다.

재사용할 수 있는 부분:

- `CompetitionState`
- `MatchSchedule`
- `MatchRecord`
- 순위/결과 저장 구조
- 경기 시뮬레이션
- 대회 현황의 일정/결과 표시 일부

새로 필요한 부분:

- 11팀 참가자 산정
- First Stand 우승 리그 판정
- 플레이인 토너먼트 생성
- 8팀 더블 엘리미네이션 브래킷 생성
- 상위조/하위조 이동 규칙
- BO3/BO5 혼합 스케줄
- MSI 전용 브래킷 UI

## 10. 1차 구현 완료 상태

완료:

- 11팀 참가자 산정
- 해외 고정 팀 구성
- LCK 1시드/2시드 산정
- First Stand 우승 리그 2시드 브래킷 직행
- First Stand 우승 리그가 CBLOL인 경우 준우승 리그 2시드에게 직행권 승계
- 플레이인 4팀 싱글 엘리미네이션
- 브래킷 스테이지 8팀 상위조/하위조 더블 엘리미네이션
- 플레이인 결승, Upper Final, Lower Final, Grand Finals BO5
- MSI 우승팀/준우승팀 저장
- LCK Rounds 1-2 완료 후 MSI 활성화
- MSI 성적 기반 Worlds 추가 시드 판정
- 리그별 최고 성적 1팀 기준 상위 2개 리그 산정
- LCK Rounds 3-4 최종 4위의 Worlds 진출 확정/조건 미충족 해석
- Worlds 20팀 참가 풀 저장
- 대회 현황 화면 MSI 전용 UI 연결
- Overview / Schedule / Bracket 탭 표시
- MSI Overview/Summary에 Worlds 보너스 리그 표시
- 플레이인, 상위조, 하위조, Grand Finals 브래킷 표시
- 현재 라운드, BO5, 우리 팀 경기/슬롯 강조
- 1366x768 16:9 브라우저 검증

검증 스크린샷:

- `test-results/ui-screenshots/msi-bracket-1366x768.png`

후속 고도화 후보:

- Worlds 실제 경기 포맷과 스케줄 생성
- 브래킷 가로 스크롤 위치 저장
- 라운드 연결선/진출 화살표 시각화
- 국제대회 공통 브래킷 컴포넌트 추출
