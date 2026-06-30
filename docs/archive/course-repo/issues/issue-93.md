# #93 [라이브 매치 연출] 아이템 스파이크 기반 교전 페이스 편향

- State: `OPEN`
- Author: motoo42
- Created: 2026-06-16T11:53:40Z
- Closed: <no value>
- Labels: `enhancement` `todo` 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/93

## Body

﻿## 배경
라이브 매치 연출 편향 v1에서는 능력치와 라인 우열 축은 반영했지만, 코어템 완성 시점에 따라 교전 흐름이 기울어지는 아이템 스파이크 축은 보류되어 있습니다.

## 목표
캐리가 코어템을 완성하는 시점 근처에서 한타와 교전 클러스터를 그 팀 쪽으로 편향해, #86 아이템 시스템과 #87 연출 편향 사이를 자연스럽게 연결합니다.

## 범위
- 코어템 완성 시점 탐지
- 스파이크 부근 교전 클러스터링
- 근처 한타를 해당 팀으로 편향
- 기존 결과 / 승자 / `블루킬 = 레드데스` 불변식 유지

## 관련 파일
- `src/domain/live-match/matchTimeline.ts`
- `src/domain/live-match/liveItemBuilds.ts`
- `src/domain/live-match/matchAbilityBias.ts`

## 완료 기준
- 코어템 완성 시점이 교전 페이스에 반영된다
- 기존 승패와 핵심 불변식은 유지된다
- 회귀 테스트가 추가된다

## 비고
자잘한 UI 폴리시보다는 우선순위를 따로 잡아 관리합니다.


## Comments (0)
