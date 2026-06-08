import {
  createContractsForRoster,
  getSelectedRosterPlayerIds,
  splitRosterByStarter,
  validateFullRoster,
} from "../../domain/roster";
import { completeStoveLeague } from "../../domain/season";
import type { Role } from "../../types/game";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";

type RosterAction = Extract<
  GameAction,
  {
    type:
      | "sign-roster-player"
      | "release-roster-player"
      | "set-roster-player"
      | "call-up-player"
      | "send-down-player"
      | "confirm-roster";
  }
>;

function uniqueIds(playerIds: Array<string | undefined>) {
  return [...new Set(playerIds.filter((playerId): playerId is string => Boolean(playerId)))];
}

function getActiveContractedPlayerIds(state: GameState) {
  if (!state.career) {
    return new Set<string>();
  }

  return new Set(
    state.career.userTeam.contracts
      .filter((contract) => contract.remainingYears > 0)
      .map((contract) => contract.playerId),
  );
}

function isActiveContractedPlayer(state: GameState, playerId: string) {
  if (!state.career) {
    return false;
  }

  const activeContractIds = getActiveContractedPlayerIds(state);
  const player = state.career.lckPlayers.find((candidate) => candidate.id === playerId);

  return activeContractIds.has(playerId) && Boolean(player?.availableForRoster);
}

function handleSetRosterPlayerAction(
  state: GameState,
  action: Extract<GameAction, { type: "set-roster-player" }>,
): GameState {
  if (!state.career) {
    return state;
  }

  const nextRoster = { ...state.career.userTeam.roster };
  const previousStarterId = nextRoster[action.role];

  if (action.player) {
    nextRoster[action.role] = action.player.id;
  } else {
    delete nextRoster[action.role];
  }

  const starterPlayerIds = Object.values(nextRoster).filter(
    (playerId): playerId is string => Boolean(playerId),
  );
  const isContractedRoster = state.career.userTeam.contracts.length > 0;
  const activeContractIds = getActiveContractedPlayerIds(state);
  const mainRosterPlayerIds = uniqueIds([
    ...state.career.userTeam.mainRosterPlayerIds,
    ...starterPlayerIds,
    previousStarterId,
    action.player?.id,
  ]).filter((playerId) => !isContractedRoster || activeContractIds.has(playerId));
  const mainRosterPlayerIdSet = new Set(mainRosterPlayerIds);
  const academyRosterPlayerIds = state.career.userTeam.academyRosterPlayerIds.filter(
    (playerId) =>
      !mainRosterPlayerIdSet.has(playerId) &&
      (!isContractedRoster || activeContractIds.has(playerId)),
  );
  return {
    ...state,
    career: {
      ...state.career,
      userTeam: {
        ...state.career.userTeam,
        roster: nextRoster,
        mainRosterPlayerIds,
        academyRosterPlayerIds,
      },
    },
  };
}

function handleCallUpPlayerAction(
  state: GameState,
  action: Extract<GameAction, { type: "call-up-player" }>,
): GameState {
  if (!state.career || !isActiveContractedPlayer(state, action.playerId)) {
    return state;
  }

  if (state.career.userTeam.mainRosterPlayerIds.includes(action.playerId)) {
    return state;
  }

  return {
    ...state,
    career: {
      ...state.career,
      userTeam: {
        ...state.career.userTeam,
        mainRosterPlayerIds: uniqueIds([
          ...state.career.userTeam.mainRosterPlayerIds,
          action.playerId,
        ]),
        academyRosterPlayerIds: state.career.userTeam.academyRosterPlayerIds.filter(
          (playerId) => playerId !== action.playerId,
        ),
      },
    },
  };
}

function handleSendDownPlayerAction(
  state: GameState,
  action: Extract<GameAction, { type: "send-down-player" }>,
): GameState {
  if (!state.career || !isActiveContractedPlayer(state, action.playerId)) {
    return state;
  }

  const starterIds = new Set(Object.values(state.career.userTeam.roster));

  if (starterIds.has(action.playerId)) {
    return state;
  }

  if (!state.career.userTeam.mainRosterPlayerIds.includes(action.playerId)) {
    return state;
  }

  return {
    ...state,
    career: {
      ...state.career,
      userTeam: {
        ...state.career.userTeam,
        mainRosterPlayerIds: state.career.userTeam.mainRosterPlayerIds.filter(
          (playerId) => playerId !== action.playerId,
        ),
        academyRosterPlayerIds: uniqueIds([
          ...state.career.userTeam.academyRosterPlayerIds,
          action.playerId,
        ]),
      },
    },
  };
}

function handleSignRosterPlayerAction(
  state: GameState,
  action: Extract<GameAction, { type: "sign-roster-player" }>,
): GameState {
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

function handleReleaseRosterPlayerAction(
  state: GameState,
  action: Extract<GameAction, { type: "release-roster-player" }>,
): GameState {
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

function handleConfirmRosterAction(
  state: GameState,
  action: Extract<GameAction, { type: "confirm-roster" }>,
): GameState {
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

export function handleRosterAction(
  state: GameState,
  action: RosterAction,
): GameState {
  switch (action.type) {
    case "set-roster-player":
      return handleSetRosterPlayerAction(state, action);
    case "call-up-player":
      return handleCallUpPlayerAction(state, action);
    case "send-down-player":
      return handleSendDownPlayerAction(state, action);
    case "sign-roster-player":
      return handleSignRosterPlayerAction(state, action);
    case "release-roster-player":
      return handleReleaseRosterPlayerAction(state, action);
    case "confirm-roster":
      return handleConfirmRosterAction(state, action);
  }
}
