export type LckTeamHistory = {
  founded: string;
  lineage: string[];
  domesticTitles: string[];
  internationalTitles: string[];
  summary: string;
  sources: string[];
};

export const lckTeamHistories: Record<string, LckTeamHistory> = {
  "gen-g": {
    founded: "2017년 KSV eSports로 출발, 2018년 Gen.G로 리브랜딩",
    lineage: ["Samsung Galaxy 계보 인수", "KSV eSports", "Gen.G"],
    domesticTitles: [
      "LCK 2022 Summer",
      "LCK 2023 Spring / Summer",
      "LCK 2024 Spring / Summer",
    ],
    internationalTitles: [
      "MSI 2024",
      "Samsung Galaxy 계보 기준 Worlds 2014 / 2017",
    ],
    summary:
      "삼성 갤럭시의 세계대회 유산을 이어받아 Gen.G 시대에 LCK 장기 집권을 만든 구단입니다.",
    sources: [
      "https://lol.fandom.com/wiki/Gen.G",
      "https://en.wikipedia.org/wiki/Gen.G",
    ],
  },
  "hanwha-life-esports": {
    founded: "2018년 ROX Tigers의 LCK 슬롯과 로스터를 인수하며 출범",
    lineage: ["HUYA / GE / KOO Tigers", "ROX Tigers", "Hanwha Life Esports"],
    domesticTitles: ["LCK 2016 Summer 계보", "LCK 2024 Summer", "LCK Cup 2025"],
    internationalTitles: ["First Stand 2025", "KOO Tigers Worlds 2015 준우승 계보"],
    summary:
      "Tigers 시절의 공격적인 색채와 한화생명의 대형 투자가 결합된 우승권 프로젝트입니다.",
    sources: [
      "https://lol.fandom.com/wiki/Hanwha_Life_Esports",
      "https://en.wikipedia.org/wiki/Hanwha_Life_Esports",
    ],
  },
  t1: {
    founded: "2004년 SK Telecom T1 계보에서 시작, 2019년 T1으로 브랜드 정리",
    lineage: ["SK Telecom T1", "T1"],
    domesticTitles: ["LCK 최다 우승 구단", "KeSPA Cup 2025"],
    internationalTitles: [
      "Worlds 2013 / 2015 / 2016 / 2023 / 2024 / 2025",
      "MSI 2016 / 2017",
      "Esports World Cup 2024",
    ],
    summary:
      "Faker를 중심으로 LCK와 Worlds의 기준을 만들어온, 리그 역사상 가장 상징적인 명문입니다.",
    sources: [
      "https://lol.fandom.com/wiki/T1",
      "https://en.wikipedia.org/wiki/T1_(esports)",
    ],
  },
  "kt-rolster": {
    founded: "KT 프로게임단 계보에서 출발, 2012년 LoL 팀 운영 시작",
    lineage: ["KT Rolster Arrows / Bullets", "KT Rolster"],
    domesticTitles: ["LCK 2014 Summer", "LCK 2018 Summer"],
    internationalTitles: ["Rift Rivals 2017 / 2018 LCK 대표 성과"],
    summary:
      "통신사 라이벌리와 오래된 팬덤을 바탕으로, 강팀의 길목에서 늘 변수와 긴장감을 만든 구단입니다.",
    sources: ["https://lol.fandom.com/wiki/KT_Rolster"],
  },
  "dplus-kia": {
    founded: "2017년 DAMWON Gaming으로 챌린저스 무대에 등장",
    lineage: ["DAMWON Gaming", "DWG KIA", "Dplus KIA"],
    domesticTitles: ["LCK 2020 Summer", "LCK 2021 Spring / Summer"],
    internationalTitles: ["Worlds 2020", "Worlds 2021 준우승", "MSI 2021 준우승"],
    summary:
      "챌린저스에서 세계 챔피언까지 오른 성장 서사를 가진, LCK 현대사의 대표적인 성공 사례입니다.",
    sources: ["https://lol.fandom.com/wiki/Dplus_Kia"],
  },
  "nongshim-redforce": {
    founded: "2020년 Team Dynamics 계보를 이어 Nongshim RedForce로 LCK에 합류",
    lineage: ["Team Dynamics", "Nongshim RedForce"],
    domesticTitles: ["주요 LCK 우승 기록 없음"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
    summary:
      "Team Dynamics의 도전자 이미지를 이어받아, 젊은 자원과 베테랑 조합으로 반전을 노리는 구단입니다.",
    sources: ["https://lol.fandom.com/wiki/Nongshim_RedForce"],
  },
  "hanjin-brion": {
    founded: "e-mFire와 Kongdoo Monster 계보를 거쳐 BRION 브랜드로 LCK에 자리잡음",
    lineage: [
      "e-mFire",
      "Kongdoo Monster",
      "Brion Blade",
      "hyFresh Blade",
      "Fredit BRION",
      "OKSavingsBank BRION",
      "HANJIN BRION",
    ],
    domesticTitles: ["KeSPA Cup 2024"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
    summary:
      "여러 번의 이름 변화를 거치며 언더독 서사를 쌓아온, 한 경기 반전을 기대하게 만드는 구단입니다.",
    sources: ["https://lol.fandom.com/wiki/HANJIN_BRION"],
  },
  "bnk-fearx": {
    founded: "SANDBOX Gaming 계보에서 출발해 Liiv SANDBOX, FearX를 거쳐 BNK FEARX로 리브랜딩",
    lineage: ["SANDBOX Gaming", "Liiv SANDBOX", "FearX", "BNK FEARX"],
    domesticTitles: ["주요 LCK 우승 기록 없음"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
    summary:
      "젊은 색채와 공격적인 리브랜딩을 통해 LCK 안에서 새로운 정체성을 넓혀가는 구단입니다.",
    sources: ["https://lol.fandom.com/wiki/BNK_FEARX"],
  },
  "kiwoom-drx": {
    founded: "Incredible Miracle, Longzhu, KING-ZONE, DRX 계보를 이어 Kiwoom DRX로 운영",
    lineage: ["Incredible Miracle", "Longzhu Gaming", "KING-ZONE DragonX", "DRX", "Kiwoom DRX"],
    domesticTitles: ["LCK 2017 Summer 계보", "LCK 2018 Spring 계보"],
    internationalTitles: ["Worlds 2022"],
    summary:
      "2022년 플레이-인에서 Worlds 우승까지 이어진 기적의 서사를 품은 재건형 구단입니다.",
    sources: [
      "https://lol.fandom.com/wiki/Kiwoom_DRX",
      "https://en.wikipedia.org/wiki/2022_League_of_Legends_World_Championship_final",
    ],
  },
  "dn-soopers": {
    founded: "2016년 Afreeca Freecs 계보에서 출발해 2026년 DN SOOPers로 리브랜딩",
    lineage: ["Afreeca Freecs", "Kwangdong Freecs", "DN Freecs", "DN SOOPers"],
    domesticTitles: ["주요 LCK 우승 기록 없음"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
    summary:
      "Afreeca/Kwangdong 시절의 계보 위에서 새 이름으로 다시 출발한, 반등 서사가 중요한 구단입니다.",
    sources: [
      "https://lol.fandom.com/wiki/DN_SOOPers",
      "https://www.sheepesports.com/en/all/articles/lol-dn-freecs-rebrand-as-dn-soopers/en",
    ],
  },
};

export function getLckTeamHistory(teamId: string): LckTeamHistory {
  return (
    lckTeamHistories[teamId] ?? {
      founded: "기록 정리 중",
      lineage: ["LCK 참가 구단"],
      domesticTitles: ["주요 국내 우승 기록 정리 중"],
      internationalTitles: ["주요 국제대회 기록 정리 중"],
      summary:
        "구단의 역사와 기록은 이후 데이터 업데이트를 통해 보강될 예정입니다.",
      sources: [],
    }
  );
}
