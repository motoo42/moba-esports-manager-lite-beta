# 시즌과 대회 구조

## 1. 기본 방향

실제 LoL e스포츠와 LCK 시즌 흐름을 최대한 참고하되, 게임 진행과 구현 속도를 위해 일부 포맷은 간소화

첫 시즌은 2026 시즌

2026 시즌은 아시안게임 시즌으로 시작하고, 이후 4년마다 아시안게임 시즌 처리

## 2. 시즌 템플릿

### 일반 시즌

```text
LCK Cup
-> First Stand
-> LCK Rounds 1-2
-> MSI
-> LCK Rounds 3-5
-> Worlds
-> 오프시즌
```

### 아시안게임 시즌

```text
LCK Cup
-> First Stand
-> LCK Rounds 1-2
-> MSI
-> LCK Rounds 3-4
-> Asian Games
-> Worlds
-> 오프시즌
```

## 3. 아시안게임 주기

기준:

```text
firstSeasonYear = 2026
isAsianGamesYear = (year - 2026) % 4 === 0
```

예시:

| 시즌 | 연도 | 타입 |
| ---: | ---: | --- |
| 1 | 2026 | 아시안게임 시즌 |
| 2 | 2027 | 일반 시즌 |
| 3 | 2028 | 일반 시즌 |
| 4 | 2029 | 일반 시즌 |
| 5 | 2030 | 아시안게임 시즌 |

## 4. 대회 ID

현재 코드 기준 `CompetitionId`:

```ts
type CompetitionId =
  | "lck-cup"
  | "first-stand"
  | "lck-rounds-1-2"
  | "msi"
  | "lck-rounds-3-5"
  | "lck-rounds-3-4"
  | "worlds"
  | "asian-games";
```

## 5. LCK Cup

현실 기반 간소화 포맷

- LCK 10팀 참가
- 직전 시즌 순위 기반으로 Baron/Elder 그룹 분배
- 첫 시즌은 초기 기준 시드 사용
- 그룹은 고정하지 않고 매 시즌 재분배 가능
- 그룹 배틀 후 플레이인/플레이오프
- 플레이인/플레이오프는 싱글 엘리미네이션으로 간소화
- 우승/준우승팀을 First Stand LCK 대표로 사용

현재 구현:

- LCK Cup 진행 가능
- 그룹 현황과 일정/결과 표시 가능
- LCK Cup 완료 후 First Stand로 전환

## 6. First Stand / MSI

First Stand는 8팀 포맷으로 구현했다.

- LCK 상위 2팀
- LPL 상위 2팀
- 기타 4개 리그 상위 1팀씩
- 총 8팀
- 4팀씩 2개 조
- 각 조 상위 2팀 토너먼트 진출
- 4강/결승 토너먼트

현재 구현:

- First Stand 진행 엔진 완료
- 조별리그/일정/토너먼트 실제 결과 UI 연결
- First Stand 완료 후 LCK Rounds 1-2로 전환

MSI는 2026 MSI 진행 방식을 기준으로 별도 구현한다.

상세 기준:

- [MSI 포맷 설계](./msi-format.md)

MSI 핵심 규칙:

- 총 11팀 참가
- CBLOL 제외 각 지역 리그 상위 2팀씩 참가
- CBLOL은 우승팀 1팀 참가
- 1시드 6팀과 2026 First Stand 우승 리그의 2시드 팀은 브래킷 스테이지 직행
- 나머지 2시드 4팀은 플레이인 스테이지부터 시작
- 플레이인 우승팀이 브래킷 스테이지에 합류
- 브래킷 스테이지는 총 8팀 상위조/하위조 더블 엘리미네이션
- 플레이인 결승, 브래킷 스테이지 후반부, Grand Finals는 BO5
- 나머지 경기는 BO3
- LCK 1시드/2시드는 LCK Rounds 1-2 포스트시즌 우승팀/준우승팀을 1차 기준으로 사용
- MSI 상위 성적 2개 리그는 Worlds 추가 시드 1장을 받을 수 있으며, 리그 성적은 해당 리그 MSI 참가팀 중 가장 높은 성적 1팀만 기준으로 판정

## 7. LCK Rounds 1-2

현실 LCK 1~2라운드 체제를 기준으로 구현

- LCK 10팀
- 9주 진행
- 팀당 18경기
- 총 90시리즈
- 한 팀은 주당 2경기
- 전체 팀 경기가 시스템상 실제로 생성되고 시뮬레이션됨
- 우리 팀 경기가 없는 날도 AI 경기 결과가 순위에 반영됨
- 타이브레이커 경기는 1차 구현에서 제외

현재 구현:

- 정규시즌 일정 생성
- 날짜 단위 진행
- 순위표 갱신
- 포스트시즌 6팀 싱글 엘리미네이션
- 우승팀/준우승팀 저장

## 8. LCK Rounds 3-5 / 3-4

일반 시즌:

