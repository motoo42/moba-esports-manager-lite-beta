import { useMemo } from "react";

import {
  buildMomentumSeries,
  type LiveMatchSetPresentation,
  type MatchTimelineEventType,
  type MomentumPoint,
} from "../../../domain/live-match";
import { LiveMatchIcon } from "./LiveMatchIcon";

type LiveMomentumGraphProps = {
  gameTimeSec: number;
  set: LiveMatchSetPresentation;
};

// SVG view box. The graph is data-driven, so the box is fixed and the parent scales
// it to whatever 1/n band it occupies.
const VIEW_W = 800;
const VIEW_H = 96;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16; // small headroom for stickers that sit high on the curve
const PAD_BOTTOM = 13; // leaves a band at the bottom for minute labels
const INNER_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const INNER_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const GRID_INTERVAL_SEC = 600; // a dashed vertical line every 10 minutes
const maxFightStickers = 5; // keep only the biggest team fights on the line
const importanceRank: Record<string, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

const eventLabels: Record<MatchTimelineEventType, string> = {
  kill: "킬",
  tower: "포탑 파괴",
  inhibitor: "억제기 파괴",
  dragon: "드래곤 처치",
  soul: "드래곤 영혼",
  herald: "전령 처치",
  baron: "바론 처치",
  elder: "장로 드래곤",
  nexus: "넥서스 파괴",
};

function formatClock(timeSec: number) {
  const total = Math.max(0, Math.round(timeSec));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Linear-interpolate the blue win probability at an arbitrary time between samples.
function probabilityAt(points: MomentumPoint[], timeSec: number) {
  if (points.length === 0) {
    return 0.5;
  }

  if (timeSec <= points[0].timeSec) {
    return points[0].blueWinProbability;
  }

  for (let index = 1; index < points.length; index += 1) {
    const next = points[index];

    if (next.timeSec >= timeSec) {
      const previous = points[index - 1];
      const span = next.timeSec - previous.timeSec || 1;
      const ratio = (timeSec - previous.timeSec) / span;

      return (
        previous.blueWinProbability +
        (next.blueWinProbability - previous.blueWinProbability) * ratio
      );
    }
  }

  return points[points.length - 1].blueWinProbability;
}

// Catmull-Rom spline through the points, emitted as cubic beziers so the momentum
// line reads as a smooth curve instead of a chain of straight segments.
function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return path;
}

