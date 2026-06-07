import { createInitialCareer } from "../domain/career/createInitialCareer";
import {
  type CareerProgressResult,
  progressCareer,
  simulatePracticeMatch,
} from "../domain/game-progress/progressCareer";
import { applyCallUpMoraleBoost } from "../domain/player-status";
import {
  createContractsForRoster,
  getSelectedRosterPlayerIds,
  splitRosterByStarter,
  validateFullRoster,
  type ContractTypeSelections,
} from "../domain/roster";
import {
  completeStoveLeague,
  initializeOffseasonMarket,
  releaseExpiredOffseasonPlayer,
  renewExpiredContractsForOffseason,
  setAsianGamesPlayMode,
  submitFreeAgentOffer,
  submitOffseasonRenewalOffer,
  startNextSeasonFromOffseason,
  type OffseasonContractOfferInput,
} from "../domain/season";
import type { AppRoute } from "./routes";
import type {
  AsianGamesPlayMode,
  CareerSave,
  CompetitionId,
  Player,
  Role,
  StrategyId,
  TrainingIntensity,
} from "../types/game";

export type GameState = {
  route: AppRoute;
  career: CareerSave | null;
  lastMatch: CareerProgressResult["lastMatch"];
  selectedCompetitionId: CompetitionId | null;
};

export type GameAction =
  | { type: "start-career"; teamName: string }
  | { type: "load-career"; career: CareerSave }
  | { type: "go-to"; route: AppRoute }
  | {
      type: "sync-route";
      route: AppRoute;
      competitionId?: CompetitionId | null;
    }
  | { type: "view-competition"; competitionId?: CompetitionId | null }
  | { type: "sign-roster-player"; player: Player }
  | { type: "release-roster-player"; playerId: string }
  | { type: "set-roster-player"; role: Role; player: Player | null }
  | { type: "confirm-roster"; contractTypes: ContractTypeSelections }
  | { type: "renew-expired-contracts"; contractTypes: ContractTypeSelections }
  | { type: "start-offseason-market" }
  | {
      type: "submit-offseason-renewal-offer";
      offer: OffseasonContractOfferInput;
    }
  | { type: "release-expired-offseason-player"; playerId: string }
  | { type: "submit-free-agent-offer"; offer: OffseasonContractOfferInput }
  | { type: "start-next-season" }
  | { type: "set-strategy"; strategy: StrategyId }
  | { type: "set-training-intensity"; trainingIntensity: TrainingIntensity }
  | {
      type: "set-asian-games-play-mode";
      playMode: Exclude<AsianGamesPlayMode, "undecided">;
    }
  | { type: "simulate-next-match" }
  | { type: "progress-season" }
  | { type: "commit-progress-result"; result: CareerProgressResult };

export const initialGameState: GameState = {
  route: "career-setup",
  career: null,
  lastMatch: null,
  selectedCompetitionId: null,
};

function getSelectedCompetitionIdForRoute(
  state: GameState,
  route: AppRoute,
  competitionId?: CompetitionId | null,
) {
  if (route !== "competition-dashboard") {
    return state.selectedCompetitionId;
  }

  return (
    competitionId ??
    state.career?.seasonState.currentCompetitionId ??
    state.selectedCompetitionId ??
    null
  );
}

function getRouteForCareer(career: CareerSave): AppRoute {
  if (career.seasonState.phase === "completed") {
    return "season-summary";
  }

  if (career.seasonState.phase === "offseason") {
    const offseasonStatus = career.seasonState.offseason?.status;

    return offseasonStatus === "active" || offseasonStatus === "ready-for-next-season"
      ? "offseason"
      : "season-summary";
  }

  return "main-dashboard";
}

