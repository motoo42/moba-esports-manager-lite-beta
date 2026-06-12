import type {
  CareerSave,
  ContractType,
  OffseasonNegotiationContext,
  OffseasonRequestedRosterRole,
  Player,
} from "../../../types/game";
import {
  getOffseasonMinimumAcceptableSalary,
  getOffseasonVisibleDemandSalary,
} from "./demand";
import {
  getBaseMoodScore,
  getMoodMinimumMultiplier,
  getOffseasonMoodColor,
} from "./mood";
import { clampNumber, getCurrentOffseasonDay } from "./shared";

function getNegotiationHistory({
  career,
  context,
  playerId,
  teamName,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  playerId: string;
  teamName: string;
}) {
  return (career.seasonState.offseason?.resolvedOffers ?? []).filter(
    (offer) =>
      offer.fromTeamName === teamName &&
      offer.playerIds.includes(playerId) &&
      (offer.negotiationContext ?? "free-agent") === context,
  );
}

function getHistoryMoodModifier({
  career,
  context,
  playerId,
  teamName,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  playerId: string;
  teamName: string;
}) {
  const history = getNegotiationHistory({
    career,
    context,
    playerId,
    teamName,
  });
  const modifier = history.reduce((total, offer) => {
    if (offer.status === "accepted") {
      return total + 8;
    }

    if (offer.status === "lost") {
      return total - 6;
    }

    if (offer.status !== "rejected") {
      return total - 3;
    }

    const referenceSalary = offer.minAcceptableSalary ?? offer.visibleDemand;
    const ratio =
      referenceSalary && referenceSalary > 0
        ? offer.salaryOffer / referenceSalary
        : 0;

    if (ratio >= 0.98) {
      return total + 4;
    }

    if (ratio >= 0.94) {
      return total - 2;
    }

    if (ratio >= 0.86) {
      return total - 8;
    }

    return total - 14;
  }, 0);

  return clampNumber(modifier, -34, 14);
}

function getCurrentRosterRoleForNegotiation({
  career,
  player,
  teamName,
}: {
  career: CareerSave;
  player: Player;
  teamName: string;
}): OffseasonRequestedRosterRole {
  if (teamName === career.userTeam.name) {
    if (career.userTeam.roster[player.role] === player.id) {
      return "starter";
    }

    if (career.userTeam.mainRosterPlayerIds.includes(player.id)) {
      return "sixth-man";
    }

    if (career.userTeam.academyRosterPlayerIds.includes(player.id)) {
      return "academy";
    }
  }

  if (player.rosterTier === "main") {
    return "starter";
  }

  if (player.rosterTier === "academy") {
    return "academy";
  }

  return player.overall >= 70 ? "sixth-man" : "academy";
}

function getRoleNegotiationEffect({
  career,
  player,
  requestedRosterRole,
  teamName,
}: {
  career: CareerSave;
  player: Player;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  teamName: string;
}) {
  if (!requestedRosterRole) {
    return {
      minimumMultiplier: 1,
      moodModifier: 0,
    };
  }

  const currentRole = getCurrentRosterRoleForNegotiation({
    career,
    player,
    teamName,
  });

  if (currentRole === requestedRosterRole) {
    return {
      minimumMultiplier: 1,
      moodModifier: 0,
    };
  }

  if (currentRole === "starter" && requestedRosterRole === "academy") {
    return {
      minimumMultiplier: 1.35,
      moodModifier: -20,
    };
  }

  if (currentRole === "starter" && requestedRosterRole === "sixth-man") {
    return {
      minimumMultiplier: 1.12,
      moodModifier: -8,
    };
  }

  if (currentRole === "sixth-man" && requestedRosterRole === "academy") {
    return {
      minimumMultiplier: 1.12,
      moodModifier: -8,
    };
  }

  if (currentRole === "academy" && requestedRosterRole === "starter") {
    return {
      minimumMultiplier: 0.84,
      moodModifier: 14,
    };
  }

  if (currentRole === "academy" && requestedRosterRole === "sixth-man") {
    return {
      minimumMultiplier: 0.92,
      moodModifier: 8,
    };
  }

  if (currentRole === "sixth-man" && requestedRosterRole === "starter") {
    return {
      minimumMultiplier: 0.95,
      moodModifier: 6,
    };
  }

  return {
    minimumMultiplier: 1,
    moodModifier: 0,
  };
}

export function getOffseasonNegotiationSnapshot({
  career,
  context,
  contractType,
  player,
  requestedRosterRole,
  salaryOffer,
  teamName = career.userTeam.name,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  contractType: ContractType;
  player: Player;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  salaryOffer: number;
  teamName?: string;
}) {
  const day = getCurrentOffseasonDay(career);
  const marketMinimumSalary = getOffseasonMinimumAcceptableSalary({
    context,
    contractType,
    day,
    player,
  });
  const marketVisibleDemand = getOffseasonVisibleDemandSalary({
    context,
    contractType,
    day,
    player,
  });
  const roleEffect = getRoleNegotiationEffect({
    career,
    player,
    requestedRosterRole,
    teamName,
  });
  const baseMinimumSalary = Math.ceil(
    marketMinimumSalary * roleEffect.minimumMultiplier,
  );
  const visibleDemand = Math.max(
    baseMinimumSalary + 5,
    Math.ceil(marketVisibleDemand * roleEffect.minimumMultiplier),
  );
  const moodScore = Math.round(
    clampNumber(
      getBaseMoodScore({
        baseMinimumSalary,
        salaryOffer,
        visibleDemand,
      }) +
        getHistoryMoodModifier({
          career,
          context,
          playerId: player.id,
          teamName,
        }) +
        roleEffect.moodModifier,
      0,
      100,
    ),
  );
  const minAcceptableSalary = Math.ceil(
    baseMinimumSalary * getMoodMinimumMultiplier(moodScore),
  );

  return {
    baseMinimumSalary,
    minAcceptableSalary,
    moodColor: getOffseasonMoodColor(moodScore),
    moodScore,
    visibleDemand,
  };
}
