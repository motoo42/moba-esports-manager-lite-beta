# LCK 2026 선수 커리어 및 이미지 데이터 수집 초안

생성일: 2026-06-13
이슈: https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42/issues/48
상태: 구현 기준 문서. 사용자 컨펌을 받은 범위부터 실제 게임 데이터에 반영한다.

## 문서 목적

이 문서는 48번 이슈를 실제 코드와 웹 데이터에 반영하기 위한 수집 기준과 반영 범위를 정리한 문서다.

이번 이슈의 핵심은 단순히 선수 사진 몇 장을 바꾸는 것이 아니라, 다음 데이터를 신뢰 가능한 형태로 다시 정리하는 것이다.

- 2026 시즌 개막 기준 LCK 로스터
- 선수별 실제 커리어와 주요 경력
- 팀별 역사, 팀명 변경, 국내/국제 우승 기록
- 선수 사진의 최신화
- 기존 AI 생성형 한 줄 소개/커리어 문구의 실제 데이터 기반 대체
- 데이터별 출처와 검증 상태 기록

실제 반영 후보 파일은 다음과 같다.

- `src/data/lck2026RosterSeeds.ts`
- `src/data/lck2026PlayerPortraits.ts`
- `src/data/lckTeams.ts`
- 추후 추가될 선수 커리어 데이터 파일
- 추후 추가될 팀 역사 데이터 파일

## 확정된 사용자 기준

아래 기준은 사용자가 확정한 요구사항이다. 이후 조사와 구현은 이 기준을 우선한다.

1. 로스터 기준은 `2026 시즌 개막 시점`이다.
2. Taeyoon/Diable의 시즌 중 팀 이동은 반영하지 않는다.
3. Taeyoon은 Nongshim RedForce 개막 로스터 기준으로 다룬다.
4. Diable은 BNK FEARX 개막 로스터 기준으로 다룬다.
5. Sharvel은 Dplus KIA 2군 선수로 유지한다.
6. Diable은 BNK FEARX 1군 주전 선수로 둔다.
7. Slayer는 BNK FEARX 2군 선수로 둔다.
8. 선수 사진은 1군 전원 신규 버전으로 교체한다. 이는 선택 과제가 아니라 필수 완료 조건이다.
9. FA 명단의 BeryL도 신규 사진으로 교체한다. 2025년 사진까지 허용한다.
10. 2군 선수 사진 교체는 추후 작업으로 넘긴다.
11. 팀 대표 이미지는 이번 범위에서 새로 가져오지 않는다.
12. 선수 커리어 수집 시 나무위키를 참고해도 된다.
13. 선수 커리어는 나무위키의 `소속` 항목을 우선 참고한다.
14. 팀 역사는 나무위키의 `팀명` 항목과 우승 기록 항목을 우선 참고한다.
15. 롤팬덤/Leaguepedia보다 나무위키가 더 올바른 데이터를 가지고 있을 수 있음을 항상 염두에 둔다.
16. T1과 Gen.G처럼 과거 이원화 팀 또는 이전 팀명 시절의 기록이 있는 경우, 현재 팀 역사에 포함하되 UI에는 간결하게 표시한다.
17. 선수 커리어 카드에는 하위 설명 문구를 넣지 않는다.
18. 팀을 옮긴 선수 커리어는 한 항목에 묶지 않고 팀별로 분리한다.
19. 팀 역사 탭에는 우승 기록만 주요 기록으로 표시하고 준우승 기록은 넣지 않는다.

## 출처 우선순위

### 선수 커리어

선수 커리어 수집 우선순위는 다음과 같다.

1. 나무위키 선수 문서의 `소속` 항목
2. 나무위키 선수 문서의 수상/우승/경력 관련 항목
3. 공식 팀 발표, LCK/Riot 공식 발표
4. Leaguepedia, Liquipedia
5. 신뢰 가능한 e스포츠 매체

