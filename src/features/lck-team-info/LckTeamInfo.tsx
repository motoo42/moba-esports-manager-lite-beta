import { useEffect, useState } from "react";
import {
  getLckTeamDisplayName,
  lck2026Teams,
  type LckTeamSeed,
} from "../../data/lckTeams";
import { formatSalaryAmount } from "../../shared/format/money";
import { PlayerCard } from "../../shared/ui/PlayerCard";
import { PlayerDetailModal } from "../../shared/ui/PlayerDetailModal";
import { TeamLogo } from "../../shared/ui/TeamLogo";
import type {
  CareerSave,
  Player,
  Role,
  StandingEntry,
  Team,
} from "../../types/game";
import { getLckTeamIntroduction } from "./lckTeamIntroductions";
import { getLckTeamHistory } from "./lckTeamHistories";

type LckTeamInfoProps = {
  career: CareerSave;
  teamId?: string | null;
  onViewTeam: (teamId: string) => void;
  onViewTeamList: () => void;
};

type StandingSnapshot = {
  competitionName: string;
  rank: number;
  entry: StandingEntry;
};

type ReserveRosterGroup = "bench" | "academy";

const roleSlots: Array<{ role: Role; label: string }> = [
  { role: "top", label: "TOP" },
  { role: "jungle", label: "JGL" },
  { role: "mid", label: "MID" },
  { role: "bot", label: "BOT" },
  { role: "support", label: "SUP" },
];

const lckStandingPriority = [
  "lck-rounds-3-5",
  "lck-rounds-3-4",
  "lck-rounds-1-2",
  "lck-cup",
];

function getSetDiff(entry: StandingEntry) {
  return entry.setWins - entry.setLosses;
}

function compareStandingEntries(left: StandingEntry, right: StandingEntry) {
  return (
    right.wins - left.wins ||
    getSetDiff(right) - getSetDiff(left) ||
    right.setWins - left.setWins ||
    left.initialSeed - right.initialSeed
  );
}

function getUserTeamSeed(career: CareerSave) {
  return lck2026Teams.find((team) => team.name === career.userTeam.name);
}

function isUserTeam(career: CareerSave, team: LckTeamSeed) {
  return getUserTeamSeed(career)?.id === team.id;
}

function getPlayerTeamId(player: Player) {
  if (!player.currentTeam) {
    return null;
  }

  return (
    lck2026Teams.find(
      (team) => team.name === player.currentTeam || team.shortName === player.currentTeam,
    )?.id ?? null
  );
}

function isAvailablePlayer(player: Player) {
  return player.availableForRoster !== false && player.rosterTier !== "free-agent";
}

function getPlayersForTeam(career: CareerSave, team: LckTeamSeed) {
  return career.lckPlayers.filter(
    (player) => isAvailablePlayer(player) && getPlayerTeamId(player) === team.id,
  );
}

function getPlayersByIds(players: Player[], playerIds: string[]) {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return playerIds
    .map((playerId) => playerById.get(playerId))
    .filter((player): player is Player => Boolean(player));
}

function sortByScoutingPriority(players: Player[]) {
  return [...players].sort(
    (left, right) =>
      right.overall - left.overall ||
      right.ability - left.ability ||
      right.status.form - left.status.form ||
      left.name.localeCompare(right.name),
  );
}

function getUserTeamRosterSections(career: CareerSave) {
  const players = career.lckPlayers.filter(isAvailablePlayer);
  const starterIds = new Set(Object.values(career.userTeam.roster).filter(Boolean));
  const starters = roleSlots.map(({ role }) => {
    const playerId = career.userTeam.roster[role];

    return playerId ? players.find((player) => player.id === playerId) : undefined;
  });
  const mainPlayers = getPlayersByIds(players, career.userTeam.mainRosterPlayerIds);
  const academyPlayers = getPlayersByIds(players, career.userTeam.academyRosterPlayerIds);

  return {
    starters,
    benchPlayers: mainPlayers.filter((player) => !starterIds.has(player.id)),
    academyPlayers,
  };
}

