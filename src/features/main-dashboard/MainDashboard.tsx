import { Button } from "../../shared/ui/Button";
import { findLckTeamSeed } from "../../data/lckTeams";
import {
  getStrategyLabel,
  getTrainingIntensityLabel,
} from "../../domain/weekly-plan";
import { PlayerPortrait } from "../../shared/ui/PlayerPortrait";
import { EvaluationStars } from "../../shared/ui/EvaluationStars";
import { TeamLogo } from "../../shared/ui/TeamLogo";
import { analyzeOpponent, type OpponentAnalysis } from "../../domain/opponent-analysis";
import { createLckOpponentFromSchedule } from "../../domain/opponents";
import { careerMessageCategoryLabels } from "../../domain/messages";
import {
  getLckCupGroupBattleTable,
  getLckCupGroupPointSummary,
  getNextScheduledMatches,
  getPreviewMatches,
  getReviewRecords,
} from "../../domain/season";
import type {
  CareerSave,
  CompetitionState,
  LckCupGroupName,
  MatchRecord,
  MatchSchedule,
  CareerMessage,
  Player,
  Role,
  StandingEntry,
} from "../../types/game";

type MainDashboardProps = {
  career: CareerSave;
  onViewRoster: () => void;
  onViewCompetition: () => void;
  onViewCalendar: () => void;
  onViewInbox: () => void;
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

const starterSlots: Array<{ role: Role; label: string }> = [
  { role: "top", label: "TOP" },
  { role: "jungle", label: "JGL" },
  { role: "mid", label: "MID" },
  { role: "bot", label: "BOT" },
  { role: "support", label: "SUP" },
];

function getStarter(career: CareerSave, role: Role): Player | undefined {
  const playerId = career.userTeam.roster[role];

  return playerId
    ? career.lckPlayers.find((player) => player.id === playerId)
    : undefined;
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

function getGroupLabel(group: LckCupGroupName) {
  return group === "baron" ? "Baron" : "Elder";
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

function getStandingRecord(entry: StandingEntry) {
  return `${entry.wins}-${entry.losses}`;
}

function getSetDiff(entry: StandingEntry) {
  const diff = entry.setWins - entry.setLosses;

  return `${diff > 0 ? "+" : ""}${diff}`;
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

function GroupPointPanel({
  competition,
  records,
}: {
  competition: CompetitionState | undefined;
  records: MatchRecord[];
}) {
  if (!competition || competition.competitionId !== "lck-cup") {
    return null;
  }

  const summary = getLckCupGroupPointSummary(competition, records);

  return (
    <div className="mini-panel">
      <p className="eyebrow">Group points</p>
      <div className="group-score-grid">
        {(["baron", "elder"] as LckCupGroupName[]).map((group) => (
          <div
            className={`group-score-card ${
              summary.winnerGroup === group ? "group-score-card-leading" : ""
            }`}
            key={group}
          >
            <span>{getGroupLabel(group)}</span>
            <strong>{summary.groups[group].points} pts</strong>
            <small>Set diff {summary.groups[group].setDiff}</small>
          </div>
        ))}
      </div>
      <span>
        현재 기준 승자 그룹은 {getGroupLabel(summary.winnerGroup)}입니다.
      </span>
    </div>
  );
}

function MiniStandingsPanel({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState | undefined;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  if (!competition || competition.competitionId !== "lck-cup") {
    return null;
  }

  const table = getLckCupGroupBattleTable(competition, records).slice(0, 5);

  return (
    <div className="mini-panel">
      <p className="eyebrow">LCK Cup table</p>
      <div className="standings-mini-table">
        {table.map((entry, index) => (
          <div
            className={`standings-mini-row ${
              entry.teamId === userTeamId ? "standings-mini-row-user" : ""
            }`}
            key={entry.teamId}
          >
            <span>{index + 1}</span>
            <strong>{entry.teamName}</strong>
            <span>{getStandingRecord(entry)}</span>
            <span>{getSetDiff(entry)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StyleChipList({ styles }: { styles: OpponentAnalysis["favorableStyles"] }) {
  if (styles.length === 0) {
    return <span className="style-chip style-chip-muted">없음</span>;
  }

  return (
    <>
      {styles.map((style) => (
        <span className="style-chip" key={style}>
          {getStrategyLabel(style)}
        </span>
      ))}
    </>
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

function OpponentAnalysisPanel({
  analysis,
}: {
  analysis: OpponentAnalysis | null;
}) {
  if (!analysis) {
    return null;
  }

  return (
    <div className="mini-panel opponent-analysis-panel">
      <div className="analysis-title-row">
        <div>
          <p className="eyebrow">Opponent analysis</p>
          <strong>{analysis.opponentTeamName}</strong>
        </div>
        <span className="outlook-badge">{analysis.outlookGrade}</span>
      </div>
      <div className="analysis-data-grid">
        <div>
          <span>상대 스타일</span>
          <strong>{analysis.opponentStyleLabel}</strong>
        </div>
        <div>
          <span>현재 상성</span>
          <strong>{getStyleMatchupLabel(analysis.styleMatchupScore)}</strong>
        </div>
        <div>
          <span>핵심 라인</span>
          <strong>
            {analysis.keyLane.roleLabel} · {analysis.keyLane.playerName}
          </strong>
        </div>
        <div>
          <span>우리 상태</span>
          <strong>{analysis.statusSummary}</strong>
        </div>
      </div>
      <div className="style-matchup-list">
        <span>유리한 스타일</span>
        <div>
          <StyleChipList styles={analysis.favorableStyles} />
        </div>
      </div>
      <div className="style-matchup-list">
        <span>불리한 스타일</span>
        <div>
          <StyleChipList styles={analysis.unfavorableStyles} />
        </div>
      </div>
    </div>
  );
}

function getRecentMessages(messages: CareerMessage[] | undefined) {
  return [...(messages ?? [])]
    .sort((left, right) => {
      const turnDiff = right.createdTurn - left.createdTurn;

      if (turnDiff !== 0) {
        return turnDiff;
      }

      return right.id.localeCompare(left.id);
    })
    .slice(0, 4);
}

function RecentMessagesPanel({
  messages,
  onViewInbox,
}: {
  messages: CareerMessage[] | undefined;
  onViewInbox: () => void;
}) {
  const recentMessages = getRecentMessages(messages);
  const unreadCount = (messages ?? []).filter((message) => !message.read).length;

  return (
    <div className="mini-panel dashboard-message-panel" id="recent-messages" tabIndex={-1}>
      <div className="section-label-row">
        <span>최근 메시지</span>
        <strong>{unreadCount} unread</strong>
      </div>
      {recentMessages.length === 0 ? (
        <span>아직 도착한 메시지가 없습니다.</span>
      ) : (
        <div className="dashboard-message-list">
          {recentMessages.map((message) => (
            <article
              className={`dashboard-message-item ${
                message.read ? "" : "dashboard-message-item-unread"
              }`}
              key={message.id}
            >
              <strong>{message.title}</strong>
              <span>
                {careerMessageCategoryLabels[message.category]} ·{" "}
                {message.dateLabel}
              </span>
            </article>
          ))}
        </div>
      )}
      <Button variant="ghost" onClick={onViewInbox}>
        메시지함으로 이동
      </Button>
    </div>
  );
}

export function MainDashboard({
  career,
  onViewRoster,
  onViewCompetition,
  onViewCalendar,
  onViewInbox,
  onViewTeam,
}: MainDashboardProps) {
  const selectedRosterSize =
    career.userTeam.mainRosterPlayerIds.length +
    career.userTeam.academyRosterPlayerIds.length;
  const activeCompetitionName = getActiveCompetitionName(career);
  const phaseLabel =
    career.seasonState.phase === "stove-league"
      ? "Stove League"
      : career.seasonState.phase;
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
      <section className="hub-panel starter-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Current roster</p>
            <h2>선발 5인</h2>
          </div>
          <div className="panel-meta">
            <span>{selectedRosterSize} signed</span>
            <span>{career.userTeam.contracts.length} contracts</span>
          </div>
        </div>

        <div className="starter-grid">
          {starterSlots.map((slot) => {
            const player = getStarter(career, slot.role);

            return (
              <article className="starter-card" key={slot.role}>
                <strong className="starter-role">{slot.label}</strong>
                <PlayerPortrait
                  className="starter-photo"
                  player={player}
                  size="lg"
                />
                <div className="starter-name">{player?.name ?? "Open"}</div>
                {player && <EvaluationStars compact player={player} />}
              </article>
            );
          })}
        </div>
      </section>

      <section className="hub-panel match-hub-panel" id="schedule" tabIndex={-1}>
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Match hub</p>
            <h2>{matchHubTitle}</h2>
          </div>
          <div className="panel-meta">
            <span>{activeCompetitionName}</span>
            <span>{phaseLabel}</span>
            <span>{career.seasonState.currentDateLabel}</span>
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
                  밴픽 점수와 경기 로그는 이후 상세 리뷰 화면으로 확장할 수
                  있습니다.
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
                <div className="match-data-row">
                  <span>Draft power</span>
                  <strong>
                    {primaryReviewRecord.draft
                      ? primaryReviewRecord.draft.netDraftPower
                      : "N/A"}
                  </strong>
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
                <p>
                  {activeCompetitionName} {primaryPreviewMatch.week}주차 경기일입니다. 상단의
                  플레이 버튼을 누르면 오늘 {previewMatches.length}시리즈가
                  BO 단위로 진행되고, 결과 리뷰로 전환됩니다.
                </p>
                <div className="match-data-row">
                  <span>Format</span>
                  <strong>{getFormatLabel(primaryPreviewMatch)}</strong>
                </div>
                <div className="match-data-row">
                  <span>Stage</span>
                  <strong>{primaryPreviewMatch.stageName}</strong>
                </div>
                {matchAnalysis && (
                  <>
                    <div className="match-data-row">
                      <span>전망 등급</span>
                      <strong>{matchAnalysis.outlookGrade}</strong>
                    </div>
                    <div className="match-data-row">
                      <span>상대 스타일</span>
                      <strong>{matchAnalysis.opponentStyleLabel}</strong>
                    </div>
                  </>
                )}
                <WeeklyPreviewList
                  matches={previewMatches}
                  title="오늘 일정"
                  userTeamId={userTeamId}
                />
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
                <p>
                  다음 우리 팀 예정 경기는 {activeCompetitionName}{" "}
                  {primaryNextMatch.week}주차입니다. 진행 버튼은 하루씩 날짜를
                  넘기고, 우리 팀 경기일에는 플레이 버튼으로 바뀝니다.
                </p>
                <div className="match-data-row">
                  <span>Format</span>
                  <strong>{getFormatLabel(primaryNextMatch)}</strong>
                </div>
                <div className="match-data-row">
                  <span>Stage</span>
                  <strong>{primaryNextMatch.stageName}</strong>
                </div>
                {matchAnalysis && (
                  <>
                    <div className="match-data-row">
                      <span>전망 등급</span>
                      <strong>{matchAnalysis.outlookGrade}</strong>
                    </div>
                    <div className="match-data-row">
                      <span>상대 스타일</span>
                      <strong>{matchAnalysis.opponentStyleLabel}</strong>
                    </div>
                  </>
                )}
                <WeeklyPreviewList
                  matches={nextScheduledMatches}
                  title="다음 경기일 일정"
                  userTeamId={userTeamId}
                />
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
            <div className="match-data-row">
              <span>Plan</span>
              <strong>
                {getStrategyLabel(career.weeklyPlan.strategy)} /{" "}
                {getTrainingIntensityLabel(career.weeklyPlan.trainingIntensity)}
              </strong>
            </div>
            <div className="match-data-row">
              <span>Record</span>
              <strong>
                {career.userTeam.wins}W {career.userTeam.losses}L
              </strong>
            </div>
          </div>

          <div className="match-side-stack">
            <OpponentAnalysisPanel analysis={isReview ? null : matchAnalysis} />
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
                  : "LCK Cup 그룹 배틀은 5주, 이후 플레이-인과 플레이오프로 이어집니다."}
              </span>
            </div>
            <GroupPointPanel
              competition={currentCompetition}
              records={career.seasonState.matchRecords}
            />
            <MiniStandingsPanel
              competition={currentCompetition}
              records={career.seasonState.matchRecords}
              userTeamId={userTeamId}
            />
          </div>
        </div>

        <div className="dashboard-actions">
          <Button variant="ghost" onClick={onViewRoster}>
            로스터 관리
          </Button>
          <Button variant="ghost" onClick={onViewCompetition}>
            대회 현황
          </Button>
          <Button variant="ghost" onClick={onViewCalendar}>
            시즌 일정
          </Button>
        </div>
      </section>
    </section>
  );
}