커리어 데이터는 다음 기준으로 정리한다.

- 소속팀 변경 이력
- 주요 우승 기록
- 대표적인 커리어 포인트
- 팀 이동이 게임의 로스터 기준과 다른 경우, 실제 경력과 게임 기준 로스터를 분리해서 기록
- 커리어 카드에는 `LCK 주전 탑으로 성장` 같은 하위 설명 문구를 표시하지 않음
- 이적한 팀은 한 항목에 묶지 않고 별도 항목으로 분리

### 팀 역사

팀 역사 수집 우선순위는 다음과 같다.

1. 나무위키 팀 문서의 `팀명` 항목
2. 나무위키 팀 문서의 우승 기록/입상 기록 항목
3. 공식 팀 홈페이지 또는 공식 발표
4. LCK/Riot 공식 자료
5. Leaguepedia, Liquipedia
6. 신뢰 가능한 e스포츠 매체

팀 역사 데이터는 다음 기준으로 정리한다.

- 창단 또는 LCK 합류 시점
- 팀명 변경 연혁
- 주요 스폰서/네이밍 변경
- 국내 대회 우승 기록
- 국제 대회 우승 기록
- 상징적인 팀 정체성

### 선수 사진

선수 사진은 1군 전원과 FA BeryL을 신규 버전으로 교체해야 한다.

이미지 수집 우선순위는 다음과 같다.

1. LCK, Riot, LoL Esports 공식 프로필/미디어 자료
2. 팀 공식 홈페이지, 팀 공식 SNS, 팀 공식 미디어킷
3. 나무위키 또는 위키류 문서의 최신 이미지. 단, 원출처 확인 필요
4. Leaguepedia/Liquipedia 이미지. 단, 최신성/팀 유니폼/원출처 확인 필요

선수 이미지에는 반드시 다음 정보를 남긴다.

- 이미지 파일 경로
- 원본 출처 URL
- 원본 이미지 파일명 또는 게시물 식별자
- 접근일
- 최신성 검증 상태
- 라이선스/사용 가능 여부 메모

일반 이미지 검색 결과는 최종 근거로 사용하지 않는다.

## 로스터 기준

이번 데이터 작업의 로스터 기준은 `2026 시즌 개막 로스터`다.

따라서 시즌 중 트레이드, 콜업, 로스터 변경은 커리어 설명이나 참고 메모에는 남길 수 있지만, 기본 게임 로스터에는 반영하지 않는다.

### 주요 확정 사항

| 항목 | 확정 기준 |
| --- | --- |
| Taeyoon | Nongshim RedForce 개막 로스터 기준으로 유지 |
| Diable | BNK FEARX 개막 로스터 기준으로 유지 |
| Diable 역할 | BNK FEARX 1군 주전 BOT |
| Slayer | BNK FEARX 2군 BOT |
| Taeyoon/Diable 시즌 중 교환 | 기본 게임 로스터에는 반영하지 않음 |
| Sharvel | Dplus KIA 2군 선수로 유지 |
| 선수 사진 | 1군 전원과 FA BeryL 신규 버전으로 교체 |
| 팀 대표 이미지 | 이번 작업 범위에서 제외 |
| 선수 커리어 출처 | 나무위키 `소속` 항목 우선 |
| 팀 역사 출처 | 나무위키 `팀명` 및 우승 기록 항목 우선 |

### 현재 repo와의 충돌 정리

현재 repo 데이터에서 위 기준과 다를 수 있는 지점은 아래 기준으로 정리한다.

