import { describe, expect, it } from "vitest";
import {
  appendCareerMessages,
  appendOffseasonLogMessages,
  createProgressMessages,
  maxCareerMessages,
} from "../../src/domain/messages";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { normalizeCareerSave } from "../../src/domain/career/normalizeCareerSave";
import { completeStoveLeague } from "../../src/domain/season";
import type { CareerSave, MatchSchedule } from "../../src/types/game";

function createCompetitionCareer() {
  const preseasonCareer = createInitialCareer("T1");

  return {
    ...preseasonCareer,
    seasonState: {
      ...completeStoveLeague(preseasonCareer.seasonState),
      offseason: undefined,
    },
  };
}

function findUserMatch(career: CareerSave): MatchSchedule {
  const currentCompetition = career.seasonState.competitions.find(
    (competition) =>
      competition.competitionId === career.seasonState.currentCompetitionId,
  );
  const userTeamId = currentCompetition?.standings.find(
    (entry) => entry.isUserTeam,
  )?.teamId;
  const match = career.seasonState.scheduledMatches.find(
    (schedule) =>
      schedule.blueTeamId === userTeamId || schedule.redTeamId === userTeamId,
  );

  if (!match) {
    throw new Error("User match was not found.");
  }

  return match;
}

describe("career messages", () => {
  it("normalizes legacy saves without messages to an empty array", () => {
    const career = createInitialCareer("T1");
    const normalized = normalizeCareerSave({
      ...career,
      messages: undefined,
    });

    expect(normalized.messages).toEqual([]);
  });

  it("creates schedule messages from progress state changes", () => {
    const previousCareer = createCompetitionCareer();
    const match = findUserMatch(previousCareer);
    const nextCareer = {
      ...previousCareer,
      seasonState: {
        ...previousCareer.seasonState,
        nextMatchIds: [match.id],
        progressStatus: "match-preview" as const,
      },
    };
    const messages = createProgressMessages({
      lastMatch: null,
      nextCareer,
      previousCareer,
    });

    expect(messages.some((message) => message.category === "schedule")).toBe(
      true,
    );
    expect(messages[0].title).toContain("오늘 경기");
  });

  it("copies user-team offseason logs into transfer messages", () => {
    const previousCareer = createInitialCareer("T1");
    const nextCareer = {
      ...previousCareer,
      seasonState: {
        ...previousCareer.seasonState,
        offseason: {
          ...previousCareer.seasonState.offseason!,
          logEntries: [
            ...(previousCareer.seasonState.offseason?.logEntries ?? []),
            {
              id: "user-transfer-log",
              day: 2,
              week: 1,
              type: "renewal" as const,
              message: "Faker와 재계약 협상이 진행됐습니다.",
              isUserTeamRelated: true,
            },
          ],
        },
      },
    };
    const careerWithMessages = appendOffseasonLogMessages(
      previousCareer,
      nextCareer,
    );

    expect(careerWithMessages.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "transfer",
          source: "offseason",
          title: expect.stringContaining("Faker"),
        }),
      ]),
    );
  });

  it("dedupes messages and keeps only the latest 120 entries", () => {
    const career = createInitialCareer("T1");
    const drafts = Array.from({ length: 130 }, (_, index) => ({
      dateKey: `2026-01-${String(index + 1).padStart(2, "0")}`,
      dateLabel: `${index + 1}일`,
      category: "system" as const,
      priority: "normal" as const,
      title: `테스트 메시지 ${index}`,
      body: "테스트",
      createdTurn: index,
      source: "system" as const,
    }));
    const withMessages = appendCareerMessages(career, drafts);
    const withDuplicate = appendCareerMessages(withMessages, [drafts[129]]);

    expect(withMessages.messages).toHaveLength(maxCareerMessages);
    expect(withDuplicate.messages).toHaveLength(maxCareerMessages);
    expect(
      withDuplicate.messages?.[withDuplicate.messages.length - 1]?.title,
    ).toBe("테스트 메시지 129");
  });
});
