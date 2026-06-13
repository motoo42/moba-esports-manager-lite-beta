import { lck2026Teams } from "../../../data/lckTeams";
import type {
  CareerSave,
  ContractType,
  OffseasonNegotiationContext,
  OffseasonOffer,
  Player,
  Role,
} from "../../../types/game";
import {
  getAiMainRoleCount,
  isAiMainRosterCandidate,
} from "../offseasonRosterAutomation";
import { getOffseasonContractDemand } from "./demand";
import { getOffseasonNegotiationSnapshot } from "./negotiation";
import {
  evaluateOffer,
  getOfferScore,
  getTeamBudgetSnapshot,
  getTeamNeedScore,
} from "./offerEvaluation";
import { createOffer } from "./offerFactory";
import {
  getAvailableFreeAgentPlayers,
  setPlayerCurrentTeam,
} from "./playerPool";
import { appendLog, getCurrentOffseasonDay, removeValue } from "./shared";
import { roleOrder } from "./validation";

function getAiRoleCount(players: Player[], teamName: string, role: Role) {
  return getAiMainRoleCount(players, teamName, role);
}

function hashString(value: string) {
  return [...value].reduce(
    (total, char) => (total * 31 + char.charCodeAt(0)) % 100000,
    17,
  );
}

function getAiOfferMultiplier({
  career,
  demand,
  player,
  teamName,
}: {
  career: CareerSave;
  demand: number;
  player: Player;
  teamName: string;
}) {
  const currentDay = getCurrentOffseasonDay(career);
  const hash = hashString(`${player.id}:${teamName}:${currentDay}:offer-range`);
  const profile = lck2026Teams.find((team) => team.name === teamName);
  const needScore = getTeamNeedScore({ career, player, teamName });
  const { budget, remainingBudget } = getTeamBudgetSnapshot(career, teamName);
  const budgetRoomRatio = demand > 0 ? remainingBudget / demand : 1;
  const budgetModifier = Math.max(-0.24, Math.min(0.22, (budgetRoomRatio - 2) * 0.08));
  const needModifier = needScore / 150;
  const starModifier = player.overall >= 85 ? 0.08 : player.overall >= 78 ? 0.03 : -0.03;
  const appealModifier = ((profile?.appealModifier ?? 0) + (budget / 900 - 0.5)) * 0.04;
  const volatility = ((hash % 71) - 35) / 100;
  const maxMultiplier =
    budgetRoomRatio < 0.75 ? 0.92 : budgetRoomRatio < 1 ? 0.98 : 1.48;
  const rawMultiplier =
    0.96 +
    budgetModifier +
    needModifier +
    starModifier +
    appealModifier +
    volatility;
  const cappedMultiplier =
    rawMultiplier > maxMultiplier
      ? maxMultiplier - ((hashString(`${teamName}:${player.id}:cap`) % 9) / 100)
      : rawMultiplier;

  return Math.max(0.68, Math.min(maxMultiplier, cappedMultiplier));
}

export function getAiCandidateTeams(career: CareerSave, player: Player) {
  if (!isAiMainRosterCandidate(player)) {
    return [];
  }

  const userTeamName = career.userTeam.name.trim().toLowerCase();

  return lck2026Teams
    .filter((team) => team.name.trim().toLowerCase() !== userTeamName)
    .map((team) => ({
      team,
      needScore: getTeamNeedScore({
        career,
        player,
        teamName: team.name,
      }),
    }))
    .filter(({ needScore }) => needScore > 0)
    .sort((left, right) => {
      const needDiff = right.needScore - left.needScore;

      if (needDiff !== 0) {
        return needDiff;
      }

      return left.team.previousSeasonRank - right.team.previousSeasonRank;
    })
    .slice(0, 3);
}

export function createAiOffer({
  career,
  context = "free-agent",
  player,
  teamName,
}: {
  career: CareerSave;
  context?: OffseasonNegotiationContext;
  player: Player;
  teamName: string;
}) {
  const currentDay = getCurrentOffseasonDay(career);
  const hash = hashString(`${player.id}:${teamName}:${currentDay}`);
  const contractType: ContractType = hash % 3 === 0 ? "two-year" : "one-year";
  const demand = getOffseasonContractDemand(player, contractType);
  const salaryOffer = Math.round(
    demand *
      getAiOfferMultiplier({
        career,
        demand,
        player,
        teamName,
      }),
  );
  const requestedRosterRole =
    getAiRoleCount(career.lckPlayers, teamName, player.role) === 0
      ? "starter"
      : "sixth-man";
  const snapshot = getOffseasonNegotiationSnapshot({
    career,
    context,
    contractType,
    player,
    requestedRosterRole,
    salaryOffer,
    teamName,
  });
  const offer = createOffer({
    career,
    contractType,
    fromTeamName: teamName,
    minAcceptableSalary: snapshot.minAcceptableSalary,
    moodScore: snapshot.moodScore,
    negotiationContext: context,
    playerId: player.id,
    requestedRosterRole,
    salaryOffer,
    status: "pending",
    visibleDemand: snapshot.visibleDemand,
  });

  return {
    ...offer,
    id: `${offer.id}-${hashString(teamName)}`,
    score: getOfferScore({
      career,
      contractType,
      player,
      salaryOffer,
      teamName,
    }),
  };
}

