import { describe, expect, it } from "vitest";
import {
  calculateMsiWorldsSeedAllocation,
  createLckWorldsSeeds,
  createWorldsEntrants,
  normalizeLeagueCode,
} from "../../src/domain/season";
import type {
  CompetitionState,
  MatchRecord,
  MatchSchedule,
} from "../../src/types/game";

function createMatch({
  blueTeamId,
  blueTeamName,
  id,
  redTeamId,
  redTeamName,
}: Pick<
  MatchSchedule,
  "blueTeamId" | "blueTeamName" | "id" | "redTeamId" | "redTeamName"
>): MatchSchedule {
  return {
    id,
    competitionId: "msi",
    week: 1,
    scheduledDate: "2026-06-20",
    stageName: "MSI",
    blueTeamId,
    blueTeamName,
    redTeamId,
    redTeamName,
    format: "bo5",
    status: "completed",
    fearlessEnabled: false,
  };
}

function createRecord(match: MatchSchedule, winnerTeamId: string): MatchRecord {
  const winnerSide = match.blueTeamId === winnerTeamId ? "blue" : "red";

  return {
    id: `${match.id}-record`,
    scheduleId: match.id,
    competitionId: "msi",
    week: match.week,
    stageName: match.stageName,
    winnerSide,
    winnerTeamId,
    winnerTeamName:
      winnerSide === "blue" ? match.blueTeamName : match.redTeamName,
    score: {
      blueWins: winnerSide === "blue" ? 3 : 2,
      redWins: winnerSide === "red" ? 3 : 2,
    },
    userResult: "none",
    log: [],
    createdAtTurn: 1,
  };
}

function createMsiCompetitionForWorldsSeeds() {
  const teams = [
    ["t1", "T1", 1],
    ["msi-lpl-1", "Bilibili Gaming", 2],
    ["msi-lec-1", "G2 Esports", 3],
    ["msi-lcs-1", "Cloud9", 4],
    ["msi-lcp-1", "PSG Talon", 5],
    ["msi-cblol-1", "LOUD", 6],
    ["gen-g", "Gen.G", 7],
    ["msi-lpl-2", "Top Esports", 8],
    ["msi-lec-2", "Fnatic", 9],
    ["msi-lcs-2", "FlyQuest", 10],
    ["msi-lcp-2", "GAM Esports", 11],
  ] as const;
  const schedule = [
    createMatch({
      id: "msi-play-in-semifinal-1",
      blueTeamId: "gen-g",
      blueTeamName: "Gen.G",
      redTeamId: "msi-lcp-2",
      redTeamName: "GAM Esports",
    }),
    createMatch({
      id: "msi-play-in-semifinal-2",
      blueTeamId: "msi-lec-2",
      blueTeamName: "Fnatic",
      redTeamId: "msi-lcs-2",
      redTeamName: "FlyQuest",
    }),
    createMatch({
      id: "msi-play-in-final",
      blueTeamId: "gen-g",
      blueTeamName: "Gen.G",
      redTeamId: "msi-lec-2",
      redTeamName: "Fnatic",
    }),
    createMatch({
      id: "msi-lower-round-1-a",
      blueTeamId: "msi-lcs-1",
      blueTeamName: "Cloud9",
      redTeamId: "msi-cblol-1",
      redTeamName: "LOUD",
    }),
    createMatch({
      id: "msi-lower-round-1-b",
      blueTeamId: "msi-lcp-1",
      blueTeamName: "PSG Talon",
      redTeamId: "msi-lpl-2",
      redTeamName: "Top Esports",
    }),
    createMatch({
      id: "msi-lower-round-2-a",
      blueTeamId: "msi-lcs-1",
      blueTeamName: "Cloud9",
      redTeamId: "msi-lec-1",
      redTeamName: "G2 Esports",
    }),
    createMatch({
      id: "msi-lower-round-2-b",
      blueTeamId: "gen-g",
      blueTeamName: "Gen.G",
      redTeamId: "msi-lpl-2",
      redTeamName: "Top Esports",
    }),
    createMatch({
      id: "msi-lower-round-3",
      blueTeamId: "msi-lec-1",
      blueTeamName: "G2 Esports",
      redTeamId: "gen-g",
      redTeamName: "Gen.G",
    }),
    createMatch({
      id: "msi-lower-final",
      blueTeamId: "msi-lpl-1",
      blueTeamName: "Bilibili Gaming",
      redTeamId: "gen-g",
      redTeamName: "Gen.G",
    }),
    createMatch({
      id: "msi-grand-final",
      blueTeamId: "t1",
      blueTeamName: "T1",
      redTeamId: "gen-g",
      redTeamName: "Gen.G",
    }),
  ];

  return {
    competition: {
      competitionId: "msi",
      name: "MSI",
      status: "completed",
      currentStageName: "Completed",
      currentWeek: 1,
      standings: teams.map(([teamId, teamName, initialSeed]) => ({
        teamId,
        teamName,
        rank: initialSeed,
        initialSeed,
        wins: 0,
        losses: 0,
        matchWins: 0,
        matchLosses: 0,
        setWins: 0,
        setLosses: 0,
        winRate: 0,
        isUserTeam: teamId === "t1",
      })),
      schedule,
      qualifiedTeamIds: ["t1", "gen-g"],
      qualifiedTeamNames: ["T1", "Gen.G"],
      winnerTeamId: "t1",
      winnerTeamName: "T1",
      completed: true,
    } satisfies CompetitionState,
    records: schedule.map((match) => {
      const winnerByMatchId: Record<string, string> = {
        "msi-play-in-semifinal-1": "gen-g",
        "msi-play-in-semifinal-2": "msi-lec-2",
        "msi-play-in-final": "gen-g",
        "msi-lower-round-1-a": "msi-lcs-1",
        "msi-lower-round-1-b": "msi-lpl-2",
        "msi-lower-round-2-a": "msi-lec-1",
        "msi-lower-round-2-b": "gen-g",
        "msi-lower-round-3": "gen-g",
        "msi-lower-final": "gen-g",
        "msi-grand-final": "t1",
      };

      return createRecord(match, winnerByMatchId[match.id]);
    }),
  };
}

