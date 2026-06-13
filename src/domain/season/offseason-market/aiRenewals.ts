import { getLckTeamProfile, lck2026Teams } from "../../../data/lckTeams";
import type {
  CareerSave,
  OffseasonAiRenewalPlan,
  Player,
} from "../../../types/game";
import { createPlayerContract } from "../../players";
import { addUnique, appendLog, getCurrentOffseasonDay, setOffseasonState } from "./shared";

const maxAiRenewalsPerTeam = 2;

function normalizeTeamName(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function hashString(value: string) {
  return [...value].reduce(
    (total, char) => (total * 31 + char.charCodeAt(0)) % 100000,
    23,
  );
}

function addUniqueNumber(values: number[], value: number) {
  return values.includes(value) ? values : [...values, value];
}

function getPlayerMarketRank(player: Player) {
  return player.overall * 1.5 + player.potential * 0.35;
}

function sortRenewalCandidates(left: Player, right: Player) {
  const rankDiff = getPlayerMarketRank(right) - getPlayerMarketRank(left);

  if (rankDiff !== 0) {
    return rankDiff;
  }

  return left.id.localeCompare(right.id);
}

function getAiRenewalDecisionDays(teamName: string) {
  const firstDay = (hashString(`${teamName}:ai-renewal-a`) % 7) + 1;
  const secondSeed = (hashString(`${teamName}:ai-renewal-b`) % 6) + 1;
  const secondDay = secondSeed >= firstDay ? secondSeed + 1 : secondSeed;

  return [firstDay, secondDay].sort((left, right) => left - right);
}

function getTargetRenewalCount({
  players,
  teamName,
}: {
  players: Player[];
  teamName: string;
}) {
  const profile = getLckTeamProfile(teamName);
  const sortedPlayers = [...players].sort(sortRenewalCandidates);
  const topTwoAverageOverall =
    sortedPlayers
      .slice(0, maxAiRenewalsPerTeam)
      .reduce((total, player) => total + player.overall, 0) /
    Math.max(1, Math.min(maxAiRenewalsPerTeam, sortedPlayers.length));
  const budget = profile?.budget ?? 450;
  const strength = profile?.strength ?? 72;
  const swing = (hashString(`${teamName}:ai-renewal-target`) % 25) - 12;
  const retentionScore = strength + budget / 35 + topTwoAverageOverall / 2 + swing;

  if (retentionScore >= 142) {
    return 2;
  }

  if (retentionScore >= 124) {
    return 1;
  }

  return 0;
}

export function createAiRenewalPlans(
  players: Player[],
  userTeamName: string,
): OffseasonAiRenewalPlan[] {
  const userTeamKey = normalizeTeamName(userTeamName);

  return lck2026Teams
    .filter((team) => normalizeTeamName(team.name) !== userTeamKey)
    .map((team) => {
      const teamPlayers = players
        .filter(
          (player) =>
            normalizeTeamName(player.currentTeam) === normalizeTeamName(team.name) &&
            player.region === "lck" &&
            player.league === "LCK" &&
            player.rosterTier === "main" &&
            player.availableForRoster,
        )
        .sort(sortRenewalCandidates);

      return {
        teamName: team.name,
        decisionDays: getAiRenewalDecisionDays(team.name),
        candidatePlayerIds: teamPlayers.map((player) => player.id),
        targetRenewalCount: Math.min(
          maxAiRenewalsPerTeam,
          getTargetRenewalCount({
            players: teamPlayers,
            teamName: team.name,
          }),
        ),
        processedDays: [],
        renewedPlayerIds: [],
        releasedPlayerIds: [],
      };
    })
    .filter((plan) => plan.candidatePlayerIds.length > 0);
}

function getPlayer(players: Player[], playerId: string) {
  return players.find((player) => player.id === playerId);
}

function getCurrentAiRenewalSalary(
  players: Player[],
  renewedPlayerIds: string[],
) {
  return renewedPlayerIds.reduce((total, playerId) => {
    const player = getPlayer(players, playerId);

    return total + (player?.salaryExpectation ?? 0);
  }, 0);
}

function shouldRenewPlayer({
  career,
  plan,
  player,
  renewedPlayerIds,
}: {
  career: CareerSave;
  plan: OffseasonAiRenewalPlan;
  player: Player;
  renewedPlayerIds: string[];
}) {
  if (renewedPlayerIds.length >= plan.targetRenewalCount) {
    return false;
  }

  const profile = getLckTeamProfile(
    plan.teamName,
    career.seasonState.teamBalanceAdjustments,
  );
  const budget = profile?.budget ?? 450;
  const committedSalary = getCurrentAiRenewalSalary(
    career.lckPlayers,
    renewedPlayerIds,
  );
  const remainingBudget = budget - committedSalary;
  const salaryFitsBudget = player.salaryExpectation <= remainingBudget * 0.55;
  const rankPosition = plan.candidatePlayerIds.indexOf(player.id);

  return salaryFitsBudget && rankPosition >= 0 && rankPosition < plan.targetRenewalCount;
}

function getCandidateIdsForDay(plan: OffseasonAiRenewalPlan, day: number) {
  const dayIndex = plan.decisionDays.indexOf(day);
  const isLastDecisionDay = day === plan.decisionDays[plan.decisionDays.length - 1];
  const alreadyResolvedIds = new Set([
    ...plan.renewedPlayerIds,
    ...plan.releasedPlayerIds,
  ]);
  const remainingIds = plan.candidatePlayerIds.filter(
    (playerId) => !alreadyResolvedIds.has(playerId),
  );

  if (dayIndex < 0) {
    return [];
  }

  if (isLastDecisionDay) {
    return remainingIds;
  }

  return remainingIds.filter(
    (_playerId, index) => index % plan.decisionDays.length === dayIndex,
  );
}

function applyAiRenewalDecision({
  career,
  plan,
  playerId,
  releasedPlayerIds,
  renewedPlayerIds,
}: {
  career: CareerSave;
  plan: OffseasonAiRenewalPlan;
  playerId: string;
  releasedPlayerIds: string[];
  renewedPlayerIds: string[];
}) {
  const player = getPlayer(career.lckPlayers, playerId);
  const offseason = career.seasonState.offseason;

  if (!player || !offseason) {
    return {
      career,
      releasedPlayerIds,
      renewedPlayerIds,
    };
  }

  if (
    shouldRenewPlayer({
      career,
      plan,
      player,
      renewedPlayerIds,
    })
  ) {
    const contract = createPlayerContract({
      contractType: "one-year",
      playerId,
      salaryOffer: player.salaryExpectation,
    });
    const nextCareer = appendLog(
      {
        ...career,
        seasonState: {
          ...career.seasonState,
          offseason: {
            ...offseason,
            resolvedOffers: [
              ...(offseason.resolvedOffers ?? []),
              {
                id: `ai-renewal-${plan.teamName}-${playerId}-${getCurrentOffseasonDay(career)}`,
                kind: "contract",
                fromTeamName: plan.teamName,
                toTeamName: plan.teamName,
                playerIds: [playerId],
                salaryOffer: contract.salary,
                contractType: contract.type,
                status: "accepted",
                createdDay: getCurrentOffseasonDay(career),
                resolvedDay: getCurrentOffseasonDay(career),
                negotiationContext: "renewal",
                requestedRosterRole: "starter",
              },
            ],
          },
        },
      },
      "renewal",
      `${plan.teamName}이 ${player.name}과 재계약에 합의했습니다.`,
      { relatedTeamNames: [plan.teamName] },
    );

    return {
      career: nextCareer,
      releasedPlayerIds,
      renewedPlayerIds: addUnique(renewedPlayerIds, playerId),
    };
  }

  const nextCareer = appendLog(
    {
      ...career,
      lckPlayers: career.lckPlayers.map((candidate) =>
        candidate.id === playerId
          ? {
              ...candidate,
              currentTeam: undefined,
            }
          : candidate,
      ),
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...offseason,
          freeAgentPlayerIds: addUnique(offseason.freeAgentPlayerIds ?? [], playerId),
          releasedPlayerIds: addUnique(offseason.releasedPlayerIds ?? [], playerId),
        },
      },
    },
    "release",
    `${plan.teamName}이 ${player.name}을 방출했습니다. 해당 선수는 FA 시장에 등록됐습니다.`,
    { relatedTeamNames: [plan.teamName] },
  );

  return {
    career: nextCareer,
    releasedPlayerIds: addUnique(releasedPlayerIds, playerId),
    renewedPlayerIds,
  };
}

