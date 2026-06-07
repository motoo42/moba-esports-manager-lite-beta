# 데이터 모델과 저장 전략

## 1. 현재 구현 상태

1차 저장 구현은 다음 구조로 진행했다.

```text
React/Vite client
-> Express API server
-> MongoDB Atlas
-> careerSaves collection
```

프론트엔드의 `CareerSave` 전체를 `careerSaves` 문서 하나에 저장하는 단순형 구조다. 구현 속도가 빠르고 현재 reducer 상태와 잘 맞기 때문에 MVP에는 이 방식이 가장 적합하다.

현재 로컬 환경 변수 기준:

- 실제 연결 문자열은 Git에 커밋하지 않는 `.env.local`에만 저장
- repo에는 `.env.example`만 두고 placeholder 값을 사용
- 서버 코드에서 사용할 변수 이름은 `MONGODB_URI`, `MONGODB_DB_NAME`, `PORT`
- 프론트엔드가 호출할 API 기준 URL은 `VITE_API_BASE_URL`
- MongoDB URI는 브라우저/Vite 클라이언트 코드에 직접 노출하지 않음
- Atlas Project: `moba-esports-manager-lite`
- Atlas Cluster: `moba-manager-dev`
- 앱용 Database User: `moba_app_dev`
- 앱용 Database: `moba_esports_manager`
- MVP Collection: `careerSaves`

현재 Windows/Node 환경에서는 SRV URI가 Node 드라이버에서 `querySrv ECONNREFUSED`로 실패했다. PowerShell DNS 조회와 TCP 연결은 성공했으므로 `.env.local`에는 SRV URI 대신 Atlas shard host 3개와 replicaSet/authSource를 명시한 non-SRV URI를 사용한다. 이 값은 secret이므로 문서와 Git 추적 파일에는 남기지 않는다.

## 2. 현재 핵심 타입

주요 타입 위치:

```text
src/types/game.ts
```

핵심 타입:

- `CareerSave`
- `SeasonState`
- `CompetitionState`
- `Competition`
- `MatchSchedule`
- `MatchRecord`
- `Player`
- `Team`
- `PlayerContract`
- `WeeklyPlan`

현재 `CompetitionId`:

```ts
type CompetitionId =
  | "lck-cup"
  | "first-stand"
  | "lck-rounds-1-2"
  | "msi"
  | "lck-rounds-3-5"
  | "lck-rounds-3-4"
  | "worlds"
  | "asian-games";
```

## 3. 저장 대상

MVP 저장 최소 단위:

- 커리어 기본 정보
- 현재 날짜
- 현재 시즌 번호
- 현재 대회
- 유저 팀
- 로스터
- 계약
- 선수 상태
- 주간 계획
- 대회별 상태
- 일정
- 경기 기록
- 시즌 히스토리

## 4. 현재 컬렉션

```text
careerSaves
```

`CareerSave` 전체를 하나의 문서로 저장한다.

장점:

- 구현이 빠름
- 현재 프론트엔드 상태 구조와 잘 맞음
- 불러오기 간단
- 저장 목록은 `summary`와 메타데이터만 projection해서 가볍게 조회 가능

단점:

- 일부 데이터만 조회/갱신하기 어려움
- 장기 시즌 데이터가 커지면 문서 크기 관리 필요
- 여러 사용자가 같은 세계관을 동시에 조작하는 구조는 별도 동기화 정책 필요

이후 필요해지면 `matchRecords`, `players`, `seasonSummaries`, `worldParticipants`를 분리한다.

## 5. 현재 문서 구조

서버 타입 위치:

```text
server/careerSaves.ts
```

현재 문서 형태:

```ts
type CareerSaveDocument = {
  _id?: ObjectId;
  schemaVersion: number;
  mode: "single-player" | "league-multiplayer";
  ownerId: string;
  worldId: string;
  saveName: string;
  participants: Array<{
    ownerId: string;
    teamId: string;
    role: "commissioner" | "manager";
  }>;
  revision: number;
  createdAt: string;
  updatedAt: string;
  summary: {
    teamName: string;
    seasonNumber: number;
    currentDateLabel: string;
    currentCompetitionId: CompetitionId | null;
    currentCompetitionName?: string;
  };
  career: CareerSave;
};
```

인덱스:

- `{ ownerId: 1, updatedAt: -1 }`
- `{ worldId: 1 }`
- `{ ownerId: 1, saveName: 1 }`

