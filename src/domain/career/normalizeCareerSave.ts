import { sampleOpponents } from "../../data/sampleOpponents";
import { lck2026Players } from "../../data/lck2026Players";
import { getLck2026PlayerPortrait } from "../../data/lck2026PlayerPortraits";
import { ensurePlayerEvaluationStatus } from "../players";
import type {
  CareerSave,
  CareerMessage,
  OffseasonAiRenewalPlan,
  OffseasonLogEntry,
  OffseasonOffer,
  Player,
  SeasonOffseasonSummary,
  SeasonState,
  SeasonSummary,
  Team,
  WeeklyPlan,
} from "../../types/game";
import { normalizeCareerGuideState } from "./careerGuides";
import { createInitialCareer } from "./createInitialCareer";
import { createPreseasonStoveLeagueCareer } from "./preseasonStoveLeague";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asLogEntries(value: unknown): OffseasonLogEntry[] {
  return Array.isArray(value) ? (value as OffseasonLogEntry[]) : [];
}

function asOffers(value: unknown): OffseasonOffer[] {
  return Array.isArray(value) ? (value as OffseasonOffer[]) : [];
}

function asAiRenewalPlans(value: unknown): OffseasonAiRenewalPlan[] {
  return Array.isArray(value) ? (value as OffseasonAiRenewalPlan[]) : [];
}

function normalizeMessages(value: unknown): CareerMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((message) => {
      const dateKey =
        typeof message.dateKey === "string" ? message.dateKey : "unknown-date";
      const title = typeof message.title === "string" ? message.title : "알림";

      return {
        id:
          typeof message.id === "string"
            ? message.id
            : `legacy-message-${dateKey}-${title}`,
        dateKey,
        dateLabel:
          typeof message.dateLabel === "string" ? message.dateLabel : dateKey,
        category:
          typeof message.category === "string"
            ? (message.category as CareerMessage["category"])
            : "system",
        priority:
          typeof message.priority === "string"
            ? (message.priority as CareerMessage["priority"])
            : "normal",
        title,
        body: typeof message.body === "string" ? message.body : "",
        read: Boolean(message.read),
        createdTurn:
          typeof message.createdTurn === "number" ? message.createdTurn : 0,
        source:
          typeof message.source === "string"
            ? (message.source as CareerMessage["source"])
            : "system",
        relatedPlayerId:
          typeof message.relatedPlayerId === "string"
            ? message.relatedPlayerId
            : undefined,
        relatedTeamId:
          typeof message.relatedTeamId === "string"
            ? message.relatedTeamId
            : undefined,
        relatedCompetitionId:
          typeof message.relatedCompetitionId === "string"
            ? (message.relatedCompetitionId as CareerMessage["relatedCompetitionId"])
            : undefined,
      };
    });
}

function normalizeWeeklyPlan(value: Partial<WeeklyPlan> | undefined): WeeklyPlan {
  return {
    strategy: value?.strategy ?? "balanced",
    trainingIntensity: value?.trainingIntensity ?? "normal",
  };
}

function normalizeTeam(value: Partial<Team> | undefined, fallback: Team): Team {
  return {
    ...fallback,
    ...value,
    rosterSettings: {
      ...fallback.rosterSettings,
      ...(value?.rosterSettings ?? {}),
    },
    roster: value?.roster ?? fallback.roster,
    mainRosterPlayerIds: value?.mainRosterPlayerIds ?? [],
    academyRosterPlayerIds: value?.academyRosterPlayerIds ?? [],
    contracts: value?.contracts ?? [],
    wins: value?.wins ?? 0,
    losses: value?.losses ?? 0,
    elo: value?.elo ?? fallback.elo,
  };
}

function uniqueIds(playerIds: Array<string | undefined>) {
  return [...new Set(playerIds.filter((playerId): playerId is string => Boolean(playerId)))];
}

