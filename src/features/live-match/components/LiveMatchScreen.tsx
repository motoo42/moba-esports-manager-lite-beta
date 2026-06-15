import { useEffect, useRef } from "react";

import type {
  LiveMatchObjectiveSnapshot,
  LiveMatchSetPresentation,
  LiveMatchSide,
  LiveMatchTeamPresentation,
  MatchTimelineEventType,
} from "../../../domain/live-match";
import type { LiveCommentaryEntry } from "../liveCommentaryView";
import type { MatchPlayback } from "../useMatchPlayback";
import { LiveMatchIcon } from "./LiveMatchIcon";
import { LivePlayerPortraitRail } from "./LivePlayerPortraitRail";
import { LiveStatsBoard } from "./LiveStatsBoard";

type LiveMatchScreenProps = {
  commentary: LiveCommentaryEntry[];
  onExit: () => void;
  onShowDraft: () => void;
  playback: MatchPlayback;
  set: LiveMatchSetPresentation;
};

const objectiveIcons: Array<{
  key: keyof LiveMatchObjectiveSnapshot;
  label: string;
  type: MatchTimelineEventType;
}> = [
  { key: "dragons", type: "dragon", label: "드래곤" },
  { key: "heralds", type: "herald", label: "전령" },
  { key: "barons", type: "baron", label: "바론" },
  { key: "towers", type: "tower", label: "타워" },
];

function ObjectiveRow({ side, team }: { side: LiveMatchSide; team: LiveMatchTeamPresentation }) {
  const items = side === "blue" ? objectiveIcons : [...objectiveIcons].reverse();

  return (
    <div className={`live-objective-row live-objective-row-${side}`}>
      {items.map((objective) => (
        <span
          aria-label={`${team.name} ${objective.label} ${team.objectives[objective.key]}개`}
          key={objective.key}
          title={objective.label}
        >
          <LiveMatchIcon type={objective.type} size={15} />
          {team.objectives[objective.key]}
        </span>
      ))}
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
                      <LiveMatchIcon type={entry.type} size={16} />
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

      <LiveStatsBoard set={set} />
    </>
  );
}