`mode`, `worldId`, `participants`, `ownerId`, `revision`은 장기적으로 같은 세계관을 최대 10명이 공유하는 모드를 염두에 둔 메타데이터다. 지금은 `single-player`와 `local-dev` 기준으로만 사용한다.

## 6. 저장 시점

현재 구현:

- 커리어 생성 화면에서 저장 목록 조회
- 상단바에서 수동 저장
- 상단바에서 새 저장 슬롯 생성
- 저장 목록에서 선택한 커리어 불러오기
- 커리어 생성 직후 첫 자동 저장 슬롯 생성
- 활성 저장 슬롯이 있으면 주요 체크포인트에서 자동 업데이트
- 자동 저장 상태를 상단바에 표시: `자동 저장 중`, `자동 저장 완료`, `자동 저장 실패`, `저장 서버 대기`, `저장 충돌`
- 자동 저장 실패는 게임 진행을 막지 않음

현재 자동 저장 체크포인트:

- 커리어 생성 직후 자동 저장
- 로스터 확정 후 자동 저장
- 날짜 진행 후 자동 저장
- 경기 종료 후 자동 저장
- 대회 완료 후 자동 저장

이번 범위에서 의도적으로 제외한 자동 저장:

- 전략/훈련 강도 변경 즉시 저장
- 선발 라인업 변경 즉시 저장
- 로그인 사용자별 저장
- 시즌 종료 후 자동 저장

## 7. revision 충돌 정책

수동 저장과 자동 저장 업데이트는 `expectedRevision`을 함께 보낸다.

흐름:

```text
client active save revision
-> PUT /api/saves/:saveId expectedRevision
-> server compares existing revision
-> same revision: update and revision +1
-> different revision: 409 Save revision conflict
```

현재 충돌 처리는 병합하지 않는다. 충돌이 발생하면 상단바나 저장 패널에 `저장 충돌: 새로고침 필요`를 표시하고, 사용자가 새로고침/불러오기로 최신 저장 상태를 다시 가져오는 방식이다.

## 8. 불러오기 흐름

```text
앱 시작
-> 저장된 커리어 목록 조회
-> 커리어 선택
-> CareerSave 복원
-> reducer load-career action 실행
-> /hub로 이동
```

현재는 불러오기 후 `/hub`로 복구한다. 나중에 마지막 화면까지 복구하려면 저장 문서에 `lastRoute` 또는 UI preference 메타데이터를 추가한다.

불러오기 직후에는 같은 상태를 다시 덮어쓰지 않도록 다음 자동 저장 1회를 건너뛴다.

## 9. 버전 관리

저장 데이터에는 `schemaVersion` 필드가 있다.

이유:

- 타입이 자주 바뀌는 개발 단계
- 오래된 저장 파일 복구 필요
- MongoDB 연결 후 마이그레이션 가능성

마이그레이션 정책은 아직 미구현이다. 저장 구조가 2~3번 더 변한 뒤 `schemaVersion`별 복구 함수를 추가하는 편이 좋다.

## 10. 주의사항

- 실제 이미지 파일은 DB에 저장하지 않음
- 팀 로고와 선수 사진은 URL만 저장
- `.env`와 `.env.local`은 절대 Git에 커밋하지 않음
- 공개 저장소에 MongoDB 연결 문자열을 남기지 않음
- 샘플 데이터와 실제 저장 데이터의 책임을 분리
- Atlas 연결은 DNS/TCP 도달 여부와 인증 성공 여부를 구분해서 확인
- Atlas 콘솔에서 IP Access List와 Database User 권한을 확인한 뒤 서버 연결 테스트를 진행
- 새 Atlas 프로젝트 기준 URI로 `.env.local`을 교체한 뒤에는 이전 실습 프로젝트 URI를 사용하지 않음
- 프론트엔드에는 MongoDB URI를 절대 전달하지 않음

## 11. 배포 전 MongoDB 리마인더

배포 시점에는 Atlas를 다시 확인해야 한다.

- 개발용 Atlas 프로젝트/DB와 운영용 Atlas 프로젝트/DB를 분리
- 운영용 Database User를 새로 만들고 필요한 권한만 부여
- 개발 중 노출된 적 있는 비밀번호는 운영 전에 교체
- Atlas IP Access List를 운영 배포 환경 기준으로 재설정
- API 서버 CORS 허용 도메인을 운영 URL 기준으로 재설정
- `ownerId=local-dev`를 실제 로그인 사용자 ID로 교체
- 사용자별 저장, 세계관별 저장, 멀티유저 권한 모델 확정
- 무료 요금제 저장 용량과 커넥션 사용량을 모니터링