describe("Worlds qualification", () => {
  it("ranks MSI teams and awards bonus seeds to the two best leagues", () => {
    const { competition, records } = createMsiCompetitionForWorldsSeeds();
    const allocation = calculateMsiWorldsSeedAllocation(competition, records);

    expect(allocation.teamPlacements).toHaveLength(11);
    expect(allocation.bonusLeagueLabels).toEqual(["LCK", "LPL"]);
    expect(allocation.msiLeagueResults[0]).toMatchObject({
      leagueLabel: "LCK",
      bestTeamId: "t1",
      resultLabel: "MSI 우승",
    });
    expect(
      allocation.teamPlacements.find((placement) => placement.teamId === "msi-lcs-1")
        ?.rank,
    ).toBe(5);
    expect(
      allocation.teamPlacements.find((placement) => placement.teamId === "msi-lpl-2")
        ?.rank,
    ).toBe(6);
  });

  it("builds the 20-team Worlds pool with LCK bonus and LCQ placeholders", () => {
    const lckSeeds = createLckWorldsSeeds(
      [
        { teamId: "t1", teamName: "T1" },
        { teamId: "gen-g", teamName: "Gen.G" },
        { teamId: "hle", teamName: "Hanwha Life Esports" },
        { teamId: "dk", teamName: "Dplus KIA" },
      ],
      ["LCK", "LPL"],
    );
    const entrants = createWorldsEntrants({
      bonusLeagueLabels: ["LCK", "LPL"],
      lckSeeds,
    });

    expect(lckSeeds[3]).toMatchObject({
      teamId: "dk",
      status: "qualified",
      sourceLabel: "MSI 추가 시드",
    });
    expect(entrants).toHaveLength(20);
    expect(
      entrants.filter((entrant) => entrant.source === "lcq-placeholder"),
    ).toHaveLength(2);
    expect(
      entrants.some(
        (entrant) =>
          entrant.leagueLabel === "LPL" &&
          entrant.seed === 4 &&
          entrant.source === "msi-bonus",
      ),
    ).toBe(true);
  });

  it("keeps LCK fourth out when LCK misses the MSI bonus seed", () => {
    const lckSeeds = createLckWorldsSeeds(
      [
        { teamId: "t1", teamName: "T1" },
        { teamId: "gen-g", teamName: "Gen.G" },
        { teamId: "hle", teamName: "Hanwha Life Esports" },
        { teamId: "dk", teamName: "Dplus KIA" },
      ],
      ["LPL", "LEC"],
    );
    const entrants = createWorldsEntrants({
      bonusLeagueLabels: ["LPL", "LEC"],
      lckSeeds,
    });

    expect(lckSeeds[3]).toMatchObject({
      status: "conditional-missed",
      sourceLabel: "MSI 추가 시드 조건 미충족",
    });
    expect(entrants).toHaveLength(20);
    expect(entrants.some((entrant) => entrant.teamId === "dk")).toBe(false);
  });

  it("normalizes legacy LTA labels to LCS", () => {
    expect(normalizeLeagueCode("LTA")).toBe("LCS");
    expect(normalizeLeagueCode("lta")).toBe("LCS");
  });
});