| 항목 | 현재 주의점 | 처리 방향 |
| --- | --- | --- |
| Diable | 현재 repo에서 Nongshim 쪽에 포함되어 있을 수 있음 | BNK FEARX 1군 주전 BOT으로 정리 |
| Taeyoon | Nongshim 유지가 사용자 확정 기준 | BNK FEARX 이동 반영 금지 |
| Slayer | 기존 repo에서 BNK FEARX 1군일 수 있음 | BNK FEARX 2군 BOT으로 정리 |
| Sharvel | 일부 자료에서 Dplus KIA 1군 출전/등록 흔적이 있음 | 게임 데이터에서는 2군 유지 |
| 팀명 스폰서 표기 | 개막 시점 명칭과 현재 코드 명칭이 다를 수 있음 | 게임 표시명은 현재 코드 기준을 유지하고, 역사 기록에서 과거 명칭을 간단히 병기 |

## 선수 사진 필수 교체 정책

현재 `src/data/lck2026PlayerPortraits.ts`의 초상화 메타데이터는 최신 시즌 자료로 보기 어렵다.

기존 감사 결과:

- 추적 중인 1군 초상화 항목: 61개
- 2026 시즌 후보로 볼 수 있는 원본 파일명: 1개
- 2024-2025 자료지만 현재 팀/시즌 확정이 부족한 항목: 5개
- 2014-2023 기반으로 명백히 오래된 항목: 54개
- 연도 확인이 어려운 항목: 1개

따라서 이번 이슈의 완료 조건은 다음과 같다.

- 모든 1군 선수 사진과 FA BeryL 사진을 신규 버전으로 교체한다.
- 가능하면 2026 시즌 개막 로스터 기준 팀 유니폼 또는 공식 프로필 이미지를 사용한다.
- 최신 사진이 없다는 이유로 기존 오래된 사진을 유지하지 않는다.
- 단, 공식 최신 사진을 찾지 못한 경우에도 반드시 `needs-review` 또는 `temporary-current-candidate` 상태를 남긴다.
- 이미지 파일 교체와 함께 출처 메타데이터도 반드시 갱신한다.

특히 아래 항목은 기존 출처가 명백히 오래되어 우선 교체 대상이다.

| 선수 | 기존 원본 파일명 | 문제 |
| --- | --- | --- |
| Faker | `Faker2014.jpg` | 매우 오래된 사진 |
| Ruler | `Ruler_Summer_2016.png` | 매우 오래된 사진 |
| Bdd | `CJ_Bdd_2016_Spring.png` | 매우 오래된 사진 |
| Scout | `SKT_Scout_2016_Spring.png` | 매우 오래된 사진 |
| Chovy | `GRF_Chovy_2018_Split_1.png` | 이전 팀, 오래된 시즌 |
| Canyon | `DWG_Canyon_2019_Split_1.png` | 이전 팀, 오래된 시즌 |
| Zeus | `T1_Zeus_2021_Split_1.png` | 현재 게임 기준 팀과 불일치 가능 |
| Gumayusi | `T1_Gumayusi_2020_Split_1.png` | 현재 게임 기준 팀과 불일치 가능 |
| Peyz | `GEN.C_Peyz_2022_Split_1.png` | 현재 게임 기준 팀과 불일치 가능 |
| Taeyoon | `DRX.C_Taeyoon_2021_Split_1.png` | 이전 팀, 오래된 시즌 |
| Diable | `LSB.Y_Diable_2023_Split_2.png` | 이전 팀/유스 기반 자료 |

## 선수 커리어 데이터 작성 방식

선수 커리어는 UI에 바로 긴 문장으로 박아 넣지 않고, 구조화된 데이터로 관리하는 것을 권장한다.

추천 데이터 구조:

```ts
type PlayerCareerProfile = {
  playerName: string;
  realName?: string;
  currentTeam: string;
  rosterBaselineTeam: string;
  summaryKo: string;
  affiliations: Array<{
    period: string;
    team: string;
  }>;
  achievements: Array<{
    year: string;
    competition: string;
    result: string;
    team?: string;
  }>;
  sources: Array<{
    label: string;
    url: string;
    accessedAt: string;
    noteKo?: string;
  }>;
  verificationStatus: "verified" | "cross-checked" | "needs-review";
};
```

작성 원칙:

- `currentTeam`은 게임 내 현재 소속으로 사용한다.
- `rosterBaselineTeam`은 2026 시즌 개막 기준 소속을 명시한다.
- 시즌 중 이적은 기본 로스터를 바꾸는 근거로 쓰지 않는다.
- 팀을 바꾼 이력은 반드시 별도 항목으로 분리한다.
- 커리어 카드에 하위 설명 문구는 넣지 않는다.
- 나무위키 `소속` 항목을 우선 참고하되, 우승 기록은 공식/위키/매체 자료와 교차 확인한다.
- 선수 소개 문구는 커리어 요약과 분리한다.

우선 수집 순서:

1. T1, Gen.G, Hanwha Life Esports 1군 선수
2. 2026 개막 로스터 기준 충돌 가능성이 있는 선수: Taeyoon, Diable, Slayer, Sharvel
3. 커리어가 긴 베테랑: Faker, Ruler, Scout, Bdd, ShowMaker, Teddy, Cuzz, Lehends, Pyosik
4. 나머지 1군 선수
5. 2군 선수

## 팀 역사 데이터 작성 방식

팀 역사도 구조화된 데이터로 관리하는 것을 권장한다.

추천 데이터 구조:

```ts
type TeamHistoryProfile = {
  teamId: string;
  teamName: string;
  displayNameKo: string;
  summaryKo: string;
  nameHistory: Array<{
    period: string;
    name: string;
  }>;
  achievements: Array<{
    year: string;
    competition: string;
    result: string;
  }>;
  sources: Array<{
    label: string;
    url: string;
    accessedAt: string;
    noteKo?: string;
  }>;
  verificationStatus: "verified" | "cross-checked" | "needs-review";
};
```

작성 원칙:

- 나무위키의 팀명 변경 항목을 우선 참고한다.
- 우승 기록은 나무위키의 우승 기록 항목을 우선 참고한다.
- 준우승 기록은 팀 역사 탭의 주요 기록에 넣지 않는다.
- Leaguepedia/Liquipedia는 보조 검증 자료로 사용한다.
- 팀명 변경은 `팀명 (YYYY.MM - YYYY.MM)` 또는 `팀명 (YYYY.MM - 현재)` 형태로 표시한다.
- 창단/합류 카드, 자료 출처 접힘 영역, 역사 하단 소개 문구는 팀 상세 화면에 표시하지 않는다.
- 팀 레전드 선수 명단은 이번 이슈의 필수 범위가 아니며 후속 확장 후보로 둔다.

## 팀 역사 1차 수집 대상

아래는 1차로 정리할 팀 역사 항목이다.

| 팀 | 우선 수집 항목 |
| --- | --- |
| T1 | SK Telecom T1 1/2, K/S 이원화 시절과 T1 팀명 흐름, LCK 우승 10회 시즌, MSI 우승, Worlds 우승 |
| Gen.G | Samsung Galaxy Blue/White, Samsung Galaxy, KSV, Gen.G 흐름, LCK 우승, MSI 2024/2025 우승, Worlds 우승 |
| Hanwha Life Esports | ROX Tigers 시절과 HLE 창단 흐름, LCK 및 국제대회 성과 |
| KT Rolster | KT LoL 팀 창단, Arrows/Bullets/통합팀 흐름, LCK 우승 기록 |
| Dplus KIA | DAMWON Gaming/DWG KIA/Dplus KIA 팀명 흐름, Worlds 2020 우승. 준우승 기록 제외 |
| Hanjin BRION | e-mFire/Kongdoo Monster/BRION 계열 팀명 변경, 주요 성과 |
| BNK FEARX | SANDBOX/Liiv SANDBOX/FearX/BNK FEARX 흐름 |
| Nongshim RedForce | Team Dynamics/Nongshim RedForce 흐름, LCK 합류 과정 |
| Kiwoom DRX | DRX 팀명 흐름, Worlds 2022 우승, Kiwoom 네이밍 스폰서 흐름 |
| DN SOOPers | Afreeca Freecs/Kwangdong Freecs/DN Freecs/DN SOOPers 흐름 |

