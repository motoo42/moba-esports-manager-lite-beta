import { describe, expect, it } from "vitest";
import {
  narrateEvent,
  type LiveNarrationContext,
} from "../../src/domain/live-match/matchNarration";
import type { MatchTimelineEvent } from "../../src/domain/live-match/matchTimeline";

const context: LiveNarrationContext = {
  blue: {
    name: "T1",
    shortName: "T1",
    players: {
      top: { name: "Doran", championName: "Aatrox" },
      jungle: { name: "Oner", championName: "Vi" },
      mid: { name: "Faker", championName: "Ahri" },
      bot: { name: "Peyz", championName: "Ashe" },
      support: { name: "Keria", championName: "Rell" },
    },
  },
  red: {
    name: "Gen.G",
    shortName: "GEN",
    players: {
      top: { name: "Kiin", championName: "Rumble" },
      jungle: { name: "Canyon", championName: "LeeSin" },
      mid: { name: "Chovy", championName: "Corki" },
      bot: { name: "Ruler", championName: "Senna" },
      support: { name: "Duro", championName: "Lulu" },
    },
  },
};

function event(overrides: Partial<MatchTimelineEvent>): MatchTimelineEvent {
  return {
    advantage: "blue",
    id: "evt-0",
    importance: "high",
    side: "blue",
    timeSec: 600,
    type: "kill",
    visible: true,
    ...overrides,
  };
}

describe("match commentary narration", () => {
  it("phrases a solo kill with both players and a laning badge", () => {
    const result = narrateEvent(
      event({
        type: "kill",
        side: "blue",
        kill: {
          assistRoles: [],
          isLaningPhase: true,
          isSolo: true,
          killerRole: "mid",
          victimRole: "mid",
        },
      }),
      context,
    );

    expect(result.title).toBe("솔로 킬");
    expect(result.body).toContain("Faker");
    expect(result.body).toContain("Chovy");
    expect(result.badgeLabel).toBe("라인전");
    expect(result.tone).toBe("blue");
  });

  it("phrases a teamfight kill with the assist count and a critical badge", () => {
    const result = narrateEvent(
      event({
        importance: "critical",
        kill: {
          assistRoles: ["jungle", "bot"],
          isLaningPhase: false,
          isSolo: false,
          killerRole: "mid",
          victimRole: "top",
        },
      }),
      context,
    );

    expect(result.title).toBe("결정적 한타");
    expect(result.body).toContain("어시 2");
    expect(result.badgeLabel).toBe("중대");
  });

  it("marks a baron steal distinctly from a clean baron", () => {
    const stolen = narrateEvent(
      event({ type: "baron", side: "red", advantage: "red", isSteal: true }),
      context,
    );
    const clean = narrateEvent(
      event({ type: "baron", side: "blue", advantage: "blue", isSteal: false }),
      context,
    );

    expect(stolen.title).toBe("바론 스틸");
    expect(stolen.badgeLabel).toBe("스틸");
    expect(stolen.body).toContain("Gen.G");
    expect(stolen.tone).toBe("red");
    expect(clean.title).toBe("바론");
    expect(clean.badgeLabel).toBeUndefined();
  });

  it("narrates objectives and the closing nexus with the right team and tone", () => {
    const soul = narrateEvent(
      event({ type: "soul", side: "red", advantage: "red" }),
      context,
    );
    const nexus = narrateEvent(
      event({ type: "nexus", side: "blue", advantage: "blue", importance: "critical" }),
      context,
    );

    expect(soul.badgeLabel).toBe("영혼");
    expect(soul.body).toContain("Gen.G");
    expect(nexus.title).toBe("넥서스 파괴");
    expect(nexus.body).toContain("T1");
    expect(nexus.badgeLabel).toBe("GG");
  });

  it("carries a neutral advantage through as a neutral tone", () => {
    const result = narrateEvent(
      event({
        advantage: "neutral",
        importance: "medium",
        kill: {
          assistRoles: ["support"],
          isLaningPhase: false,
          isSolo: false,
          killerRole: "bot",
          victimRole: "bot",
        },
      }),
      context,
    );

    expect(result.tone).toBe("neutral");
  });
});
