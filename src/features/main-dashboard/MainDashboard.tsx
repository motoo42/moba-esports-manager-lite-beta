import { Button } from "../../shared/ui/Button";
import { findLckTeamSeed } from "../../data/lckTeams";
import {
  getStrategyLabel,
  getTrainingIntensityLabel,
} from "../../domain/weekly-plan";
import { TeamLogo } from "../../shared/ui/TeamLogo";
import { analyzeOpponent, type OpponentAnalysis } from "../../domain/opponent-analysis";
import { createLckOpponentFromSchedule } from "../../domain/opponents";
import { careerMessageCategoryLabels } from "../../domain/messages";
import { StarterLineupPanel } from "./StarterLineupPanel";
import {
  getNextScheduledMatches,
  getPreviewMatches,
  getReviewRecords,
} from "../../domain/season";
import { formatSeasonDateLabel } from "../../domain/season/seasonScheduleDates";
import type {
  CareerSave,
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  CareerMessage,
} from "../../types/game";

type MainDashboardProps = {
  career: CareerSave;
  onViewRoster: () => void;
  onViewCompetition: () => void;
  onViewCalendar: () => void;
  onViewInbox: () => void;
  onViewOpponentReport: () => void;
  onViewTeam?: (teamId: string) => void;
};

function getActiveCompetitionName(career: CareerSave) {
  const activeCompetition = career.seasonState.competitions.find(
    (competition) => competition.status === "active",
  );
  const currentCompetition = career.seasonState.competitions.find(
    (competition) =>
      competition.competitionId === career.seasonState.currentCompetitionId,
  );

  if (activeCompetition) {
    return activeCompetition.name;
  }

  if (currentCompetition?.status === "completed") {
    return `${currentCompetition.name} Completed`;
  }

  return currentCompetition?.name ?? "No active competition";
}

function getUserTeamId(career: CareerSave) {
  const activeCompetition = career.seasonState.competitions.find(
    (competition) => competition.competitionId === career.seasonState.currentCompetitionId,
  );

  return activeCompetition?.standings.find((entry) => entry.isUserTeam)?.teamId;
}

function getCurrentCompetition(career: CareerSave) {
  return career.seasonState.competitions.find(
    (competition) =>
      competition.competitionId === career.seasonState.currentCompetitionId,
  );
}

function getFormatLabel(match: MatchSchedule) {
  return `${match.format.toUpperCase()}${match.fearlessEnabled ? " · Fearless" : ""}`;
}

function getMatchTitle(match: MatchSchedule) {
  return `${match.blueTeamName} vs ${match.redTeamName}`;
}

function getTeamLabel(teamId: string, teamName: string) {
  const lckTeam = findLckTeamSeed(teamId) ?? findLckTeamSeed(teamName);

  if (!lckTeam) {
    return <span>{teamName}</span>;
  }

  return (
    <span className="team-name-with-logo">
      <TeamLogo team={lckTeam} size="sm" />
      <span>{teamName}</span>
    </span>
  );
}

function getLckOpponentFromMatch(
  match: MatchSchedule | undefined,
  userTeamId: string | undefined,
) {
  if (!match || !userTeamId) {
    return null;
  }

  const opponentId =
    match.blueTeamId === userTeamId
      ? match.redTeamId
      : match.redTeamId === userTeamId
        ? match.blueTeamId
        : null;

  return opponentId ? findLckTeamSeed(opponentId) : null;
}

function getMatchAnalysis(
  career: CareerSave,
  match: MatchSchedule | undefined,
  userTeamId: string | undefined,
) {
  if (!match || !userTeamId || !isUserMatch(match, userTeamId)) {
    return null;
  }

  return analyzeOpponent({
    match,
    opponent: createLckOpponentFromSchedule(match, userTeamId),
    players: career.lckPlayers,
    team: career.userTeam,
    trainingIntensity: career.weeklyPlan.trainingIntensity,
    userStrategy: career.weeklyPlan.strategy,
    userTeamId,
  });
}

