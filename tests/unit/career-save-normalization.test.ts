import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import {
  INBOX_GUIDE_ID,
  OFFSEASON_RULES_GUIDE_ID,
  ROSTER_MANAGEMENT_GUIDE_ID,
} from "../../src/domain/career/careerGuides";
import { normalizeCareerSave } from "../../src/domain/career/normalizeCareerSave";
import type { CareerSave } from "../../src/types/game";

describe("career save normalization", () => {
  it("fills missing top-level fields from current career defaults", () => {
    const legacyCareer = createInitialCareer("T1") as Partial<CareerSave>;

    delete legacyCareer.weeklyPlan;
    delete legacyCareer.seasonHistory;
    delete legacyCareer.internationalOpponents;

    const normalized = normalizeCareerSave(legacyCareer as CareerSave);

    expect(normalized.weeklyPlan).toEqual({
      strategy: "balanced",
      trainingIntensity: "normal",
    });
    expect(normalized.seasonHistory).toEqual([]);
    expect(normalized.internationalOpponents.length).toBeGreaterThan(0);
  });

  it("fills missing player lifecycle and nested offseason arrays", () => {
    const career = createInitialCareer("T1");
    const legacyCareer: CareerSave = {
      ...career,
      lckPlayers: career.lckPlayers.map((player, index) =>
        index === 0
          ? ({
              ...player,
              availableForRoster: undefined,
              militaryServiceStatus: undefined,
              retirementCandidate: undefined,
              status: undefined,
            } as unknown as typeof player)
          : player,
      ),
      seasonHistory: [
        {
          seasonNumber: 1,
          yearLabel: 2026,
          calendarType: "asian-games",
          lckResult: "우승",
          finalElo: 1710,
        },
      ],
      seasonState: {
        ...career.seasonState,
        phase: "offseason",
        offseason: {
          status: "active",
          completedSeasonNumber: 1,
          startedDateKey: "2026-11-08",
          expiredContractPlayerIds: [],
          renewedPlayerIds: [],
          summarySeasonNumber: 1,
        },
      },
    };
    const normalized = normalizeCareerSave(legacyCareer);
    const normalizedPlayer = normalized.lckPlayers[0];

    expect(normalizedPlayer.availableForRoster).toBe(true);
    expect(normalizedPlayer.militaryServiceStatus).toBe("none");
    expect(normalizedPlayer.retirementCandidate).toBe(false);
    expect(normalizedPlayer.status.morale).toBe("neutral");
    expect(normalizedPlayer.status.evaluationForm).toBe(normalizedPlayer.status.form);
    expect(normalizedPlayer.status.evaluationStars).toBeGreaterThanOrEqual(0.5);
    expect(normalized.seasonHistory[0].competitionResults).toEqual([]);
    expect(normalized.seasonHistory[0].expiredContractPlayerIds).toEqual([]);
    expect(normalized.seasonState.offseason?.pendingOffers).toEqual([]);
    expect(normalized.seasonState.offseason?.resolvedOffers).toEqual([]);
    expect(normalized.seasonState.offseason?.retiredPlayerIds).toEqual([]);
    expect(normalized.seasonState.offseason?.militaryServicePlayerIds).toEqual([]);
    expect(normalized.guideState?.seenGuideIds).toEqual([]);
  });

  it("rehydrates current 2026 LCK main roster portraits for legacy saves", () => {
    const career = createInitialCareer("T1");
    const legacyCareer: CareerSave = {
      ...career,
      lckPlayers: career.lckPlayers.map((player) =>
        player.name === "Faker"
          ? {
              ...player,
              portraitUrl: undefined,
              portraitSourceUrl: undefined,
            }
          : player,
      ),
    };
    const normalized = normalizeCareerSave(legacyCareer);
    const faker = normalized.lckPlayers.find((player) => player.name === "Faker");

    expect(faker?.portraitUrl).toBe("/assets/players/lck/2026/main/t1-faker.png");
    expect(faker?.portraitSourceUrl).toBe(
      "https://lol.fandom.com/wiki/File:T1_Faker_2026_LCK_Cup.png",
    );
  });

  it("keeps known career guide ids and drops stale values", () => {
    const career = createInitialCareer("T1");
    const legacyCareer = {
      ...career,
      guideState: {
        seenGuideIds: [
          OFFSEASON_RULES_GUIDE_ID,
          ROSTER_MANAGEMENT_GUIDE_ID,
          "legacy-data-save-guide",
          INBOX_GUIDE_ID,
        ],
      },
    } as unknown as CareerSave;

    const normalized = normalizeCareerSave(legacyCareer);

    expect(normalized.guideState?.seenGuideIds).toEqual([
      OFFSEASON_RULES_GUIDE_ID,
      ROSTER_MANAGEMENT_GUIDE_ID,
      INBOX_GUIDE_ID,
    ]);
  });
});