## 반영 체크리스트

### 사용자 확정으로 반영할 항목

- 로스터 기준은 2026 시즌 개막 시점으로 고정한다.
- Taeyoon/Diable 시즌 중 팀 이동은 반영하지 않는다.
- Diable은 BNK FEARX 1군 주전 선수로 둔다.
- Slayer는 BNK FEARX 2군 선수로 둔다.
- Sharvel은 2군 선수로 유지한다.
- 1군 전원과 FA BeryL 사진은 신규 버전으로 교체한다.
- 팀 대표 이미지는 이번 작업 범위에서 제외한다.
- 선수 커리어는 나무위키 `소속` 항목을 우선 참고한다.
- 팀 역사는 나무위키 `팀명` 및 우승 기록 항목을 우선 참고한다.

### 추가 확인이 필요한 항목

- 이미지 라이선스와 출처 표기 방식

### 이번 범위에서 제외할 항목

- 2군 선수 사진 교체
- 팀 대표 이미지 수집
- 출처 없는 이미지 교체
- 일반 이미지 검색 기반 사진 사용
- 시즌 중 로스터 변경 자동 반영

## 추천 작업 순서

1. 이 문서를 사용자 검토 기준에 맞게 확정한다.
2. 개막 로스터 기준으로 현재 repo 선수 소속 차이를 표로 다시 만든다.
3. Taeyoon/Diable/Slayer/Sharvel 충돌 지점을 먼저 정리한다.
4. 전체 1군 선수와 FA BeryL 사진 신규 후보를 수집하고 출처/라이선스/최신성 상태를 표로 만든다.
5. 사용자 검토 후 사진 파일을 실제로 교체한다.
6. 선수 커리어 데이터 구조를 추가한다.
7. 나무위키 `소속` 항목 기반으로 1군 선수 커리어를 수집한다.
8. 팀 역사 데이터 구조를 추가한다.
9. 나무위키 `팀명` 및 우승 기록 항목 기반으로 팀 역사를 수집한다.
10. 선수 카드/팀 상세 UI에서 기존 AI 생성 문구를 실제 데이터 기반 문구로 교체한다.
11. 빌드와 관련 테스트를 실행한다.

## 샘플 수집 결과

수집일: 2026-06-13
대상: Faker, Chovy, Gen.G
목적: 48번 전체 데이터 수집 전 샘플 품질 검토

### 샘플 수집 상태 메모

- 나무위키는 선수 커리어/팀 역사 수집의 1순위 출처로 유지한다.
- 현재 자동 수집 환경에서는 `namu.wiki`가 보안 검증 페이지를 반환했고, `namu.moe` 계열 미러는 522/타임아웃이 발생했다.
- 따라서 이번 샘플은 나무위키의 확인 대상 URL과 확인해야 할 항목을 명시하고, 접근 가능한 Leaguepedia/Wikipedia/이미지 API 자료로 1차 교차 검증했다.
- 실제 전체 수집 단계에서는 나무위키 `소속`, `팀명`, 우승 기록 항목을 사람이 검토 가능한 형태로 다시 대조해야 한다.

### Faker 샘플

#### 기본 정보

| 항목 | 값 |
| --- | --- |
| 선수명 | Faker |
| 실명 | 이상혁 / Lee Sang-hyeok |
| 포지션 | MID |
| 게임 기준 소속 | T1 |
| 2026 개막 기준 소속 | T1 |
| 데이터 상태 | `cross-checked`, 나무위키 소속 항목 직접 대조 필요 |

#### 커리어 소속 초안