function resolveAiCompetitionForPlayer({
  career,
  context = "ai-depth",
  player,
}: {
  career: CareerSave;
  context?: OffseasonNegotiationContext;
  player: Player;
}) {
  const evaluatedOffers = getAiCandidateTeams(career, player).map(({ team }) => {
    const offer = createAiOffer({
      career,
      context,
      player,
      teamName: team.name,
    });

    return evaluateOffer({
      career,
      context,
      offer,
      player,
    });
  });
  const winningOffer = evaluatedOffers
    .filter((offer) => offer.isAcceptable)
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))[0];

  return {
    evaluatedOffers,
    winningOffer,
    rejectedOffers: evaluatedOffers
      .filter((offer) => offer.id !== winningOffer?.id)
      .map(
        (offer): OffseasonOffer => ({
          ...offer,
          status: "rejected",
          resolvedDay: getCurrentOffseasonDay(career),
          rejectionReason: "minimum-salary-not-met",
        }),
      ),
  };
}

function getAiDepthTarget(career: CareerSave, teamName: string) {
  return roleOrder.find(
    (role) => getAiRoleCount(career.lckPlayers, teamName, role) < 2,
  );
}

function pickAiDepthCandidate({
  career,
  excludedPlayerIds,
  role,
}: {
  career: CareerSave;
  excludedPlayerIds: Set<string>;
  role: Role;
}) {
  return getAvailableFreeAgentPlayers(career, excludedPlayerIds)
    .filter(
      (player) => player.role === role && isAiMainRosterCandidate(player),
    )
    .sort((left, right) => {
      const rightScore = right.overall * 1.5 + right.potential * 0.35;
      const leftScore = left.overall * 1.5 + left.potential * 0.35;
      const scoreDiff = rightScore - leftScore;

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return left.id.localeCompare(right.id);
    })[0];
}

export function resolveAiDepthSignings(
  career: CareerSave,
  excludedPlayerIds: Set<string>,
) {
  const offseason = career.seasonState.offseason;
  const currentDay = getCurrentOffseasonDay(career);

  if (!offseason || currentDay < 8 || currentDay >= 28) {
    return career;
  }

  const userTeamName = career.userTeam.name.trim().toLowerCase();
  const maxSigningsPerDay = 3;
  let nextCareer = career;
  let signingCount = 0;
  const claimedPlayerIds = new Set(excludedPlayerIds);

  for (const team of [...lck2026Teams].sort(
    (left, right) => left.previousSeasonRank - right.previousSeasonRank,
  )) {
    if (signingCount >= maxSigningsPerDay) {
      break;
    }

    if (team.name.trim().toLowerCase() === userTeamName) {
      continue;
    }

    const targetRole = getAiDepthTarget(nextCareer, team.name);

    if (!targetRole) {
      continue;
    }

    const player = pickAiDepthCandidate({
      career: nextCareer,
      excludedPlayerIds: claimedPlayerIds,
      role: targetRole,
    });

    if (!player) {
      continue;
    }

    const { evaluatedOffers, rejectedOffers, winningOffer } =
      resolveAiCompetitionForPlayer({
        career: nextCareer,
        context: "ai-depth",
        player,
      });

    if (!winningOffer) {
      continue;
    }

    const currentOffseason = nextCareer.seasonState.offseason;

    if (!currentOffseason) {
      break;
    }

    const acceptedAiOffer: OffseasonOffer = {
      ...winningOffer,
      status: "accepted",
      resolvedDay: getCurrentOffseasonDay(nextCareer),
    };
    const winningTeamName = acceptedAiOffer.fromTeamName;
    nextCareer = {
      ...nextCareer,
      lckPlayers: setPlayerCurrentTeam(
        nextCareer.lckPlayers,
        player.id,
        winningTeamName,
      ),
      seasonState: {
        ...nextCareer.seasonState,
        offseason: {
          ...currentOffseason,
          resolvedOffers: [
            ...(currentOffseason.resolvedOffers ?? []),
            acceptedAiOffer,
            ...rejectedOffers,
          ],
          freeAgentPlayerIds: removeValue(
            currentOffseason.freeAgentPlayerIds ?? [],
            player.id,
          ),
          validationErrors: [],
        },
      },
    };
    nextCareer = appendLog(
      nextCareer,
      "ai-signing",
      `${player.name} FA 영입 경쟁에서 ${winningTeamName}이 승리했습니다. 경쟁 ${evaluatedOffers.length}팀.`,
    );
    claimedPlayerIds.add(player.id);
    signingCount += 1;
  }

  return nextCareer;
}
