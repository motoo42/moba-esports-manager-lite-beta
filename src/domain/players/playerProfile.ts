import type { Player } from "../../types/game";

export type PlayerCareerEntry = {
  note?: string;
  period: string;
  teamName: string;
};

const profileSummariesByName: Record<string, string> = {
  Chovy:
    "LCK를 대표하는 미드 라이너 중 한 명입니다. 뛰어난 라인전과 안정적인 캐리력으로 팀의 경기 기준점을 높이는 선수입니다.",
  Faker:
    "LCK와 국제대회의 역사를 상징하는 미드 라이너입니다. 오랜 기간 정상권에서 경쟁하며 팀의 중심 역할을 맡아왔습니다.",
  Keria:
    "넓은 챔피언 폭과 창의적인 플레이메이킹으로 경기를 흔드는 서포터입니다. 라인전과 한타 양쪽에서 영향력이 큰 선수입니다.",
  Zeus:
    "강한 메카닉과 한타 영향력을 갖춘 탑 라이너입니다. 상위권 팀의 핵심 전력으로 높은 평가를 받습니다.",
};

const careerEntriesByName: Record<string, PlayerCareerEntry[]> = {
  Chovy: [
    {
      teamName: "Griffin",
      period: "2018.03 ~ 2019.11",
      note: "LCK 정상권 미드 라이너로 이름을 알린 시기",
    },
    {
      teamName: "DRX / Hanwha Life Esports / Gen.G",
      period: "2019.12 ~ 현재",
      note: "여러 팀에서 에이스 역할을 이어온 커리어",
    },
  ],
  Faker: [
    {
      teamName: "SK Telecom T1 / T1",
      period: "2013.02 ~ 현재",
      note: "LCK와 국제대회 우승 경력을 쌓아온 프랜차이즈 스타",
    },
  ],
  Keria: [
    {
      teamName: "DRX",
      period: "2019.11 ~ 2020.11",
      note: "LCK 데뷔 후 빠르게 주목받은 시기",
    },
    {
      teamName: "T1",
      period: "2020.11 ~ 현재",
      note: "국내외 정상권에서 활약한 서포터 커리어",
    },
  ],
  Zeus: [
    {
      teamName: "T1",
      period: "2020.11 ~ 2024.11",
      note: "T1에서 성장해 정상급 탑 라이너로 자리잡은 시기",
    },
    {
      teamName: "Hanwha Life Esports",
      period: "2024.11 ~ 현재",
      note: "새로운 우승권 로스터에서 이어가는 커리어",
    },
  ],
};

export function getPlayerProfileSummary(player: Player) {
  return (
    profileSummariesByName[player.name] ??
    "이 선수의 세부 능력치는 공개되지 않습니다. 현재 화면에서는 평가, 상태, 계약 맥락과 커리어 기록을 중심으로 확인합니다."
  );
}

export function getPlayerCareerEntries(player: Player): PlayerCareerEntry[] {
  const knownEntries = careerEntriesByName[player.name];

  if (knownEntries) {
    return knownEntries;
  }

  return [
    {
      teamName: player.currentTeam ?? "FA",
      period: "2026.01 ~ 현재",
      note:
        player.rosterTier === "academy"
          ? "아카데미 로스터 등록 선수"
          : player.rosterTier === "free-agent"
            ? "현재 시장에서 확인 가능한 FA 선수"
            : "현재 시즌 등록 선수",
    },
  ];
}