function normalizeTeamRosterBuckets(team: Team, players: Player[]): Team {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const starterIds = uniqueIds(Object.values(team.roster));
  const hasActiveContracts = team.contracts.some(
    (contract) => contract.remainingYears > 0,
  );
  const activeContractIds = new Set(
    team.contracts
      .filter((contract) => contract.remainingYears > 0)
      .map((contract) => contract.playerId),
  );
  const isValidRosterPlayer = (playerId: string) => {
    const player = playerById.get(playerId);

    if (!player?.availableForRoster) {
      return false;
    }

    return !hasActiveContracts || activeContractIds.has(playerId);
  };
  const mainRosterPlayerIds = uniqueIds([
    ...team.mainRosterPlayerIds,
    ...starterIds,
  ]).filter(isValidRosterPlayer);
  const mainRosterSet = new Set(mainRosterPlayerIds);
  const academyRosterPlayerIds = uniqueIds(team.academyRosterPlayerIds).filter(
    (playerId) => isValidRosterPlayer(playerId) && !mainRosterSet.has(playerId),
  );
  const assignedRosterSet = new Set([
    ...mainRosterPlayerIds,
    ...academyRosterPlayerIds,
  ]);

  if (hasActiveContracts) {
    activeContractIds.forEach((playerId) => {
      if (assignedRosterSet.has(playerId) || !isValidRosterPlayer(playerId)) {
        return;
      }

      const player = playerById.get(playerId);

      if (player?.rosterTier === "academy") {
        academyRosterPlayerIds.push(playerId);
        return;
      }

      mainRosterPlayerIds.push(playerId);
    });
  }

  return {
    ...team,
    mainRosterPlayerIds,
    academyRosterPlayerIds,
  };
}

function normalizePlayer(player: Player): Player {
  const baseStatus: Player["status"] = {
    form: player.status?.form ?? 50,
    evaluationForm: player.status?.evaluationForm,
    evaluationStars: player.status?.evaluationStars,
    fatigue: player.status?.fatigue ?? 0,
    morale: player.status?.morale ?? "neutral",
    condition: player.status?.condition ?? 100,
    injuryRisk: player.status?.injuryRisk ?? 5,
  };
  const normalized: Player = {
    ...player,
    secondaryRoles: player.secondaryRoles ?? [],
    availableForRoster: player.availableForRoster ?? true,
    militaryServiceStatus: player.militaryServiceStatus ?? "none",
    retirementCandidate: player.retirementCandidate ?? false,
    traits: player.traits ?? [],
    status: baseStatus,
    mindset: {
      pressureResistance: player.mindset?.pressureResistance ?? player.mental,
      clutch: player.mindset?.clutch ?? player.mental,
      consistency: player.mindset?.consistency ?? player.mental,
      tiltControl: player.mindset?.tiltControl ?? player.mental,
      leadership: player.mindset?.leadership ?? player.macro,
      teamwork: player.mindset?.teamwork ?? player.teamfight,
      communication: player.mindset?.communication ?? player.macro,
      affinity: player.mindset?.affinity ?? 70,
      professionalism: player.mindset?.professionalism ?? player.mental,
      ambition: player.mindset?.ambition ?? 70,
    },
    adaptability: {
      metaAdaptability:
        player.adaptability?.metaAdaptability ?? player.championPool,
      patchAdaptability:
        player.adaptability?.patchAdaptability ?? player.championPool,
      roleFlexibility: player.adaptability?.roleFlexibility ?? 50,
      championLearning:
        player.adaptability?.championLearning ?? player.championPool,
      internationalAdaptability:
        player.adaptability?.internationalAdaptability ?? player.mental,
    },
    chemistryProfile: {
      preferredTeammates: player.chemistryProfile?.preferredTeammates ?? [],
      dislikedTeammates: player.chemistryProfile?.dislikedTeammates ?? [],
      synergyTags: player.chemistryProfile?.synergyTags ?? [],
      playstyleTags: player.chemistryProfile?.playstyleTags ?? [],
      personalityTags: player.chemistryProfile?.personalityTags ?? [],
      languageTags: player.chemistryProfile?.languageTags ?? ["ko"],
    },
    championProfile: {
      preferredChampionIds: player.championProfile?.preferredChampionIds ?? [],
      dislikedChampionIds: player.championProfile?.dislikedChampionIds ?? [],
      signatureChampionIds: player.championProfile?.signatureChampionIds ?? [],
      masteryOverrides: player.championProfile?.masteryOverrides ?? {},
      preferredArchetypes: player.championProfile?.preferredArchetypes ?? [],
    },
    development: {
      growthRate: player.development?.growthRate ?? 45,
      peakAgeStart: player.development?.peakAgeStart ?? 22,
      peakAgeEnd: player.development?.peakAgeEnd ?? 27,
      declineRate: player.development?.declineRate ?? 35,
      prospectTier: player.development?.prospectTier,
    },
    marketProfile: {
      marketability: player.marketProfile?.marketability ?? 55,
      fanbase: player.marketProfile?.fanbase ?? 55,
      brandRisk: player.marketProfile?.brandRisk ?? 20,
      buyoutEstimate: player.marketProfile?.buyoutEstimate,
    },
  };
  normalized.status = ensurePlayerEvaluationStatus(normalized, normalized.status);
  const portrait = getLck2026PlayerPortrait(normalized);

  if (!portrait) {
    return normalized;
  }

  return {
    ...normalized,
    portraitUrl: portrait.portraitUrl,
    portraitSourceUrl: portrait.portraitSourceUrl,
  };
}

