import type { Competition, SeasonTemplate } from "../types/game";

const lckCup: Competition = {
  id: "lck-cup",
  name: "LCK Cup",
  scope: "lck",
  order: 1,
  calendarType: "both",
  qualificationRule: "LCK Cup 우승팀과 준우승팀이 First Stand LCK 대표로 진출합니다.",
  formatSummary:
    "Baron/Elder 그룹 배틀, Super Week BO5, Play-In, Playoffs를 통해 첫 국내 챔피언을 가립니다.",
  entrantsSummary: "LCK 10개 팀",
  stages: [
    {
      name: "Group Battle",
      format: "Baron 그룹과 Elder 그룹이 교차 대결을 치릅니다.",
      notes: "일반 그룹 배틀 승리는 1점으로 반영됩니다.",
    },
    {
      name: "Super Week",
      format: "동일 선택 순위 팀끼리 고정 BO5 경기를 치릅니다.",
      notes: "Super Week 승리는 2점이며 Play-In/Playoffs 시드에 크게 반영됩니다.",
    },
    {
      name: "Play-In / Playoffs",
      format: "컵 시드를 바탕으로 BO5 포스트시즌을 진행합니다.",
      notes: "우승팀과 준우승팀이 First Stand LCK 대표가 됩니다.",
    },
  ],
  status: "available",
};

const firstStand: Competition = {
  id: "first-stand",
  name: "First Stand",
  scope: "international",
  order: 2,
  calendarType: "both",
  qualificationRule:
    "LCK 2팀, LPL 2팀, 3~6위권 리그 각 1팀이 출전합니다.",
  formatSummary:
    "8개 팀이 두 개 BO1 조별리그를 치른 뒤, 상위 4팀이 BO5 토너먼트에 진출합니다.",
  entrantsSummary:
    "LCK 2팀, LPL 2팀, 그 외 3~6위권 리그 각 1팀, 총 8팀.",
  stages: [
    {
      name: "Group Stage",
      format: "4팀씩 두 조로 나뉘어 조별리그를 진행합니다.",
      entrants: 8,
      advancing: 4,
      notes: "각 조 상위 2팀이 토너먼트에 진출합니다.",
    },
    {
      name: "Semifinals and Final",
      format: "4팀 싱글 엘리미네이션 토너먼트입니다.",
      entrants: 4,
      advancing: 1,
      notes: "4강과 결승은 BO5 시리즈로 진행됩니다.",
    },
  ],
  status: "locked",
};

const lckRounds12: Competition = {
  id: "lck-rounds-1-2",
  name: "LCK Rounds 1-2",
  scope: "lck",
  order: 3,
  calendarType: "both",
  qualificationRule: "MSI 진출권과 후반 LCK 시드의 기반을 결정합니다.",
  formatSummary:
    "LCK 10개 팀 더블 라운드 로빈 이후 Road to MSI 포스트시즌으로 MSI 대표를 가립니다.",
  entrantsSummary: "LCK 10개 팀",
  stages: [
    {
      name: "Rounds 1-2 regular stage",
      format: "총 90경기 더블 라운드 로빈이며 LCK 경기일과 휴식일 규칙을 따릅니다.",
      notes: "정규 순위는 MSI 이후 후반 LCK 단계의 그룹 배정과 시드에 이어집니다.",
    },
    {
      name: "Road to MSI / postseason",
      format: "포스트시즌 브래킷으로 LCK MSI 대표를 결정합니다.",
      notes: "최종 순위는 후반 국내 시드에도 영향을 줍니다.",
    },
  ],
  status: "locked",
};

const msi: Competition = {
  id: "msi",
  name: "MSI",
  scope: "international",
  order: 4,
  calendarType: "both",
  qualificationRule:
    "주요 리그 상위 2팀과 CBLOL 우승팀이 출전하며, First Stand 우승 리그는 2시드가 브래킷 직행 혜택을 받습니다.",
  formatSummary:
    "11개 팀이 Play-In을 거쳐 8팀 더블 엘리미네이션 브래킷에서 우승팀을 가립니다.",
  entrantsSummary:
    "LCK 2팀, LPL 2팀, LEC 2팀, LCS 2팀, LCP 2팀, CBLOL 1팀, 총 11팀.",
  stages: [
    {
      name: "Play-In Stage",
      format: "4팀 싱글 엘리미네이션입니다.",
      entrants: 4,
      advancing: 1,
      notes: "Play-In 승자는 브래킷 직행 7팀과 합류합니다.",
    },
    {
      name: "Bracket Stage",
      format: "8팀 승자조/패자조 더블 엘리미네이션입니다.",
      entrants: 8,
      advancing: 1,
      notes: "MSI 최종 성적 상위 2개 리그에는 Worlds 추가 시드가 주어집니다.",
    },
  ],
  status: "locked",
};

const lckRounds35: Competition = {
  id: "lck-rounds-3-5",
  name: "LCK Rounds 3-5",
  scope: "lck",
  order: 5,
  calendarType: "normal",
  qualificationRule: "Worlds 진출권을 결정합니다.",
  formatSummary:
    "MSI 이후 Legend/Rise 그룹 정규시즌과 포스트시즌을 통해 Worlds 시드를 확정합니다.",
  entrantsSummary: "LCK 10개 팀",
  stages: [
    {
      name: "Rounds 3-5 regular stage",
      format: "Legend와 Rise 그룹이 각 그룹 내부 정규시즌을 진행합니다.",
      notes: "하루 2경기 편성 시 Legend 1경기와 Rise 1경기가 함께 배치됩니다.",
    },
    {
      name: "LCK Playoffs",
      format: "포스트시즌 브래킷으로 Worlds 시드를 결정합니다.",
      notes: "최종 LCK 순위는 Worlds 20팀 참가 풀에 반영됩니다.",
    },
  ],
  status: "locked",
};