export function LiveMomentumGraph({ gameTimeSec, set }: LiveMomentumGraphProps) {
  const series = useMemo(
    () => buildMomentumSeries(set.timeline),
    [set.timeline],
  );

  const { durationSec, points, markers } = series;
  const toX = (timeSec: number) =>
    PAD_LEFT + (durationSec > 0 ? timeSec / durationSec : 0) * INNER_W;
  const toY = (probability: number) => PAD_TOP + (1 - probability) * INNER_H;
  const yCenter = toY(0.5);

  // Reveal the curve only up to the playhead so the graph "draws itself" as the
  // match plays and never spoils the result. A trailing interpolated point keeps the
  // leading edge exactly under the moving head dot.
  const revealTime = Math.min(Math.max(gameTimeSec, 0), durationSec);
  const leadProbability = probabilityAt(points, revealTime);
  const visiblePoints = useMemo(() => {
    const revealed = points.filter((point) => point.timeSec <= revealTime);
    const last = revealed[revealed.length - 1];

    if (!last || last.timeSec < revealTime) {
      revealed.push({ blueWinProbability: leadProbability, timeSec: revealTime });
    }

    return revealed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, revealTime]);

  // A faint cosmetic wobble so flat 50/50 stretches still breathe (a couple of slow,
  // wide undulations) without changing the underlying probabilities. Deterministic
  // per match via phases seeded from the game length, and damped to nothing once the
  // game is decided so only close stretches move.
  const wobblePhaseA = (durationSec * 0.013) % (Math.PI * 2);
  const wobblePhaseB = (durationSec * 0.021) % (Math.PI * 2);
  const displayY = (timeSec: number, baseProbability: number) => {
    const minutes = timeSec / 60;
    const wobble =
      0.028 * Math.sin(minutes * 1.1 + wobblePhaseA) +
      0.014 * Math.sin(minutes * 2.7 + wobblePhaseB);
    const damp = 4 * baseProbability * (1 - baseProbability);
    const probability = Math.max(
      0.012,
      Math.min(0.988, baseProbability + wobble * damp),
    );

    return toY(probability);
  };

  const displayPoints = visiblePoints.map((point) => ({
    x: toX(point.timeSec),
    y: displayY(point.timeSec, point.blueWinProbability),
  }));
  const curvePath = smoothPath(displayPoints);
  // Blue/red split is done by clipping a single smooth area path above/below the
  // centreline, so the fill stays smooth and never kinks where the curve crosses.
  const areaPath =
    displayPoints.length > 0
      ? `${curvePath} L ${toX(revealTime)} ${yCenter} L ${toX(0)} ${yCenter} Z`
      : "";

  const gridLines = useMemo(() => {
    const lines: number[] = [];
    for (let timeSec = GRID_INTERVAL_SEC; timeSec < durationSec; timeSec += GRID_INTERVAL_SEC) {
      lines.push(timeSec);
    }

    return lines;
  }, [durationSec]);

  const blueProbability = probabilityAt(points, gameTimeSec);
  const blueChance = Math.round(blueProbability * 100);

  // Stickers placed on the line: every objective / epic monster, plus only the
  // biggest team fights (capped) so a kill-heavy game doesn't bury the curve.
  const stickerMarkers = useMemo(() => {
    const objectives = markers.filter((marker) => marker.type !== "kill");
    const fights = markers
      .filter(
        (marker) =>
          marker.type === "kill" &&
          (marker.importance === "high" || marker.importance === "critical"),
      )
      .sort(
        (left, right) =>
          importanceRank[right.importance] - importanceRank[left.importance] ||
          left.timeSec - right.timeSec,
      )
      .slice(0, maxFightStickers);

    return [...objectives, ...fights].sort(
      (left, right) => left.timeSec - right.timeSec,
    );
  }, [markers]);

  // The latest sticker the playhead has already reached drives the callout and the
  // highlighted marker.
  const currentMarker = useMemo(() => {
    const reached = stickerMarkers.filter(
      (marker) => marker.timeSec <= gameTimeSec + 0.5,
    );

    return reached.length > 0 ? reached[reached.length - 1] : null;
  }, [stickerMarkers, gameTimeSec]);

  const teamNameForSide = (side: "blue" | "red") =>
    side === "blue" ? set.blueTeam.name : set.redTeam.name;

  const calloutTeam =
    currentMarker?.side === "blue"
      ? set.blueTeam
      : currentMarker?.side === "red"
        ? set.redTeam
        : null;

  return (
    <section className="live-momentum" aria-label="기세 그래프">
      <header className="live-momentum-header">
        <div className="live-momentum-team live-momentum-team-blue">
          <span className="live-momentum-name">{set.blueTeam.name}</span>
          <strong>{blueChance}%</strong>
        </div>
        <span className="live-momentum-set">{set.gameNumber}세트</span>
        <div className="live-momentum-team live-momentum-team-red">
          <strong>{100 - blueChance}%</strong>
          <span className="live-momentum-name">{set.redTeam.name}</span>
        </div>
      </header>

      <div
        className="live-momentum-split"
        role="img"
        aria-label={`현재 승리 확률 ${set.blueTeam.name} ${blueChance}% 대 ${set.redTeam.name} ${100 - blueChance}%`}
      >
        <span className="live-momentum-split-blue" style={{ width: `${blueChance}%` }} />
        <span className="live-momentum-split-red" style={{ width: `${100 - blueChance}%` }} />
      </div>

      <div className="live-momentum-plot">
        {currentMarker ? (
          <div className="live-momentum-callout">
            <LiveMatchIcon type={currentMarker.type} size={15} />
            <span className="live-momentum-callout-time">
              {formatClock(currentMarker.timeSec)}
            </span>
            {calloutTeam ? (
              <span className="live-momentum-callout-team">{calloutTeam.name}</span>
            ) : null}
            <span className="live-momentum-callout-event">
              {eventLabels[currentMarker.type]}
            </span>
          </div>
        ) : null}

        <svg
          className="live-momentum-svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="live-momentum-clip-blue">
              <rect x="0" y="0" width={VIEW_W} height={yCenter} />
            </clipPath>
            <clipPath id="live-momentum-clip-red">
              <rect x="0" y={yCenter} width={VIEW_W} height={VIEW_H - yCenter} />
            </clipPath>
          </defs>

          {gridLines.map((timeSec) => (
            <line
              key={`grid-${timeSec}`}
              className="live-momentum-grid"
              x1={toX(timeSec)}
              x2={toX(timeSec)}
              y1={PAD_TOP}
              y2={PAD_TOP + INNER_H}
            />
          ))}

          <path
            className="live-momentum-area-red"
            d={areaPath}
            clipPath="url(#live-momentum-clip-red)"
          />
          <path
            className="live-momentum-area-blue"
            d={areaPath}
            clipPath="url(#live-momentum-clip-blue)"
          />
          <path className="live-momentum-curve" d={curvePath} />

          <line
            className="live-momentum-center"
            x1={PAD_LEFT}
            x2={PAD_LEFT + INNER_W}
            y1={yCenter}
            y2={yCenter}
          />

          {gridLines.map((timeSec) => (
            <text
              key={`label-${timeSec}`}
              className="live-momentum-axis-label"
              x={toX(timeSec)}
              y={VIEW_H - 4}
              textAnchor="middle"
            >
              {Math.round(timeSec / 60)}
            </text>
          ))}

          {/* The head rides the curve at the current time, drawing it as it moves. */}
          <circle
            className="live-momentum-head"
            cx={toX(revealTime)}
            cy={displayY(revealTime, leadProbability)}
            r={3.6}
          />
        </svg>

        <div className="live-momentum-markers">
          {stickerMarkers
            .filter((marker) => marker.timeSec <= revealTime + 0.5)
            .map((marker) => {
            const markerY = displayY(
              marker.timeSec,
              probabilityAt(points, marker.timeSec),
            );
            const isCurrent = currentMarker?.id === marker.id;

            return (
              <span
                key={marker.id}
                className={`live-momentum-chip live-momentum-chip-${marker.tone}${
                  isCurrent ? " live-momentum-chip-current" : ""
                }`}
                style={{
                  left: `${(toX(marker.timeSec) / VIEW_W) * 100}%`,
                  top: `${(markerY / VIEW_H) * 100}%`,
                }}
                title={`${formatClock(marker.timeSec)} ${teamNameForSide(marker.side)} · ${eventLabels[marker.type]}`}
              >
                <LiveMatchIcon type={marker.type} size={11} />
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
