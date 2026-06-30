# 디자인 규약 (Design Conventions)

> 리디자인의 "계약". 모든 화면이 이 규약을 따르면, 토큰값만 바꿔 전 화면을 일괄 리스킨할 수 있다.
> ⚠️ 이 문서는 **시스템 규약**을 정의한다. 실제 색감/톤(디자인 방향)은 §6에서 **미정** — 추후 결정.

## 1. 단일 스타일 소스

- 모든 스타일은 `src/shared/styles/global.css` 한 파일 + 컴포넌트 `className`.
- 새 CSS 파일을 만들지 않는다(이 작업 범위에서는). 모듈 분리는 별도 결정.

## 2. 토큰 사용 계약 (가장 중요)

- **컴포넌트/규칙 안에서 색·간격·라운드·그림자를 하드코딩하지 않는다.** 반드시 `var(--token)`을 쓴다.
  - ❌ `color: #9aa7bd;` → ✅ `color: var(--muted);`
  - ❌ `background: #121929;` → ✅ `background: var(--surface-raised);`
- 토큰에 없는 값이 반복되면 **토큰을 새로 정의**한 뒤 참조한다(하드코딩 반복 금지).
- 토큰은 **의미(semantic) 기준**으로 쓴다. "이 색이 무엇인지"가 아니라 "어떤 역할인지"로 선택(예: 카드 배경 → `--surface-raised`, 보조 텍스트 → `--muted`).

## 3. 토큰 네이밍 규약

기존 체계를 유지·확장한다.

| 접두/그룹 | 용도 | 예 |
|---|---|---|
| `--text`, `--muted`, `--accent` | 핵심 전경색 | `--muted` |
| `--color-*` | 컴포넌트별 표면/보더/텍스트 | `--color-card-bg`, `--color-pill-border` |
| `--surface-{base,raised,overlay,sunken}` | 표면 깊이 단계 | `--surface-raised` |
| `--color-border{,-subtle,-strong}` | 보더 강도 | `--color-border-subtle` |
| `--radius-{sm,md,lg,pill}` | 모서리 | `--radius-md` |
| `--shadow-{card,stage}` | 그림자 | `--shadow-card` |
| `--status-{success,danger,info,warning,neutral}-{bg,border,text}` | 상태색 3종 세트 | `--status-danger-text` |

신규 토큰 후보(현재 하드코딩 다발): `#253048`(67회), `#9f5cff`(29회, accent 계열), `#171436`(13회, 딥 퍼플). → 의미 이름으로 승격 예정(예: `--surface-line`, `--accent-strong`, `--surface-deep` 등 — 이름은 토큰화 시 확정).

## 4. 테마 메커니즘

- 다크가 기본: `:root, :root[data-theme="dark"]`에서 토큰 정의.
- 라이트: `:root[data-theme="light"]`에서 **같은 토큰을 재정의**.
- 원칙: **라이트 테마는 토큰 재정의만으로 완성**한다. 컴포넌트가 토큰을 쓰면 `:root[data-theme="light"] .특정클래스 { ... }` 같은 개별 땜빵이 필요 없다.
  - 현재 626개의 개별 땜빵은 하드코딩의 부산물 → 토큰화하며 제거 목표.
- 테마 토글은 설정 화면(`gameActions.setThemeMode`)이 `data-theme` 속성을 바꾸는 방식. 이 배선은 유지.

## 5. 예외 / 가드레일

- **live-match (`src/features/live-match/*`)는 다크모드 전용 예외.** 토큰화/라이트 대응 대상에서 제외하고 별도 취급.
- **토큰 가드레일 테스트**(`DARK_SURFACE_HEXES` 카운트)는 회귀 금지. 토큰화는 하드코딩 다크 표면색을 줄이므로 가드레일에 유리한 방향.
- 인라인 `style={{}}`(LiveMomentumGraph·MoraleIndicator 등)는 동적 값이라 유지. 정적 색은 토큰으로.

## 6. 디자인 방향 (미정 — 추후 결정)

토큰화 패스가 끝나면 여기서 실제 값을 확정한다. 결정 항목:

- [ ] 전체 톤/무드 (레퍼런스)
- [ ] 다크/라이트 팔레트 (배경·표면·텍스트·보더)
- [ ] 액센트(브랜드) 컬러
- [ ] 라운드/그림자 스케일 (날카롭게 vs 부드럽게)
- [ ] 타이포 스케일·폰트
- [ ] 상태색 5종

> 이 항목들이 정해지면 §3 토큰값만 교체 → 전 화면 반영.
