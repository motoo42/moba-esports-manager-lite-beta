export type LckTeamNameHistory = {
  name: string;
  period: string;
};

export type LckTeamHistory = {
  domesticTitles: string[];
  internationalTitles: string[];
  nameHistory: LckTeamNameHistory[];
};

export const lckTeamHistories: Record<string, LckTeamHistory> = {
  "gen-g": {
    nameHistory: [
      { name: "Samsung Galaxy Blue / White", period: "2013.09 - 2014.10" },
      { name: "Samsung Galaxy", period: "2014.10 - 2017.11" },
      { name: "KSV eSports", period: "2017.11 - 2018.05" },
      { name: "Gen.G", period: "2018.05 - 현재" },
    ],
    domesticTitles: [
      "LCK 2014 Spring - Samsung Blue 시절",
      "LCK 2014 Summer - Samsung White 시절",
      "LCK 2022 Summer",
      "LCK 2023 Spring",
      "LCK 2023 Summer",
      "LCK 2024 Spring",
      "LCK 2024 Summer",
    ],
    internationalTitles: [
      "Worlds 2014 - Samsung White 시절",
      "Worlds 2017 - Samsung Galaxy 시절",
      "MSI 2024",
      "MSI 2025",
    ],
  },
  "hanwha-life-esports": {
    nameHistory: [
      { name: "HUYA Tigers", period: "2014.11 - 2015.01" },
      { name: "GE Tigers", period: "2015.01 - 2015.05" },
      { name: "KOO Tigers", period: "2015.05 - 2015.12" },
      { name: "ROX Tigers", period: "2016.01 - 2018.04" },
      { name: "Hanwha Life Esports", period: "2018.04 - 현재" },
    ],
    domesticTitles: [
      "LCK 2016 Summer - ROX Tigers 시절",
      "LCK 2024 Summer",
      "LCK Cup 2025",
    ],
    internationalTitles: ["First Stand 2025"],
  },
  t1: {
    nameHistory: [
      { name: "SK Telecom T1 1 / 2", period: "2012.12 - 2013.11" },
      { name: "SK Telecom T1 K / S", period: "2013.11 - 2014.12" },
      { name: "SK Telecom T1", period: "2014.12 - 2019.10" },
      { name: "T1", period: "2019.10 - 현재" },
    ],
    domesticTitles: [
      "LCK 2013 Summer",
      "LCK 2013-2014 Winter",
      "LCK 2015 Spring",
      "LCK 2015 Summer",
      "LCK 2016 Spring",
      "LCK 2017 Spring",
      "LCK 2019 Spring",
      "LCK 2019 Summer",
      "LCK 2020 Spring",
      "LCK 2022 Spring",
      "KeSPA Cup 2025",
    ],
    internationalTitles: [
      "Worlds 2013",
      "Worlds 2015",
      "Worlds 2016",
      "Worlds 2023",
      "Worlds 2024",
      "Worlds 2025",
      "MSI 2016",
      "MSI 2017",
      "Esports World Cup 2024",
    ],
  },
  "kt-rolster": {
    nameHistory: [
      { name: "KT Rolster Arrows / Bullets", period: "2012.10 - 2014.12" },
      { name: "KT Rolster", period: "2014.12 - 현재" },
    ],
    domesticTitles: ["LCK 2014 Summer", "LCK 2018 Summer"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
  },
  "dplus-kia": {
    nameHistory: [
      { name: "DAMWON Gaming", period: "2017.05 - 2020.12" },
      { name: "DWG KIA", period: "2020.12 - 2023.01" },
      { name: "Dplus KIA", period: "2023.01 - 현재" },
    ],
    domesticTitles: ["LCK 2020 Summer", "LCK 2021 Spring", "LCK 2021 Summer"],
    internationalTitles: ["Worlds 2020"],
  },
  "nongshim-redforce": {
    nameHistory: [
      { name: "Team Dynamics", period: "2019.05 - 2020.12" },
      { name: "Nongshim RedForce", period: "2020.12 - 현재" },
    ],
    domesticTitles: ["주요 LCK 우승 기록 없음"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
  },
  "hanjin-brion": {
    nameHistory: [
      { name: "e-mFire", period: "2012.02 - 2015.12" },
      { name: "Kongdoo Monster", period: "2016.01 - 2018.01" },
      { name: "Brion Blade", period: "2018.01 - 2019.12" },
      { name: "hyFresh Blade", period: "2019.12 - 2020.06" },
      { name: "Fredit BRION", period: "2020.06 - 2023.12" },
      { name: "OKSavingsBank BRION", period: "2023.12 - 2025.12" },
      { name: "HANJIN BRION", period: "2025.12 - 현재" },
    ],
    domesticTitles: ["KeSPA Cup 2024"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
  },
  "bnk-fearx": {
    nameHistory: [
      { name: "SANDBOX Gaming", period: "2018.12 - 2021.03" },
      { name: "Liiv SANDBOX", period: "2021.03 - 2023.12" },
      { name: "FearX", period: "2023.12 - 2024.12" },
      { name: "BNK FEARX", period: "2024.12 - 현재" },
    ],
    domesticTitles: ["주요 LCK 우승 기록 없음"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
  },
  "kiwoom-drx": {
    nameHistory: [
      { name: "Incredible Miracle", period: "2012.05 - 2016.01" },
      { name: "Longzhu Gaming", period: "2016.01 - 2018.01" },
      { name: "KING-ZONE DragonX", period: "2018.01 - 2019.10" },
      { name: "DragonX / DRX", period: "2019.10 - 2025.12" },
      { name: "Kiwoom DRX", period: "2025.12 - 현재" },
    ],
    domesticTitles: [
      "LCK 2017 Summer - Longzhu Gaming 시절",
      "LCK 2018 Spring - KING-ZONE 시절",
    ],
    internationalTitles: ["Worlds 2022"],
  },
  "dn-soopers": {
    nameHistory: [
      { name: "Afreeca Freecs", period: "2016.01 - 2021.12" },
      { name: "Kwangdong Freecs", period: "2021.12 - 2024.12" },
      { name: "DN Freecs", period: "2024.12 - 2025.12" },
      { name: "DN SOOPers", period: "2025.12 - 현재" },
    ],
    domesticTitles: ["주요 LCK 우승 기록 없음"],
    internationalTitles: ["주요 국제대회 우승 기록 없음"],
  },
};

export function getLckTeamHistory(teamId: string): LckTeamHistory {
  return (
    lckTeamHistories[teamId] ?? {
      nameHistory: [{ name: "LCK 참가 구단", period: "기록 정리 중" }],
      domesticTitles: ["주요 국내 우승 기록 정리 중"],
      internationalTitles: ["주요 국제대회 기록 정리 중"],
    }
  );
}
