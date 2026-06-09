import type { Player } from "../../types/game";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function calculatePlayerMarketValue(player: Player) {
  if (player.rosterTier === "academy") {
    const abilityValue = Math.max(0, player.overall - 58) * 0.55;
    const potentialValue = Math.max(0, player.potential - player.overall) * 0.22;
    const brandValue =
      player.marketProfile.marketability * 0.025 +
      player.marketProfile.fanbase * 0.015 -
      player.marketProfile.brandRisk * 0.01;

    return clamp(6 + abilityValue + potentialValue + brandValue, 6, 22);
  }

  const abilityValue = Math.max(0, player.overall - 50) * 3.8;
  const potentialValue = Math.max(0, player.potential - player.overall) * 2.2;
  const brandValue =
    player.marketProfile.marketability * 0.28 +
    player.marketProfile.fanbase * 0.18 -
    player.marketProfile.brandRisk * 0.16;

  return clamp(
    abilityValue + potentialValue + brandValue + 18,
    20,
    320,
  );
}

export function blendPlayerSalaryExpectation(
  currentSalary: number,
  marketValue: number,
  player?: Player,
) {
  const isAcademy = player?.rosterTier === "academy";

  return clamp(
    currentSalary * 0.85 + marketValue * 0.15,
    isAcademy ? 6 : 20,
    isAcademy ? 24 : 320,
  );
}
