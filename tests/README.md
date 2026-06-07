# 테스트 구조

프로젝트 테스트는 4단계로 분리

## 1. Unit

위치:

```text
tests/unit
```

검증 대상:

- 순수 도메인 함수
- 로스터 검증
- 계약 계산
- 경기 시뮬레이션
- 시리즈 시뮬레이션
- 순위표 계산
- 시즌 일정 생성

## 2. Integration

위치:

```text
tests/integration
```

검증 대상:

- 기능 컴포넌트
- props와 callback
- 화면 상태 변화
- 대회 대시보드 렌더링
- 전략/훈련 선택

## 3. System

위치:

```text
tests/system
```

검증 대상:

- 브라우저 기반 전체 앱 흐름
- 커리어 생성
- 로스터 확정
- URL 이동
- 진행/플레이 흐름

## 4. Acceptance

위치:

```text
tests/acceptance
```

검증 대상:

- 사용자 가치 기준 시나리오
- 요구사항이 실제 화면에서 충족되는지
- 로스터 구성이나 경기 진행 같은 핵심 경험

## 5. 실행 명령

```bash
npm test
npm run test:system
npm run test:acceptance
```

빌드 검증:

```bash
npm run build
```

## 6. 규칙

- 경기 시뮬레이션은 seeded random 사용
- UI 변경은 가능하면 16:9 스크린샷으로 확인
- 도메인 로직이 바뀌면 unit 테스트 우선
- 사용자 흐름이 바뀌면 system 또는 acceptance 테스트 갱신
