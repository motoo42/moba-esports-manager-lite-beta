import { useCallback, useMemo, useState } from "react";

import {
  applyStatSnapshotToTeams,
  buildNarrationContext,
  createMockLiveMatchPresentation,
  getLiveMatchSetId,
} from "../../domain/live-match";
import type { CareerSave, MatchSeriesReplay } from "../../types/game";
import { LiveDraftScreen } from "./components/LiveDraftScreen";
import { LiveMatchScreen } from "./components/LiveMatchScreen";
import { LiveMatchTopbar } from "./components/LiveMatchTopbar";
import { buildCommentaryEntries, formatClock } from "./liveCommentaryView";
import { useMatchPlayback } from "./useMatchPlayback";

type LiveMatchPrototypeProps = {
  career: CareerSave | null;
  onExit: () => void;
  series?: MatchSeriesReplay | null;
};

export function LiveMatchPrototype({
  career,
  onExit,
  series,
}: LiveMatchPrototypeProps) {
  const [screen, setScreen] = useState<"match" | "draft">("match");
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const setId = getLiveMatchSetId(career);
  const presentation = useMemo(
    () => createMockLiveMatchPresentation(career, series),
    // Freeze the replay by set id (step 7): the played match (career + series) is
    // fixed, so the presentation must not be rebuilt mid-replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setId],
  );
  const sets = presentation.sets;
  const safeIndex = Math.min(currentSetIndex, sets.length - 1);
  const baseSet = sets[safeIndex];

  const goToNextSet = useCallback(() => {
    setCurrentSetIndex((index) => Math.min(index + 1, sets.length - 1));
  }, [sets.length]);

  // No auto-advance: a finished set holds on its final stats until the user
  // chooses to move on, so it never rushes past the set result.
  const playback = useMatchPlayback({ timeline: baseSet.timeline });

  const liveTeams = useMemo(
    () =>
      applyStatSnapshotToTeams({
        blueTeam: baseSet.blueTeam,
        redTeam: baseSet.redTeam,
        snapshot: playback.snapshot,
      }),
    [baseSet, playback.snapshot],
  );

  const liveSet = useMemo(
    () => ({
      ...baseSet,
      blueTeam: liveTeams.blueTeam,
      gameTime: formatClock(playback.gameTimeSec),
      redTeam: liveTeams.redTeam,
    }),
    [baseSet, liveTeams, playback.gameTimeSec],
  );

  const narrationContext = useMemo(
    () =>
      buildNarrationContext({
        blueTeam: baseSet.blueTeam,
        redTeam: baseSet.redTeam,
      }),
    [baseSet],
  );

  const commentary = useMemo(
    () => buildCommentaryEntries(playback.revealedEvents, narrationContext),
    [playback.revealedEvents, narrationContext],
  );

  // Running series score across the sets that have finished.
  const currentSetFinished = playback.status === "finished";
  const finishedSets = sets.slice(
    0,
    safeIndex + (currentSetFinished ? 1 : 0),
  );
  const blueSetWins = finishedSets.filter(
    (set) => set.timeline.winningSide === "blue",
  ).length;
  const redSetWins = finishedSets.filter(
    (set) => set.timeline.winningSide === "red",
  ).length;
  const isLastSet = safeIndex === sets.length - 1;
  const seriesComplete = currentSetFinished && isLastSet;
  const showSetBreak = currentSetFinished && !isLastSet;
  const setWinnerName =
    baseSet.timeline.winningSide === "blue"
      ? liveSet.blueTeam.name
      : liveSet.redTeam.name;

  const livePresentation = useMemo(
    () => ({ ...presentation, currentSet: liveSet }),
    [presentation, liveSet],
  );

  return (
    <section
      aria-label="매치엔진 UI 프로토타입"
      className={`live-match-prototype live-match-prototype-${screen}`}
    >
      <LiveMatchTopbar
        blueSetWins={blueSetWins}
        presentation={livePresentation}
        redSetWins={redSetWins}
        setCount={sets.length}
      />
      {screen === "draft" ? (
        <LiveDraftScreen onShowMatch={() => setScreen("match")} set={liveSet} />
      ) : (
        <LiveMatchScreen
          commentary={commentary}
          onExit={onExit}
          onShowDraft={() => setScreen("draft")}
          playback={playback}
          set={liveSet}
        />
      )}
      {showSetBreak && (
        <div className="live-series-result live-set-break" role="status">
          <span>세트 {baseSet.gameNumber} 종료</span>
          <strong>{setWinnerName} 승</strong>
          <div className="live-series-actions">
            <button type="button" onClick={goToNextSet}>
              다음 세트
            </button>
            <button type="button" onClick={onExit}>
              허브로
            </button>
          </div>
        </div>
      )}
      {seriesComplete && (
        <div className="live-series-result" role="status">
          <span>SERIES</span>
          <strong>
            {liveSet.blueTeam.name} {blueSetWins} - {redSetWins}{" "}
            {liveSet.redTeam.name}
          </strong>
          <em>
            {(blueSetWins >= redSetWins ? liveSet.blueTeam : liveSet.redTeam).name}{" "}
            승리
          </em>
          <div className="live-series-actions">
            <button type="button" onClick={onExit}>
              허브로
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
