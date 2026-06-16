import {
  getMatchSnapshotAt,
  type MatchStatSnapshot,
  type ObjectiveTally,
} from "./matchStats";
import type {
  GeneratedMatchTimeline,
  MatchTimelineEventType,
} from "./matchTimeline";
import type {
  LiveMatchEventAdvantage,
  LiveMatchImportance,
  LiveMatchSide,
} from "./types";

// buildMomentumSeries (#87③). Folds an already-generated timeline into a
// time-series win-probability curve for the live-match momentum graph. Pure and
// deterministic: it samples the existing stat snapshot at fixed intervals and maps
// each side's gold / kill / objective lead onto a blue-win probability in [0, 1].
// The final point is anchored to the real winning side so the curve always resolves
// to the actual result. This never touches the match simulation — it is a read-only
// presentation layer over the timeline (same contract as matchStats / matchNarration).

export type MomentumPoint = {
  // 0 = red is certain to win, 0.5 = even, 1 = blue is certain to win.
  blueWinProbability: number;
  timeSec: number;
};

export type MomentumMarker = {
  id: string;
  importance: LiveMatchImportance;
  side: LiveMatchSide;
  timeSec: number;
  // blue / red / neutral — drives the marker colour on the graph.
  tone: LiveMatchEventAdvantage;
  type: MatchTimelineEventType;
};

export type MomentumSeries = {
  durationSec: number;
  markers: MomentumMarker[];
  points: MomentumPoint[];
  winningSide: LiveMatchSide;
};

// How often the curve is sampled. 15s keeps the line lively without flooding the
// renderer with points on a 40-minute game (~160 samples max).
const sampleIntervalSec = 15;
// Each kill is worth roughly this much momentum beyond the gold it already granted.
const killMomentum = 200;
// Larger = a calmer curve (a given lead maps closer to 50%). Tuned so a healthy mid
// game lead reads ~75% and a decisive one approaches the rails.
const momentumScale = 4200;
// The winner never quite reaches a literal 100%, leaving the endpoint a clear spike.
const endpointAnchor = 0.985;
// Mid-game probabilities are kept just inside the rails so the curve has headroom.
const probabilityFloor = 0.015;
const probabilityCeiling = 0.985;

// Momentum value of a side's objective tally. Weighted well above the raw gold each
// objective grants, because securing barons / soul / inhibitors swings a game far
// more than their gold bounty alone suggests.
const objectiveMomentumWeight = {
  tower: 220,
  dragon: 200,
  herald: 170,
  baron: 1700,
  elder: 1700,
  inhibitor: 600,
  // Extra weight on top of the dragon that granted soul.
  soul: 900,
};

function logistic(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function objectiveMomentum(objectives: ObjectiveTally) {
  return (
    objectives.towers * objectiveMomentumWeight.tower +
    objectives.dragons * objectiveMomentumWeight.dragon +
    objectives.heralds * objectiveMomentumWeight.herald +
    objectives.barons * objectiveMomentumWeight.baron +
    objectives.elders * objectiveMomentumWeight.elder +
    objectives.inhibitors * objectiveMomentumWeight.inhibitor +
    (objectives.soulTaken ? objectiveMomentumWeight.soul : 0)
  );
}

// Net blue advantage in gold-equivalent units (positive favours blue).
function blueAdvantageScore(snapshot: MatchStatSnapshot) {
  const goldDiff = snapshot.blue.gold - snapshot.red.gold;
  const killDiff = snapshot.blue.kills - snapshot.red.kills;
  const objectiveDiff =
    objectiveMomentum(snapshot.blue.objectives) -
    objectiveMomentum(snapshot.red.objectives);

  return goldDiff + killDiff * killMomentum + objectiveDiff;
}

function blueWinProbabilityAt(
  timeline: GeneratedMatchTimeline,
  timeSec: number,
) {
  const snapshot = getMatchSnapshotAt(timeline, timeSec);
  const probability = logistic(blueAdvantageScore(snapshot) / momentumScale);

  return clamp(probability, probabilityFloor, probabilityCeiling);
}

export function buildMomentumSeries(
  timeline: GeneratedMatchTimeline,
): MomentumSeries {
  const { durationSec, winningSide } = timeline;
  const points: MomentumPoint[] = [];

  for (let timeSec = 0; timeSec < durationSec; timeSec += sampleIntervalSec) {
    points.push({
      blueWinProbability: blueWinProbabilityAt(timeline, timeSec),
      timeSec,
    });
  }

  // Anchor the final point to the real winner so the curve always resolves to the
  // actual result regardless of how the snapshot math lands.
  points.push({
    blueWinProbability:
      winningSide === "blue" ? endpointAnchor : 1 - endpointAnchor,
    timeSec: durationSec,
  });

  const markers: MomentumMarker[] = timeline.events
    .filter((event) => event.visible)
    .map((event) => ({
      id: event.id,
      importance: event.importance,
      side: event.side,
      timeSec: event.timeSec,
      tone: event.advantage,
      type: event.type,
    }));

  return { durationSec, markers, points, winningSide };
}