function normalizeOffseasonSummary(
  value: SeasonOffseasonSummary | undefined,
): SeasonOffseasonSummary | undefined {
  if (!value) {
    return undefined;
  }

  return {
    renewedPlayerIds: value.renewedPlayerIds ?? [],
    releasedPlayerIds: value.releasedPlayerIds ?? [],
    signedPlayerIds: value.signedPlayerIds ?? [],
    aiSigningCount: value.aiSigningCount ?? 0,
    retiredPlayerIds: value.retiredPlayerIds ?? [],
    militaryServicePlayerIds: value.militaryServicePlayerIds ?? [],
    notableLogEntries: value.notableLogEntries ?? [],
  };
}

function normalizeSeasonHistory(value: unknown): SeasonSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const summary = entry as SeasonSummary;

    return {
      ...summary,
      competitionResults: summary.competitionResults ?? [],
      expiredContractPlayerIds: summary.expiredContractPlayerIds ?? [],
      offseasonSummary: normalizeOffseasonSummary(summary.offseasonSummary),
    };
  });
}

function normalizeSeasonState(
  value: Partial<SeasonState> | undefined,
  fallback: SeasonState,
): SeasonState {
  const offseason = value?.offseason;

  return {
    ...fallback,
    ...value,
    stoveLeague: {
      ...fallback.stoveLeague,
      ...(value?.stoveLeague ?? {}),
    },
    competitions: value?.competitions ?? fallback.competitions,
    scheduledMatches: value?.scheduledMatches ?? [],
    matchRecords: value?.matchRecords ?? [],
    nextMatchIds: value?.nextMatchIds ?? [],
    lastMatchRecordIds: value?.lastMatchRecordIds ?? [],
    offseason: offseason
      ? {
          ...offseason,
          context: offseason.context ?? "postseason",
          expiredContractPlayerIds: offseason.expiredContractPlayerIds ?? [],
          renewedPlayerIds: offseason.renewedPlayerIds ?? [],
          freeAgentPlayerIds: offseason.freeAgentPlayerIds ?? [],
          pendingOffers: asOffers(offseason.pendingOffers),
          resolvedOffers: asOffers(offseason.resolvedOffers),
          releasedPlayerIds: asStringArray(offseason.releasedPlayerIds),
          signedPlayerIds: asStringArray(offseason.signedPlayerIds),
          resolvedExpiredPlayerIds: asStringArray(
            offseason.resolvedExpiredPlayerIds,
          ),
          retiredPlayerIds: asStringArray(offseason.retiredPlayerIds),
          militaryServicePlayerIds: asStringArray(
            offseason.militaryServicePlayerIds,
          ),
          aiRenewalPlans: asAiRenewalPlans(offseason.aiRenewalPlans),
          logEntries: asLogEntries(offseason.logEntries),
          validationErrors: asStringArray(offseason.validationErrors),
        }
      : undefined,
  };
}

export function normalizeCareerSave(value: CareerSave): CareerSave {
  const fallback = createInitialCareer(value.userTeam?.name ?? "T1");
  const lckPlayers = Array.isArray(value.lckPlayers)
    ? value.lckPlayers.map(normalizePlayer)
    : lck2026Players.map(normalizePlayer);
  const internationalOpponents = Array.isArray(value.internationalOpponents)
    ? value.internationalOpponents
    : sampleOpponents;
  const seasonHistory = normalizeSeasonHistory(value.seasonHistory);

  const normalized: CareerSave = {
    ...fallback,
    ...value,
    currentSeason: value.currentSeason ?? fallback.currentSeason,
    maxSeason: value.maxSeason ?? fallback.maxSeason,
    userTeam: normalizeTeamRosterBuckets(
      normalizeTeam(value.userTeam, fallback.userTeam),
      lckPlayers,
    ),
    lckPlayers,
    internationalOpponents,
    weeklyPlan: normalizeWeeklyPlan(value.weeklyPlan),
    seasonState: normalizeSeasonState(value.seasonState, fallback.seasonState),
    seasonHistory,
    messages: normalizeMessages(value.messages),
    guideState: normalizeCareerGuideState(value.guideState),
  };

  if (
    normalized.seasonState.phase === "stove-league" &&
    normalized.seasonState.stoveLeague.status === "active"
  ) {
    return createPreseasonStoveLeagueCareer(normalized);
  }

  return normalized;
}

export function normalizeCareerSaveFromUnknown(
  value: unknown,
): CareerSave | null {
  if (!isRecord(value)) {
    return null;
  }

  return normalizeCareerSave(value as CareerSave);
}
