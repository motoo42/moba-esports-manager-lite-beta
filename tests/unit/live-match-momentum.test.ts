import { describe, expect, it } from "vitest";
import {
  buildMomentumSeries,
  generateMatchTimeline,
} from "../../src/domain/live-match";
import type { LiveMatchSide } from "../../src/domain/live-match";

function timeline(seed: string, winningSide: LiveMatchSide, dominance = 0.4) {
  return generateMatchTimeline({ seed, winningSide, dominance });
}

describe("buildMomentumSeries", () => {
  it("is deterministic for the same timeline", () => {
    const source = timeline("momentum-a", "blue");

    expect(buildMomentumSeries(source)).toEqual(buildMomentumSeries(source));
  });

  it("keeps every probability in [0,1] on a strictly increasing time axis", () => {
    const series = buildMomentumSeries(timeline("momentum-b", "red"));

    expect(series.points.length).toBeGreaterThan(2);
    let previousTime = -1;
    for (const point of series.points) {
      expect(point.blueWinProbability).toBeGreaterThanOrEqual(0);
      expect(point.blueWinProbability).toBeLessThanOrEqual(1);
      expect(point.timeSec).toBeGreaterThan(previousTime);
      previousTime = point.timeSec;
    }
  });

  it("starts the game even at 50%", () => {
    const series = buildMomentumSeries(timeline("momentum-c", "blue"));

    expect(series.points[0].timeSec).toBe(0);
    expect(series.points[0].blueWinProbability).toBeCloseTo(0.5, 5);
  });

  it("anchors the final point to the real winner", () => {
    const blueWin = buildMomentumSeries(timeline("momentum-d", "blue"));
    const redWin = buildMomentumSeries(timeline("momentum-d", "red"));
    const blueLast = blueWin.points[blueWin.points.length - 1];
    const redLast = redWin.points[redWin.points.length - 1];

    expect(blueLast.timeSec).toBe(blueWin.durationSec);
    expect(blueLast.blueWinProbability).toBeGreaterThan(0.5);
    expect(redLast.timeSec).toBe(redWin.durationSec);
    expect(redLast.blueWinProbability).toBeLessThan(0.5);
  });

  it("emits a marker for every visible event with a matching tone", () => {
    const source = timeline("momentum-e", "blue", 0.5);
    const series = buildMomentumSeries(source);
    const visibleEvents = source.events.filter((event) => event.visible);

    expect(series.markers).toHaveLength(visibleEvents.length);
    for (const marker of series.markers) {
      const event = visibleEvents.find((candidate) => candidate.id === marker.id);
      expect(event).toBeDefined();
      expect(marker.tone).toBe(event?.advantage);
      expect(marker.type).toBe(event?.type);
      expect(marker.timeSec).toBe(event?.timeSec);
    }
  });

  it("trends toward the winner in a dominant game", () => {
    const series = buildMomentumSeries(timeline("momentum-f", "blue", 0.85));
    const lateHalf = series.points.filter(
      (point) => point.timeSec >= series.durationSec / 2,
    );
    const blueFavoured = lateHalf.filter(
      (point) => point.blueWinProbability > 0.5,
    );

    // In a stomp the back half of the game should mostly favour the winner.
    expect(blueFavoured.length).toBeGreaterThan(lateHalf.length / 2);
  });
});
