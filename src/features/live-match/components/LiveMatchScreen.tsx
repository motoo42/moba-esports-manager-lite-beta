import { useEffect, useRef } from "react";

import type {
  DragonType,
  LiveMatchSetPresentation,
  LiveMatchSide,
  LiveMatchTeamPresentation,
  MatchTimelineEventType,
} from "../../../domain/live-match";
import type { LiveCommentaryEntry } from "../liveCommentaryView";
import type { MatchPlayback } from "../useMatchPlayback";
import { LiveDragonIcon } from "./LiveDragonIcon";
import { LiveMatchIcon } from "./LiveMatchIcon";
import { LiveMomentumGraph } from "./LiveMomentumGraph";
import { LivePlayerPortraitRail } from "./LivePlayerPortraitRail";
import { LiveStatsBoard } from "./LiveStatsBoard";

type LiveMatchScreenProps = {
  commentary: LiveCommentaryEntry[];
  onExit: () => void;
  onShowDraft: () => void;
  playback: MatchPlayback;
  set: LiveMatchSetPresentation;
};

const counterObjectives: Array<{
  key: "heralds" | "barons" | "towers";
  label: string;
  type: MatchTimelineEventType;
}> = [
  { key: "heralds", type: "herald", label: "전령" },
  { key: "barons", type: "baron", label: "바론" },
  { key: "towers", type: "tower", label: "타워" },
];

// Short one-line explainers shown on hover over each objective in the top bar.
const objectiveDescriptions: Partial<Record<MatchTimelineEventType, string>> = {
  dragon:
    "드래곤: 처치할 때마다 팀 전체에 영구 원소 강화를 쌓고, 네 마리째에 강력한 영혼을 얻습니다.",
  herald: "전령: 처치 후 소환해 타워 철거를 돕습니다.",
  baron: "바론: 처치 시 아군과 미니언에게 이로운 버프를 제공합니다.",
  tower: "타워: 부술수록 골드를 얻고 상대 본진으로 진격할 수 있습니다.",
};

function DragonTrack({ side, types }: { side: LiveMatchSide; types: DragonType[] }) {
  // Mirror the order on the red side so both teams' dragons read symmetrically
  // outward from the centre.
  const ordered = side === "blue" ? types : [...types].reverse();

  return (
    <span
      className="live-objective-dragons live-objective-has-tip"
      aria-label={`드래곤 ${types.length}개`}
      tabIndex={0}
    >
      {ordered.length === 0 ? (
        <LiveMatchIcon type="dragon" size={14} />
      ) : (
        ordered.map((type, index) => (
          <LiveDragonIcon key={`${type}-${index}`} type={type} size={14} />
        ))
      )}
      <span className="live-objective-tip" role="tooltip">
        {objectiveDescriptions.dragon}
      </span>
    </span>
  );
}

function ObjectiveRow({ side, team }: { side: LiveMatchSide; team: LiveMatchTeamPresentation }) {
  const counters = side === "blue" ? counterObjectives : [...counterObjectives].reverse();
  const counterCells = counters.map((objective) => (
    <span
      aria-label={`${team.name} ${objective.label} ${team.objectives[objective.key]}개`}
      className="live-objective-has-tip"
      key={objective.key}
      tabIndex={0}
    >
      <LiveMatchIcon type={objective.type} size={15} />
      {team.objectives[objective.key]}
      <span className="live-objective-tip" role="tooltip">
        {objectiveDescriptions[objective.type]}
      </span>
    </span>
  ));
  const dragonCell = (
    <DragonTrack key="dragons" side={side} types={team.objectives.dragonTypes} />
  );

  return (
    <div className={`live-objective-row live-objective-row-${side}`}>
      {side === "blue"
        ? [dragonCell, ...counterCells]
        : [...counterCells, dragonCell]}
    </div>
  );
}

function FrequencyToggle({ playback }: { playback: MatchPlayback }) {
  return (
    <div className="live-frequency-toggle" role="group" aria-label="문자중계 빈도">
      <button
        type="button"
        aria-pressed={playback.frequency === "major"}
        onClick={() => playback.setFrequency("major")}
      >
        주요 상황
      </button>
      <button
        type="button"
        aria-pressed={playback.frequency === "core"}
        onClick={() => playback.setFrequency("core")}
      >
        핵심 상황
      </button>
    </div>
  );
}

export function LiveMatchScreen({
  commentary,
  onExit,
  onShowDraft,
  playback,
  set,
}: LiveMatchScreenProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  // Stick the feed to the latest message, unless the user has scrolled up to
  // read older entries (then leave it until they return to the bottom).
  const stickToBottomRef = useRef(true);

  const handleFeedScroll = () => {
    const element = feedRef.current;

    if (element) {
      stickToBottomRef.current =
        element.scrollHeight - element.scrollTop - element.clientHeight < 24;
    }
  };

  useEffect(() => {
    const element = feedRef.current;

    if (element && stickToBottomRef.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [commentary]);

  return (
    <>
      <div className="live-objective-strip">
        <ObjectiveRow side="blue" team={set.blueTeam} />
        <span className="live-objective-center">오브젝트</span>
        <ObjectiveRow side="red" team={set.redTeam} />
      </div>

      <main className="live-match-main">
        <LivePlayerPortraitRail side="blue" team={set.blueTeam} />

        <section className="live-commentary-stage">
          <div className="live-commentary-hero">
            <h1>문자중계</h1>
            <div className="live-commentary-actions">
              <FrequencyToggle playback={playback} />
              <button type="button" onClick={onShowDraft}>
                밴픽 화면
              </button>
              <button type="button" onClick={playback.toggle}>
                {playback.isPlaying ? "일시정지" : "재생"}
              </button>
              <button
                type="button"
                aria-pressed={playback.speed === "fast"}
                onClick={() =>
                  playback.setSpeed(
                    playback.speed === "fast" ? "normal" : "fast",
                  )
                }
              >
                빠른 진행
              </button>
              <button type="button" onClick={playback.skipToEnd}>
                세트 결과
              </button>
              <button type="button" onClick={onExit}>
                허브로
              </button>
            </div>
          </div>

          <div
            className="live-commentary-feed"
            ref={feedRef}
            onScroll={handleFeedScroll}
          >
            {commentary.map((entry) => (
              <article
                className={`live-commentary-event live-tone-${entry.tone}`}
                key={entry.id}
              >
                <time>{entry.time}</time>
                <div>
                  <strong>
                    <span className="live-event-icon" aria-hidden="true">
                      {entry.dragonType ? (
                        <LiveDragonIcon type={entry.dragonType} size={16} />
                      ) : (
                        <LiveMatchIcon type={entry.type} size={16} />
                      )}
                    </span>
                    {entry.title}
                    {entry.badgeLabel ? (
                      <span className="live-event-badge">{entry.badgeLabel}</span>
                    ) : null}
                  </strong>
                  <p>{entry.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <LivePlayerPortraitRail side="red" team={set.redTeam} />
      </main>

      <LiveMomentumGraph gameTimeSec={playback.gameTimeSec} set={set} />

      <LiveStatsBoard set={set} />
    </>
  );
}
