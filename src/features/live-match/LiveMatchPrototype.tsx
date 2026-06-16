import { useCallback, useMemo, useRef, useState } from "react";

import {
  applyStatSnapshotToTeams,
  buildNarrationContext,
  createMockLiveMatchPresentation,
  getFinalMatchSnapshot,
  getLiveMatchSetId,
} from "../../domain/live-match";
import type { CareerSave, MatchSeriesReplay } from "../../types/game";
import { LiveDraftBroadcastScreen } from "./components/LiveDraftBroadcastScreen";
import { LiveMatchScreen } from "./components/LiveMatchScreen";
import { LiveMatchTopbar } from "./components/LiveMatchTopbar";
import { LiveSeriesTags } from "./components/LiveSeriesTags";
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
  // Each set opens on its banpick screen; the match only starts when the user
  // hits 경기 시작, so the draft is always seen first.
  const [screen, setScreen] = useState<"match" | "draft">("draft");
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  // Sets whose banpick has already been watched — re-entering one shows it fully
  // revealed instead of re-running (and re-shuffling) the reveal animation.
  const seenDraftsRef = useRef(new Set<number>());
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
    setScreen("draft");
  }, [sets.length]);

  // No auto-advance and no auto-start: each set waits on its draft screen, and a
  // finished set holds on its final stats until the user chooses to move on.
  const playback = useMatchPlayback({
    autoPlay: false,
    timeline: baseSet.timeline,
  });

  const startSet = useCallback(() => {
    seenDraftsRef.current.add(safeIndex);
    setScreen("match");
    playback.play();
  }, [playback, safeIndex]);

  // The set's final-frame snapshot fixes each player's end-game gold, so item slots can
  // fill proportionally as the replay advances. Stable per set (frozen replay).
  const finalSnapshot = useMemo(
    () => getFinalMatchSnapshot(baseSet.timeline),
    [baseSet],
  );

  const liveTeams = useMemo(
    () =>
      applyStatSnapshotToTeams({
        blueTeam: baseSet.blueTeam,
        finalSnapshot,
        redTeam: baseSet.redTeam,
        snapshot: playback.snapshot,
      }),
    [baseSet, finalSnapshot, playback.snapshot],
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

  const seriesTags = (
    <LiveSeriesTags
      blueSetWins={blueSetWins}
      formatLabel={livePresentation.formatLabel}
      gameNumber={liveSet.gameNumber}
      redSetWins={redSetWins}
      setCount={sets.length}
      stageName={liveSet.stageName}
    />
  );

  return (
    <section
      aria-label="매치엔진 UI 프로토타입"
      className={`live-match-prototype live-match-prototype-${screen}${
        screen === "draft" ? " live-match-prototype-draft-broadcast" : ""
      }`}
    >
      <LiveMatchTopbar presentation={livePresentation} />
      {screen === "draft" ? (
        <LiveDraftBroadcastScreen
          instant={seenDraftsRef.current.has(safeIndex)}
          onShowMatch={startSet}
          seriesTags={seriesTags}
          set={liveSet}
        />
      ) : (
        <LiveMatchScreen
          commentary={commentary}
          onExit={onExit}
          onShowDraft={() => setScreen("draft")}
          playback={playback}
          seriesTags={seriesTags}
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
