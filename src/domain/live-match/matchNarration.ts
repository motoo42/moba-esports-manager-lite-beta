import type { Role } from "../../types/game";
import type { MatchTimelineEvent } from "./matchTimeline";
import type { LiveMatchEventAdvantage, LiveMatchSide } from "./types";

// Deterministic Korean commentary for timeline events. No AI / network: this is
// the narration step deferred out of the generator so prose stays out of the
// pure structural model. Returns a UI-friendly shape (title / body / optional
// badge / tone) so the commentary component can render without re-deriving
// anything. Tone mirrors the event's advantage color index (blue/red/neutral).

export type LiveCommentaryTone = LiveMatchEventAdvantage;

export type LiveCommentaryNarration = {
  badgeLabel?: string;
  body: string;
  title: string;
  tone: LiveCommentaryTone;
};

export type LiveNarrationPlayer = {
  championName: string;
  name: string;
};

export type LiveNarrationTeamContext = {
  name: string;
  players: Record<Role, LiveNarrationPlayer>;
  shortName: string;
};

export type LiveNarrationContext = Record<LiveMatchSide, LiveNarrationTeamContext>;

function opposite(side: LiveMatchSide): LiveMatchSide {
  return side === "blue" ? "red" : "blue";
}

function describePlayer(player: LiveNarrationPlayer) {
  // Middot phrasing avoids Korean particle agreement (을/를, 이/가) entirely.
  return `${player.name} (${player.championName})`;
}

function narrateKill(
  event: MatchTimelineEvent,
  context: LiveNarrationContext,
  tone: LiveCommentaryTone,
): LiveCommentaryNarration {
  const kill = event.kill;

  if (!kill) {
    const team = context[event.side];
    return { body: `${team.name} 교전 승리`, title: "교전", tone };
  }

  const killer = describePlayer(context[event.side].players[kill.killerRole]);
  const victim = describePlayer(
    context[opposite(event.side)].players[kill.victimRole],
  );

  if (kill.isSolo) {
    return {
      badgeLabel: kill.isLaningPhase ? "라인전" : "솔로킬",
      body: `${killer} → ${victim} 솔로 처치`,
      title: "솔로 킬",
      tone,
    };
  }

  return {
    badgeLabel: event.importance === "critical" ? "중대" : undefined,
    body: `${killer} → ${victim} 처치 (어시 ${kill.assistRoles.length})`,
    title: event.importance === "critical" ? "결정적 한타" : "교전",
    tone,
  };
}

export function narrateEvent(
  event: MatchTimelineEvent,
  context: LiveNarrationContext,
): LiveCommentaryNarration {
  const tone: LiveCommentaryTone = event.advantage;
  const team = context[event.side];

  switch (event.type) {
    case "kill":
      return narrateKill(event, context, tone);
    case "dragon":
      return { body: `${team.name} 드래곤 획득`, title: "드래곤", tone };
    case "soul":
      return {
        badgeLabel: "영혼",
        body: `${team.name} 드래곤 영혼 확보`,
        title: "드래곤 영혼",
        tone,
      };
    case "herald":
      return { body: `${team.name} 전령 확보`, title: "전령", tone };
    case "baron":
      return event.isSteal
        ? {
            badgeLabel: "스틸",
            body: `${team.name} 바론 스틸! 흐름이 넘어갑니다`,
            title: "바론 스틸",
            tone,
          }
        : { body: `${team.name} 바론 획득`, title: "바론", tone };
    case "elder":
      return {
        badgeLabel: event.isSteal ? "스틸" : "장로",
        body: `${team.name} 장로 드래곤 확보`,
        title: "장로 드래곤",
        tone,
      };
    case "tower":
      return { body: `${team.name} 타워 철거`, title: "타워", tone };
    case "inhibitor":
      return { body: `${team.name} 억제기 파괴`, title: "억제기", tone };
    case "nexus":
      return {
        badgeLabel: "GG",
        body: `${team.name} 넥서스 파괴 — 승리`,
        title: "넥서스 파괴",
        tone,
      };
    default:
      return { body: team.name, title: "경기", tone };
  }
}
