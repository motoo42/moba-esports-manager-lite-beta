# 커스텀 테마와 에셋 전략

## 1. 기본 원칙

개인 프라이빗 프로젝트에서는 실제 LoL/LCK 팀명, 선수명, 대회명을 사용할 수 있음

공개 저장소에는 실제 팀 로고, 선수 사진, Riot Games 에셋 파일을 직접 포함하지 않는 방향 권장

이미지가 필요하면 사용자가 개인 환경에서 준비한 URL을 적용하는 커스텀 테마 방식으로 확장

## 2. 기능 목표

후순위 기능으로 다음을 지원 가능

- 팀명 표시 변경
- 팀 로고 URL 적용
- 선수 이미지 URL 적용
- 팀 색상 적용
- 기본 테마로 복구
- 테마 미리보기

## 3. 입력 방식 후보

- JSON 붙여넣기
- JSON 파일 업로드
- 이미지 파일 업로드는 후순위
- 이미지 URL 우선

## 4. 검증 규칙

- JSON 파싱 실패 시 적용하지 않음
- 필수 필드 누락 시 오류 표시
- `logoUrl`, `photoUrl`은 문자열만 허용
- 외부 URL 로딩 실패 시 fallback 표시
- 테마 적용 전 미리보기 제공
- 기본 테마로 되돌리기 제공

## 5. 예시 스키마

```json
{
  "themeName": "Custom Demo Theme",
  "teams": [
    {
      "id": "t1",
      "displayName": "T1",
      "logoUrl": "https://example.com/t1-logo.png",
      "primaryColor": "#e4002b",
      "secondaryColor": "#111111"
    }
  ],
  "players": [
    {
      "id": "faker",
      "displayName": "Faker",
      "photoUrl": "https://example.com/faker.png",
      "role": "mid"
    }
  ]
}
```

## 6. 저장 전략

1차:

- 테마 JSON을 브라우저 로컬 또는 MongoDB 커리어 설정에 저장
- 이미지 파일 자체는 저장하지 않음

후순위:

- 사용자별 테마 저장
- 여러 테마 프리셋
- 팀별 카드 디자인

## 7. 안내 문구 후보

```text
이 프로젝트는 개인용 League of Legends e스포츠 매니저 게임입니다.
기본 버전은 LoL Esports, LCK, MSI, Worlds 등 실제 명칭을 사용합니다.
커스텀 테마 기능은 사용자가 직접 준비한 로컬 데이터와 이미지 URL을 적용하기 위한 기능입니다.
```

## 8. 현재 우선순위

커스텀 테마는 1시즌 MVP 이후 후순위

먼저 완성할 것:

- 시즌 진행
- 국제전 진행
- 저장/불러오기
- 시즌 종료와 다음 시즌
- 밸런싱
