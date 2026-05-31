import { calculateChampionFit, type Champion } from "../champions";
import { draftRoles } from "./createDraftTeams";
import type { DraftContext, DraftPick, DraftResult, DraftTeam } from "./draftTypes";
import type { DraftPickSummary, Role, StrategyId } from "../../types/game";

type DraftSidePicks = Partial<Record<Role, DraftPick>>;

const defaultBanCount = 3;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getChampionName(champions: Champion[], championId: string) {
  return champions.find((champion) => champion.id === championId)?.name ?? championId;
}

function toPickSummary(pick: DraftPick): DraftPickSummary {
  return {
    championId: pick.champion.id,
    championName: pick.champion.name,
    fitScore: pick.fit.score,
    reasons: pick.fit.reasons,
  };
}

function getStrategyPower(champion: Champion, strategy: StrategyId) {
  if (strategy === "aggressive") {
    return champion.lanePower * 0.34 + champion.engagePower * 0.33 + champion.pokePower * 0.33;
  }

  if (strategy === "tempo") {
    return champion.lanePower * 0.38 + champion.engagePower * 0.26 + champion.metaScore * 0.2 + champion.pokePower * 0.16;
  }

  if (strategy === "macro") {
    return champion.pokePower * 0.32 + champion.scalingPower * 0.28 + champion.lanePower * 0.25 + champion.metaScore * 0.15;
  }

  if (strategy === "vision") {
    return champion.pokePower * 0.32 + champion.engagePower * 0.28 + champion.metaScore * 0.24 + champion.teamfightPower * 0.16;
  }

  if (strategy === "scaling") {
    return champion.scalingPower * 0.45 + champion.teamfightPower * 0.35 + champion.metaScore * 0.2;
  }

  return champion.teamfightPower * 0.36 + champion.scalingPower * 0.24 + champion.engagePower * 0.22 + champion.metaScore * 0.18;
}

