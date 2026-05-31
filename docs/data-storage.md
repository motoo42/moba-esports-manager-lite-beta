# 데이터 모델과 저장 전략

## 1. 기술 스택 후보

추천:

- React + TypeScript + Vite.
- 선수, 상대 팀, 이벤트는 정적 JSON/TS 데이터.
- 시즌 시뮬레이션은 로컬 상태로 관리.
- 초반에는 로컬 상태와 정적 데이터로 구현.
- 시즌 흐름이 안정되면 localStorage로 임시 저장.
- 최종적으로는 MongoDB 연결을 고려.
- 선택 기능으로 사용자 커스텀 테마 JSON을 localStorage에 저장.

이유:

- 초기 구현에는 외부 API가 필요 없습니다.
- 데이터 기반 설계라 AI가 생성한 선수/이벤트 콘텐츠를 활용하기 좋습니다.
- 프론트엔드만으로 핵심 게임 루프를 먼저 완성할 수 있습니다.
- MongoDB는 선수/팀/시즌 기록 데이터가 안정된 뒤 연결합니다.

## 2. 데이터 모델 초안

```ts
type Region = "lck" | "international";

type Role = "top" | "jungle" | "mid" | "bot" | "support";

type CompetitionScope = "lck" | "international" | "special";

type SeasonCalendarType = "normal" | "asian-games";

type CompetitionId =
  | "lck-split-1"
  | "first-stand"
  | "lck-split-2"
  | "msi"
  | "lck-split-3"
  | "worlds"
  | "asian-games-selection"
  | "asian-games-camp"
  | "asian-games";

type Player = {
  id: string;
  name: string;
  role: Role;
  secondaryRoles: Role[];
  region: Region;
  league: LeagueCode;
  currentTeam?: string;
  availableForRoster: boolean;
  age: number;
  retirementAge?: number;
  militaryServiceStatus?: "none" | "pending" | "serving" | "completed";
  cost: number;
  salaryExpectation: number;
  ability: number;
  potential: number;
  overall: number;
  mechanics: number;
  macro: number;
  laning: number;
  teamfight: number;
  mental: number;
  championPool: number;
  status: PlayerStatus;
  mindset: PlayerMindset;
  adaptability: PlayerAdaptability;
  chemistryProfile: PlayerChemistryProfile;
  development: PlayerDevelopment;
  marketProfile: PlayerMarketProfile;
  traits: string[];
};

type ContractType = "one-year" | "two-year" | "one-plus-one";

type PlayerContract = {
  playerId: string;
  salary: number;
  type: ContractType;
  guaranteedYears: 1 | 2;
  optionYear?: boolean;
  remainingYears: number;
};

type Team = {
  name: string;
  region: Region;
  budget: number;
  rosterSettings: {
    minPlayers: 10;
    maxPlayers: 15;
    freeMovementBetweenMainAndAcademy: boolean;
  };
  roster: Partial<Record<Role, Player>>;
  mainRosterPlayerIds: string[];
  academyRosterPlayerIds: string[];
  contracts: PlayerContract[];
  wins: number;
  losses: number;
  elo: number;
};

type Competition = {
  id: string;
  name: string;
  scope: CompetitionScope;
  order: number;
  calendarType: SeasonCalendarType | "both";
  qualificationRule?: string;
  status: "locked" | "available" | "active" | "completed";
};

type SeasonCalendar = {
  seasonNumber: number;
  yearLabel?: number;
  type: SeasonCalendarType;
  competitions: Competition[];
};

type SeasonSummary = {
  seasonNumber: number;
  calendarType: SeasonCalendarType;
  lckResult: string;
  internationalResult?: string;
  asianGamesResult?: string;
  finalElo: number;
};

type Opponent = {
  id: string;
  name: string;
  region: "international";
  leagueLabel: string;
  appearsIn: CompetitionId[];
  strength: number;
  style: string;
};

type CareerSave = {
  currentSeason: number;
  maxSeason: 20;
  userTeam: Team;
  lckPlayers: Player[];
  internationalOpponents: Opponent[];
  seasonHistory: SeasonSummary[];
};
```

## 3. 저장 전략

MVP 후보:

- 간단 저장: localStorage.
- 장기 커리어 저장: MongoDB 연결 전까지 IndexedDB 검토 가능.
- 최종 저장: MongoDB 후보.

판단:

- 20시즌 커리어 데이터는 브라우저 로컬 저장만으로도 충분히 가능할 가능성이 큽니다.
- 이미지 자체를 저장하지 않고 URL만 저장하면 데이터 크기는 작습니다.
- MongoDB 연결 시 선수, 팀, 계약, 시즌 결과, 경기 로그 컬렉션을 분리하는 방향을 검토합니다.
