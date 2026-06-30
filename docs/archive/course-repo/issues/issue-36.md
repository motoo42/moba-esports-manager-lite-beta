# #36 전역 스크롤바 디자인 개선

- State: `CLOSED`
- Author: motoo42
- Created: 2026-06-09T20:12:08Z
- Closed: 2026-06-10T14:20:49Z
- Labels: `enhancement` `todo` 
- Original: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/36

## Body

﻿## Summary

앱 전체에서 보이는 기본 브라우저 스크롤바 디자인을 더 게임 UI에 어울리는 스타일로 개선한다.

현재 위아래 스크롤 시 오른쪽에 뜨는 기본 스크롤바가 전체 UI 톤과 어울리지 않고, 화면의 완성도를 떨어뜨린다.

## Requirements

- 전역 스크롤바 스타일을 개선한다.
- 메인 앱 프레임, 패널, 리스트, 모달 등 스크롤이 발생하는 영역에서 과하게 튀지 않는 디자인을 적용한다.
- 너무 두껍거나 밝은 기본 스크롤바 대신, 현재 어두운 UI 톤에 맞는 얇고 정돈된 스크롤바로 만든다.
- hover 상태에서는 사용자가 스크롤 가능한 영역임을 알아볼 수 있게 약간 더 명확하게 표시한다.
- Windows/Chrome 기준으로 먼저 적용하되, Firefox 호환 속성도 가능하면 함께 둔다.
- 스크롤바 때문에 레이아웃이 밀리거나 카드/텍스트가 잘리지 않게 한다.

## Suggested Direction

- `scrollbar-width`, `scrollbar-color`를 Firefox용으로 적용한다.
- `::-webkit-scrollbar`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-track`를 Chrome/Edge용으로 적용한다.
- thumb는 어두운 회색 또는 LCK UI 톤에 맞는 절제된 색상으로 둔다.
- radius는 과하게 둥글지 않게 6px 이하로 맞춘다.
- 앱 전체 전역 스타일과 주요 scrollable panel 스타일을 함께 점검한다.

## Acceptance Criteria

- [ ] 기본 브라우저 스크롤바보다 앱 톤에 어울리는 스크롤바가 표시된다.
- [ ] 주요 화면에서 스크롤바가 레이아웃을 밀거나 UI를 가리지 않는다.
- [ ] 모달/패널/리스트 스크롤 영역에서도 일관된 스타일이 적용된다.
- [ ] Chrome/Edge에서 정상 표시된다.
- [ ] 가능하면 Firefox에서도 최소한의 스타일이 적용된다.


## Comments (0)