function calculateSynergyBonus(picks: DraftPick[]) {
  const tagCounts = new Map<string, number>();

  for (const pick of picks) {
    for (const tag of pick.champion.synergyTags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const repeatedTagBonus = [...tagCounts.values()].filter((count) => count >= 2).length * 2;
  const completeRosterBonus = picks.length === draftRoles.length ? 2 : 0;

  return clamp(repeatedTagBonus + completeRosterBonus, 0, 10);
}

function calculateDraftPower(picksByRole: DraftSidePicks, strategy: StrategyId) {
  const picks = Object.values(picksByRole);
  const fitAverage = average(picks.map((pick) => pick.fit.score));
  const strategyAverage = average(
    picks.map((pick) => getStrategyPower(pick.champion, strategy)),
  );
  const synergyBonus = calculateSynergyBonus(picks);

  return Math.round(clamp(fitAverage * 0.72 + strategyAverage * 0.22 + synergyBonus, 0, 100));
}

function chooseBansAgainstTeam(
  targetTeam: DraftTeam,
  champions: Champion[],
  blockedChampionIds: Set<string>,
  banCount: number,
) {
  const candidates = champions
    .filter((champion) => !blockedChampionIds.has(champion.id))
    .map((champion) => {
      const bestFit = draftRoles.reduce((best, role) => {
        const player = targetTeam.players[role];

        if (!player || !champion.roles.includes(role)) {
          return best;
        }

        const fit = calculateChampionFit({
          player,
          champion,
          role,
          strategy: targetTeam.strategy,
        });

        return Math.max(best, fit.score);
      }, 0);

      return {
        champion,
        score: bestFit + champion.metaScore * 0.2,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((first, second) => second.score - first.score);

  return candidates.slice(0, banCount).map((candidate) => candidate.champion.id);
}

function pickBestForRole({
  team,
  role,
  champions,
  fearlessBlockedChampionIds,
  inGameBlockedChampionIds,
  notes,
}: {
  team: DraftTeam;
  role: Role;
  champions: Champion[];
  fearlessBlockedChampionIds: Set<string>;
  inGameBlockedChampionIds: Set<string>;
  notes: string[];
}): DraftPick | null {
  const player = team.players[role];

  if (!player) {
    notes.push(`${team.name} has no ${role} starter for draft scoring.`);
    return null;
  }

  const availableCandidates = champions.filter(
    (champion) =>
      champion.roles.includes(role) &&
      !fearlessBlockedChampionIds.has(champion.id) &&
      !inGameBlockedChampionIds.has(champion.id),
  );
  const fallbackCandidates = champions.filter(
    (champion) =>
      champion.roles.includes(role) && !inGameBlockedChampionIds.has(champion.id),
  );
  const candidates = availableCandidates.length > 0 ? availableCandidates : fallbackCandidates;

  if (availableCandidates.length === 0 && fallbackCandidates.length > 0) {
    notes.push(`${team.name} reused a fearless-blocked ${role} champion because the sample pool is still small.`);
  }

  const bestPick = candidates
    .map((champion) => ({
      champion,
      fit: calculateChampionFit({
        player,
        champion,
        role,
        strategy: team.strategy,
      }),
    }))
    .sort((first, second) => second.fit.score - first.fit.score)[0];

  if (!bestPick) {
    notes.push(`${team.name} could not draft a ${role} champion.`);
    return null;
  }

  return {
    role,
    player,
    champion: bestPick.champion,
    fit: bestPick.fit,
  };
}

export function runSimpleDraft({
  blueTeam,
  redTeam,
  champions,
  context,
}: {
  blueTeam: DraftTeam;
  redTeam: DraftTeam;
  champions: Champion[];
  context: DraftContext;
}): DraftResult {
  const notes: string[] = [];
  const banCount = context.banCount ?? defaultBanCount;
  const fearlessBlockedChampionIds = new Set(
    context.fearlessEnabled ? context.unavailableChampionIds : [],
  );
  const inGameBlockedChampionIds = new Set<string>();

  if (fearlessBlockedChampionIds.size > 0) {
    notes.push(`${fearlessBlockedChampionIds.size} champions are unavailable by fearless rules.`);
  }

  const blueBanIds = chooseBansAgainstTeam(
    redTeam,
    champions,
    new Set([...fearlessBlockedChampionIds, ...inGameBlockedChampionIds]),
    banCount,
  );
  blueBanIds.forEach((championId) => inGameBlockedChampionIds.add(championId));

  const redBanIds = chooseBansAgainstTeam(
    blueTeam,
    champions,
    new Set([...fearlessBlockedChampionIds, ...inGameBlockedChampionIds]),
    banCount,
  );
  redBanIds.forEach((championId) => inGameBlockedChampionIds.add(championId));

  const bluePicks: DraftSidePicks = {};
  const redPicks: DraftSidePicks = {};

  for (const role of draftRoles) {
    const bluePick = pickBestForRole({
      team: blueTeam,
      role,
      champions,
      fearlessBlockedChampionIds,
      inGameBlockedChampionIds,
      notes,
    });

    if (bluePick) {
      bluePicks[role] = bluePick;
      inGameBlockedChampionIds.add(bluePick.champion.id);
    }

    const redPick = pickBestForRole({
      team: redTeam,
      role,
      champions,
      fearlessBlockedChampionIds,
      inGameBlockedChampionIds,
      notes,
    });

    if (redPick) {
      redPicks[role] = redPick;
      inGameBlockedChampionIds.add(redPick.champion.id);
    }
  }

  const blueDraftPower = calculateDraftPower(bluePicks, blueTeam.strategy);
  const redDraftPower = calculateDraftPower(redPicks, redTeam.strategy);
  const netDraftPower = Math.round(clamp((blueDraftPower - redDraftPower) / 4, -10, 10));
  const bestBluePick = Object.values(bluePicks).sort(
    (first, second) => second.fit.score - first.fit.score,
  )[0];

  notes.push(
    `Draft power: ${blueTeam.name} ${blueDraftPower}, ${redTeam.name} ${redDraftPower}.`,
  );

  if (bestBluePick) {
    notes.push(
      `Best fit: ${bestBluePick.player.name} ${bestBluePick.champion.name} (${bestBluePick.fit.score}).`,
    );
  }

  return {
    bluePicks: Object.fromEntries(
      Object.entries(bluePicks).map(([role, pick]) => [role, toPickSummary(pick)]),
    ),
    redPicks: Object.fromEntries(
      Object.entries(redPicks).map(([role, pick]) => [role, toPickSummary(pick)]),
    ),
    blueBans: blueBanIds.map((championId) => getChampionName(champions, championId)),
    redBans: redBanIds.map((championId) => getChampionName(champions, championId)),
    blueDraftPower,
    redDraftPower,
    netDraftPower,
    notes,
    usedChampionIds: [
      ...Object.values(bluePicks).map((pick) => pick.champion.id),
      ...Object.values(redPicks).map((pick) => pick.champion.id),
    ],
  };
}
