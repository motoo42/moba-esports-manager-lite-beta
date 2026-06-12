import { clampNumber } from "./shared";

export function getBaseMoodScore({
  baseMinimumSalary,
  salaryOffer,
  visibleDemand,
}: {
  baseMinimumSalary: number;
  salaryOffer: number;
  visibleDemand: number;
}) {
  const salary = Math.max(0, salaryOffer);

  if (salary >= visibleDemand) {
    return 100;
  }

  if (salary >= baseMinimumSalary) {
    const spread = Math.max(1, visibleDemand - baseMinimumSalary);

    return 72 + ((salary - baseMinimumSalary) / spread) * 24;
  }

  const ratio =
    baseMinimumSalary > 0 ? salary / baseMinimumSalary : salary > 0 ? 1 : 0;

  if (ratio >= 0.98) {
    return 69;
  }

  if (ratio >= 0.94) {
    return 62 + ((ratio - 0.94) / 0.04) * 6;
  }

  if (ratio >= 0.86) {
    return 47 + ((ratio - 0.86) / 0.08) * 13;
  }

  if (ratio >= 0.7) {
    return 25 + ((ratio - 0.7) / 0.16) * 20;
  }

  return (ratio / 0.7) * 24;
}

export function getMoodMinimumMultiplier(moodScore: number) {
  if (moodScore >= 50) {
    return 1 - ((moodScore - 50) / 50) * 0.04;
  }

  return 1 + ((50 - moodScore) / 50) * 0.06;
}

export function mixColor(
  from: [number, number, number],
  to: [number, number, number],
  ratio: number,
) {
  return from.map((value, index) =>
    Math.round(value + (to[index] - value) * ratio),
  ) as [number, number, number];
}

export function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

export function getOffseasonMoodColor(moodScore: number) {
  const score = clampNumber(moodScore, 0, 100);
  const red: [number, number, number] = [0xef, 0x44, 0x44];
  const white: [number, number, number] = [0xf8, 0xfa, 0xfc];
  const green: [number, number, number] = [0x22, 0xc5, 0x5e];
  const [r, g, b] =
    score <= 50
      ? mixColor(red, white, score / 50)
      : mixColor(white, green, (score - 50) / 50);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
