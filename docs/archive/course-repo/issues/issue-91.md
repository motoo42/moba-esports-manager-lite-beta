# #91 [기세 그래프] 툴팁·보간 폴리시

- State: `OPEN`
- Author: motoo42
- Created: 2026-06-16T11:53:36Z
- Closed: <no value>
- Labels: `enhancement` `todo` 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/91

## Body

﻿## 배경
기세 그래프 v1은 곡선과 주요 사건 마커까지는 갖췄지만, 마커 해석성과 시점 이동 시의 움직임은 더 다듬을 여지가 남아 있습니다.

## 목표
#87의 그래프 레이어를 폴리시합니다. 마커 hover 툴팁과 곡선/헤드 dot 보간을 함께 다뤄 읽기 쉬운 그래프로 정리합니다.

## 범위
- 마커 hover 툴팁 UI
- 시간 / 사건 / 팀 정보 표시
- 오브젝트 strip 툴팁과 시각 톤 통일
- 곡선 시점 변화 보간 개선
- 헤드 dot 이동 보간 개선
- seek 시점 전환의 부드러움 보강

## 관련 파일
- `src/features/live-match/components/LiveMomentumGraph.tsx`
- `src/shared/styles/global.css`

## 완료 기준
- 마커 hover 시 상세 툴팁이 나타난다
- 기존 오브젝트 툴팁과 시각 톤이 어긋나지 않는다
- 재생 중 곡선과 헤드 dot의 움직임이 더 매끄럽다
- 시점 이동 시 튐 현상이 줄어든다


## Comments (0)
