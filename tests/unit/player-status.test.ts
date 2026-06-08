import { describe, expect, it } from "vitest";
import { samplePlayers } from "../../src/data/samplePlayers";
import {
  applyWeeklyPlayerStatusChanges,
  clampStatusValue,
  decreaseMorale,
  getMoraleLabel,
  increaseMorale,
} from "../../src/domain/player-status";

describe("player status", () => {
  it("clamps numeric status values between 0 and 100", () => {
    expect(clampStatusValue(-7)).toBe(0);
    expect(clampStatusValue(53.6)).toBe(54);
    expect(clampStatusValue(124)).toBe(100);
  });

  it("moves morale through the approved five discrete levels", () => {
    expect(getMoraleLabel("very-high")).toBe("최상");
    expect(increaseMorale("neutral")).toBe("high");
    expect(increaseMorale("very-high")).toBe("very-high");
    expect(decreaseMorale("neutral")).toBe("low");
    expect(decreaseMorale("very-low")).toBe("very-low");
  });

  it("changes starter status after a win and only applies training recovery to bench players", () => {
    const starter = {
      ...samplePlayers[0],
      status: {
        ...samplePlayers[0].status,
        form: 70,
        fatigue: 20,
        morale: "neutral" as const,
      },
    };
    const bench = {
      ...samplePlayers[1],
      status: {
        ...samplePlayers[1].status,
        form: 70,
        fatigue: 20,
        morale: "neutral" as const,
      },
    };
    const [updatedStarter, updatedBench] = applyWeeklyPlayerStatusChanges({
      players: [starter, bench],
      roster: { top: starter.id },
      contractedPlayerIds: [starter.id, bench.id],
      trainingIntensity: "normal",
      userResult: "win",
    });

    expect(updatedStarter.status.form).toBe(72);
    expect(updatedStarter.status.fatigue).toBe(28);
    expect(updatedStarter.status.morale).toBe("high");
    expect(updatedBench.status.form).toBe(70);
    expect(updatedBench.status.fatigue).toBe(16);
    expect(updatedBench.status.morale).toBe("neutral");
  });
});