| 기간 | 소속 | 메모 |
| --- | --- | --- |
| 2013.02-2013.11 | SK Telecom T1 2 | 데뷔 시기, 이후 SK Telecom T1 K로 정리되는 계열 |
| 2013.11-2014.12 | SK Telecom T1 K | 2013 Worlds 우승 로스터 |
| 2014.12-2019.12 | SK Telecom T1 | SKT 단일팀 체제 |
| 2019.12-현재 | T1 | 팀 리브랜딩 이후에도 동일 조직에서 활동 |

#### 주요 커리어 포인트 초안

- 2013년 데뷔 이후 T1/SK Telecom T1 계열에서만 활동한 원클럽맨으로 정리한다.
- Worlds 우승 6회: 2013, 2015, 2016, 2023, 2024, 2025.
- MSI 우승 2회: 2016, 2017.
- LCK 우승 10회.
- 2022 항저우 아시안게임 금메달, 2018 자카르타-팔렘방 아시안게임 은메달.
- 2024 LoL Esports Hall of Legends 초대 헌액자로 요약 가능.
- UI용 한 줄 요약 후보: `T1의 상징이자 LoL e스포츠 역사상 가장 긴 지배력을 보여준 미드 라이너.`

#### 선수 사진 후보

| 항목 | 값 |
| --- | --- |
| 권장 로컬 경로 | `/assets/players/lck/2026/main/t1-faker.png` |
| 원본 후보 파일명 | `T1_Faker_2026_LCK_Cup.png` |
| 원본 후보 설명 | T1 Faker, LCK Cup 2026 |
| 원본 크기 | 571x526 |
| 원본 MIME | `image/png` |
| 원본 업데이트 | 2026-01-22T16:33:12Z |
| 원본 URL | `https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/5a/T1_Faker_2026_LCK_Cup.png/revision/latest?cb=20260122163312` |
| 설명 페이지 | https://lol.fandom.com/wiki/File:T1_Faker_2026_LCK_Cup.png |
| 검증 상태 | `temporary-current-candidate` |
| 남은 확인 | Leaguepedia 파일은 2026 시즌 후보로 적합하지만, 최종 반영 전 LCK/Riot/T1 공식 원출처 또는 사용 가능 범위 확인 필요 |

#### 출처

- 나무위키 확인 대상: https://namu.wiki/w/Faker
- Leaguepedia Faker: https://lol.fandom.com/wiki/Faker
- Wikipedia Faker: https://en.wikipedia.org/wiki/Faker_(gamer)
- Leaguepedia 이미지 API: `File:T1_Faker_2026_LCK_Cup.png`

### Chovy 샘플

#### 기본 정보

| 항목 | 값 |
| --- | --- |
| 선수명 | Chovy |
| 실명 | 정지훈 / Jeong Ji-hoon |
| 포지션 | MID |
| 게임 기준 소속 | Gen.G |
| 2026 개막 기준 소속 | Gen.G |
| 데이터 상태 | `cross-checked`, 나무위키 소속 항목 직접 대조 필요 |

#### 커리어 소속 초안

| 기간 | 소속 | 메모 |
| --- | --- | --- |
| 2017.11 | Gwangju | 단기 소속 기록 |
| 2018.03-2019.11 | Griffin | LCK 데뷔와 첫 전성기 기반 |
| 2019.12-2020.11 | DRX | 2020 시즌 주전 미드 |
| 2020.11-2021.11 | Hanwha Life Esports | 2021 시즌 주전 미드 |
| 2021.11-현재 | Gen.G | 장기 주전 미드, 다수 LCK/MSI 우승 커리어 |

#### 주요 커리어 포인트 초안

- Griffin 시절 강력한 라인전과 CS 격차를 상징하는 미드 라이너로 부상했다.
- DRX, Hanwha Life Esports를 거쳐 2022 시즌부터 Gen.G의 핵심 미드로 정착했다.
- Gen.G 소속으로 LCK 다회 우승, MSI 2025 우승, Esports World Cup 2025 우승, LCK Cup 2026 우승 기록을 우선 반영 후보로 둔다.
- 개인 수상은 MSI Finals MVP 2025, LCK Regular Season MVP 4회, LCK Finals MVP 2023 Summer 등을 우선 후보로 둔다.
- UI용 한 줄 요약 후보: `압도적인 라인전과 꾸준한 정규시즌 지배력으로 Gen.G 시대를 대표하는 미드 라이너.`