function getPrimaryPreviewMatch(
  matches: MatchSchedule[],
  userTeamId: string | undefined,
) {
  return (
    matches.find(
      (match) =>
        match.blueTeamId === userTeamId || match.redTeamId === userTeamId,
    ) ?? matches[0]
  );
}

function getPrimaryReviewRecord(records: MatchRecord[]) {
  return records.find((record) => record.userResult !== "none") ?? records[0];
}

function getScheduleById(competition: CompetitionState | undefined) {
  return new Map(competition?.schedule.map((match) => [match.id, match]) ?? []);
}

function getRecordMatchTitle(
  record: MatchRecord,
  scheduleById: Map<string, MatchSchedule>,
) {
  const match = scheduleById.get(record.scheduleId);

  return match ? getMatchTitle(match) : record.log[0] ?? record.winnerTeamName;
}

function getRecordScore(record: MatchRecord) {
  return `${record.score.blueWins}-${record.score.redWins}`;
}

function isUserMatch(match: MatchSchedule, userTeamId: string | undefined) {
  return match.blueTeamId === userTeamId || match.redTeamId === userTeamId;
}

function WeeklyPreviewList({
  matches,
  title = "오늘 일정",
  userTeamId,
}: {
  matches: MatchSchedule[];
  title?: string;
  userTeamId: string | undefined;
}) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="weekly-match-list">
      <div className="section-label-row">
        <span>{title}</span>
        <strong>{matches.length} series</strong>
      </div>
      {matches.map((match) => {
        const userMatch = isUserMatch(match, userTeamId);

        return (
          <div
            className={`weekly-match-row ${userMatch ? "weekly-match-row-user" : ""}`}
            key={match.id}
          >
            <div>
              <strong className="match-row-title-with-logos">
                {getTeamLabel(match.blueTeamId, match.blueTeamName)}
                <span>vs</span>
                {getTeamLabel(match.redTeamId, match.redTeamName)}
              </strong>
              <span>{match.stageName}</span>
            </div>
            <div className="match-row-meta">
              {userMatch && <span className="result-badge result-user">USER</span>}
              <span>{getFormatLabel(match)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyReviewList({
  records,
  scheduleById,
}: {
  records: MatchRecord[];
  scheduleById: Map<string, MatchSchedule>;
}) {
  if (records.length === 0) {
    return null;
  }

  return (
    <div className="weekly-match-list">
      <div className="section-label-row">
        <span>오늘 결과</span>
        <strong>{records.length} results</strong>
      </div>
      {records.map((record) => {
        const isUserResult = record.userResult !== "none";

        return (
          <div
            className={`weekly-match-row ${isUserResult ? "weekly-match-row-user" : ""}`}
            key={record.id}
          >
            <div>
              <strong>{getRecordMatchTitle(record, scheduleById)}</strong>
              <span>Winner: {record.winnerTeamName}</span>
            </div>
            <div className="match-row-meta">
              <span
                className={`result-badge ${
                  record.userResult === "win"
                    ? "result-win"
                    : record.userResult === "loss"
                      ? "result-loss"
                      : "result-neutral"
                }`}
              >
                {record.userResult === "none" ? "SIM" : record.userResult.toUpperCase()}
              </span>
              <strong>{getRecordScore(record)}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getStyleMatchupLabel(score: number) {
  if (score > 0) {
    return "우호";
  }

  if (score < 0) {
    return "불리";
  }

  return "중립";
}

function MatchMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="match-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OpponentAnalysisPanel({
  analysis,
  onViewOpponentReport,
}: {
  analysis: OpponentAnalysis | null;
  onViewOpponentReport: () => void;
}) {
  if (!analysis) {
    return null;
  }

  return (
    <button
      aria-label="전략/훈련 상대 리포트 열기"
      className="mini-panel opponent-analysis-panel"
      onClick={onViewOpponentReport}
      type="button"
    >
      <div className="analysis-title-row">
        <div>
          <p className="eyebrow">Opponent analysis</p>
          <strong>{analysis.opponentTeamName}</strong>
        </div>
        <span className="outlook-badge">{analysis.outlookGrade}</span>
      </div>
      <div className="opponent-summary-strip">
        <span>{analysis.opponentStyleLabel}</span>
        <span>{getStyleMatchupLabel(analysis.styleMatchupScore)}</span>
        <span>
          {analysis.keyLane.roleLabel} · {analysis.keyLane.playerName}
        </span>
      </div>
    </button>
  );
}

function compareMessagesByCreatedTurn(
  left: CareerMessage,
  right: CareerMessage,
) {
  const turnDiff = right.createdTurn - left.createdTurn;

  if (turnDiff !== 0) {
    return turnDiff;
  }

  return right.id.localeCompare(left.id);
}

function isPriorityUnreadMessage(message: CareerMessage) {
  return !message.read && message.priority !== "normal";
}

function getDashboardMessage(messages: CareerMessage[] | undefined) {
  const sortedMessages = [...(messages ?? [])].sort(
    compareMessagesByCreatedTurn,
  );

  return (
    sortedMessages.find(isPriorityUnreadMessage) ??
    sortedMessages.find((message) => !message.read) ??
    sortedMessages[0]
  );
}

function RecentMessagesPanel({
  messages,
  onViewInbox,
}: {
  messages: CareerMessage[] | undefined;
  onViewInbox: () => void;
}) {
  const dashboardMessage = getDashboardMessage(messages);
  const unreadCount = (messages ?? []).filter((message) => !message.read).length;

  return (
    <button
      aria-label="최근 메시지함 열기"
      className="mini-panel dashboard-message-panel"
      id="recent-messages"
      onClick={onViewInbox}
      type="button"
    >
      <div className="section-label-row">
        <span>최근 메시지</span>
        <strong>{unreadCount} unread</strong>
      </div>
      {!dashboardMessage ? (
        <span>아직 도착한 메시지가 없습니다.</span>
      ) : (
        <div className="dashboard-message-list">
          <article
            className={`dashboard-message-item ${
              dashboardMessage.read ? "" : "dashboard-message-item-unread"
            }`}
          >
            <strong>{dashboardMessage.title}</strong>
            <span>
              {careerMessageCategoryLabels[dashboardMessage.category]} ·{" "}
              {dashboardMessage.dateLabel}
            </span>
          </article>
        </div>
      )}
    </button>
  );
}

export function MainDashboard({
  career,
  onViewRoster,
  onViewCompetition,
  onViewCalendar,
  onViewInbox,
  onViewOpponentReport,
  onViewTeam,
}: MainDashboardProps) {
  const activeCompetitionName = getActiveCompetitionName(career);
  const currentCompetition = getCurrentCompetition(career);
  const scheduleById = getScheduleById(currentCompetition);
  const previewMatches = getPreviewMatches(career.seasonState);
  const reviewRecords = getReviewRecords(career.seasonState);
  const nextScheduledMatches = getNextScheduledMatches(career.seasonState);
  const userTeamId = getUserTeamId(career);
  const primaryPreviewMatch = getPrimaryPreviewMatch(previewMatches, userTeamId);
  const primaryReviewRecord = getPrimaryReviewRecord(reviewRecords);
  const primaryNextMatch = getPrimaryPreviewMatch(nextScheduledMatches, userTeamId);
  const matchAnalysis = getMatchAnalysis(
    career,
    primaryPreviewMatch ?? primaryNextMatch,
    userTeamId,
  );
  const primaryPreviewOpponent = getLckOpponentFromMatch(
    primaryPreviewMatch,
    userTeamId,
  );
  const primaryNextOpponent = getLckOpponentFromMatch(primaryNextMatch, userTeamId);
  const isReview = career.seasonState.progressStatus === "match-review";
  const isPreview = career.seasonState.progressStatus === "match-preview";
  const matchHubTitle = isReview
    ? "경기 리뷰"
    : isPreview
      ? "매치 프리뷰"
      : "다음 경기";

  return (
    <section className="main-hub" id="dashboard" tabIndex={-1}>
      <section className="hub-panel match-hub-panel" id="schedule" tabIndex={-1}>
        <div className="panel-title-row match-hub-title-row">
          <div>
            <p className="eyebrow">Match hub</p>
            <h2>{matchHubTitle}</h2>
          </div>
          <div className="match-hub-header-tools">
            <div className="dashboard-actions dashboard-actions-inline">
              <Button onClick={onViewRoster}>
                1군 로스터 보기
              </Button>
              <Button variant="ghost" onClick={onViewCompetition}>
                대회 현황
              </Button>
              <Button variant="ghost" onClick={onViewCalendar}>
                시즌 일정
              </Button>
            </div>
          </div>
        </div>

        <div className="match-hub-grid">
          <div className="match-primary-card">
            <p className="eyebrow">
              {isReview ? "Review" : isPreview ? "Preview" : "Next match"}
            </p>
            {isReview && primaryReviewRecord ? (
              <>
                <h3>
                  {primaryReviewRecord.winnerTeamName} 승리 ·{" "}
                  {primaryReviewRecord.score.blueWins}-
                  {primaryReviewRecord.score.redWins}
                </h3>
                <p>
                  {primaryReviewRecord.userResult === "win"
                    ? "오늘 유저 팀 경기는 승리로 마무리했습니다."
                    : primaryReviewRecord.userResult === "loss"
                      ? "오늘 유저 팀 경기는 패배로 마무리했습니다."
                      : "오늘 리그 경기가 처리되었습니다."}{" "}
                  다음 진행을 누르면 날짜가 이어집니다.
                </p>
                <div className="match-data-row">
                  <span>결과</span>
                  <strong>
                    {primaryReviewRecord.userResult === "win"
                      ? "승리"
                      : primaryReviewRecord.userResult === "loss"
                        ? "패배"
                        : "중립 경기"}
                  </strong>
                </div>
                <div className="match-metric-strip">
                  <MatchMetric
                    label="Draft power"
                    value={
                      primaryReviewRecord.draft
                        ? primaryReviewRecord.draft.netDraftPower
                        : "N/A"
                    }
                  />
                  <MatchMetric
                    label="Plan"
                    value={`${getStrategyLabel(
                      career.weeklyPlan.strategy,
                    )} / ${getTrainingIntensityLabel(
                      career.weeklyPlan.trainingIntensity,
                    )}`}
                  />
                  <MatchMetric
                    label="Record"
                    value={`${career.userTeam.wins}W ${career.userTeam.losses}L`}
                  />
                </div>
                <WeeklyReviewList
                  records={reviewRecords}
                  scheduleById={scheduleById}
                />
              </>
            ) : primaryPreviewMatch ? (
              <>
                <h3>{getMatchTitle(primaryPreviewMatch)}</h3>
                {primaryPreviewOpponent && onViewTeam && (
                  <button
                    className="team-link-button team-name-with-logo match-team-link"
                    onClick={() => onViewTeam(primaryPreviewOpponent.id)}
                    type="button"
                  >
                    <TeamLogo team={primaryPreviewOpponent} size="sm" />
                    <span>{primaryPreviewOpponent.name} 구단 정보</span>
                  </button>
                )}
                {primaryPreviewMatch.scheduledDate && (
                  <p className="match-date-chip">
                    <span>경기일</span>
                    <strong>
                      {formatSeasonDateLabel(primaryPreviewMatch.scheduledDate)}
                    </strong>
                  </p>
                )}
                <p>
                  {activeCompetitionName} {primaryPreviewMatch.week}주차 경기일입니다.
                  플레이 후 오늘 {previewMatches.length}시리즈 결과 리뷰로 전환됩니다.
                </p>
                <div className="match-metric-strip">
                  <MatchMetric
                    label="Format"
                    value={getFormatLabel(primaryPreviewMatch)}
                  />
                  <MatchMetric
                    label="Stage"
                    value={primaryPreviewMatch.stageName}
                  />
                  {matchAnalysis && (
                    <>
                      <MatchMetric label="전망" value={matchAnalysis.outlookGrade} />
                      <MatchMetric
                        label="상대 스타일"
                        value={matchAnalysis.opponentStyleLabel}
                      />
                    </>
                  )}
                  <MatchMetric
                    label="Plan"
                    value={`${getStrategyLabel(
                      career.weeklyPlan.strategy,
                    )} / ${getTrainingIntensityLabel(
                      career.weeklyPlan.trainingIntensity,
                    )}`}
                  />
                  <MatchMetric
                    label="Record"
                    value={`${career.userTeam.wins}W ${career.userTeam.losses}L`}
                  />
                </div>
              </>
            ) : primaryNextMatch ? (
              <>
                <h3>{getMatchTitle(primaryNextMatch)}</h3>
                {primaryNextOpponent && onViewTeam && (
                  <button
                    className="team-link-button team-name-with-logo match-team-link"
                    onClick={() => onViewTeam(primaryNextOpponent.id)}
                    type="button"
                  >
                    <TeamLogo team={primaryNextOpponent} size="sm" />
                    <span>{primaryNextOpponent.name} 구단 정보</span>
                  </button>
                )}
                {primaryNextMatch.scheduledDate && (
                  <p className="match-date-chip">
                    <span>경기일</span>
                    <strong>
                      {formatSeasonDateLabel(primaryNextMatch.scheduledDate)}
                    </strong>
                  </p>
                )}
                <p>
                  다음 우리 팀 예정 경기는 {activeCompetitionName}{" "}
                  {primaryNextMatch.week}주차입니다. 진행하면 하루씩 날짜가 흐릅니다.
                </p>
                <div className="match-metric-strip">
                  <MatchMetric
                    label="Format"
                    value={getFormatLabel(primaryNextMatch)}
                  />
                  <MatchMetric
                    label="Stage"
                    value={primaryNextMatch.stageName}
                  />
                  {matchAnalysis && (
                    <>
                      <MatchMetric label="전망" value={matchAnalysis.outlookGrade} />
                      <MatchMetric
                        label="상대 스타일"
                        value={matchAnalysis.opponentStyleLabel}
                      />
                    </>
                  )}
                  <MatchMetric
                    label="Plan"
                    value={`${getStrategyLabel(
                      career.weeklyPlan.strategy,
                    )} / ${getTrainingIntensityLabel(
                      career.weeklyPlan.trainingIntensity,
                    )}`}
                  />
                  <MatchMetric
                    label="Record"
                    value={`${career.userTeam.wins}W ${career.userTeam.losses}L`}
                  />
                </div>
              </>
            ) : (
              <>
                <h3>LCK Cup schedule block complete</h3>
                <p>
                  LCK Cup의 현재 예약된 일정은 모두 처리되었습니다. 다음
                  단계에서 이어지는 대회나 시즌 전환을 연결합니다.
                </p>
              </>
            )}
          </div>

          <StarterLineupPanel career={career} />

          <div className="match-side-stack">
            <OpponentAnalysisPanel
              analysis={isReview ? null : matchAnalysis}
              onViewOpponentReport={onViewOpponentReport}
            />
            <RecentMessagesPanel
              messages={career.messages}
              onViewInbox={onViewInbox}
            />
            <div className="mini-panel">
              <p className="eyebrow">Day status</p>
              <strong>
                {isReview ? "경기 직후" : isPreview ? "경기 직전" : "일반 진행"}
              </strong>
              <span>
                {isReview
                  ? "진행 버튼을 누르면 다음 날짜로 이동합니다."
                  : isPreview
                    ? "플레이 버튼을 누르면 오늘 경기가 진행됩니다."
                    : "진행 버튼을 누르면 날짜가 하루 흐릅니다."}
              </span>
            </div>
            <div className="mini-panel">
              <p className="eyebrow">Recent log</p>
              <strong>
                {primaryReviewRecord
                  ? primaryReviewRecord.log[0]
                  : primaryPreviewMatch
                    ? getFormatLabel(primaryPreviewMatch)
                    : "대기 중"}
              </strong>
              <span>
                {primaryReviewRecord
                  ? primaryReviewRecord.log[1]
                  : "대회 세부 현황은 대회 현황 화면에서 확인합니다."}
              </span>
            </div>
          </div>
        </div>

      </section>
    </section>
  );
}