- LCK Rounds 3-5
- LCK Rounds 1-2 최종 순위 기준 상위 5팀은 Legend Group, 하위 5팀은 Rise Group으로 분리
- Rounds 1-2 승패, 세트 승패, 세트 득실 기록은 초기화하지 않고 승계
- 각 그룹 5팀 내부 트리플 라운드로빈
- 팀당 12시리즈 추가, 총 60시리즈
- 모든 경기는 BO3 Fearless
- MSI 완료 후 일반 시즌이면 LCK Rounds 3-5로 전환
- 대회 현황 화면에서 그룹 순위표, 일정/결과, 후속 경로 예상 슬롯 표시
- Rounds 3-5 정규 그룹 종료 시 Legend 1-5위와 Rise 1-3위를 Season Play-In/Playoffs 경로 후보로 저장
- Season Play-In/Playoffs 구조는 아시안게임 시즌 Rounds 3-4와 같은 흐름을 재사용
- Playoffs 종료 후 최종 1~4위를 저장
- 최종 1~3위는 Worlds 기본 진출 후보, 4위는 MSI 추가 시드 조건부 후보로 해석
- 일반 시즌은 Asian Games 없이 Worlds로 연결

아시안게임 시즌:

- LCK Rounds 3-4
- Asian Games 이후 Worlds로 연결

아시안게임 시즌 LCK Rounds 3-4 현재 구현:

- LCK Rounds 1-2 최종 순위 기준 상위 5팀은 Legend Group, 하위 5팀은 Rise Group으로 분리
- Rounds 1-2 승패, 세트 승패, 세트 득실 기록은 초기화하지 않고 승계
- 각 그룹 5팀 내부 더블 라운드로빈
- 팀당 8시리즈 추가, 총 40시리즈
- 모든 경기는 BO3 Fearless
- MSI 완료 후 아시안게임 시즌이면 LCK Rounds 3-4로 전환
- 대회 현황 화면에서 그룹 순위표, 일정/결과, 후속 경로 예상 슬롯 표시
- Rounds 3-4 정규 그룹 종료 시 Legend 1-5위와 Rise 1-3위를 Season Play-In/Playoffs 경로 후보로 저장
- Season Play-In은 Legend 5위, Rise 1~3위가 참가하고 2팀이 Playoffs에 합류
- Playoffs는 Legend 1~4위와 Season Play-In 통과 2팀이 참가하는 상위조/하위조 브래킷
- Season Play-In/Playoffs 모든 경기는 BO5 Fearless
- Playoffs 종료 후 최종 1~4위를 저장
- 최종 1~3위는 Worlds 기본 진출 후보, 4위는 MSI 추가 시드 조건부 후보로 해석

남은 구현 필요:

- 2027/2028 전체 시즌 진행 중 Rounds 3-5 이후 Worlds, 시즌 요약, 스토브리그까지 장기 연결 검증

## 9. Asian Games

2026 아시안게임 시즌에는 LCK Rounds 3-4 포스트시즌 이후 Asian Games로 전환한다.

현재 구현:

- Asian Games 개막 기준일은 2026-09-08
- 대표 6인은 개막 7일 전 자동 선발
- 진행 방식 선택은 개막 6일 전 한 번만 진행
- 선택지는 `직접 플레이`와 `자동 진행`
- 선택 전에는 진행 버튼을 잠그고 선택 모달을 표시
- 직접 플레이 선택 시 한국 경기만 기존 match-preview/플레이 흐름으로 진행
- 자동 진행 선택 시 한국 경기 포함 모든 경기를 AI 자동 처리
- 대한민국 대표 6인은 LCK 선수 풀 전체에서 선발
- TOP/JGL/MID/BOT/SUP 각 포지션 최고 폼 1명씩 선발
- 남은 한국 후보 중 최고 폼 1명을 6번째 선수로 선발
- 동률은 `overall`, `potential`, `id` 순으로 해소
- 선발 6인과 스타팅 5인은 자동 고정
- 한국 대표팀 경기력은 선발 스타팅 5인과 현재 전략/훈련 성향을 반영

토너먼트:

- 참가국: 대한민국, 중국, 대만, 일본, 홍콩, 베트남, 인도, 마카오
- 8강: 대한민국 vs 마카오, 일본 vs 홍콩, 중국 vs 인도, 대만 vs 베트남
- 4강: 8강 A/B 승자, 8강 C/D 승자
- 동메달전: 4강 패자
- 결승: 4강 승자
- 결승은 BO5, 나머지는 BO3
- 금/은/동 결과를 Asian Games 상태와 대회 `qualifiedTeamIds`에 저장
- 대한민국 금메달 시 대표 6인의 `militaryServiceStatus`를 `completed`로 변경
- Asian Games 완료 후 Worlds를 `available` 상태로 전환

이번 범위에서 제외:

- 대표 차출로 인한 폼/피로도 이벤트
- 국가별 상세 해외 선수 로스터
- 선수 선발 이후 라인업 조작