#### 선수 사진 후보

| 항목 | 값 |
| --- | --- |
| 권장 로컬 경로 | `/assets/players/lck/2026/main/gen-g-chovy.png` |
| 원본 후보 파일명 | `GEN_Chovy_2026_Split_1.png` |
| 원본 후보 설명 | GEN Chovy, 2026 Split 1 |
| 원본 크기 | 692x548 |
| 원본 MIME | `image/png` |
| 원본 업데이트 | 2026-01-22T17:12:12Z |
| 원본 URL | `https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/b3/GEN_Chovy_2026_Split_1.png/revision/latest?cb=20260122171212` |
| 설명 페이지 | https://lol.fandom.com/wiki/File:GEN_Chovy_2026_Split_1.png |
| 검증 상태 | `temporary-current-candidate` |
| 남은 확인 | Leaguepedia 파일은 2026 시즌 후보로 적합하지만, 최종 반영 전 LCK/Riot/Gen.G 공식 원출처 또는 사용 가능 범위 확인 필요 |

#### 출처

- 나무위키 확인 대상: https://namu.wiki/w/Chovy
- 나무위키 보조 확인 후보: https://namu.wiki/w/%EC%A0%95%EC%A7%80%ED%9B%88(2001)
- Leaguepedia Chovy: https://lol.fandom.com/wiki/Chovy
- Liquipedia Chovy: https://liquipedia.net/leagueoflegends/Chovy
- Leaguepedia 이미지 API: `File:GEN_Chovy_2026_Split_1.png`

### Gen.G 팀 커리어 샘플

#### 기본 정보

| 항목 | 값 |
| --- | --- |
| 팀명 | Gen.G |
| 한국어 표기 | 젠지 |
| 이전 명칭 | Samsung Galaxy, KSV eSports |
| 생성/리브랜딩 기준 | 2018-05-03 |
| 게임 기준 팀 | Gen.G |
| 데이터 상태 | `cross-checked`, 나무위키 팀명/우승 기록 항목 직접 대조 필요 |

#### 팀명/역사 초안

| 시기 | 팀명/조직 흐름 | 메모 |
| --- | --- | --- |
| 2013-2014 | Samsung Galaxy Blue / White | 이원화 팀 시절. Worlds 2014 우승은 Samsung White 기록으로 간단히 병기 |
| 2014-2017 | Samsung Galaxy | Worlds 2017 우승은 Samsung Galaxy 시절 기록으로 간단히 병기 |
| 2017.11 | KSV eSports | Samsung Galaxy LoL 팀 인수 후 사용한 임시 팀명 |
| 2018.05 | Gen.G | KSV eSports에서 Generation Gaming/Gen.G로 리브랜딩 |
| 2022-2024 | Gen.G LCK 왕조기 | LCK 4연속 우승 기록을 핵심 팀 역사로 정리 |
| 2024-2025 | 국제대회 우승기 | MSI 2024, MSI 2025 우승 흐름을 팀 커리어의 핵심 국제 성과로 정리 |
| 2026 | Kiin-Canyon-Chovy-Ruler-Duro 로스터 | 게임의 2026 개막 기준 주전 로스터 |

#### 주요 성과 초안

