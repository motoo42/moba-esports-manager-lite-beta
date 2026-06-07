import { useMemo } from "react";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import type {
  CareerSave,
  Player,
  SeasonCompetitionSummary,
  SeasonSummary as SeasonSummaryRecord,
} from "../../types/game";

type SeasonSummaryProps = {
  career: CareerSave;
  onStartOffseason: () => void;
  onViewRoster: () => void;
};

function getLatestSummary(career: CareerSave) {
  const summarySeasonNumber =
    career.seasonState.offseason?.summarySeasonNumber ?? career.currentSeason;

  return (
    [...career.seasonHistory]
      .reverse()
      .find((summary) => summary.seasonNumber === summarySeasonNumber) ??
    career.seasonHistory[career.seasonHistory.length - 1]
  );
}

function getFallbackSummary(career: CareerSave): SeasonSummaryRecord {
  return {
    seasonNumber: career.currentSeason,
    yearLabel: career.seasonState.yearLabel,
    calendarType: career.seasonState.calendarType,
    lckResult: "진행 중",
    finalElo: career.userTeam.elo,
    finalRecord: {
      wins: career.userTeam.wins,
      losses: career.userTeam.losses,
    },
    competitionResults: career.seasonState.competitions
      .filter((competition) => competition.status !== "locked")
      .map((competition) => ({
        competitionId: competition.competitionId,
        competitionName: competition.name,
        resultLabel: competition.completed
          ? competition.winnerTeamName
            ? `${competition.winnerTeamName} 우승`
            : "완료"
          : "진행 중",
        winnerTeamName: competition.winnerTeamName,
      })),
  };
}

function getPlayerName(players: Player[], playerId: string) {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

function getExpiredPlayers(career: CareerSave) {
  const expiredIds =
    career.seasonState.offseason?.expiredContractPlayerIds ??
    getLatestSummary(career)?.expiredContractPlayerIds ??
    [];

  return expiredIds
    .map((playerId) => career.lckPlayers.find((player) => player.id === playerId))
    .filter((player): player is Player => Boolean(player));
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="season-summary-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function CompetitionResultList({
  results,
}: {
  results: SeasonCompetitionSummary[];
}) {
  if (results.length === 0) {
    return <p className="muted">아직 기록된 대회 결과가 없습니다.</p>;
  }

  return (
    <div className="season-competition-results">
      {results.map((result) => (
        <article
          className="season-competition-result"
          key={result.competitionId}
        >
          <div>
            <span>{result.competitionName}</span>
            <strong>{result.resultLabel}</strong>
          </div>
          <small>{result.userResultLabel ?? "유저 팀 기록 없음"}</small>
        </article>
      ))}
    </div>
  );
}

export function SeasonSummary({
  career,
  onStartOffseason,
  onViewRoster,
}: SeasonSummaryProps) {
  const summary = getLatestSummary(career) ?? getFallbackSummary(career);
  const expiredPlayers = useMemo(() => getExpiredPlayers(career), [career]);
  const offseason = career.seasonState.offseason;
  const isCareerComplete =
    career.seasonState.phase === "completed" ||
    offseason?.status === "career-completed";
  const canEnterOffseason =
    career.seasonState.phase === "offseason" &&
    !isCareerComplete &&
    offseason?.status !== "active" &&
    offseason?.status !== "ready-for-next-season";
  const finalRecord = summary.finalRecord ?? {
    wins: career.userTeam.wins,
    losses: career.userTeam.losses,
  };
  const competitionResults = summary.competitionResults ?? [];

  return (
    <section className="stack season-summary-page">
      <header className="season-summary-header">
        <div>
          <p className="eyebrow">Season Summary</p>
          <h1>
            {summary.yearLabel ?? career.seasonState.yearLabel} 시즌 종료
          </h1>
          <p className="lede">
            {career.userTeam.name}의 시즌 기록을 확인하고 다음 시즌 스토브리그로
            이동합니다.
          </p>
        </div>
        <div className="season-summary-status">
          <span>Season {summary.seasonNumber}</span>
          <strong>{isCareerComplete ? "커리어 완료" : "스토브리그 대기"}</strong>
        </div>
      </header>

      <div className="season-summary-grid">
        <Card>
          <div className="season-summary-card-title">
            <p className="eyebrow">Team Result</p>
            <h2>{career.userTeam.name}</h2>
          </div>
          <div className="season-summary-metrics">
            <SummaryMetric
              label="최종 성적"
              value={`${finalRecord.wins}W ${finalRecord.losses}L`}
            />
            <SummaryMetric
              label="최종 ELO"
              value={`${summary.finalElo}`}
              detail="다음 시즌에도 유지"
            />
            <SummaryMetric label="LCK 결과" value={summary.lckResult} />
            <SummaryMetric
              label="Worlds"
              value={summary.worldsChampionTeamName ?? "미정"}
              detail={summary.worldsChampionTeamName ? "Champion" : undefined}
            />
          </div>
        </Card>

        <Card>
          <div className="season-summary-card-title">
            <p className="eyebrow">Competition Log</p>
            <h2>대회별 요약</h2>
          </div>
          <CompetitionResultList results={competitionResults} />
        </Card>
      </div>

      <Card>
        <div className="season-summary-card-title">
          <p className="eyebrow">Offseason</p>
          <h2>스토브리그 준비</h2>
        </div>

        {isCareerComplete ? (
          <div className="season-summary-empty">
            <strong>최대 시즌을 모두 마쳤습니다.</strong>
            <span>커리어 기록은 시즌 히스토리에 보존됩니다.</span>
          </div>
        ) : (
          <div className="season-summary-renewal-ready">
            <strong>28일 스토브리그가 대기 중입니다.</strong>
            <span>
              1주차에는 팀 내 재계약/방출을 처리하고, 2~4주차에는 FA 시장에서
              AI 팀들과 경쟁합니다.
            </span>
          </div>
        )}

        {expiredPlayers.length > 0 && (
          <div className="season-renewal-panel">
            <div className="section-label-row">
              <span>계약 만료</span>
              <strong>{expiredPlayers.length} players</strong>
            </div>
            <div className="season-renewal-list">
              {expiredPlayers.map((player) => (
                <article className="season-renewal-row" key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>
                      {player.role.toUpperCase()} · {player.currentTeam} · salary{" "}
                      {player.salaryExpectation}
                    </span>
                    <small>스토브리그 1주차에서 재계약 또는 방출 결정</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="season-summary-actions">
          <Button disabled={!canEnterOffseason} onClick={onStartOffseason}>
            스토브리그 진입
          </Button>
          <Button variant="ghost" onClick={onViewRoster}>
            로스터 확인
          </Button>
        </div>
      </Card>

      {summary.expiredContractPlayerIds &&
        summary.expiredContractPlayerIds.length > 0 && (
          <p className="muted">
            만료 선수:{" "}
            {summary.expiredContractPlayerIds
              .map((playerId) => getPlayerName(career.lckPlayers, playerId))
              .join(", ")}
          </p>
        )}
    </section>
  );
}