function processPlanForCurrentDay({
  career,
  day,
  plan,
}: {
  career: CareerSave;
  day: number;
  plan: OffseasonAiRenewalPlan;
}) {
  if (
    !plan.decisionDays.includes(day) ||
    plan.processedDays.includes(day)
  ) {
    return {
      career,
      plan,
    };
  }

  const result = getCandidateIdsForDay(plan, day).reduce(
    (current, playerId) =>
      applyAiRenewalDecision({
        career: current.career,
        plan,
        playerId,
        releasedPlayerIds: current.releasedPlayerIds,
        renewedPlayerIds: current.renewedPlayerIds,
      }),
    {
      career,
      releasedPlayerIds: plan.releasedPlayerIds,
      renewedPlayerIds: plan.renewedPlayerIds,
    },
  );

  return {
    career: result.career,
    plan: {
      ...plan,
      processedDays: addUniqueNumber(plan.processedDays, day),
      releasedPlayerIds: result.releasedPlayerIds,
      renewedPlayerIds: result.renewedPlayerIds,
    },
  };
}

export function processAiRenewalsForCurrentDay(career: CareerSave) {
  const offseason = career.seasonState.offseason;
  const day = getCurrentOffseasonDay(career);

  if (!offseason || day < 1 || day > 7 || !offseason.aiRenewalPlans?.length) {
    return career;
  }

  const processed = offseason.aiRenewalPlans.reduce<{
    career: CareerSave;
    plans: OffseasonAiRenewalPlan[];
  }>(
    (current, plan) => {
      const result = processPlanForCurrentDay({
        career: current.career,
        day,
        plan,
      });

      return {
        career: result.career,
        plans: [...current.plans, result.plan],
      };
    },
    {
      career,
      plans: [] as OffseasonAiRenewalPlan[],
    },
  );
  const latestOffseason = processed.career.seasonState.offseason;

  if (!latestOffseason) {
    return processed.career;
  }

  return setOffseasonState(processed.career, {
    ...latestOffseason,
    aiRenewalPlans: processed.plans,
  });
}
