import { describe, expect, it } from "vitest";
import { createInitialGameState, gameReducer } from "../../src/app/state";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import {
  getScrimDateOptions,
  getScrimOpponentOptions,
  requestScrim,
  resolvePendingScrimRequests,
  runTodayScrim,
} from "../../src/domain/scrim";
import {
  addDaysToDateKey,
  formatSeasonDateLabel,
} from "../../src/domain/season/seasonScheduleDates";
import type { CareerSave, ScrimSchedule } from "../../src/types/game";

function createCompetitionCareer() {
  return createInitialCareer("T1", { startMode: "real-roster-lck-cup" });
}

function getFirstRequestableInput(career: CareerSave) {
  const date = getScrimDateOptions(career).find((option) => !option.isDisabled);

  if (!date) {
    throw new Error("Expected at least one requestable scrim date.");
  }

  const opponent = getScrimOpponentOptions(career, date.dateKey).find(
    (option) => !option.isDisabled,
  );

  if (!opponent) {
    throw new Error("Expected at least one requestable scrim opponent.");
  }

  return {
    scheduledDateKey: date.dateKey,
    opponentTeamId: opponent.teamId,
    matchCount: 3,
  };
}

function moveCareerDate(career: CareerSave, dateKey: string): CareerSave {
  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      currentDateKey: dateKey,
      currentDateLabel: formatSeasonDateLabel(dateKey),
      currentTurn: career.seasonState.currentTurn + 1,
    },
  };
}

function createAcceptedScrimDayCareer() {
  const career = createCompetitionCareer();
  const input = getFirstRequestableInput(career);
  const requested = requestScrim(career, input);
  const pending = requested.seasonState.scrim?.requests[0] as ScrimSchedule;
  const accepted: ScrimSchedule = {
    ...pending,
    status: "accepted",
    resolvedDateKey: requested.seasonState.currentDateKey,
    resolvedDateLabel: requested.seasonState.currentDateLabel,
  };

  return moveCareerDate(
    {
      ...requested,
      seasonState: {
        ...requested.seasonState,
        scrim: {
          requests: [accepted],
        },
      },
    },
    input.scheduledDateKey,
  );
}

describe("scrim system", () => {
  it("exposes requestable dates while disabling same-day requests", () => {
    const career = createCompetitionCareer();
    const dateOptions = getScrimDateOptions(career);

    expect(dateOptions[0]).toMatchObject({
      dateKey: career.seasonState.currentDateKey,
      isDisabled: true,
    });
    expect(dateOptions.some((option) => !option.isDisabled)).toBe(true);
  });

  it("creates a pending request and resolves it after the request day", () => {
    const career = createCompetitionCareer();
    const input = getFirstRequestableInput(career);
    const requested = requestScrim(career, input);

    expect(requested.seasonState.scrim?.requests).toHaveLength(1);
    expect(requested.seasonState.scrim?.requests[0]).toMatchObject({
      status: "pending",
      scheduledDateKey: input.scheduledDateKey,
      matchCount: 3,
    });
    expect(
      requested.messages?.find((message) => message.title === "스크림 요청 발송")
        ?.body,
    ).not.toContain("\n");

    const nextDay = addDaysToDateKey(career.seasonState.currentDateKey, 1);
    const resolved = resolvePendingScrimRequests(
      moveCareerDate(requested, nextDay),
    );

    expect(resolved.seasonState.scrim?.requests[0].status).not.toBe("pending");
    expect(
      resolved.messages?.some((message) => message.title.startsWith("스크림 요청")),
    ).toBe(true);
  });

  it("runs an accepted scrim without changing official records", () => {
    const scrimDayCareer = createAcceptedScrimDayCareer();
    const starterId = Object.values(scrimDayCareer.userTeam.roster).find(Boolean);
    const previousStarter = scrimDayCareer.lckPlayers.find(
      (player) => player.id === starterId,
    );
    const result = runTodayScrim(scrimDayCareer);
    const nextStarter = result.career.lckPlayers.find(
      (player) => player.id === starterId,
    );

    expect(result.summary).toMatchObject({
      status: "completed",
      matchCount: 3,
    });
    expect(result.summary?.resultSummary).not.toMatch(/승률/);
    expect(result.career.userTeam.wins).toBe(scrimDayCareer.userTeam.wins);
    expect(result.career.userTeam.losses).toBe(scrimDayCareer.userTeam.losses);
    expect(nextStarter?.status.fatigue).not.toBe(previousStarter?.status.fatigue);
  });

  it("blocks next-day progress while an accepted scrim is still unplayed today", () => {
    const scrimDayCareer = createAcceptedScrimDayCareer();
    const state = {
      ...createInitialGameState(),
      career: scrimDayCareer,
      route: "match-week" as const,
    };
    const nextState = gameReducer(state, { type: "progress-season" });

    expect(nextState.career?.seasonState.currentDateKey).toBe(
      scrimDayCareer.seasonState.currentDateKey,
    );
    expect(nextState.career?.seasonState.scrim?.requests[0].status).toBe(
      "accepted",
    );
  });
});