## 10. Worlds

현재 구현:

- MSI 결과를 바탕으로 상위 2개 리그에 Worlds 보너스 시드 1장씩 부여
- 리그 성적은 같은 리그 MSI 참가팀 중 가장 높은 성적 1팀만 기준으로 판정
- LCK/LPL/LCS/LEC는 기본 3팀
- LCP/CBLOL은 기본 2팀
- MSI 상위 2개 리그는 보너스 1팀
- LCQ placeholder 2팀
- 총 20팀 참가 풀을 `SeasonState.worldsQualification.entrants`에 저장
- LCK Rounds 3-4 포스트시즌 최종 1~3위는 기본 Worlds 진출팀으로 해석
- LCK가 MSI 보너스 시드를 얻으면 최종 4위도 Worlds 진출팀으로 승격
- LCK가 MSI 보너스 시드를 얻지 못하면 4위는 `조건 미충족`으로 표시하고 참가 풀에서는 제외
- Asian Games 완료 후 다음 진행에서 Worlds를 active로 전환
- Worlds 대시보드는 Overview, Schedule, Groups, Bracket 탭으로 표시
- Worlds 완료 시 `CompetitionState.winnerTeamId/winnerTeamName`과 `SeasonState.worlds.championTeamId/championTeamName`에 우승팀 저장

플레이인:

- 참가팀은 LCP 1~2시드, CBLOL 1~2시드, MSI 보너스 2팀, LCQ placeholder 2팀
- 단, LCK/LPL/LCS/LEC의 MSI 보너스 4시드는 Play-In 참가팀으로 배치
- 4팀씩 2개 조
- BO1 싱글 라운드 로빈
- 각 조 상위 2팀, 총 4팀이 Group Stage 진출

조별리그:

- LCK/LPL/LCS/LEC 1~3시드 12팀과 Play-In 통과 4팀, 총 16팀
- 4팀씩 4개 조
- BO1 더블 라운드 로빈
- 조 상위 2팀 토너먼트 진출
- Play-In과 Group Stage 조 편성은 같은 리그 중복을 금지하고, 불가능할 때만 최소 중복 fallback 사용

토너먼트:

- 8강, 4강, 결승 싱글 엘리미네이션
- 전 경기 BO5
- 8강 대진은 `A1 vs B2`, `B1 vs A2`, `C1 vs D2`, `D1 vs C2`

Worlds 이후 시즌 종료:

- Worlds 완료 후 시즌 요약 화면으로 전환
- 시즌 요약에는 대회별 결과, 최종 승패/ELO, Worlds 우승팀, 계약 만료 현황을 표시
- 시즌 종료 시 계약 연차를 1 감소시키고 0년 선수는 재계약 브리지에 표시
- 재계약 브리지는 최종 스토브리그가 아니라, 향후 고도화 전까지 다음 시즌 전환을 가능하게 하는 임시 연결부
- 다음 시즌 시작 시 선수 나이 +1, 피로 0, 사기 중립, 컨디션 회복, 폼 중간값 보정
- 팀 승패는 0승 0패로 리셋하고 ELO는 유지
- 다음 시즌은 새 시즌 LCK Cup 활성화 상태로 진입

다음 구현 필요:

- 고도화 스토브리그: FA 시장, 방출/영입, 재계약 협상, AI 팀 이적 시장
- LCQ placeholder 2장의 실제 출처 결정

## 11. 시즌 캘린더 UI

- 로드맵 보기
- 달력 보기
- 로드맵은 국내전/국제전을 위아래 트랙으로 분리
- 달력은 실제 JS `Date` 계산으로 요일 반영
- 달력에는 우리 팀 경기만 표시
- 다른 팀 경기는 대회 현황의 일정/결과에서 확인
- 대회 카드 클릭 시 `/competitions/:id`로 이동

## 12. 진출권 메모

현재 코드에서는 LCK Rounds 1-2 포스트시즌 우승팀/준우승팀을 `qualifiedTeamIds` 후보로 저장

주의:

- 실제 시즌 흐름상 First Stand 대표는 LCK Cup 결과와 연결하는 편이 자연스러움
- LCK Rounds 1-2 결과는 MSI 대표 산정에 쓰는 편이 자연스러움
- MSI 엔진은 First Stand 우승 리그가 CBLOL이면 준우승 리그 2시드에게 직행권을 넘김
- MSI에서 상위 성적을 기록한 2개 리그는 Worlds 추가 시드 1장을 받을 수 있음
- 리그 성적 판정은 MSI에 진출한 같은 리그 팀 중 더 높은 성적을 기록한 1팀만 기준으로 함
- LCK 대표 중 최고 성적 팀이 MSI 상위 2개 리그 조건을 만족하면 LCK 4위도 Worlds 진출 가능
- 따라서 LCK Season Play-In/Playoffs는 기본 Worlds 진출권 1~3위뿐 아니라 조건부 4시드 후보인 최종 4위까지 저장해야 함
