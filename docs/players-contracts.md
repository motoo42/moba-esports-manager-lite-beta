# 선수, 스탯, 계약, 장기 커리어

## 1. 선수 스탯 시스템

선수는 현재 능력, 성장 가능성, 경기 상태, 성향 데이터를 함께 가짐

모든 주요 점수는 0~100 스케일로 통일

핵심 점수:

- `ability`: 현재 실력
- `potential`: 장기 성장 가능성
- `overall`: 카드에 표시되는 대표 점수

세부 스탯:

- `mechanics`: 피지컬/메카닉
- `macro`: 운영 이해도
- `laning`: 라인전
- `teamfight`: 한타
- `mental`: 멘탈
- `championPool`: 챔피언 폭

상태값:

- `form`: 폼
- `fatigue`: 피로도
- `morale`: 사기

확장 후보:

- `condition`: 컨디션
- `injuryRisk`: 부상 위험
- `pressureResistance`: 압박감 저항
- `clutch`: 큰 경기 강한 정도
- `consistency`: 경기력 일관성
- `tiltControl`: 멘탈 흔들림 제어
- `leadership`: 리더십
- `teamwork`: 팀워크
- `communication`: 커뮤니케이션
- `affinity`: 친화력
- `professionalism`: 프로 의식
- `ambition`: 야망
- `metaAdaptability`: 메타 적응력
- `patchAdaptability`: 패치 적응력
- `roleFlexibility`: 포지션 유연성
- `championLearning`: 챔피언 습득력
- `internationalAdaptability`: 국제전 적응력

## 2. 현재 상태값 규칙

폼:

- 0~100 숫자
- 경기 결과와 훈련 강도에 따라 변화
- 경기력 계산에 보정값으로 반영

피로도:

- 0~100 숫자
- 낮을수록 좋고 높을수록 나쁨
- 경기 출전과 훈련 강도에 따라 증가/감소

사기:

- 숫자 대신 5단계 이산 상태
- `최상`, `중상`, `중`, `중하`, `최하`
- UI는 원형 배지와 흰색 화살표로 표시
- 12시 방향이 최상, 6시 방향이 최하

## 3. 계약

현재 계약 타입:

- 1년
- 2년
- 1+1년 옵션

규칙:

- 복잡한 바이아웃, 임대, 트레이드는 MVP에서 제외
- 계약은 시즌 종료 시 남은 연차 감소
- 계약 만료 선수는 재계약 또는 방출 후보
- 현실 계약보다 단순하지만 게임성을 위해 이 세 가지 타입을 우선 유지

## 4. 로스터 규모와 1군/2군

- 팀당 1군+2군 10~15명
- 실제 경기 선발은 5명
- 포지션은 TOP, JGL, MID, BOT, SUP
- 현재는 같은 포지션 선수끼리만 교체 가능
- 1군과 2군 이동은 자유롭게 허용하는 방향
- 2군 선수 콜업 시 사기 상승 같은 기믹을 확장 가능

현재 코드 개념:

- `roster`: 선발 5인 슬롯
- `mainRosterPlayerIds`: 1군 등록 선수
- `academyRosterPlayerIds`: 2군 등록 선수
- `contracts`: 계약 목록

## 5. 훈련

현재 훈련 강도:

- `고강도 훈련`
- `일반 훈련`
- `가벼운 훈련`
- `휴식`

현재 반영:

- 경기력 보정
- 폼 변화
- 피로도 변화
- 선수 상태 변화 테스트

후순위 확장:

- 메카닉 집중
- 운영 집중
- 라인전 집중
- 한타 집중
- 멘탈 집중
- 유망주 성장 보너스
- 부상 위험

## 6. 장기 커리어

최종 목표는 최대 20시즌 플레이 가능한 커리어 모드

장기 커리어 후보:

- 선수 나이 증가
- 은퇴
- 군 입대/복귀
- 유망주 생성
- 계약 만료와 재계약
- 팀 ELO 변화
- 시즌별 기록 저장
- 선수 커리어 기록 저장

## 7. 장기 데이터 설계 메모

MongoDB 연결을 고려해 선수 데이터는 지나치게 평평한 구조보다 의미 단위로 묶는 편이 좋음

후보 구조:

```ts
type Player = {
  id: string;
  nickname: string;
  role: Role;
  stats: PlayerStats;
  status: PlayerStatus;
  mindset: PlayerMindset;
  adaptability: PlayerAdaptability;
  chemistryProfile: PlayerChemistryProfile;
  development: PlayerDevelopment;
  marketProfile: PlayerMarketProfile;
};
```

현재는 프론트엔드 정적 데이터와 로컬 상태를 먼저 안정화하고, 저장 구조 설계 후 MongoDB 연결