function getEstimatedRosterSections(career: CareerSave, team: LckTeamSeed) {
  const teamPlayers = getPlayersForTeam(career, team);
  const mainPlayers = sortByScoutingPriority(
    teamPlayers.filter((player) => player.rosterTier === "main"),
  );
  const academyPlayers = sortByScoutingPriority(
    teamPlayers.filter((player) => player.rosterTier === "academy"),
  );
  const fallbackPlayers = mainPlayers.length > 0 ? mainPlayers : sortByScoutingPriority(teamPlayers);
  const starterIds = new Set<string>();
  const starters = roleSlots.map(({ role }) => {
    const player = fallbackPlayers.find(
      (candidate) => candidate.role === role && !starterIds.has(candidate.id),
    );

    if (player) {
      starterIds.add(player.id);
    }

    return player;
  });

  return {
    starters,
    benchPlayers: mainPlayers.filter((player) => !starterIds.has(player.id)),
    academyPlayers,
  };
}

function getRosterSections(career: CareerSave, team: LckTeamSeed) {
  return isUserTeam(career, team)
    ? getUserTeamRosterSections(career)
    : getEstimatedRosterSections(career, team);
}

function getLatestStandingSnapshot(
  career: CareerSave,
  team: LckTeamSeed,
): StandingSnapshot | null {
  const competitionsByPriority = [...career.seasonState.competitions].sort(
    (left, right) =>
      lckStandingPriority.indexOf(left.competitionId) -
      lckStandingPriority.indexOf(right.competitionId),
  );

  for (const competitionId of lckStandingPriority) {
    const competition = competitionsByPriority.find(
      (candidate) =>
        candidate.competitionId === competitionId &&
        candidate.standings.some((entry) => entry.teamId === team.id),
    );

    if (!competition) {
      continue;
    }

    const table = [...competition.standings].sort(compareStandingEntries);
    const entry = table.find((candidate) => candidate.teamId === team.id);

    if (!entry) {
      continue;
    }

    return {
      competitionName: competition.name,
      rank: table.findIndex((candidate) => candidate.teamId === team.id) + 1,
      entry,
    };
  }

  return null;
}

function getTeamRecordLabel(snapshot: StandingSnapshot | null) {
  if (!snapshot) {
    return "시즌 전적 없음";
  }

  return `${snapshot.rank}위 · ${snapshot.entry.wins}승 ${snapshot.entry.losses}패`;
}

function getContractSalaryTotal(team: Team) {
  return team.contracts
    .filter((contract) => contract.remainingYears > 0)
    .reduce((total, contract) => total + contract.salary, 0);
}

function TeamCard({
  career,
  onViewTeam,
  team,
}: {
  career: CareerSave;
  onViewTeam: (teamId: string) => void;
  team: LckTeamSeed;
}) {
  const snapshot = getLatestStandingSnapshot(career, team);
  const displayName = getLckTeamDisplayName(team);

  return (
    <button
      aria-label={`${displayName} ${team.name} 구단 상세 보기`}
      className="career-team-card lck-team-info-card"
      onClick={() => onViewTeam(team.id)}
      type="button"
    >
      <div className="career-team-card-header">
        <TeamLogo team={team} size="md" />
        <div>
          <strong>{displayName}</strong>
        </div>
      </div>
      <dl>
        <div>
          <dt>티어</dt>
          <dd>{team.tier}</dd>
        </div>
        <div>
          <dt>전력</dt>
          <dd>{team.strength}</dd>
        </div>
        <div>
          <dt>예상 순위</dt>
          <dd>{team.previousSeasonRank}위</dd>
        </div>
        <div>
          <dt>현재 상태</dt>
          <dd>{getTeamRecordLabel(snapshot)}</dd>
        </div>
      </dl>
    </button>
  );
}

function EmptyPlayerSlot({ label }: { label: string }) {
  return (
    <article className="lck-team-empty-slot">
      <strong>{label}</strong>
      <span>정보 없음</span>
    </article>
  );
}

