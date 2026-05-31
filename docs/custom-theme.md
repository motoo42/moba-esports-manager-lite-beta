# LoL 커스텀 테마/스킨 가져오기

## 1. 기본 원칙

개인 프라이빗 프로젝트에서는 실제 LoL/LCK 팀명, 로고 URL, 선수 이미지 URL을 사용할 수 있게 합니다.

사용자가 개인 로컬 환경에서 직접 준비한 JSON과 이미지 URL을 가져와 팀명, 로고, 선수 이미지, 색상 테마를 바꿀 수 있게 합니다. 공개 배포를 하게 되면 실제 에셋 포함 여부는 별도로 재검토합니다.

## 2. 기능 목표

- 기본 게임은 실제 LoL/LCK 명칭 기반 데이터로 동작합니다.
- 사용자는 개인 환경에서 커스텀 테마를 불러와 실제 팀 분위기를 더 강하게 반영할 수 있습니다.
- 앱은 이미지 파일 자체보다 URL과 테마 형식을 우선 사용합니다.

## 3. 입력 방식

- JSON 붙여넣기.
- JSON 파일 업로드.
- 이미지 자체 업로드보다는 이미지 URL을 우선 사용.

## 4. 검증 규칙

- JSON 파싱 실패 시 적용하지 않습니다.
- 필수 필드가 없으면 오류 메시지를 표시합니다.
- `logoUrl`, `photoUrl`은 문자열로만 받습니다.
- 테마 적용 전 미리보기를 제공합니다.
- 기본 테마로 되돌리는 버튼을 제공합니다.

## 5. 예시 더미 테마

```json
{
  "themeName": "Custom Demo Theme",
  "teams": [
    {
      "id": "team-aurora",
      "displayName": "Custom Team",
      "logoUrl": "https://example.com/logo.png",
      "primaryColor": "#6d5dfc",
      "secondaryColor": "#101828"
    }
  ],
  "players": [
    {
      "id": "player-mid-01",
      "displayName": "Custom Mid",
      "photoUrl": "https://example.com/player.png",
      "role": "mid"
    }
  ]
}
```

## 6. 개인용 사용 규칙

- 제품 UI에서 "League of Legends", "LoL", "LCK", 실제 팀명, 실제 선수명, 챔피언명, Riot Games 명칭을 사용할 수 있습니다.
- 실제 팀 로고와 선수 사진은 우선 URL 기반으로만 다룹니다.
- 커스텀 테마 데이터는 가능하면 localStorage에만 저장하고 외부 서버로 업로드하지 않습니다.
- 공개 배포나 저장소 공개를 하게 되면 실제 에셋 포함 여부와 고지 문구를 다시 검토합니다.

권장 안내 문구:

```text
이 프로젝트는 개인용 League of Legends e스포츠 매니저 게임입니다.
기본 버전은 LoL Esports, LCK, MSI, Worlds 등 실제 명칭을 사용합니다.
커스텀 테마 기능은 사용자가 직접 준비한 로컬 데이터와 이미지 URL을 적용하기 위한 기능입니다.
```
