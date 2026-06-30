# #88 [라이브 매치 아이템] 빌드·컴포넌트·구매 페이스 정교화

- State: `OPEN`
- Author: motoo42
- Created: 2026-06-16T11:53:29Z
- Closed: <no value>
- Labels: `enhancement` `todo` 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/88

## Body

﻿## 배경
현재 라이브 매치 아이템 시스템 v1은 시간에 따라 아이템 슬롯이 채워지는 기반은 갖췄지만, 아직 role 기준 빌드와 완성 아이템 중심 표시 단계에 머물러 있습니다.

## 목표
#86의 후속으로 아이템 연출을 한 단계 더 정교화합니다. 챔피언별 빌드, 컴포넌트 구매, 골드 효율계수 기반 페이스 조정을 하나의 흐름으로 묶어 관리합니다.

## 범위
- 챔피언 id별 구매순서 빌드 큐레이션
- 미정의 챔피언 role 빌드 폴백 유지
- DDragon `from` / `into` 기반 컴포넌트 단계 표시
- `getOwnedItemIdsAt`의 골드 효율계수 적용
- 종료 시 최종 빌드 완성 보장 유지

## 관련 파일
- `src/domain/live-match/liveItemBuilds.ts`
- `src/domain/champions/`
- `src/domain/items/`
- `src/domain/items/itemPool.ts`
- `scripts/generate-item-gold.mjs`

## 완료 기준
- 주요 챔피언별 빌드가 큐레이션되어 있다
- 미정의 챔피언은 role 빌드로 자연스럽게 폴백한다
- 시점별로 컴포넌트에서 완성 아이템으로 전이된다
- 골드 효율계수 반영 후 아이템 구매 페이스가 더 자연스럽다
- 단위 테스트가 추가된다

## 주의
DDragon 데이터는 이 도구환경에서 직접 네트워크 다운로드하지 않고, 기존 생성기 방식처럼 사용자 브라우저 다운로드를 전제로 유지합니다.


## Comments (0)