function commitProgressResult(
  state: GameState,
  result: CareerProgressResult,
): GameState {
  return {
    ...state,
    route: getRouteForCareer(result.career),
    career: result.career,
    lastMatch: result.lastMatch,
    selectedCompetitionId: result.career.seasonState.currentCompetitionId,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === "start-career") {
    return {
      ...state,
      career: createInitialCareer(action.teamName),
      route: "roster-builder",
      lastMatch: null,
      selectedCompetitionId: null,
    };
  }

  if (action.type === "load-career") {
    return {
      ...state,
      career: action.career,
      route: getRouteForCareer(action.career),
      lastMatch: null,
      selectedCompetitionId: action.career.seasonState.currentCompetitionId,
    };
  }

  if (action.type === "sync-route") {
    return {
      ...state,
      route: action.route,
      selectedCompetitionId: getSelectedCompetitionIdForRoute(
        state,
        action.route,
        action.competitionId,
      ),
    };
  }

  if (action.type === "go-to") {
    return {
      ...state,
      route: action.route,
      selectedCompetitionId: getSelectedCompetitionIdForRoute(
        state,
        action.route,
      ),
    };
  }

  if (action.type === "view-competition") {
    return {
      ...state,
      route: "competition-dashboard",
      selectedCompetitionId: getSelectedCompetitionIdForRoute(
        state,
        "competition-dashboard",
        action.competitionId,
      ),
    };
  }

  if (action.type === "set-roster-player") {
    if (!state.career) {
      return state;
    }

    const nextRoster = { ...state.career.userTeam.roster };
    const nextAcademyRosterPlayerIds = [
      ...state.career.userTeam.academyRosterPlayerIds,
    ];
    const previousStarterId = nextRoster[action.role];

    if (action.player) {
      if (previousStarterId && previousStarterId !== action.player.id) {
        nextAcademyRosterPlayerIds.push(previousStarterId);
      }

      nextRoster[action.role] = action.player.id;
    } else {
      delete nextRoster[action.role];

      if (previousStarterId) {
        nextAcademyRosterPlayerIds.push(previousStarterId);
      }
    }

    const starterPlayerIds = Object.values(nextRoster).filter(
      (playerId): playerId is string => Boolean(playerId),
    );
    const starterIds = new Set(starterPlayerIds);
    const dedupedAcademyRosterPlayerIds = [...new Set(nextAcademyRosterPlayerIds)].filter(
      (playerId) => !starterIds.has(playerId),
    );
    const isContractedRoster = state.career.userTeam.contracts.length > 0;
    const contractedPlayerIds = state.career.userTeam.contracts.map(
      (contract) => contract.playerId,
    );
    const nextLckPlayers =
      isContractedRoster &&
      action.player &&
      previousStarterId !== action.player.id
        ? applyCallUpMoraleBoost(state.career.lckPlayers, action.player.id)
        : state.career.lckPlayers;

    return {
      ...state,
      career: {
        ...state.career,
        lckPlayers: nextLckPlayers,
        userTeam: {
          ...state.career.userTeam,
          roster: nextRoster,
          mainRosterPlayerIds: isContractedRoster
            ? starterPlayerIds
            : state.career.userTeam.mainRosterPlayerIds,
          academyRosterPlayerIds: isContractedRoster
            ? contractedPlayerIds.filter((playerId) => !starterIds.has(playerId))
            : dedupedAcademyRosterPlayerIds,
        },
      },
    };
  }

  if (action.type === "sign-roster-player") {
    if (!state.career) {
      return state;
    }

    const selectedPlayerIds = new Set(getSelectedRosterPlayerIds(state.career.userTeam));

    if (selectedPlayerIds.has(action.player.id)) {
      return state;
    }

    return {
      ...state,
      career: {
        ...state.career,
        userTeam: {
          ...state.career.userTeam,
          academyRosterPlayerIds: [
            ...state.career.userTeam.academyRosterPlayerIds,
            action.player.id,
          ],
        },
      },
    };
  }

  if (action.type === "release-roster-player") {
    if (!state.career) {
      return state;
    }

    const nextRoster = { ...state.career.userTeam.roster };

    Object.entries(nextRoster).forEach(([role, playerId]) => {
      if (playerId === action.playerId) {
        delete nextRoster[role as Role];
      }
    });

    return {
      ...state,
      career: {
        ...state.career,
        userTeam: {
          ...state.career.userTeam,
          roster: nextRoster,
          mainRosterPlayerIds: state.career.userTeam.mainRosterPlayerIds.filter(
            (playerId) => playerId !== action.playerId,
          ),
          academyRosterPlayerIds: state.career.userTeam.academyRosterPlayerIds.filter(
            (playerId) => playerId !== action.playerId,
          ),
          contracts: state.career.userTeam.contracts.filter(
            (contract) => contract.playerId !== action.playerId,
          ),
        },
      },
    };
  }

  if (action.type === "confirm-roster") {
    if (!state.career) {
      return state;
    }

    const validation = validateFullRoster({
      team: state.career.userTeam,
      players: state.career.lckPlayers,
      contractTypes: action.contractTypes,
    });

    if (!validation.isValid) {
      return state;
    }

    const selectedPlayerIds = validation.selectedPlayerIds;
    const splitRoster = splitRosterByStarter(state.career.userTeam, selectedPlayerIds);
    const contracts = createContractsForRoster({
      playerIds: selectedPlayerIds,
      players: state.career.lckPlayers,
      contractTypes: action.contractTypes,
    });

    return {
      ...state,
      route: "main-dashboard",
      career: {
        ...state.career,
        seasonState: completeStoveLeague(state.career.seasonState),
        userTeam: {
          ...state.career.userTeam,
          ...splitRoster,
          contracts,
        },
      },
    };
  }

  if (action.type === "set-strategy") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      career: {
        ...state.career,
        weeklyPlan: {
          ...state.career.weeklyPlan,
          strategy: action.strategy,
        },
      },
    };
  }

  if (action.type === "set-training-intensity") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      career: {
        ...state.career,
        weeklyPlan: {
          ...state.career.weeklyPlan,
          trainingIntensity: action.trainingIntensity,
        },
      },
    };
  }

  if (action.type === "set-asian-games-play-mode") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      route: "competition-dashboard",
      selectedCompetitionId: "asian-games",
      career: {
        ...state.career,
        seasonState: setAsianGamesPlayMode(
          state.career.seasonState,
          action.playMode,
        ),
      },
    };
  }

  if (action.type === "renew-expired-contracts") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      route: "season-summary",
      career: renewExpiredContractsForOffseason({
        career: state.career,
        contractTypes: action.contractTypes,
      }),
    };
  }

  if (action.type === "start-offseason-market") {
    if (!state.career) {
      return state;
    }

    const nextCareer = initializeOffseasonMarket(state.career);

    return {
      ...state,
      route: getRouteForCareer(nextCareer),
      career: nextCareer,
      lastMatch: null,
      selectedCompetitionId: nextCareer.seasonState.currentCompetitionId,
    };
  }

  if (action.type === "submit-offseason-renewal-offer") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      route: "offseason",
      career: submitOffseasonRenewalOffer(state.career, action.offer),
    };
  }

  if (action.type === "release-expired-offseason-player") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      route: "offseason",
      career: releaseExpiredOffseasonPlayer(state.career, action.playerId),
    };
  }

  if (action.type === "submit-free-agent-offer") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      route: "offseason",
      career: submitFreeAgentOffer(state.career, action.offer),
    };
  }

  if (action.type === "start-next-season") {
    if (!state.career) {
      return state;
    }

    const nextCareer = startNextSeasonFromOffseason(state.career);

    return {
      ...state,
      route: getRouteForCareer(nextCareer),
      career: nextCareer,
      lastMatch: null,
      selectedCompetitionId: nextCareer.seasonState.currentCompetitionId,
    };
  }

  if (action.type === "commit-progress-result") {
    return commitProgressResult(state, action.result);
  }

  if (action.type === "progress-season") {
    if (!state.career) {
      return state;
    }

    return commitProgressResult(state, progressCareer(state.career));
  }

  if (action.type === "simulate-next-match") {
    if (!state.career) {
      return state;
    }

    return {
      ...state,
      ...simulatePracticeMatch(state.career),
    };
  }

  return state;
}
