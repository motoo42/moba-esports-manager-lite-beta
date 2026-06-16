import { getItemGoldTotal, getMatchItems } from "../items";
import type { Role } from "../../types/game";
import type { LiveMatchItemSlot, LiveMatchSide } from "./types";

// Purchase-ordered builds per side/role: the order in which items COMPLETE through the
// game. Unlike a final-screen build, boots come early (≈2nd completed item) like a real
// game, so the item slots fill in a believable sequence as the replay advances. Same
// curated item selections as the old static slots, just time-ordered.
const buildOrderBySideAndRole: Record<LiveMatchSide, Record<Role, string[]>> = {
  blue: {
    top: ["3071", "3047", "3161", "6333", "3053", "3065"],
    jungle: ["6631", "3158", "3078", "6333", "6692", "3053"],
    mid: ["6655", "3020", "3089", "3157", "3135", "4645"],
    bot: ["3031", "3006", "6672", "3094", "3036", "6676"],
    support: ["3869", "3047", "3190", "3109", "3107", "3222"],
  },
  red: {
    top: ["6662", "3111", "3071", "3053", "3065", "3075"],
    jungle: ["3068", "3158", "3075", "6665", "2502", "6664"],
    mid: ["3003", "3020", "4645", "3089", "3157", "3135"],
    bot: ["3031", "3006", "6676", "6673", "3036", "3094"],
    support: ["3876", "3111", "3109", "3190", "3222", "3504"],
  },
};

export function getLiveMatchBuildOrder(side: LiveMatchSide, role: Role): string[] {
  return buildOrderBySideAndRole[side][role];
}

// Proportional purchase model: an item is "completed" once the player's gold — as a
// fraction of their FINAL gold — covers the build's cumulative cost up to that item. So
// the curated build fills steadily and finishes on the last frame, scaled to the actual
// game length, regardless of exact prices. `progress` = gold(t) / finalGold (0..1).
export function getOwnedItemIdsAt(
  buildItemIds: string[],
  progress: number,
): string[] {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const totalCost = buildItemIds.reduce(
    (sum, id) => sum + getItemGoldTotal(id),
    0,
  );

  if (totalCost <= 0) {
    return [];
  }

  const budget = clampedProgress * totalCost;
  const owned: string[] = [];
  let cumulative = 0;

  for (const id of buildItemIds) {
    cumulative += getItemGoldTotal(id);

    if (cumulative > budget) {
      break;
    }

    owned.push(id);
  }

  return owned;
}

// A player's item slots at a given progress through the game: the owned items in
// purchase order. The stat board pulls boots into their own slot and pads the rest, so
// returning just the owned items (variable length) is enough.
export function getLiveMatchItemSlotsAt(
  side: LiveMatchSide,
  role: Role,
  progress: number,
): LiveMatchItemSlot[] {
  const ownedIds = getOwnedItemIdsAt(getLiveMatchBuildOrder(side, role), progress);

  return getMatchItems(ownedIds);
}
