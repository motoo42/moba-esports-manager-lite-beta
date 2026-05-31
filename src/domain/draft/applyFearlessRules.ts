import type { Champion } from "../champions";
import type { MatchDraftSummary } from "../../types/game";

export function applyFearlessRules(
  champions: Champion[],
  usedChampionIds: string[],
) {
  const usedSet = new Set(usedChampionIds);

  return champions.filter((champion) => !usedSet.has(champion.id));
}

export function collectPickedChampionIds(draft: MatchDraftSummary) {
  return [
    ...Object.values(draft.bluePicks),
    ...Object.values(draft.redPicks),
  ].flatMap((pick) => (pick ? [pick.championId] : []));
}