const lckRounds34: Competition = {
  id: "lck-rounds-3-4",
  name: "LCK Rounds 3-4",
  scope: "lck",
  order: 5,
  calendarType: "asian-games",
  qualificationRule: "Asian Games 시즌의 Worlds 진출 경로를 결정합니다.",
  formatSummary:
    "Asian Games가 있는 시즌에는 MSI 이후 LCK 후반부가 Rounds 3-4로 압축됩니다.",
  entrantsSummary: "LCK 10개 팀",
  stages: [
    {
      name: "Rounds 3-4 regular stage",
      format: "Legend와 Rise 그룹이 축약된 그룹 내부 정규시즌을 진행합니다.",
      notes: "국가대표 대회 전 Worlds 진출권 경쟁을 유지하기 위한 압축 단계입니다.",
    },
    {
      name: "LCK Playoffs",
      format:
        "Season Play-In 이후 승자조/패자조 LCK Playoffs를 진행하며 전 경기 BO5 Fearless입니다.",
      notes:
        "최종 1~3위는 기본 Worlds 후보이며, 4위는 MSI 추가 시드 상황에 따라 활용됩니다.",
    },
  ],
  status: "locked",
};

const asianGames: Competition = {
  id: "asian-games",
  name: "Asian Games",
  scope: "special",
  order: 6,
  calendarType: "asian-games",
  qualificationRule: "LCK 선수 풀에서 대한민국 대표팀을 구성합니다.",
  formatSummary:
    "Asian Games 시즌에 Worlds 전 삽입되는 8개국 국가대표 토너먼트입니다.",
  entrantsSummary: "국가대표팀",
  stages: [
    {
      name: "National team event",
      format: "8팀 토너먼트이며 대한민국은 LCK 선수 풀에서 선발됩니다.",
      notes: "유저는 직접 플레이 또는 자동 진행을 선택할 수 있습니다.",
    },
  ],
  status: "locked",
};

const worldsNormal: Competition = {
  id: "worlds",
  name: "Worlds",
  scope: "international",
  order: 6,
  calendarType: "normal",
  qualificationRule: "각 지역 최종 순위와 MSI 보너스 시드를 바탕으로 참가팀을 확정합니다.",
  formatSummary:
    "20개 팀이 Play-In, Group Stage, Knockout을 거쳐 최종 Worlds 챔피언을 가립니다.",
  entrantsSummary:
    "LCK/LPL/LCS/LEC 기본 3시드, LCP/CBLOL 기본 2시드, MSI 보너스 2시드, LCQ 2팀, 총 20팀.",
  stages: [
    {
      name: "Qualification Pool",
      format: "지역 시드, MSI 보너스 시드, LCQ 슬롯으로 참가 풀을 확정합니다.",
      entrants: 20,
      notes:
        "LCK/LPL/LCS/LEC 1~3시드는 그룹 스테이지 직행, LCP/CBLOL과 보너스 시드, LCQ 팀은 Play-In에서 시작합니다.",
    },
    {
      name: "Group Stage",
      format: "4팀씩 네 조로 나뉘어 조별리그를 진행합니다.",
      entrants: 16,
      advancing: 8,
      notes: "각 조 상위 2팀이 Knockout에 진출합니다.",
    },
    {
      name: "Knockout Stage",
      format: "8팀 월드컵식 싱글 엘리미네이션 브래킷입니다.",
      entrants: 8,
      advancing: 1,
      notes: "8강, 4강, 결승은 BO5이며 최종 우승팀은 Worlds 챔피언으로 저장됩니다.",
    },
  ],
  status: "locked",
};

const worldsAsianGames: Competition = {
  ...worldsNormal,
  order: 7,
  calendarType: "asian-games",
};

export const normalSeasonCompetitions: Competition[] = [
  lckCup,
  firstStand,
  lckRounds12,
  msi,
  lckRounds35,
  worldsNormal,
];

export const asianGamesSeasonCompetitions: Competition[] = [
  lckCup,
  firstStand,
  lckRounds12,
  msi,
  lckRounds34,
  asianGames,
  worldsAsianGames,
];

export const seasonTemplates: SeasonTemplate[] = [
  {
    id: "lck-2025-reference",
    name: "일반 LoL Esports 시즌",
    referenceSeason: 2025,
    type: "normal",
    description:
      "LCK Cup -> First Stand -> LCK Rounds 1-2 -> MSI -> LCK Rounds 3-5 -> Worlds 흐름입니다.",
    competitions: normalSeasonCompetitions,
  },
  {
    id: "lck-2026-asian-games-reference",
    name: "Asian Games 포함 LoL Esports 시즌",
    referenceSeason: 2026,
    type: "asian-games",
    description:
      "LCK Cup -> First Stand -> LCK Rounds 1-2 -> MSI -> LCK Rounds 3-4 -> Asian Games -> Worlds 흐름입니다.",
    competitions: asianGamesSeasonCompetitions,
  },
];

export function getCompetitionTemplate(competitionId: Competition["id"]) {
  return (
    [...normalSeasonCompetitions, ...asianGamesSeasonCompetitions].find(
      (competition) => competition.id === competitionId,
    ) ?? null
  );
}
