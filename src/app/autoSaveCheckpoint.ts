import type { CareerSave } from "../types/game";

export function getAutosaveName(career: CareerSave) {
  return `${career.userTeam.name} S${career.currentSeason} Autosave`;
}

export function getCareerAutoSaveCheckpoint(career: CareerSave) {
  const seasonState = career.seasonState;
  const rosterFingerprint = [
    Object.entries(career.userTeam.roster)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([position, playerId]) => `${position}:${playerId ?? "empty"}`)
      .join(","),
    career.userTeam.mainRosterPlayerIds.join(","),
    career.userTeam.academyRosterPlayerIds.join(","),
    career.userTeam.wins,
    career.userTeam.losses,
    career.userTeam.elo,
  ].join(":");
  const weeklyPlanFingerprint = [
    career.weeklyPlan.strategy,
    career.weeklyPlan.trainingIntensity,
  ].join(":");
  const seasonHistoryFingerprint = career.seasonHistory
    .map((summary) =>
      [
        summary.seasonNumber,
        summary.yearLabel ?? "no-year",
        summary.lckResult,
        summary.finalElo,
        summary.worldsChampionTeamName ?? "no-worlds-champion",
        summary.offseasonSummary?.renewedPlayerIds?.join(",") ?? "",
        summary.offseasonSummary?.releasedPlayerIds?.join(",") ?? "",
        summary.offseasonSummary?.signedPlayerIds?.join(",") ?? "",
        summary.offseasonSummary?.aiSigningCount ?? 0,
        summary.offseasonSummary?.retiredPlayerIds?.join(",") ?? "",
        summary.offseasonSummary?.militaryServicePlayerIds?.join(",") ?? "",
        summary.offseasonSummary?.notableLogEntries?.length ?? 0,
      ].join(":"),
    )
    .join("|");
  const playerLifecycleFingerprint = career.lckPlayers
    .map((player) =>
      [
        player.id,
        player.age,
        player.overall,
        player.ability,
        player.potential,
        player.salaryExpectation,
        player.cost,
        player.currentTeam ?? "free-agent",
        player.rosterTier ?? "no-tier",
        player.status.form,
        player.status.fatigue,
        player.status.morale,
        player.militaryServiceStatus ?? "military-unknown",
        player.retirementCandidate ? "retirement-watch" : "active",
      ].join(":"),
    )
    .join("|");
  const asianGamesFingerprint = seasonState.asianGames
    ? [
        seasonState.asianGames.status,
        seasonState.asianGames.playMode,
        seasonState.asianGames.roster
          .map((member) => `${member.playerId}:${member.isStarter}`)
          .join(","),
        seasonState.asianGames.medals?.goldTeamId ?? "no-gold",
        seasonState.asianGames.medals?.silverTeamId ?? "no-silver",
        seasonState.asianGames.medals?.bronzeTeamId ?? "no-bronze",
      ].join(":")
    : "no-asian-games";
  const competitionFingerprint = seasonState.competitions
    .map(
      (competition) =>
        `${competition.competitionId}:${competition.status}:${competition.currentStageName}:${competition.completed}:${competition.schedule.length}:${competition.qualifiedTeamIds.join(",")}`,
    )
    .join("|");
  const contractFingerprint = career.userTeam.contracts
    .map(
      (contract) =>
        `${contract.playerId}:${contract.type}:${contract.remainingYears}:${contract.salary}`,
    )
    .join("|");
  const offseasonFingerprint = seasonState.offseason
    ? [
        seasonState.offseason.status,
        seasonState.offseason.completedSeasonNumber,
        seasonState.offseason.nextSeasonNumber ?? "final",
        seasonState.offseason.currentDay ?? "no-day",
        seasonState.offseason.currentWeek ?? "no-week",
        seasonState.offseason.marketStatus ?? "no-market",
        seasonState.offseason.expiredContractPlayerIds.join(","),
        seasonState.offseason.renewedPlayerIds.join(","),
        seasonState.offseason.resolvedExpiredPlayerIds?.join(",") ?? "",
        seasonState.offseason.releasedPlayerIds?.join(",") ?? "",
        seasonState.offseason.signedPlayerIds?.join(",") ?? "",
        seasonState.offseason.retiredPlayerIds?.join(",") ?? "",
        seasonState.offseason.militaryServicePlayerIds?.join(",") ?? "",
        seasonState.offseason.freeAgentPlayerIds?.join(",") ?? "",
        seasonState.offseason.pendingOffers
          ?.map(
            (offer) =>
              `${offer.id}:${offer.status}:${offer.negotiationContext ?? "legacy"}:${offer.playerIds.join(",")}:${offer.salaryOffer}:${offer.minAcceptableSalary ?? "no-min"}:${offer.requestedRosterRole ?? "no-role"}`,
          )
          .join(",") ?? "",
        seasonState.offseason.resolvedOffers
          ?.map(
            (offer) =>
              `${offer.id}:${offer.status}:${offer.negotiationContext ?? "legacy"}:${offer.playerIds.join(",")}:${offer.salaryOffer}:${offer.minAcceptableSalary ?? "no-min"}:${offer.rejectionReason ?? "no-reason"}:${offer.requestedRosterRole ?? "no-role"}`,
          )
          .join(",") ?? "",
        seasonState.offseason.logEntries?.length ?? 0,
      ].join(":")
    : "no-offseason";
  const worldsFingerprint = seasonState.worlds
    ? [
        seasonState.worlds.status,
        seasonState.worlds.championTeamId ?? "no-champion",
        seasonState.worlds.runnerUpTeamId ?? "no-runner-up",
      ].join(":")
    : "no-worlds";

  return [
    career.currentSeason,
    career.seasonHistory.length,
    seasonHistoryFingerprint,
    contractFingerprint,
    rosterFingerprint,
    weeklyPlanFingerprint,
    playerLifecycleFingerprint,
    seasonState.phase,
    seasonState.currentCompetitionId,
    seasonState.currentDateKey,
    seasonState.currentTurn,
    seasonState.progressStatus,
    seasonState.matchRecords.length,
    competitionFingerprint,
    asianGamesFingerprint,
    worldsFingerprint,
    offseasonFingerprint,
  ].join("::");
}
