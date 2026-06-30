# 토큰 감사 결과 — `src/shared/styles/global.css`

> 감사일 기준 파일: `src/shared/styles/global.css` (13,393줄, `src/main.tsx`에서 1회 import).
> CSS 파일은 이 하나뿐이며, 모든 화면은 `className` → global.css 방식. 인라인 `style={{}}`는 4개 파일의 동적 값뿐.

## 1. 요약

- **토큰 체계의 뼈대는 올바르게 설계돼 있음.** 하지만 색 값의 약 78%가 토큰을 우회한 하드코딩이고, 라이트 테마가 626개의 개별 클래스 땜빵으로 버티고 있음.
- 방법 1(토큰값 교체로 일괄 리스킨)이 제대로 작동하려면 **토큰화 패스가 선행**돼야 함.

## 2. 수치

| 지표 | 값 |
|---|---|
| 총 줄 수 | 13,393 |
| 고유 토큰(커스텀 프로퍼티) 수 | **83** (정의 148건 = 다크+라이트) |
| `var(--..)` 참조 | 416회 |
| 하드코딩 hex (토큰 정의부 1~150줄 제외) | **907개** |
| `rgb()/rgba()` 직접 사용 | 429회 |
| 라이트 테마 개별 클래스 땜빵 셀렉터 | **626개** (148줄 ~ 11,511줄) |

→ 색 값 비율: 토큰 참조 416 vs 하드코딩(hex 907 + rgba 429) ≈ **22% : 78%**.

## 3. 토큰 카테고리 (이미 존재)

`:root`(다크 기본) / `:root[data-theme="light"]`에서 동일 토큰을 재정의하는 방식.

- 텍스트: `--text`, `--muted`, `--accent`
- 배경/표면: `--color-body-bg`, `--color-root-bg`, `--color-stage-bg`, `--color-frame-bg`, `--color-shell-bg`, `--color-sidebar-bg`, `--color-card-bg`, `--color-control-bg`, `--color-input-bg`, `--surface-base/raised/overlay/sunken`
- 메뉴/서브메뉴: `--color-menu-button-*`, `--color-menu-icon-*`, `--color-submenu-*`
- 컴포넌트: `--color-topbar-bg`, `--color-pill-*`, `--color-button-*`, `--color-primary-button-*`, `--color-ghost-button-*`, `--color-settings-chip-*`, `--color-scrollbar-*`
- 보더: `--color-border`, `--color-border-subtle`, `--color-border-strong`
- 라운드: `--radius-sm/md/lg/pill`
- 그림자: `--shadow-card`, `--shadow-stage`
- 상태: `--status-{success,danger,info,warning,neutral}-{bg,border,text}`

## 4. 핵심 문제: "토큰이 있는데 그 값을 하드코딩"

가장 많이 반복된 하드코딩 색의 상당수가 **기존 토큰값의 복붙** → 기계적 치환 가능.

| 하드코딩 hex | 출현 | 매칭되는 기존 토큰 |
|---|---|---|
| `#ffffff` | 106 | `--color-primary-button-text` (일부는 그대로 둬도 됨) |
| `#9aa7bd` | 86 | `--muted` |
| `#0d1424` | 81 | `--surface-sunken` (= `--color-menu-icon-bg`) |
| `#253048` | 67 | **토큰 없음 → 신규 후보** |
| `#111827` | 52 | `--color-button-bg` |
| `#303a52` | 50 | `--color-pill-border` |
| `#cfd7e6` | 29 | `--color-menu-button-text` (= `--color-pill-text`) |
| `#9f5cff` | 29 | **토큰 없음 → 신규 후보** (accent 계열) |
| `#f8fafc` | 18 | (밝은 텍스트 계열) |
| `#cbd5e1` | 18 | `--status-neutral-text` 근처 |
| `#475569` | 14 | `--color-scrollbar-thumb` |
| `#2a3245` | 14 | `--color-border` |
| `#171436` | 13 | **토큰 없음 → 신규 후보** (딥 퍼플) |
| `#93c5fd` | 12 | (info 계열) |
| `#e8edf6` | 11 | `--text` |

## 5. 626개 라이트 땜빵의 정체

컴포넌트가 다크 hex를 직접 박아서 라이트 모드에 빈틈이 생김 → `:root[data-theme="light"] .xxx { ... }` 형태로 클래스마다 손으로 밝게 덮어씀(626회). 베이스를 토큰으로 바꾸면 라이트는 토큰 재정의로 자동 상속되므로, **이 땜빵 대부분을 삭제 가능** → CSS 수천 줄 축소 + 라이트모드 버그 해소.

## 6. 결론 (방법 1 관점)

- 좋음: 토큰 카테고리·테마 메커니즘이 이미 올바름 → 새 규약을 토큰값으로 정의하면 var() 쓰는 416곳은 즉시 반영.
- 선행 필요: **토큰화 패스**(하드코딩 → 토큰 치환, 신규 토큰 도입, 라이트 땜빵 정리). 색은 안 바꾸고 배선만 정리하는 작업.
- 제외: `live-match/*`(다크 전용), 토큰 가드레일 테스트는 개선 방향.
