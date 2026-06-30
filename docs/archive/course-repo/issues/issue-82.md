# #82 [UX] 설정 메뉴 UI 정리 및 개발자 모드 숨김 처리

- State: `CLOSED`
- Author: motoo42
- Created: 2026-06-14T17:14:28Z
- Closed: 2026-06-14T18:14:34Z
- Labels: `enhancement` `important` 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/82

## Body

## 개요
설정 메뉴 UI를 더 깔끔하게 정리하고, 일반 유저가 개발자 모드를 쉽게 켤 수 없도록 숨김 처리를 추가한다.

## 주요 요구사항
- 설정 메뉴 섹션 구조 재정리: 일반 설정, 가이드, 메시지/AI, 고급 설정 등
- 개발자 모드는 기본적으로 숨김 처리
- 특정 제스처, URL 플래그, 환경 변수 등으로만 개발자 모드 진입 가능하게 검토
- 일반 유저에게 노출되어 혼란을 주는 테스트/디버그 옵션 최소화

## 완료 기준
- [ ] 설정 화면 섹션 구조 정리
- [ ] 개발자 모드 기본 비노출
- [ ] 개발자 모드 진입 방법 문서화 또는 코드 주석 정리
- [ ] 기존 설정 저장/불러오기 동작 유지

## Comments (0)
