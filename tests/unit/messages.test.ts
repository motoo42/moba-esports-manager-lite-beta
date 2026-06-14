import { describe, expect, it } from "vitest";
import {
  appendCareerMessages,
  appendOffseasonLogMessages,
  createAiNewsFactsForMessage,
  createSquadReportMessages,
  createProgressMessages,
  maxCareerMessages,
} from "../../src/domain/messages";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { normalizeCareerSave } from "../../src/domain/career/normalizeCareerSave";
import { completeStoveLeague } from "../../src/domain/season";
import { defaultAppSettings } from "../../src/domain/settings/appSettings";
import type { CareerSave, MatchRecord, MatchResult, MatchSchedule } from "../../src/types/game";

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
    const activeCareer = createCompetitionCareer();
    const match = findUserMatch(activeCareer);
    const previousCareer = {
      ...activeCareer,
      seasonState: {
        ...activeCareer.seasonState,
        currentDateKey: "2026-01-13",
        currentDateLabel: "2026년 1월 13일 (화)",
        nextMatchIds: [],
        progressStatus: "idle" as const,
      },
    };
    const nextCareer = {
      ...previousCareer,
      seasonState: {
        ...previousCareer.seasonState,
        currentDateKey: match.scheduledDate ?? "2026-01-14",
        currentDateLabel: "2026년 1월 14일 (수)",
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
    expect(messages[0].title).toBe("다음 경기 일정 안내");
    expect(messages[0].body).toContain(findUserMatch(activeCareer).stageName);
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
          priority: "important",
          source: "offseason",
          title: "FA 협상 결과",
          body: expect.stringContaining("Faker"),
        }),
      ]),
    );
  });

  it("does not copy unrelated offseason signing news into individual messages", () => {
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
              id: "ai-transfer-log",
              day: 9,
              week: 2,
              type: "ai-signing" as const,
              message: "Gen.G가 FA 선수를 영입했습니다.",
            },
          ],
        },
      },
    };
    const careerWithMessages = appendOffseasonLogMessages(
      previousCareer,
      nextCareer,
    );

    expect(careerWithMessages.messages).toHaveLength(0);
  });

  it("summarizes notable non-user offseason moves when a week rolls over", () => {
    const previousCareer = createInitialCareer("T1");
    const notablePlayer = [...previousCareer.lckPlayers]
      .filter((player) => player.currentTeam !== previousCareer.userTeam.name)
      .sort(
        (left, right) =>
          right.salaryExpectation - left.salaryExpectation ||
          right.overall - left.overall,
      )[0];

    if (!notablePlayer) {
      throw new Error("A notable non-user player was not found.");
    }

    const nextCareer = {
      ...previousCareer,
      seasonState: {
        ...previousCareer.seasonState,
        currentDateKey: "2025-12-08",
        currentDateLabel: "2025년 12월 8일 (월)",
        offseason: {
          ...previousCareer.seasonState.offseason!,
          currentDay: 8,
          currentWeek: 2,
          logEntries: [
            ...(previousCareer.seasonState.offseason?.logEntries ?? []),
            {
              id: "notable-ai-transfer-log",
              day: 7,
              week: 1,
              type: "ai-signing" as const,
              message: `${notablePlayer.name} FA 영입 경쟁에서 Gen.G이 승리했습니다. 경쟁 2팀.`,
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
          priority: "normal",
          source: "offseason",
          title: "스토브리그 주간 요약",
          body: expect.stringContaining(`${notablePlayer.name} -> Gen.G`),
        }),
      ]),
    );
    expect(
      (careerWithMessages.messages ?? []).some(
        (message) => message.title === "FA 협상 결과",
      ),
    ).toBe(false);
  });

  it("creates one weekly squad report instead of multiple training alerts", () => {
    const previousCareer = createCompetitionCareer();
    const starterIds = Object.values(previousCareer.userTeam.roster).filter(
      (playerId): playerId is string => Boolean(playerId),
    );
    const nextCareer = {
      ...previousCareer,
      lckPlayers: previousCareer.lckPlayers.map((player) => {
        if (player.id === starterIds[0]) {
          return {
            ...player,
            status: {
              ...player.status,
              condition: 50,
            },
          };
        }

        if (player.id === starterIds[1]) {
          return {
            ...player,
            status: {
              ...player.status,
              fatigue: 90,
            },
          };
        }

        return player;
      }),
    };
    const messages = createSquadReportMessages({
      lastMatchPlayed: true,
      nextCareer,
      previousCareer,
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        category: "training",
        priority: "urgent",
        source: "club",
        title: "주간 선수단 리포트",
      }),
    );
    expect(messages[0].body).toContain("컨디션 50");
    expect(messages[0].body).toContain("피로도 90");
  });

  it("creates a stable weekly squad report when the competition week changes", () => {
    const previousCareer = createCompetitionCareer();
    const nextCareer = {
      ...previousCareer,
      seasonState: {
        ...previousCareer.seasonState,
        currentWeek: previousCareer.seasonState.currentWeek + 1,
      },
    };
    const messages = createSquadReportMessages({
      nextCareer,
      previousCareer,
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        category: "training",
        priority: "normal",
        source: "club",
        title: "주간 선수단 리포트",
      }),
    );
    expect(messages[0].body).toContain("선발 평균 컨디션");
    expect(messages[0].body).toContain("평균 피로도");
  });

  it("keeps short message titles and moves details into the body", () => {
    const activeCareer = createCompetitionCareer();
    const match = findUserMatch(activeCareer);
    const previousCareer = {
      ...activeCareer,
      seasonState: {
        ...activeCareer.seasonState,
        nextMatchIds: [],
      },
    };
    const nextCareer = {
      ...activeCareer,
      seasonState: {
        ...activeCareer.seasonState,
        nextMatchIds: [match.id],
      },
    };
    const messages = createProgressMessages({
      lastMatch: null,
      nextCareer,
      previousCareer,
    });
    const scheduleMessage = messages.find(
      (message) => message.category === "schedule",
    );

    expect(scheduleMessage?.title).toBe("다음 경기 일정 안내");
    expect(scheduleMessage?.title.length).toBeLessThanOrEqual(14);
    expect(scheduleMessage?.body).toContain(match.stageName);
  });

  it("creates debug-frequency media news candidates for ordinary user matches", () => {
    const previousCareer = createCompetitionCareer();
    const match = findUserMatch(previousCareer);
    const userTeamId =
      match.blueTeamName === previousCareer.userTeam.name
        ? match.blueTeamId
        : match.redTeamId;
    const record: MatchRecord = {
      id: "debug-user-record",
      competitionId: match.competitionId,
      createdAtTurn: previousCareer.seasonState.currentTurn + 1,
      draft: undefined,
      log: [],
      scheduleId: match.id,
      score: {
        blueWins: 2,
        redWins: 1,
      },
      stageName: match.stageName,
      userResult: "win",
      week: match.week,
      winnerSide: match.blueTeamId === userTeamId ? "blue" : "red",
      winnerTeamId: userTeamId,
      winnerTeamName: previousCareer.userTeam.name,
      winProbability: 0.5,
    };
    const lastMatch: MatchResult = {
      draftPower: 0,
      log: [],
      opponentPower: 0,
      teamPower: 0,
      winner: "user",
      winProbability: 0.5,
    };
    const nextCareer = {
      ...previousCareer,
      seasonState: {
        ...previousCareer.seasonState,
        currentTurn: previousCareer.seasonState.currentTurn + 1,
        lastMatchRecordIds: [record.id],
        matchRecords: [...previousCareer.seasonState.matchRecords, record],
      },
    };
    const normalMessages = createProgressMessages({
      lastMatch,
      nextCareer,
      previousCareer,
    });
    const debugMessages = createProgressMessages({
      appSettings: {
        ...defaultAppSettings,
        messageNews: {
          aiNewsEnabled: true,
          frequency: "debug",
        },
      },
      lastMatch,
      nextCareer,
      previousCareer,
    });
    const matchMessage = debugMessages.find(
      (message) => message.title === "경기 결과 도착",
    );
    const careerWithDebugMessage = appendCareerMessages(nextCareer, debugMessages);
    const newsMessage = careerWithDebugMessage.messages?.find(
      (message) => message.id === `template-news-${record.id}`,
    );

    expect(normalMessages.some((message) => message.category === "news")).toBe(
      false,
    );
    expect(newsMessage).toEqual(
      expect.objectContaining({
        category: "news",
        source: "media",
        title: "미디어 리뷰",
      }),
    );
    expect(matchMessage?.body).not.toContain("\n");
    expect(matchMessage?.body).not.toContain("경기 결과 리포트");
    expect(newsMessage?.body).not.toContain("\n");
    expect(newsMessage?.body).not.toContain("미디어 리뷰\n");
    expect(
      newsMessage &&
        createAiNewsFactsForMessage({
          career: careerWithDebugMessage,
          message: newsMessage,
        }),
    ).toEqual(
      expect.objectContaining({
        eventType: "match_review",
        result: "win",
        team: previousCareer.userTeam.name,
      }),
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
