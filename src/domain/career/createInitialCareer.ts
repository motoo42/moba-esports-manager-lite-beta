import { sampleOpponents } from "../../data/sampleOpponents";
import { lck2026Players } from "../../data/lck2026Players";
import { createInitialSeasonState } from "../season";
import type { CareerSave } from "../../types/game";

export function createInitialCareer(teamName: string): CareerSave {
  const userTeamName = teamName.trim() || "T1";

  return {
    currentSeason: 1,
    maxSeason: 20,
    userTeam: {
      name: userTeamName,
      region: "lck",
      budget: 1200,
      rosterSettings: {
        minPlayers: 10,
        maxPlayers: 15,
        freeMovementBetweenMainAndAcademy: true,
      },
      roster: {},
      mainRosterPlayerIds: [],
      academyRosterPlayerIds: [],
      contracts: [],
      wins: 0,
      losses: 0,
      elo: 1500,
    },
    lckPlayers: lck2026Players,
    internationalOpponents: sampleOpponents,
    weeklyPlan: {
      strategy: "balanced",
      trainingIntensity: "normal",
    },
    seasonState: createInitialSeasonState({
      seasonNumber: 1,
      userTeamName,
    }),
    seasonHistory: [],
  };
}
