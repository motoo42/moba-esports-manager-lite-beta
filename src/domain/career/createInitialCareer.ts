import { normalSeasonCompetitions } from "../../data/competitions";
import { sampleOpponents } from "../../data/sampleOpponents";
import { samplePlayers } from "../../data/samplePlayers";
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
    lckPlayers: samplePlayers,
    internationalOpponents: sampleOpponents,
    weeklyPlan: {
      strategy: "balanced",
      trainingIntensity: "normal",
    },
    seasonState: createInitialSeasonState({
      seasonNumber: 1,
      userTeamName,
    }),
    seasonHistory: [
      {
        seasonNumber: 1,
        calendarType: "normal",
        lckResult: normalSeasonCompetitions[0].name,
        finalElo: 1500,
      },
    ],
  };
}