function PlayerGrid({
  emptyLabel,
  onViewPlayer,
  players,
  rosterLabel,
}: {
  emptyLabel: string;
  onViewPlayer: (player: Player, rosterLabel: string) => void;
  players: Player[];
  rosterLabel: string;
}) {
  if (players.length === 0) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return (
    <div className="lck-team-player-grid">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          onClick={() => onViewPlayer(player, rosterLabel)}
          player={player}
          rosterLabel={rosterLabel}
          variant="standard"
        />
      ))}
    </div>
  );
}

function TeamListView({
  career,
  onViewTeam,
}: {
  career: CareerSave;
  onViewTeam: (teamId: string) => void;
}) {
  return (
    <section className="stack lck-team-info-page">
      <header>
        <p className="eyebrow">Scouting</p>
        <h1>LCK 구단 정보</h1>
        <p className="lede">
          LCK 10개 구단의 현재 전력과 시즌 흐름을 한눈에 확인합니다.
        </p>
      </header>

      <div className="career-team-selection lck-team-info-grid">
        {lck2026Teams.map((team) => (
          <TeamCard
            career={career}
            key={team.id}
            onViewTeam={onViewTeam}
            team={team}
          />
        ))}
      </div>
    </section>
  );
}

function TeamDetailView({
  career,
  onViewTeamList,
  team,
}: {
  career: CareerSave;
  onViewTeamList: () => void;
  team: LckTeamSeed;
}) {
  const [detailTarget, setDetailTarget] = useState<{
    player: Player;
    rosterLabel: string;
  } | null>(null);
  const [reserveGroup, setReserveGroup] = useState<ReserveRosterGroup | null>(
    null,
  );
  const snapshot = getLatestStandingSnapshot(career, team);
  const isManagedTeam = isUserTeam(career, team);
  const { academyPlayers, benchPlayers, starters } = getRosterSections(career, team);
  const displayedAcademyPlayers = academyPlayers.slice(0, 8);
  const activeReserveGroup =
    reserveGroup ?? (benchPlayers.length > 0 ? "bench" : "academy");
  const reservePlayers =
    activeReserveGroup === "bench" ? benchPlayers : displayedAcademyPlayers;
  const reserveRosterLabel = activeReserveGroup === "bench" ? "1군 후보" : "2군";
  const reserveCountLabel =
    activeReserveGroup === "academy" &&
    academyPlayers.length > displayedAcademyPlayers.length
      ? `${displayedAcademyPlayers.length}/${academyPlayers.length}명 표시`
      : `${reservePlayers.length}명`;
  const reserveEmptyLabel =
    activeReserveGroup === "bench"
      ? "현재 확인 가능한 1군 후보 정보가 없습니다."
      : "현재 확인 가능한 아카데미 정보가 없습니다.";
  const salaryTotal = isManagedTeam ? getContractSalaryTotal(career.userTeam) : null;
  const introduction = getLckTeamIntroduction(team.id);
  const history = getLckTeamHistory(team.id);
  const displayName = getLckTeamDisplayName(team);

  useEffect(() => {
    setReserveGroup(null);
  }, [team.id]);

  return (
    <section className="stack lck-team-info-page">
      <header className="lck-team-detail-header">
        <button className="secondary-button" onClick={onViewTeamList} type="button">
          구단 목록
        </button>
        <div>
          <p className="eyebrow">LCK Club Report</p>
          <h1>{displayName}</h1>
          <p className="lede">{introduction.description}</p>
        </div>
      </header>

      <section className="competition-panel lck-team-summary-panel">
        <TeamLogo
          className="lck-team-summary-logo"
          size="xl"
          team={team}
        />
        <dl className="lck-team-summary-metrics">
          <div>
            <dt>티어</dt>
            <dd>{team.tier}</dd>
          </div>
          <div>
            <dt>전력</dt>
            <dd>{team.strength}</dd>
          </div>
          <div>
            <dt>예산 규모</dt>
            <dd>{formatSalaryAmount(team.budget)}</dd>
          </div>
          <div>
            <dt>예상 순위</dt>
            <dd>{team.previousSeasonRank}위</dd>
          </div>
          <div>
            <dt>최근 순위</dt>
            <dd>{getTeamRecordLabel(snapshot)}</dd>
          </div>
          {salaryTotal !== null && (
            <div>
              <dt>내 팀 연봉</dt>
              <dd>{formatSalaryAmount(salaryTotal)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="competition-panel lck-team-history-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">History</p>
            <h2>역사</h2>
          </div>
        </div>
        <div className="lck-team-history-grid">
          <article>
            <h3>팀명 변화</h3>
            <ul>
              {history.nameHistory.map((item) => (
                <li key={`${item.name}-${item.period}`}>
                  {item.name} ({item.period})
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>국내 기록</h3>
            <ul>
              {history.domesticTitles.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>국제 기록</h3>
            <ul>
              {history.internationalTitles.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="competition-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Projected Starters</p>
            <h2>선발 5인</h2>
          </div>
          <span className="panel-note">
            {isManagedTeam ? "내 실제 선발 슬롯" : "현재 등록 선수 기준 추정"}
          </span>
        </div>
        <div className="lck-team-starter-grid">
          {roleSlots.map(({ label }, index) => {
            const player = starters[index];
            const rosterLabel = `${label} 선발`;

            return player ? (
              <PlayerCard
                key={player.id}
                onClick={() => setDetailTarget({ player, rosterLabel })}
                player={player}
                rosterLabel={rosterLabel}
                variant="starter"
              />
            ) : (
              <EmptyPlayerSlot key={label} label={label} />
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="lck-team-reserve-heading"
        className="competition-panel lck-team-reserve-panel"
      >
        <div className="panel-title-row lck-team-reserve-title-row">
          <div>
            <p className="eyebrow">Reserve Players</p>
            <h2 id="lck-team-reserve-heading">후보 선수</h2>
          </div>
          <span className="panel-note">{reserveCountLabel}</span>
        </div>
        <div className="lck-team-reserve-tabs" role="group" aria-label="후보 선수 분류">
          <button
            aria-pressed={activeReserveGroup === "bench"}
            className={`lck-team-reserve-tab ${
              activeReserveGroup === "bench"
                ? "lck-team-reserve-tab-active"
                : ""
            }`}
            onClick={() => setReserveGroup("bench")}
            type="button"
          >
            <span>1군 후보</span>
            <strong>{benchPlayers.length}명</strong>
          </button>
          <button
            aria-pressed={activeReserveGroup === "academy"}
            className={`lck-team-reserve-tab ${
              activeReserveGroup === "academy"
                ? "lck-team-reserve-tab-active"
                : ""
            }`}
            onClick={() => setReserveGroup("academy")}
            type="button"
          >
            <span>아카데미</span>
            <strong>{academyPlayers.length}명</strong>
          </button>
        </div>
        <PlayerGrid
          emptyLabel={reserveEmptyLabel}
          onViewPlayer={(player, rosterLabel) =>
            setDetailTarget({ player, rosterLabel })
          }
          players={reservePlayers}
          rosterLabel={reserveRosterLabel}
        />
      </section>
      {detailTarget && (
        <PlayerDetailModal
          onClose={() => setDetailTarget(null)}
          player={detailTarget.player}
          rosterLabel={detailTarget.rosterLabel}
          titlePrefix="Club Player Profile"
        />
      )}
    </section>
  );
}

export function LckTeamInfo({
  career,
  onViewTeam,
  onViewTeamList,
  teamId,
}: LckTeamInfoProps) {
  const selectedTeam = teamId
    ? lck2026Teams.find((team) => team.id === teamId)
    : undefined;

  if (!selectedTeam) {
    return <TeamListView career={career} onViewTeam={onViewTeam} />;
  }

  return (
    <TeamDetailView
      career={career}
      onViewTeamList={onViewTeamList}
      team={selectedTeam}
    />
  );
}