- Samsung Galaxy 시절 우승 기록은 우승 기록 옆에 `Samsung White 시절`, `Samsung Galaxy 시절`처럼 짧게 병기한다.
- Gen.G 명의의 핵심 국내 성과는 LCK 2022 Summer부터 2024 Spring까지의 4연속 LCK 우승을 우선 반영한다.
- 2025 시즌에도 LCK 통합 챔피언십/플레이오프 우승 후보 데이터를 반영할 수 있으나, 나무위키 우승 기록 항목과 대조 후 확정한다.
- 국제대회 성과는 MSI 2024, MSI 2025 우승을 우선 반영한다.
- 2026 시즌 샘플에서는 LCK Cup 2026 우승과 First Stand 2026 3-4위, LCK 2026 Rounds 1-2 3위 기록을 최신 성과 후보로 둔다.
- UI용 팀 소개 후보: `Samsung Galaxy 시절의 국제대회 우승 역사와 Gen.G 시대의 LCK 장기 집권을 함께 가진 현대 LCK의 대표 강팀.`

#### 팀 이미지 처리

팀 대표 이미지는 이번 48번 구현 범위에서 제외한다. 로고 최신화나 팀 대표 이미지가 필요하다고 판단되면 별도 이슈에서 다룬다.

#### 출처

- 나무위키 확인 대상: https://namu.wiki/w/Gen.G%20Esports/%EB%A6%AC%EA%B7%B8%20%EC%98%A4%EB%B8%8C%20%EB%A0%88%EC%A0%84%EB%93%9C
- Leaguepedia Gen.G: https://lol.fandom.com/wiki/Gen.G
- Gen.G Tournament Results: https://lol.fandom.com/wiki/Gen.G/Tournament_Results
- Liquipedia Gen.G: https://liquipedia.net/leagueoflegends/Gen.G_Esports
- Wikipedia Gen.G: https://en.wikipedia.org/wiki/Gen.G
- Leaguepedia 이미지 API: 이번 범위에서는 선수 사진 파일만 사용

### 샘플 평가

이번 샘플 기준으로 실제 전체 수집에 들어가기 전 보완해야 할 지점은 다음과 같다.

- 나무위키 직접 접근 또는 수동 대조 루트를 확보해야 한다.
- Leaguepedia 이미지 파일은 최신 후보를 찾는 데 유용하지만, 최종 이미지 출처/라이선스 검증은 별도 단계로 둬야 한다.
- 선수 커리어는 `소속 이력`과 `주요 성과`를 분리해서 저장하는 편이 UI 확장에 유리하다.
- 팀 역사는 `팀명 변경`과 `우승 기록`을 분리하되, 팀명 변화에는 기간을 괄호로 병기한다.
- T1의 LCK 우승 10회 시즌을 모두 표시한다.
- Gen.G의 MSI 2025 우승을 국제 기록에 포함한다.
- KT의 Rift Rivals 기록과 Dplus KIA의 국제대회 준우승 기록은 주요 기록에서 제외한다.

## 완료 기준

48번 이슈는 아래 조건을 만족해야 닫을 수 있다.

- 2026 시즌 개막 기준 로스터가 게임 데이터에 반영되어 있다.
- Taeyoon/Diable의 시즌 중 팀 이동이 기본 로스터에 반영되지 않았다.
- Sharvel이 2군 선수로 유지되어 있다.
- 1군 전원과 FA BeryL 사진이 신규 버전으로 교체되어 있다.
- 모든 선수 사진에 출처와 검증 상태가 남아 있다.
- 선수 카드의 커리어 영역이 실제 경력 데이터 기반으로 표시된다.
- 선수 카드의 커리어 영역에 하위 설명 문구가 표시되지 않는다.
- 기존 AI 생성 한 줄 커리어 문구가 실제 데이터 기반 문구로 대체되어 있다.
- 팀 상세 화면에서 기간이 표시된 팀명 변경과 주요 우승 기록을 확인할 수 있다.
- 팀 상세 화면의 역사 영역에는 창단/합류 카드, 자료 출처 접힘 영역, 하단 소개 문구가 표시되지 않는다.
- 선수/팀 데이터 출처가 추후 갱신 가능한 형태로 남아 있다.
