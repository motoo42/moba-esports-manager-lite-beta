import { useState } from "react";
import type { CompetitionSubPage } from "../../app/routes";
import {
  asianGamesCountryProfiles,
  asianGamesKoreaTeamId,
  asianGamesMatchIds,
  firstStandMatchIds,
  firstStandStageNames,
  getAsianGamesModeLabel,
  getAsianGamesRoleSelectionLabel,
  getAsianGamesTimelineLabel,
  getFirstStandFinalists,
  getFirstStandGroupStandings,
  getLckRounds34GroupLabel,
  getLckRounds34FinalPlacements,
  getLckRounds34PostseasonSeeds,
  getLckRounds35FinalPlacements,
  getLckRounds35PostseasonSeeds,
  getLckRounds12Finalists,
  getMsiLeagueForTeam,
  getWorldsEntryStage,
  getWorldsGroupStandings,
  getWorldsGroupTitle,
  isLckRounds12PlayoffStageName,
  isLckRounds34PostseasonStageName,
  isLckRounds35PostseasonStageName,
  lckRounds12PlayoffMatchIds,
  lckRounds12PlayoffStageNames,
  lckRounds34PostseasonMatchIds,
  lckRounds34PostseasonStageNames,
  lckRounds35PostseasonMatchIds,
  getLckCupGroupBattleTable,
  getLckCupGroupPointSummary,
  getLckCupStageNames,
  msiMatchIds,
  msiStageNames,
  splitWorldsEntrants,
  worldsMatchIds,
  worldsStageNames,
} from "../../domain/season";
import type {
  CareerSave,
  CompetitionId,
  CompetitionState,
  LckCupGroupName,
  MatchRecord,
  MatchSchedule,
  StandingEntry,
  WorldsEntrant,
  WorldsGroupAssignment,
  WorldsGroupId,
  WorldsQualificationState,
} from "../../types/game";

type CompetitionDashboardProps = {
  career: CareerSave;
  competitionId?: CompetitionId | null;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
};

type LckRoundsDashboardTab = "standings" | "schedule" | "tournament";
type FirstStandDashboardTab = "overview" | "groups" | "schedule" | "tournament";
type MsiDashboardTab = "overview" | "schedule" | "bracket";
type AsianGamesDashboardTab = "overview" | "schedule" | "bracket";
type WorldsDashboardTab = "overview" | "schedule" | "groups" | "bracket";
type FirstStandGroupId = "A" | "B";

function isLckRoundsDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is LckRoundsDashboardTab {
  return value === "standings" || value === "schedule" || value === "tournament";
}

function isFirstStandDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is FirstStandDashboardTab {
  return (
    value === "overview" ||
    value === "groups" ||
    value === "schedule" ||
    value === "tournament"
  );
}

function isMsiDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is MsiDashboardTab {
  return value === "overview" || value === "schedule" || value === "bracket";
}

function isAsianGamesDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is AsianGamesDashboardTab {
  return value === "overview" || value === "schedule" || value === "bracket";
}

function isWorldsDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is WorldsDashboardTab {
  return (
    value === "overview" ||
    value === "schedule" ||
    value === "groups" ||
    value === "bracket"
  );
}

type FirstStandEntrant = {
  id: string;
  name: string;
  leagueLabel: string;
  group: FirstStandGroupId;
  seedLabel: string;
  sourceDetail: string;
  strength?: number;
  isLck: boolean;
  isPlaceholder: boolean;
};

type FirstStandPreviewMatch = {
  id: string;
  dateLabel: string;
  group: FirstStandGroupId;
  stageName: string;
  blueTeamName: string;
  redTeamName: string;
  formatLabel: string;
};

type LckPlayoffSlot = {
  label: string;
  teamId?: string;
  teamName: string;
  detail: string;
  isPlaceholder: boolean;
  isWinner?: boolean;
  score?: number;
};

type LckPlayoffMatch = {
  id: string;
  stageName: string;
  title: string;
  subtitle: string;
  slots: LckPlayoffSlot[];
};

type MsiEntrantView = {
  teamId: string;
  teamName: string;
  leagueLabel: string;
  seedLabel: string;
  entryStage: "Bracket Stage" | "Play-In";
  initialSeed: number;
  isUserTeam: boolean;
};

type MsiBracketRound = {
  id: string;
  title: string;
  stageName: string;
  matchIds: string[];
  placeholders: Array<[string, string]>;
};

const lckCupStageNames = getLckCupStageNames();
const knockoutRounds = [
  {
    id: "play-in-r1",
    title: "Play-In R1",
    stageName: lckCupStageNames.playInRound1,
    slots: 2,
  },
  {
    id: "play-in-r2",
    title: "Play-In R2",
    stageName: lckCupStageNames.playInRound2,
    slots: 2,
  },
  {
    id: "wildcard",
    title: "Wildcard",
    stageName: lckCupStageNames.playoffsWildcard,
    slots: 1,
  },
  {
    id: "semifinals",
    title: "Semifinals",
    stageName: lckCupStageNames.playoffsSemifinals,
    slots: 2,
  },
  {
    id: "finals",
    title: "Final",
    stageName: lckCupStageNames.finals,
    slots: 1,
  },
];

function getCurrentCompetition(
  career: CareerSave,
  competitionId?: CompetitionId | null,
) {
  const targetCompetitionId =
    competitionId ?? career.seasonState.currentCompetitionId;

  return career.seasonState.competitions.find(
    (competition) => competition.competitionId === targetCompetitionId,
  );
}

function getUserTeamId(competition: CompetitionState | undefined) {
  return competition?.standings.find((entry) => entry.isUserTeam)?.teamId;
}

function getGroupLabel(group: LckCupGroupName | undefined) {
  if (!group) {
    return "-";
  }

  return group === "baron" ? "Baron" : "Elder";
}

function getSetDiff(entry: StandingEntry) {
  const diff = entry.setWins - entry.setLosses;

  return `${diff > 0 ? "+" : ""}${diff}`;
}

function getMatchCount(entry: StandingEntry) {
  return entry.wins + entry.losses;
}

function getDateLabel(dateKey: string | undefined) {
  if (!dateKey) {
    return "날짜 미정";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")} (${weekdayLabels[date.getDay()]})`;
}

function getMatchRecord(
  match: MatchSchedule,
  records: MatchRecord[],
): MatchRecord | undefined {
  return records.find((record) => record.scheduleId === match.id);
}

function getScoreLabel(record: MatchRecord | undefined) {
  if (!record) {
    return "예정";
  }

  return `${record.score.blueWins}-${record.score.redWins}`;
}

function getMatchTitle(match: MatchSchedule) {
  return `${match.blueTeamName} vs ${match.redTeamName}`;
}

function getFormatLabel(match: MatchSchedule) {
  return `${match.format.toUpperCase()}${match.fearlessEnabled ? " · Fearless" : ""}`;
}

function compareStandingEntries(left: StandingEntry, right: StandingEntry) {
  const winDiff = right.wins - left.wins;

  if (winDiff !== 0) {
    return winDiff;
  }

  const setDiffLeft = left.setWins - left.setLosses;
  const setDiffRight = right.setWins - right.setLosses;
  const setDiff = setDiffRight - setDiffLeft;

  if (setDiff !== 0) {
    return setDiff;
  }

  const setWinsDiff = right.setWins - left.setWins;

  if (setWinsDiff !== 0) {
    return setWinsDiff;
  }

  return left.initialSeed - right.initialSeed;
}

function getSortedTable(competition: CompetitionState, records: MatchRecord[]) {
  if (competition.competitionId === "lck-cup") {
    return getLckCupGroupBattleTable(competition, records);
  }

  if (isLateLckRoundsCompetition(competition)) {
    const groupOrder = { legend: 0, rise: 1 };

    return [...competition.standings].sort((left, right) => {
      const leftGroupOrder =
        left.lckRoundsGroup === "legend" || left.lckRoundsGroup === "rise"
          ? groupOrder[left.lckRoundsGroup]
          : 2;
      const rightGroupOrder =
        right.lckRoundsGroup === "legend" || right.lckRoundsGroup === "rise"
          ? groupOrder[right.lckRoundsGroup]
          : 2;

      if (leftGroupOrder !== rightGroupOrder) {
        return leftGroupOrder - rightGroupOrder;
      }

      return compareStandingEntries(left, right);
    });
  }

  return [...competition.standings].sort((left, right) => {
    return compareStandingEntries(left, right);
  });
}

function getNextWeekMatches(competition: CompetitionState) {
  const nextMatch = [...competition.schedule]
    .filter((match) => match.status === "scheduled")
    .sort((left, right) => left.week - right.week)[0];

  if (!nextMatch) {
    return [];
  }

  return competition.schedule.filter(
    (match) =>
      match.status === "scheduled" &&
      match.week === nextMatch.week &&
      match.competitionId === competition.competitionId,
  );
}

function getCurrentWeekMatches(competition: CompetitionState) {
  return competition.schedule.filter((match) => match.week === competition.currentWeek);
}

function getRecentRecords(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  return records
    .filter((record) => record.competitionId === competition.competitionId)
    .slice(-5)
    .reverse();
}

function getNextUserMatch(
  competition: CompetitionState,
  userTeamId: string | undefined,
) {
  return [...competition.schedule]
    .filter(
      (match) =>
        match.status === "scheduled" &&
        (match.blueTeamId === userTeamId || match.redTeamId === userTeamId),
    )
    .sort((left, right) => {
      const dateDiff = (left.scheduledDate ?? "").localeCompare(
        right.scheduledDate ?? "",
      );

      return dateDiff !== 0 ? dateDiff : left.id.localeCompare(right.id);
    })[0];
}

function getRecentUserRecord({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const scheduleById = new Map(competition.schedule.map((match) => [match.id, match]));

  return [...records]
    .filter((record) => record.competitionId === competition.competitionId)
    .reverse()
    .find((record) => {
      const match = scheduleById.get(record.scheduleId);

      return (
        match &&
        (match.blueTeamId === userTeamId || match.redTeamId === userTeamId)
      );
    });
}

function getUserResultLabel(record: MatchRecord | undefined) {
  if (!record) {
    return "결과 없음";
  }

  if (record.userResult === "win") {
    return "승리";
  }

  if (record.userResult === "loss") {
    return "패배";
  }

  return "중립";
}

function findTeamNameInCompetition(
  competition: CompetitionState | undefined,
  teamId: string | undefined,
) {
  if (!competition || !teamId) {
    return undefined;
  }

  return competition.standings.find((entry) => entry.teamId === teamId)?.teamName;
}

function getFirstStandLckRepresentativeSource(
  career: CareerSave,
  competition: CompetitionState,
) {
  const lckRounds = career.seasonState.competitions.find(
    (candidate) => candidate.competitionId === "lck-rounds-1-2",
  );
  const lckCup = career.seasonState.competitions.find(
    (candidate) => candidate.competitionId === "lck-cup",
  );

  if (lckRounds?.completed && lckRounds.qualifiedTeamIds.length >= 2) {
    return {
      competition: lckRounds,
      detail: "LCK Rounds 1-2 우승/준우승",
    };
  }

  if (competition.qualifiedTeamIds.length >= 2) {
    return {
      competition,
      detail: "First Stand LCK 대표 슬롯",
    };
  }

  if ((lckCup?.qualifiedTeamIds.length ?? 0) >= 2) {
    return {
      competition: lckCup,
      detail: "LCK Cup 결승 진출팀",
    };
  }

  return {
    competition: undefined,
    detail: "LCK 대표 확정 대기",
  };
}

function createFirstStandLckEntrants(
  career: CareerSave,
  competition: CompetitionState,
): FirstStandEntrant[] {
  const source = getFirstStandLckRepresentativeSource(career, competition);

  return [
    {
      group: "A" as const,
      seedLabel: "LCK 1",
    },
    {
      group: "B" as const,
      seedLabel: "LCK 2",
    },
  ].map((slot, index) => {
    const teamId = source.competition?.qualifiedTeamIds[index];
    const teamName =
      findTeamNameInCompetition(source.competition, teamId) ??
      source.competition?.qualifiedTeamNames[index] ??
      `LCK ${index + 1}번 시드`;

    return {
      id: teamId ?? `first-stand-lck-${index + 1}`,
      name: teamName,
      leagueLabel: "LCK",
      group: slot.group,
      seedLabel: slot.seedLabel,
      sourceDetail: source.detail,
      isLck: true,
      isPlaceholder: !teamId,
    };
  });
}

const firstStandInternationalFallbacks = [
  {
    leagueLabel: "LPL",
    name: "Bilibili Gaming",
    seedLabel: "LPL 1",
    group: "B" as const,
    strength: 86,
  },
  {
    leagueLabel: "LPL",
    name: "Top Esports",
    seedLabel: "LPL 2",
    group: "A" as const,
    strength: 84,
  },
  {
    leagueLabel: "LEC",
    name: "G2 Esports",
    seedLabel: "LEC 1",
    group: "A" as const,
    strength: 82,
  },
  {
    leagueLabel: "LCS",
    name: "Cloud9",
    seedLabel: "LCS 1",
    group: "B" as const,
    strength: 76,
  },
  {
    leagueLabel: "LCP",
    name: "PSG Talon",
    seedLabel: "LCP 1",
    group: "B" as const,
    strength: 74,
  },
  {
    leagueLabel: "CBLOL",
    name: "LOUD",
    seedLabel: "CBLOL 1",
    group: "A" as const,
    strength: 70,
  },
];

function createFirstStandInternationalEntrants(career: CareerSave) {
  const usedOpponentIds = new Set<string>();

  return firstStandInternationalFallbacks.map((fallback, index) => {
    const opponent = career.internationalOpponents
      .filter(
        (candidate) =>
          candidate.leagueLabel === fallback.leagueLabel &&
          candidate.appearsIn.includes("first-stand") &&
          !usedOpponentIds.has(candidate.id),
      )
      .sort((left, right) => right.strength - left.strength)[0];

    if (opponent) {
      usedOpponentIds.add(opponent.id);
    }

    return {
      id:
        opponent?.id ??
        `first-stand-${fallback.leagueLabel.toLowerCase()}-${index + 1}`,
      name: opponent?.name ?? fallback.name,
      leagueLabel: fallback.leagueLabel,
      group: fallback.group,
      seedLabel: fallback.seedLabel,
      sourceDetail: opponent ? "샘플 상대 데이터" : "임시 국제전 슬롯",
      strength: opponent?.strength ?? fallback.strength,
      isLck: false,
      isPlaceholder: !opponent,
    } satisfies FirstStandEntrant;
  });
}

function getFirstStandEntrants(
  career: CareerSave,
  competition: CompetitionState,
) {
  return [
    ...createFirstStandLckEntrants(career, competition),
    ...createFirstStandInternationalEntrants(career),
  ].sort((left, right) => {
    if (left.group !== right.group) {
      return left.group.localeCompare(right.group);
    }

    return left.seedLabel.localeCompare(right.seedLabel);
  });
}

function getFirstStandGroupEntrants(
  entrants: FirstStandEntrant[],
  group: FirstStandGroupId,
) {
  return entrants.filter((entrant) => entrant.group === group);
}

function createFirstStandPreviewMatches(entrants: FirstStandEntrant[]) {
  const matches: FirstStandPreviewMatch[] = [];
  const groups: FirstStandGroupId[] = ["A", "B"];

  groups.forEach((group) => {
    const groupEntrants = getFirstStandGroupEntrants(entrants, group);

    groupEntrants.forEach((blue, blueIndex) => {
      groupEntrants.slice(blueIndex + 1).forEach((red) => {
        matches.push({
          id: `first-stand-group-${group}-${blue.id}-${red.id}`,
          dateLabel: `Group ${group} Day ${matches.length + 1}`,
          group,
          stageName: "Group Stage",
          blueTeamName: blue.name,
          redTeamName: red.name,
          formatLabel: "BO1",
        });
      });
    });
  });

  return matches;
}

function getFirstStandRecordRows(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const scheduleById = new Map(competition.schedule.map((match) => [match.id, match]));

  return records
    .filter((record) => record.competitionId === "first-stand")
    .map((record) => ({
      record,
      match: scheduleById.get(record.scheduleId),
    }));
}

function FirstStandSummary({
  career,
  competition,
  entrants,
}: {
  career: CareerSave;
  competition: CompetitionState;
  entrants: FirstStandEntrant[];
}) {
  const [showFormatRules, setShowFormatRules] = useState(false);
  const lckEntrants = entrants.filter((entrant) => entrant.isLck);

  return (
    <section className="competition-summary-grid competition-summary-grid-compact">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">International</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Entrants</p>
        <strong>{entrants.length} teams</strong>
        <span>LCK 2 · LPL 2 · LEC/LCS/LCP/CBLOL 1</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">LCK slots</p>
        <strong>{lckEntrants.map((entrant) => entrant.name).join(" / ")}</strong>
        <span>{lckEntrants[0]?.sourceDetail ?? "진출권 확정 대기"}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Format</p>
        <button
          className="format-summary-button"
          onClick={() => setShowFormatRules(true)}
          type="button"
        >
          <strong>First Stand</strong>
          <span>대회 포맷 상세 보기</span>
        </button>
      </article>
      {showFormatRules && (
        <FirstStandFormatModal onClose={() => setShowFormatRules(false)} />
      )}
    </section>
  );
}

function FirstStandFormatModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="first-stand-format-title"
        aria-modal="true"
        className="competition-rules-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="modal-close-button"
          onClick={onClose}
          type="button"
        >
          x
        </button>
        <p className="eyebrow">Competition Regulations</p>
        <h2 id="first-stand-format-title">First Stand</h2>
        <div className="competition-rules-list">
          <article>
            <strong>제1조 참가팀</strong>
            <p>
              LCK 2팀, LPL 2팀, LEC/LCS/LCP/CBLOL 각 1팀이 참가한다.
            </p>
          </article>
          <article>
            <strong>제2조 조별리그</strong>
            <p>
              8팀을 4팀씩 2개 조로 편성한다. 조별리그는 BO1 기준으로
              표시하며 각 조 상위 2팀이 토너먼트에 진출한다.
            </p>
          </article>
          <article>
            <strong>제3조 토너먼트</strong>
            <p>
              4강과 결승은 BO5 싱글 엘리미네이션으로 진행한다. 4강은 Group
              A 1위 vs Group B 2위, Group B 1위 vs Group A 2위 구조다.
            </p>
          </article>
          <article>
            <strong>제4조 1차 구현 범위</strong>
            <p>
              12-A에서는 화면 구조와 placeholder를 먼저 구현한다. 실제 일정
              생성, 경기 진행, 순위 산정은 12-B에서 연결한다.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

function FirstStandTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: FirstStandDashboardTab;
  onTabChange: (tab: FirstStandDashboardTab) => void;
}) {
  const tabs: Array<{ id: FirstStandDashboardTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "groups", label: "Groups" },
    { id: "schedule", label: "Schedule" },
    { id: "tournament", label: "Tournament" },
  ];

  return (
    <div className="competition-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          className={`competition-tab ${
            activeTab === tab.id ? "competition-tab-active" : ""
          }`}
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function FirstStandEntrantCard({ entrant }: { entrant: FirstStandEntrant }) {
  return (
    <article
      className={`first-stand-entrant-card ${
        entrant.isLck ? "first-stand-entrant-lck" : ""
      } ${entrant.isPlaceholder ? "first-stand-entrant-placeholder" : ""}`}
    >
      <span>{entrant.seedLabel}</span>
      <strong>{entrant.name}</strong>
      <small>
        {entrant.leagueLabel} · Group {entrant.group}
      </small>
      <em>{entrant.sourceDetail}</em>
    </article>
  );
}

function FirstStandOverview({
  entrants,
}: {
  entrants: FirstStandEntrant[];
}) {
  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>참가팀 구성</h2>
        </div>
        <span className="panel-note">LCK/LPL 대표는 서로 다른 조에 배치</span>
      </div>
      <div className="first-stand-entrant-grid">
        {entrants.map((entrant) => (
          <FirstStandEntrantCard entrant={entrant} key={entrant.id} />
        ))}
      </div>
      <div className="first-stand-format-strip">
        <span>Group Stage · 2 groups of 4 · BO1</span>
        <span>Semifinals · BO5</span>
        <span>Final · BO5</span>
      </div>
    </section>
  );
}

function FirstStandGroupTable({
  entrants,
  group,
}: {
  entrants: FirstStandEntrant[];
  group: FirstStandGroupId;
}) {
  const groupEntrants = getFirstStandGroupEntrants(entrants, group);

  return (
    <article className="first-stand-group-card">
      <header>
        <p className="eyebrow">Group {group}</p>
        <strong>조별 순위</strong>
      </header>
      <div className="first-stand-group-table first-stand-group-table-header">
        <span>순위</span>
        <span>팀명</span>
        <span>경기</span>
        <span>승</span>
        <span>패</span>
        <span>세트득실</span>
      </div>
      {groupEntrants.map((entrant, index) => (
        <div
          className={`first-stand-group-table ${
            entrant.isLck ? "first-stand-group-row-lck" : ""
          }`}
          key={entrant.id}
        >
          <span>{index + 1}</span>
          <strong>{entrant.name}</strong>
          <span>0</span>
          <span>0</span>
          <span>0</span>
          <span>0</span>
        </div>
      ))}
    </article>
  );
}

function FirstStandGroupsView({
  entrants,
}: {
  entrants: FirstStandEntrant[];
}) {
  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Group Stage</p>
          <h2>조별리그 순위표</h2>
        </div>
        <span className="panel-note">상위 2팀 토너먼트 진출</span>
      </div>
      <div className="first-stand-groups-grid">
        <FirstStandGroupTable entrants={entrants} group="A" />
        <FirstStandGroupTable entrants={entrants} group="B" />
      </div>
    </section>
  );
}

function FirstStandScheduleView({
  competition,
  entrants,
  records,
}: {
  competition: CompetitionState;
  entrants: FirstStandEntrant[];
  records: MatchRecord[];
}) {
  const recordRows = getFirstStandRecordRows(competition, records);
  const previewMatches = createFirstStandPreviewMatches(entrants);

  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>일정 / 결과</h2>
        </div>
        <span className="panel-note">12-B에서 실제 경기 일정 생성 예정</span>
      </div>
      <div className="first-stand-schedule-scroll">
        {competition.schedule.length > 0
          ? competition.schedule.map((match) => {
              const record = records.find((candidate) => candidate.scheduleId === match.id);

              return (
                <article className="first-stand-schedule-row" key={match.id}>
                  <div>
                    <strong>{getMatchTitle(match)}</strong>
                    <span>
                      {getDateLabel(match.scheduledDate)} · {match.stageName}
                    </span>
                  </div>
                  <b>{getScoreLabel(record)}</b>
                </article>
              );
            })
          : previewMatches.map((match) => (
              <article className="first-stand-schedule-row" key={match.id}>
                <div>
                  <strong>
                    {match.blueTeamName} vs {match.redTeamName}
                  </strong>
                  <span>
                    {match.dateLabel} · {match.stageName} · Group {match.group}
                  </span>
                </div>
                <b>{match.formatLabel} · 예정</b>
              </article>
            ))}
        {recordRows.map(({ record, match }) => (
          <article className="first-stand-schedule-row" key={record.id}>
            <div>
              <strong>{match ? getMatchTitle(match) : record.winnerTeamName}</strong>
              <span>Winner: {record.winnerTeamName}</span>
            </div>
            <b>{getScoreLabel(record)}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function FirstStandTournamentView() {
  const rounds = [
    {
      id: "semifinals",
      title: "Semifinals",
      matches: [
        ["Group A 1위", "Group B 2위"],
        ["Group B 1위", "Group A 2위"],
      ],
    },
    {
      id: "final",
      title: "Final",
      matches: [["Semifinal A 승자", "Semifinal B 승자"]],
    },
    {
      id: "champion",
      title: "Champion",
      matches: [["우승팀 미정", ""]],
    },
  ];

  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Tournament</p>
          <h2>First Stand 토너먼트</h2>
        </div>
        <span className="panel-note">좌에서 우로 진행 · BO5</span>
      </div>
      <div className="first-stand-bracket-frame">
        <div className="first-stand-bracket">
          {rounds.map((round) => (
            <section className="first-stand-bracket-round" key={round.id}>
              <h3>{round.title}</h3>
              <div className="first-stand-bracket-stack">
                {round.matches.map(([blue, red]) => (
                  <article
                    className={`first-stand-bracket-match ${
                      round.id === "champion" ? "first-stand-bracket-champion" : ""
                    }`}
                    key={`${round.id}-${blue}-${red}`}
                  >
                    <strong>{blue}</strong>
                    {red && <strong>{red}</strong>}
                    <small>
                      {round.id === "semifinals"
                        ? "BO5 · 조별리그 종료 후 확정"
                        : round.id === "final"
                          ? "BO5 · 4강 종료 후 확정"
                          : "결승 종료 후 표시"}
                    </small>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatFirstStandDateLabel(dateKey: string | undefined) {
  if (!dateKey) {
    return "Date TBD";
  }

  const [year, month, day] = dateKey.split("-");

  return `${year}.${month}.${day}`;
}

function getFirstStandSetDiffLabel(entry: StandingEntry) {
  const diff = entry.setWins - entry.setLosses;

  return `${diff > 0 ? "+" : ""}${diff}`;
}

function isFirstStandUserMatch(
  match: MatchSchedule,
  userTeamId: string | undefined,
) {
  return match.blueTeamId === userTeamId || match.redTeamId === userTeamId;
}

function getFirstStandMatchStatusLabel(
  match: MatchSchedule,
  record: MatchRecord | undefined,
) {
  if (!record) {
    return `${match.format.toUpperCase()} · Scheduled`;
  }

  return `${record.score.blueWins}-${record.score.redWins}`;
}

function getFallbackFirstStandGroupRows(
  entrants: FirstStandEntrant[],
  group: FirstStandGroupId,
): StandingEntry[] {
  return getFirstStandGroupEntrants(entrants, group).map((entrant, index) => ({
    teamId: entrant.id,
    teamName: entrant.name,
    rank: index + 1,
    initialSeed: index + 1,
    wins: 0,
    losses: 0,
    matchWins: 0,
    matchLosses: 0,
    setWins: 0,
    setLosses: 0,
    winRate: 0,
    isUserTeam: entrant.isLck && !entrant.isPlaceholder,
  }));
}

function FirstStandLiveSummary({
  career,
  competition,
  entrants,
}: {
  career: CareerSave;
  competition: CompetitionState;
  entrants: FirstStandEntrant[];
}) {
  const lckEntrants = entrants.filter((entrant) => entrant.isLck);

  return (
    <section className="competition-summary-grid competition-summary-grid-compact">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">International</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Entrants</p>
        <strong>{entrants.length} teams</strong>
        <span>LCK 2 · LPL 2 · LEC/LCS/LCP/CBLOL 1</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">LCK Seeds</p>
        <strong>{lckEntrants.map((entrant) => entrant.name).join(" / ")}</strong>
        <span>{lckEntrants[0]?.sourceDetail ?? "Waiting for LCK Cup result"}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Status</p>
        <strong>
          {competition.completed
            ? competition.winnerTeamName ?? "Completed"
            : competition.currentStageName}
        </strong>
        <span>Top two per group advance</span>
      </article>
    </section>
  );
}

function FirstStandLiveOverview({
  entrants,
}: {
  entrants: FirstStandEntrant[];
}) {
  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Entrants</h2>
        </div>
        <span className="panel-note">LCK and LPL seeds are split across groups</span>
      </div>
      <div className="first-stand-entrant-grid">
        {entrants.map((entrant) => (
          <FirstStandEntrantCard entrant={entrant} key={entrant.id} />
        ))}
      </div>
      <div className="first-stand-format-strip">
        <span>Group Stage · 2 groups of 4 · BO1</span>
        <span>Semifinals · BO5</span>
        <span>Final · BO5</span>
      </div>
    </section>
  );
}

function FirstStandLiveGroupTable({
  competition,
  entrants,
  group,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  entrants: FirstStandEntrant[];
  group: FirstStandGroupId;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const computedRows = getFirstStandGroupStandings(competition, records, group);
  const groupRows =
    computedRows.length > 0
      ? computedRows
      : getFallbackFirstStandGroupRows(entrants, group);

  return (
    <article className="first-stand-group-card">
      <header>
        <p className="eyebrow">Group {group}</p>
        <strong>Standings</strong>
      </header>
      <div className="first-stand-group-table first-stand-group-table-header">
        <span>Rank</span>
        <span>Team</span>
        <span>Played</span>
        <span>W</span>
        <span>L</span>
        <span>Set +/-</span>
      </div>
      {groupRows.map((entry, index) => (
        <div
          className={`first-stand-group-table ${
            entry.teamId === userTeamId ? "first-stand-group-row-lck" : ""
          }`}
          key={entry.teamId}
        >
          <span>{index + 1}</span>
          <strong>{entry.teamName}</strong>
          <span>{getMatchCount(entry)}</span>
          <span>{entry.wins}</span>
          <span>{entry.losses}</span>
          <span>{getFirstStandSetDiffLabel(entry)}</span>
        </div>
      ))}
    </article>
  );
}

function FirstStandLiveGroupsView({
  competition,
  entrants,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  entrants: FirstStandEntrant[];
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Group Stage</p>
          <h2>Group Standings</h2>
        </div>
        <span className="panel-note">Top two teams per group advance to the BO5 bracket</span>
      </div>
      <div className="first-stand-groups-grid">
        <FirstStandLiveGroupTable
          competition={competition}
          entrants={entrants}
          group="A"
          records={records}
          userTeamId={userTeamId}
        />
        <FirstStandLiveGroupTable
          competition={competition}
          entrants={entrants}
          group="B"
          records={records}
          userTeamId={userTeamId}
        />
      </div>
    </section>
  );
}

function FirstStandLiveScheduleView({
  competition,
  entrants,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  entrants: FirstStandEntrant[];
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const groupedSchedule = groupMatchesByDate(competition.schedule);
  const previewMatches = createFirstStandPreviewMatches(entrants);

  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>Schedule / Results</h2>
        </div>
        <span className="panel-note">Actual First Stand fixtures, scores, and user-team highlights</span>
      </div>
      <div className="first-stand-schedule-scroll">
        {groupedSchedule.length > 0
          ? groupedSchedule.map(({ dateKey, matches }) => (
              <article className="first-stand-schedule-day" key={dateKey}>
                <header>
                  <strong>{formatFirstStandDateLabel(dateKey)}</strong>
                  <span>{matches.length} matches</span>
                </header>
                <div className="first-stand-schedule-day-list">
                  {matches.map((match) => {
                    const record = recordsByScheduleId.get(match.id);
                    const isUserMatch = isFirstStandUserMatch(match, userTeamId);

                    return (
                      <div
                        className={`first-stand-schedule-row ${
                          isUserMatch ? "first-stand-schedule-row-user" : ""
                        }`}
                        key={match.id}
                      >
                        <div>
                          <strong>{getMatchTitle(match)}</strong>
                          <span>
                            {match.stageName} · {getFormatLabel(match)}
                          </span>
                        </div>
                        <b
                          className={`schedule-status-badge ${
                            getScheduleStatusClass({ match, record, userTeamId })
                          }`}
                        >
                          {getFirstStandMatchStatusLabel(match, record)}
                        </b>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))
          : previewMatches.map((match) => (
              <article className="first-stand-schedule-row" key={match.id}>
                <div>
                  <strong>
                    {match.blueTeamName} vs {match.redTeamName}
                  </strong>
                  <span>
                    {match.dateLabel} · {match.stageName} · Group {match.group}
                  </span>
                </div>
                <b className="schedule-status-badge schedule-status-scheduled">
                  {match.formatLabel} · Scheduled
                </b>
              </article>
            ))}
      </div>
    </section>
  );
}

function getFirstStandBracketMatch(
  competition: CompetitionState,
  scheduleId: string,
) {
  return competition.schedule.find((match) => match.id === scheduleId);
}

function FirstStandBracketTeam({
  label,
  match,
  record,
  side,
  userTeamId,
}: {
  label: string;
  match: MatchSchedule | undefined;
  record: MatchRecord | undefined;
  side: "blue" | "red";
  userTeamId: string | undefined;
}) {
  if (!match) {
    return (
      <div className="first-stand-bracket-team first-stand-bracket-team-placeholder">
        <span>{label}</span>
        <strong>Pending</strong>
        <small>Waiting for previous stage</small>
      </div>
    );
  }

  const teamId = side === "blue" ? match.blueTeamId : match.redTeamId;
  const teamName = side === "blue" ? match.blueTeamName : match.redTeamName;
  const teamScore = record
    ? side === "blue"
      ? record.score.blueWins
      : record.score.redWins
    : undefined;
  const opponentScore = record
    ? side === "blue"
      ? record.score.redWins
      : record.score.blueWins
    : undefined;
  const classes = [
    "first-stand-bracket-team",
    teamId === userTeamId ? "first-stand-bracket-team-user" : "",
    record?.winnerTeamId === teamId ? "first-stand-bracket-team-winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span>{label}</span>
      <strong>{teamName}</strong>
      <small>
        {record
          ? `${teamScore}-${opponentScore}${record.winnerTeamId === teamId ? " Win" : ""}`
          : `${formatFirstStandDateLabel(match.scheduledDate)} · ${getFormatLabel(match)}`}
      </small>
    </div>
  );
}

function FirstStandBracketMatchCard({
  isCurrent,
  match,
  placeholderLabels,
  record,
  title,
  userTeamId,
}: {
  isCurrent: boolean;
  match: MatchSchedule | undefined;
  placeholderLabels: [string, string];
  record: MatchRecord | undefined;
  title: string;
  userTeamId: string | undefined;
}) {
  return (
    <article
      className={`first-stand-bracket-match ${
        isCurrent ? "first-stand-bracket-match-current" : ""
      }`}
    >
      <header>
        <strong>{title}</strong>
        <span>{match ? getFirstStandMatchStatusLabel(match, record) : "Pending"}</span>
      </header>
      <FirstStandBracketTeam
        label={placeholderLabels[0]}
        match={match}
        record={record}
        side="blue"
        userTeamId={userTeamId}
      />
      <FirstStandBracketTeam
        label={placeholderLabels[1]}
        match={match}
        record={record}
        side="red"
        userTeamId={userTeamId}
      />
    </article>
  );
}

function FirstStandLiveTournamentView({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const semifinalA = getFirstStandBracketMatch(
    competition,
    firstStandMatchIds.semifinalA1VsB2,
  );
  const semifinalB = getFirstStandBracketMatch(
    competition,
    firstStandMatchIds.semifinalB1VsA2,
  );
  const final = getFirstStandBracketMatch(competition, firstStandMatchIds.final);
  const finalists = getFirstStandFinalists(competition, records);
  const championName =
    competition.winnerTeamName ?? finalists[0]?.teamName ?? "Champion TBD";
  const runnerUpName = finalists[1]?.teamName ?? "Runner-up TBD";
  const currentStageName = competition.completed ? "Completed" : competition.currentStageName;

  return (
    <section className="competition-panel first-stand-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Tournament</p>
          <h2>First Stand Tournament</h2>
        </div>
        <span className="panel-note">Four teams advance: Group A/B top two, BO5 bracket</span>
      </div>
      <div className="first-stand-bracket-frame">
        <div className="first-stand-bracket">
          <section
            className={`first-stand-bracket-round ${
              currentStageName === firstStandStageNames.semifinals
                ? "first-stand-bracket-round-current"
                : ""
            }`}
          >
            <h3>Semifinals</h3>
            <div className="first-stand-bracket-stack">
              <FirstStandBracketMatchCard
                isCurrent={currentStageName === firstStandStageNames.semifinals}
                match={semifinalA}
                placeholderLabels={["Group A 1", "Group B 2"]}
                record={semifinalA ? recordsByScheduleId.get(semifinalA.id) : undefined}
                title="Semifinal A"
                userTeamId={userTeamId}
              />
              <FirstStandBracketMatchCard
                isCurrent={currentStageName === firstStandStageNames.semifinals}
                match={semifinalB}
                placeholderLabels={["Group B 1", "Group A 2"]}
                record={semifinalB ? recordsByScheduleId.get(semifinalB.id) : undefined}
                title="Semifinal B"
                userTeamId={userTeamId}
              />
            </div>
          </section>
          <section
            className={`first-stand-bracket-round ${
              currentStageName === firstStandStageNames.final
                ? "first-stand-bracket-round-current"
                : ""
            }`}
          >
            <h3>Final</h3>
            <div className="first-stand-bracket-stack">
              <FirstStandBracketMatchCard
                isCurrent={currentStageName === firstStandStageNames.final}
                match={final}
                placeholderLabels={["Semifinal A Winner", "Semifinal B Winner"]}
                record={final ? recordsByScheduleId.get(final.id) : undefined}
                title="Final"
                userTeamId={userTeamId}
              />
            </div>
          </section>
          <section
            className={`first-stand-bracket-round first-stand-bracket-champion-round ${
              competition.completed ? "first-stand-bracket-round-current" : ""
            }`}
          >
            <h3>Champion</h3>
            <article className="first-stand-bracket-champion">
              <span>{competition.completed ? "Champion" : "Pending"}</span>
              <strong>{championName}</strong>
              <small>
                {competition.completed
                  ? `Runner-up: ${runnerUpName}`
                  : "Final result pending"}
              </small>
            </article>
          </section>
        </div>
      </div>
    </section>
  );
}

function FirstStandDashboard({
  career,
  competition,
  subPage,
  onSubPageChange,
  records,
}: {
  career: CareerSave;
  competition: CompetitionState;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
  records: MatchRecord[];
}) {
  const [fallbackTab, setFallbackTab] =
    useState<FirstStandDashboardTab>("overview");
  const activeTab = isFirstStandDashboardTab(subPage) ? subPage : fallbackTab;
  const entrants = getFirstStandEntrants(career, competition);
  const userTeamId = getUserTeamId(competition);
  const handleTabChange = (nextTab: FirstStandDashboardTab) => {
    if (onSubPageChange) {
      onSubPageChange(nextTab);
      return;
    }

    setFallbackTab(nextTab);
  };

  return (
    <section className="competition-dashboard first-stand-dashboard">
      <FirstStandLiveSummary
        career={career}
        competition={competition}
        entrants={entrants}
      />
      <FirstStandTabs activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === "overview" && <FirstStandLiveOverview entrants={entrants} />}
      {activeTab === "groups" && (
        <FirstStandLiveGroupsView
          competition={competition}
          entrants={entrants}
          records={records}
          userTeamId={userTeamId}
        />
      )}
      {activeTab === "schedule" && (
        <FirstStandLiveScheduleView
          competition={competition}
          entrants={entrants}
          records={records}
          userTeamId={userTeamId}
        />
      )}
      {activeTab === "tournament" && (
        <FirstStandLiveTournamentView
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      )}
    </section>
  );
}

const msiPlayInOpeningMatchIds: string[] = [
  msiMatchIds.playInSemifinal1,
  msiMatchIds.playInSemifinal2,
];

const msiBo5MatchIds = new Set<string>([
  msiMatchIds.playInFinal,
  msiMatchIds.upperFinal,
  msiMatchIds.lowerFinal,
  msiMatchIds.grandFinal,
]);

const msiPlayInRounds: MsiBracketRound[] = [
  {
    id: "play-in-semifinals",
    title: "Semifinals",
    stageName: msiStageNames.playInSemifinals,
    matchIds: [msiMatchIds.playInSemifinal1, msiMatchIds.playInSemifinal2],
    placeholders: [
      ["Play-In seed 1", "Play-In seed 4"],
      ["Play-In seed 2", "Play-In seed 3"],
    ],
  },
  {
    id: "play-in-final",
    title: "Final",
    stageName: msiStageNames.playInFinal,
    matchIds: [msiMatchIds.playInFinal],
    placeholders: [["Semifinal 1 Winner", "Semifinal 2 Winner"]],
  },
];

const msiUpperRounds: MsiBracketRound[] = [
  {
    id: "upper-round-1",
    title: "Upper Round 1",
    stageName: msiStageNames.upperRound1,
    matchIds: [
      msiMatchIds.upperRound1A,
      msiMatchIds.upperRound1B,
      msiMatchIds.upperRound1C,
      msiMatchIds.upperRound1D,
    ],
    placeholders: [
      ["Bracket seed", "Bracket seed"],
      ["Bracket seed", "Bracket seed"],
      ["Bracket seed", "Bracket seed"],
      ["Bracket seed", "Play-In Winner"],
    ],
  },
  {
    id: "upper-round-2",
    title: "Upper Round 2",
    stageName: msiStageNames.upperRound2,
    matchIds: [msiMatchIds.upperRound2A, msiMatchIds.upperRound2B],
    placeholders: [
      ["Upper R1 A Winner", "Upper R1 B Winner"],
      ["Upper R1 C Winner", "Upper R1 D Winner"],
    ],
  },
  {
    id: "upper-final",
    title: "Upper Final",
    stageName: msiStageNames.upperFinal,
    matchIds: [msiMatchIds.upperFinal],
    placeholders: [["Upper R2 A Winner", "Upper R2 B Winner"]],
  },
];

const msiLowerRounds: MsiBracketRound[] = [
  {
    id: "lower-round-1",
    title: "Lower Round 1",
    stageName: msiStageNames.lowerRound1,
    matchIds: [msiMatchIds.lowerRound1A, msiMatchIds.lowerRound1B],
    placeholders: [
      ["Upper R1 A/C Loser", "Upper R1 A/C Loser"],
      ["Upper R1 B/D Loser", "Upper R1 B/D Loser"],
    ],
  },
  {
    id: "lower-round-2",
    title: "Lower Round 2",
    stageName: msiStageNames.lowerRound2,
    matchIds: [msiMatchIds.lowerRound2A, msiMatchIds.lowerRound2B],
    placeholders: [
      ["Upper R2 A Loser", "Lower R1 Winner"],
      ["Upper R2 B Loser", "Lower R1 Winner"],
    ],
  },
  {
    id: "lower-round-3",
    title: "Lower Round 3",
    stageName: msiStageNames.lowerRound3,
    matchIds: [msiMatchIds.lowerRound3],
    placeholders: [["Lower R2 A Winner", "Lower R2 B Winner"]],
  },
  {
    id: "lower-final",
    title: "Lower Final",
    stageName: msiStageNames.lowerFinal,
    matchIds: [msiMatchIds.lowerFinal],
    placeholders: [["Upper Final Loser", "Lower R3 Winner"]],
  },
];

const msiGrandFinalRound: MsiBracketRound = {
  id: "grand-finals",
  title: "Grand Finals",
  stageName: msiStageNames.grandFinal,
  matchIds: [msiMatchIds.grandFinal],
  placeholders: [["Upper Final Winner", "Lower Final Winner"]],
};

function getMsiPlayInTeamIds(competition: CompetitionState) {
  const teamIds = new Set<string>();

  competition.schedule
    .filter((match) => msiPlayInOpeningMatchIds.includes(match.id))
    .forEach((match) => {
      teamIds.add(match.blueTeamId);
      teamIds.add(match.redTeamId);
    });

  return teamIds;
}

function getMsiSeedLabel(entry: StandingEntry) {
  const leagueLabel = getMsiLeagueForTeam(entry.teamId);

  if (leagueLabel === "LCK") {
    return entry.initialSeed === 1 ? "LCK 1" : "LCK 2";
  }

  const seedMatch = entry.teamId.match(/-(\d)$/);
  const seed = seedMatch?.[1] ?? String(entry.initialSeed);

  return `${leagueLabel} ${seed}`;
}

function getMsiEntrants(competition: CompetitionState): MsiEntrantView[] {
  const playInTeamIds = getMsiPlayInTeamIds(competition);

  return [...competition.standings]
    .sort((left, right) => left.initialSeed - right.initialSeed)
    .map((entry) => ({
      teamId: entry.teamId,
      teamName: entry.teamName,
      leagueLabel: getMsiLeagueForTeam(entry.teamId),
      seedLabel: getMsiSeedLabel(entry),
      entryStage: playInTeamIds.has(entry.teamId) ? "Play-In" : "Bracket Stage",
      initialSeed: entry.initialSeed,
      isUserTeam: entry.isUserTeam,
    }));
}

function getMsiMatchStatusLabel(
  match: MatchSchedule | undefined,
  record: MatchRecord | undefined,
  expectedFormatLabel: string,
) {
  if (!match) {
    return `${expectedFormatLabel} · Pending`;
  }

  if (!record) {
    return `${getFormatLabel(match)} · Scheduled`;
  }

  return `${record.score.blueWins}-${record.score.redWins}`;
}

function getMsiExpectedFormatLabel(matchId: string) {
  return msiBo5MatchIds.has(matchId) ? "BO5" : "BO3";
}

function isMsiStageCurrent(stageName: string, competition: CompetitionState) {
  if (competition.completed) {
    return false;
  }

  if (stageName === competition.currentStageName) {
    return true;
  }

  const pairedStages: Record<string, string[]> = {
    [msiStageNames.upperRound2]: [msiStageNames.lowerRound1],
    [msiStageNames.upperFinal]: [msiStageNames.lowerRound2],
  };

  return pairedStages[competition.currentStageName]?.includes(stageName) ?? false;
}

function MsiTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: MsiDashboardTab;
  onTabChange: (tab: MsiDashboardTab) => void;
}) {
  const tabs: Array<{ id: MsiDashboardTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "bracket", label: "Bracket" },
  ];

  return (
    <div className="competition-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          className={`competition-tab ${
            activeTab === tab.id ? "competition-tab-active" : ""
          }`}
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function formatWorldsBonusLeagueLabel(
  qualification: WorldsQualificationState | undefined,
) {
  return qualification?.bonusLeagueLabels.length
    ? qualification.bonusLeagueLabels.join(" / ")
    : "판정 대기";
}

function MsiSummary({
  career,
  competition,
  entrants,
}: {
  career: CareerSave;
  competition: CompetitionState;
  entrants: MsiEntrantView[];
}) {
  const directEntrants = entrants.filter(
    (entrant) => entrant.entryStage === "Bracket Stage",
  );
  const playInEntrants = entrants.filter((entrant) => entrant.entryStage === "Play-In");
  const lckEntrants = entrants.filter((entrant) => entrant.leagueLabel === "LCK");
  const championLabel = competition.completed
    ? competition.winnerTeamName ?? "Champion TBD"
    : competition.currentStageName;
  const worldsQualification = career.seasonState.worldsQualification;

  return (
    <section className="competition-summary-grid competition-summary-grid-compact msi-summary-grid">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">International</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Stage</p>
        <strong>{championLabel}</strong>
        <span>{competition.completed ? "Tournament completed" : "MSI in progress"}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Entrants</p>
        <strong>{entrants.length} teams</strong>
        <span>
          {directEntrants.length} direct · {playInEntrants.length} play-in
        </span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">LCK Seeds</p>
        <strong>{lckEntrants.map((entrant) => entrant.teamName).join(" / ")}</strong>
        <span>
          {competition.qualifiedTeamNames[1]
            ? `Runner-up: ${competition.qualifiedTeamNames[1]}`
            : "LCK Rounds 1-2 finalists"}
        </span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Worlds Bonus</p>
        <strong>{formatWorldsBonusLeagueLabel(worldsQualification)}</strong>
        <span>
          {worldsQualification
            ? `Worlds ${worldsQualification.totalEntrants}팀 풀 반영`
            : "MSI 완료 후 상위 2개 리그 확정"}
        </span>
      </article>
    </section>
  );
}

function MsiEntrantCard({ entrant }: { entrant: MsiEntrantView }) {
  return (
    <article
      className={`msi-entrant-card ${
        entrant.isUserTeam ? "msi-entrant-card-user" : ""
      }`}
    >
      <span>{entrant.seedLabel}</span>
      <strong>{entrant.teamName}</strong>
      <small>
        {entrant.leagueLabel} · {entrant.entryStage}
      </small>
      <em>Initial seed #{entrant.initialSeed}</em>
    </article>
  );
}

function MsiWorldsBonusStrip({
  qualification,
}: {
  qualification: WorldsQualificationState | undefined;
}) {
  if (!qualification) {
    return (
      <div className="msi-worlds-bonus-strip">
        <span>Worlds 추가 시드</span>
        <strong>MSI 결과 대기</strong>
        <small>상위 2개 리그가 Worlds 보너스 시드를 받습니다.</small>
      </div>
    );
  }

  return (
    <div className="msi-worlds-bonus-strip">
      <span>Worlds 추가 시드</span>
      <strong>{qualification.bonusLeagueLabels.join(" / ")}</strong>
      <small>
        {qualification.msiLeagueResults
          .slice(0, 2)
          .map((result) => `${result.leagueLabel}: ${result.bestTeamName}`)
          .join(" · ")}
      </small>
    </div>
  );
}

function MsiOverview({
  entrants,
  qualification,
}: {
  entrants: MsiEntrantView[];
  qualification: WorldsQualificationState | undefined;
}) {
  const directEntrants = entrants.filter(
    (entrant) => entrant.entryStage === "Bracket Stage",
  );
  const playInEntrants = entrants.filter((entrant) => entrant.entryStage === "Play-In");

  return (
    <section className="competition-panel msi-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>MSI 참가팀과 진출 경로</h2>
        </div>
        <span className="panel-note">1시드 6팀과 First Stand 보너스 2시드 직행</span>
      </div>
      <div className="msi-overview-split">
        <article>
          <header>
            <strong>Bracket Stage</strong>
            <span>{directEntrants.length} teams</span>
          </header>
          <div className="msi-entrant-grid">
            {directEntrants.map((entrant) => (
              <MsiEntrantCard entrant={entrant} key={entrant.teamId} />
            ))}
          </div>
        </article>
        <article>
          <header>
            <strong>Play-In</strong>
            <span>{playInEntrants.length} teams</span>
          </header>
          <div className="msi-entrant-grid msi-entrant-grid-compact">
            {playInEntrants.map((entrant) => (
              <MsiEntrantCard entrant={entrant} key={entrant.teamId} />
            ))}
          </div>
        </article>
      </div>
      <div className="first-stand-format-strip msi-format-strip">
        <span>Play-In · 4 teams · BO3/BO5</span>
        <span>Upper/Lower Bracket · 8 teams</span>
        <span>Upper Final / Lower Final / Grand Finals · BO5</span>
      </div>
      <MsiWorldsBonusStrip qualification={qualification} />
    </section>
  );
}

function MsiScheduleView({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const groupedSchedule = groupMatchesByDate(competition.schedule);

  return (
    <section className="competition-panel msi-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>MSI 일정 / 결과</h2>
        </div>
        <span className="panel-note">BO5 경기와 우리 팀 경기 강조</span>
      </div>
      <div className="msi-schedule-scroll">
        {groupedSchedule.map(({ dateKey, matches }) => (
          <article className="first-stand-schedule-day" key={dateKey}>
            <header>
              <strong>{getDateLabel(dateKey)}</strong>
              <span>{matches.length} series</span>
            </header>
            <div className="first-stand-schedule-day-list">
              {matches.map((match) => {
                const record = recordsByScheduleId.get(match.id);
                const isUserMatch =
                  match.blueTeamId === userTeamId || match.redTeamId === userTeamId;
                const isFeatureMatch = match.format === "bo5";

                return (
                  <div
                    className={`msi-schedule-row ${
                      isUserMatch ? "msi-schedule-row-user" : ""
                    } ${isFeatureMatch ? "msi-schedule-row-feature" : ""}`}
                    key={match.id}
                  >
                    <div>
                      <strong>{getMatchTitle(match)}</strong>
                      <span>
                        {match.stageName} · {getFormatLabel(match)}
                      </span>
                    </div>
                    <b
                      className={`schedule-status-badge ${getScheduleStatusClass({
                        match,
                        record,
                        userTeamId,
                      })}`}
                    >
                      {getMsiMatchStatusLabel(
                        match,
                        record,
                        getMsiExpectedFormatLabel(match.id),
                      )}
                    </b>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function getMsiBracketMatch(competition: CompetitionState, matchId: string) {
  return competition.schedule.find((match) => match.id === matchId);
}

function MsiBracketTeam({
  label,
  match,
  record,
  side,
  userTeamId,
}: {
  label: string;
  match: MatchSchedule | undefined;
  record: MatchRecord | undefined;
  side: "blue" | "red";
  userTeamId: string | undefined;
}) {
  if (!match) {
    return (
      <div className="msi-bracket-team msi-bracket-team-placeholder">
        <span>{label}</span>
        <strong>Pending</strong>
        <small>Waiting for previous match</small>
      </div>
    );
  }

  const teamId = side === "blue" ? match.blueTeamId : match.redTeamId;
  const teamName = side === "blue" ? match.blueTeamName : match.redTeamName;
  const teamScore = record
    ? side === "blue"
      ? record.score.blueWins
      : record.score.redWins
    : undefined;
  const opponentScore = record
    ? side === "blue"
      ? record.score.redWins
      : record.score.blueWins
    : undefined;
  const classes = [
    "msi-bracket-team",
    teamId === userTeamId ? "msi-bracket-team-user" : "",
    record?.winnerTeamId === teamId ? "msi-bracket-team-winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span>{label}</span>
      <strong>{teamName}</strong>
      <small>
        {record
          ? `${teamScore}-${opponentScore}${record.winnerTeamId === teamId ? " Win" : ""}`
          : `${getMsiLeagueForTeam(teamId)} · ${getFormatLabel(match)}`}
      </small>
    </div>
  );
}

function MsiBracketMatchCard({
  competition,
  matchId,
  placeholderLabels,
  recordsByScheduleId,
  title,
  userTeamId,
}: {
  competition: CompetitionState;
  matchId: string;
  placeholderLabels: [string, string];
  recordsByScheduleId: Map<string, MatchRecord>;
  title: string;
  userTeamId: string | undefined;
}) {
  const match = getMsiBracketMatch(competition, matchId);
  const record = match ? recordsByScheduleId.get(match.id) : undefined;
  const expectedFormatLabel = getMsiExpectedFormatLabel(matchId);
  const isCurrent = match ? isMsiStageCurrent(match.stageName, competition) : false;
  const isBo5 = match?.format === "bo5" || msiBo5MatchIds.has(matchId);

  return (
    <article
      className={`msi-bracket-match ${isCurrent ? "msi-bracket-match-current" : ""}`}
    >
      <header>
        <strong>{title}</strong>
        <span className={isBo5 ? "msi-format-badge msi-format-badge-feature" : "msi-format-badge"}>
          {expectedFormatLabel}
        </span>
      </header>
      <MsiBracketTeam
        label={placeholderLabels[0]}
        match={match}
        record={record}
        side="blue"
        userTeamId={userTeamId}
      />
      <MsiBracketTeam
        label={placeholderLabels[1]}
        match={match}
        record={record}
        side="red"
        userTeamId={userTeamId}
      />
      <small className="msi-bracket-match-status">
        {getMsiMatchStatusLabel(match, record, expectedFormatLabel)}
      </small>
    </article>
  );
}

function MsiBracketRoundView({
  competition,
  recordsByScheduleId,
  round,
  userTeamId,
}: {
  competition: CompetitionState;
  recordsByScheduleId: Map<string, MatchRecord>;
  round: MsiBracketRound;
  userTeamId: string | undefined;
}) {
  const isCurrent = isMsiStageCurrent(round.stageName, competition);

  return (
    <section
      className={`msi-bracket-round ${isCurrent ? "msi-bracket-round-current" : ""}`}
    >
      <h3>{round.title}</h3>
      <div className="msi-bracket-match-stack">
        {round.matchIds.map((matchId, index) => (
          <MsiBracketMatchCard
            competition={competition}
            key={matchId}
            matchId={matchId}
            placeholderLabels={round.placeholders[index] ?? ["Pending", "Pending"]}
            recordsByScheduleId={recordsByScheduleId}
            title={`${round.title} ${round.matchIds.length > 1 ? index + 1 : ""}`.trim()}
            userTeamId={userTeamId}
          />
        ))}
      </div>
    </section>
  );
}

function MsiBracketSection({
  className,
  competition,
  recordsByScheduleId,
  rounds,
  title,
  userTeamId,
}: {
  className: string;
  competition: CompetitionState;
  recordsByScheduleId: Map<string, MatchRecord>;
  rounds: MsiBracketRound[];
  title: string;
  userTeamId: string | undefined;
}) {
  return (
    <article className={`msi-bracket-section ${className}`}>
      <header>
        <strong>{title}</strong>
      </header>
      <div className="msi-bracket-round-grid">
        {rounds.map((round) => (
          <MsiBracketRoundView
            competition={competition}
            key={round.id}
            recordsByScheduleId={recordsByScheduleId}
            round={round}
            userTeamId={userTeamId}
          />
        ))}
      </div>
    </article>
  );
}

function MsiBracketView({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const championName = competition.winnerTeamName ?? "Champion TBD";
  const runnerUpName = competition.qualifiedTeamNames[1] ?? "Runner-up TBD";

  return (
    <section className="competition-panel msi-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Bracket</p>
          <h2>MSI Bracket Stage</h2>
        </div>
        <span className="panel-note">Play-In winner joins the upper/lower bracket</span>
      </div>
      <div className="msi-bracket-frame">
        <div className="msi-bracket-board">
          <MsiBracketSection
            className="msi-bracket-section-play-in"
            competition={competition}
            recordsByScheduleId={recordsByScheduleId}
            rounds={msiPlayInRounds}
            title="Play-In"
            userTeamId={userTeamId}
          />
          <MsiBracketSection
            className="msi-bracket-section-upper"
            competition={competition}
            recordsByScheduleId={recordsByScheduleId}
            rounds={msiUpperRounds}
            title="Upper Bracket"
            userTeamId={userTeamId}
          />
          <MsiBracketSection
            className="msi-bracket-section-lower"
            competition={competition}
            recordsByScheduleId={recordsByScheduleId}
            rounds={msiLowerRounds}
            title="Lower Bracket"
            userTeamId={userTeamId}
          />
          <MsiBracketSection
            className="msi-bracket-section-final"
            competition={competition}
            recordsByScheduleId={recordsByScheduleId}
            rounds={[msiGrandFinalRound]}
            title="Final"
            userTeamId={userTeamId}
          />
          <article className="msi-champion-card">
            <span>{competition.completed ? "Champion" : "Pending"}</span>
            <strong>{championName}</strong>
            <small>
              {competition.completed
                ? `Runner-up: ${runnerUpName}`
                : "Grand Finals result pending"}
            </small>
          </article>
        </div>
      </div>
    </section>
  );
}

function MsiDashboard({
  career,
  competition,
  subPage,
  onSubPageChange,
  records,
}: {
  career: CareerSave;
  competition: CompetitionState;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
  records: MatchRecord[];
}) {
  const [fallbackTab, setFallbackTab] = useState<MsiDashboardTab>("overview");
  const activeTab = isMsiDashboardTab(subPage) ? subPage : fallbackTab;
  const entrants = getMsiEntrants(competition);
  const userTeamId = getUserTeamId(competition);
  const handleTabChange = (nextTab: MsiDashboardTab) => {
    if (onSubPageChange) {
      onSubPageChange(nextTab);
      return;
    }

    setFallbackTab(nextTab);
  };

  return (
    <section className="competition-dashboard msi-dashboard">
      <MsiSummary career={career} competition={competition} entrants={entrants} />
      <MsiTabs activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === "overview" && (
        <MsiOverview
          entrants={entrants}
          qualification={career.seasonState.worldsQualification}
        />
      )}
      {activeTab === "schedule" && (
        <MsiScheduleView
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      )}
      {activeTab === "bracket" && (
        <MsiBracketView
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      )}
    </section>
  );
}

function getRemainingSeriesByTeamId(competition: CompetitionState) {
  const remainingSeriesByTeamId = new Map(
    competition.standings.map((entry) => [entry.teamId, 0]),
  );

  competition.schedule.forEach((match) => {
    if (match.status !== "scheduled") {
      return;
    }

    remainingSeriesByTeamId.set(
      match.blueTeamId,
      (remainingSeriesByTeamId.get(match.blueTeamId) ?? 0) + 1,
    );
    remainingSeriesByTeamId.set(
      match.redTeamId,
      (remainingSeriesByTeamId.get(match.redTeamId) ?? 0) + 1,
    );
  });

  return remainingSeriesByTeamId;
}

function getPlayoffClinchedTeamIds(competition: CompetitionState, playoffSlots = 6) {
  const hasPlayoffSchedule = competition.schedule.some((match) =>
    isLckRounds12PlayoffStageName(match.stageName),
  );

  if (hasPlayoffSchedule || competition.completed) {
    return new Set(
      [...competition.standings]
        .sort((left, right) => left.rank - right.rank)
        .slice(0, playoffSlots)
        .map((entry) => entry.teamId),
    );
  }

  if (competition.qualifiedTeamIds.length >= playoffSlots) {
    return new Set(competition.qualifiedTeamIds.slice(0, playoffSlots));
  }

  const remainingSeriesByTeamId = getRemainingSeriesByTeamId(competition);

  return new Set(
    competition.standings
      .filter((entry) => {
        const teamsThatCanStillReachEntry = competition.standings.filter(
          (otherEntry) => {
            if (otherEntry.teamId === entry.teamId) {
              return true;
            }

            const maxPossibleWins =
              otherEntry.wins +
              (remainingSeriesByTeamId.get(otherEntry.teamId) ?? 0);

            return maxPossibleWins >= entry.wins;
          },
        ).length;

        return teamsThatCanStillReachEntry <= playoffSlots;
      })
      .map((entry) => entry.teamId),
  );
}

function getUserMatchResult({
  match,
  record,
  userTeamId,
}: {
  match: MatchSchedule;
  record: MatchRecord | undefined;
  userTeamId: string | undefined;
}) {
  if (
    !record ||
    !userTeamId ||
    (match.blueTeamId !== userTeamId && match.redTeamId !== userTeamId)
  ) {
    return "neutral";
  }

  const userScore =
    match.blueTeamId === userTeamId
      ? record.score.blueWins
      : record.score.redWins;
  const opponentScore =
    match.blueTeamId === userTeamId
      ? record.score.redWins
      : record.score.blueWins;

  return userScore > opponentScore ? "win" : "loss";
}

function getScheduleStatusClass({
  match,
  record,
  userTeamId,
}: {
  match: MatchSchedule;
  record: MatchRecord | undefined;
  userTeamId: string | undefined;
}) {
  if (!record) {
    return "schedule-status-scheduled";
  }

  const userResult = getUserMatchResult({ match, record, userTeamId });

  if (userResult === "win") {
    return "schedule-status-user-win";
  }

  if (userResult === "loss") {
    return "schedule-status-user-loss";
  }

  return "schedule-status-neutral";
}

function getLckRoundsSeedSlots(
  competition: CompetitionState,
  table: StandingEntry[],
) {
  const qualifierIds = competition.qualifiedTeamIds;
  const qualifierNames = competition.qualifiedTeamNames;
  const hasConfirmedSeeds = qualifierIds.length >= 6;

  return Array.from({ length: 6 }, (_, index) => {
    const seed = index + 1;

    if (hasConfirmedSeeds) {
      const teamId = qualifierIds[index];
      const tableEntry = table.find((entry) => entry.teamId === teamId);
      const teamName = tableEntry?.teamName ?? qualifierNames[index] ?? `LCK ${seed}위`;

      return {
        label: `${seed}번 시드`,
        teamId,
        teamName,
        detail: `LCK ${seed}위`,
        isPlaceholder: false,
      };
    }

    return {
      label: `LCK ${seed}위`,
      teamName: `LCK ${seed}위`,
      detail: "정규시즌 종료 후 확정",
      isPlaceholder: true,
    };
  });
}

function createWinnerSlot(label: string): LckPlayoffSlot {
  return {
    label,
    teamName: label,
    detail: "이전 라운드 승자",
    isPlaceholder: true,
  };
}

function getPlayoffMatch(
  competition: CompetitionState,
  scheduleId: string,
): MatchSchedule | undefined {
  return competition.schedule.find((match) => match.id === scheduleId);
}

function createSlotFromMatchSide({
  label,
  match,
  record,
  side,
}: {
  label: string;
  match: MatchSchedule | undefined;
  record: MatchRecord | undefined;
  side: "blue" | "red";
}): LckPlayoffSlot {
  if (!match) {
    return createWinnerSlot(label);
  }

  const teamId = side === "blue" ? match.blueTeamId : match.redTeamId;
  const teamName = side === "blue" ? match.blueTeamName : match.redTeamName;
  const score = record
    ? side === "blue"
      ? record.score.blueWins
      : record.score.redWins
    : undefined;
  const isWinner = record?.winnerTeamId === teamId;

  return {
    label,
    teamId,
    teamName,
    detail: record
      ? `${score}-${side === "blue" ? record.score.redWins : record.score.blueWins} ${
          isWinner ? "승리" : "패배"
        }`
      : `${getDateLabel(match.scheduledDate)} · ${getFormatLabel(match)}`,
    isPlaceholder: false,
    isWinner,
    score,
  };
}

function getLckRoundsPlayoffMatches({
  competition,
  records,
  table,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  table: StandingEntry[];
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const matchIds = lckRounds12PlayoffMatchIds;
  const seedSlots = getLckRoundsSeedSlots(competition, table);
  const round1Seed36 = getPlayoffMatch(
    competition,
    matchIds.round1Seed3VsSeed6,
  );
  const round1Seed45 = getPlayoffMatch(
    competition,
    matchIds.round1Seed4VsSeed5,
  );
  const semifinalSeed1 = getPlayoffMatch(
    competition,
    matchIds.semifinalSeed1VsSeed45,
  );
  const semifinalSeed2 = getPlayoffMatch(
    competition,
    matchIds.semifinalSeed2VsSeed36,
  );
  const final = getPlayoffMatch(competition, matchIds.final);

  return [
    {
      id: "round-1",
      title: "Round 1",
      matches: [
        {
          id: "r1-a",
          stageName: lckRounds12PlayoffStageNames.round1,
          title: "R1 Match A",
          subtitle: "BO5 · 3위 vs 6위",
          slots: round1Seed36
            ? [
                createSlotFromMatchSide({
                  label: "3번 시드",
                  match: round1Seed36,
                  record: recordsByScheduleId.get(round1Seed36.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "6번 시드",
                  match: round1Seed36,
                  record: recordsByScheduleId.get(round1Seed36.id),
                  side: "red",
                }),
              ]
            : [seedSlots[2], seedSlots[5]],
        },
        {
          id: "r1-b",
          stageName: lckRounds12PlayoffStageNames.round1,
          title: "R1 Match B",
          subtitle: "BO5 · 4위 vs 5위",
          slots: round1Seed45
            ? [
                createSlotFromMatchSide({
                  label: "4번 시드",
                  match: round1Seed45,
                  record: recordsByScheduleId.get(round1Seed45.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "5번 시드",
                  match: round1Seed45,
                  record: recordsByScheduleId.get(round1Seed45.id),
                  side: "red",
                }),
              ]
            : [seedSlots[3], seedSlots[4]],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "semifinals",
      title: "Semifinals",
      matches: [
        {
          id: "sf-a",
          stageName: lckRounds12PlayoffStageNames.semifinals,
          title: "Semifinal A",
          subtitle: "BO5 · 1위 vs 4/5 승자",
          slots: semifinalSeed1
            ? [
                createSlotFromMatchSide({
                  label: "1번 시드",
                  match: semifinalSeed1,
                  record: recordsByScheduleId.get(semifinalSeed1.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "R1 Match B 승자",
                  match: semifinalSeed1,
                  record: recordsByScheduleId.get(semifinalSeed1.id),
                  side: "red",
                }),
              ]
            : [seedSlots[0], createWinnerSlot("R1 Match B 승자")],
        },
        {
          id: "sf-b",
          stageName: lckRounds12PlayoffStageNames.semifinals,
          title: "Semifinal B",
          subtitle: "BO5 · 2위 vs 3/6 승자",
          slots: semifinalSeed2
            ? [
                createSlotFromMatchSide({
                  label: "2번 시드",
                  match: semifinalSeed2,
                  record: recordsByScheduleId.get(semifinalSeed2.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "R1 Match A 승자",
                  match: semifinalSeed2,
                  record: recordsByScheduleId.get(semifinalSeed2.id),
                  side: "red",
                }),
              ]
            : [seedSlots[1], createWinnerSlot("R1 Match A 승자")],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "final",
      title: "Final",
      matches: [
        {
          id: "final-a",
          stageName: lckRounds12PlayoffStageNames.final,
          title: "Final",
          subtitle: "BO5 · 우승 결정전",
          slots: final
            ? [
                createSlotFromMatchSide({
                  label: "Semifinal A 승자",
                  match: final,
                  record: recordsByScheduleId.get(final.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "Semifinal B 승자",
                  match: final,
                  record: recordsByScheduleId.get(final.id),
                  side: "red",
                }),
              ]
            : [
                createWinnerSlot("Semifinal A 승자"),
                createWinnerSlot("Semifinal B 승자"),
              ],
        },
      ] satisfies LckPlayoffMatch[],
    },
  ];
}

function getStatusText(competition: CompetitionState) {
  if (competition.completed) {
    return "Completed";
  }

  if (competition.status === "active") {
    return competition.currentStageName;
  }

  return competition.status;
}

function isLckRounds34Competition(competition: CompetitionState) {
  return competition.competitionId === "lck-rounds-3-4";
}

function isLckRounds35Competition(competition: CompetitionState) {
  return competition.competitionId === "lck-rounds-3-5";
}

function isLateLckRoundsCompetition(competition: CompetitionState) {
  return isLckRounds34Competition(competition) || isLckRounds35Competition(competition);
}

function isLckRoundsDashboardCompetition(competition: CompetitionState) {
  return (
    competition.competitionId === "lck-rounds-1-2" ||
    isLateLckRoundsCompetition(competition)
  );
}

function getLckRoundsFormatTitle(competition: CompetitionState) {
  if (isLckRounds34Competition(competition)) {
    return "LCK Rounds 3-4";
  }

  if (isLckRounds35Competition(competition)) {
    return "LCK Rounds 3-5";
  }

  return "LCK Rounds 1-2";
}

function getRecordByScheduleId(records: MatchRecord[]) {
  return new Map(records.map((record) => [record.scheduleId, record]));
}

function getTeamClass({
  teamId,
  record,
  userTeamId,
}: {
  teamId: string;
  record: MatchRecord | undefined;
  userTeamId: string | undefined;
}) {
  const classes = ["bracket-team"];

  if (teamId === userTeamId) {
    classes.push("bracket-team-user");
  }

  if (record?.winnerTeamId === teamId) {
    classes.push("bracket-team-winner");
  }

  return classes.join(" ");
}

function CompetitionSummary({
  career,
  competition,
  userTeamId,
}: {
  career: CareerSave;
  competition: CompetitionState;
  userTeamId: string | undefined;
}) {
  const nextMatches = getNextWeekMatches(competition);
  const userStanding = competition.standings.find(
    (entry) => entry.teamId === userTeamId,
  );

  return (
    <section className="competition-summary-grid">
      <article className="competition-summary-card">
        <p className="eyebrow">Competition</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Stage</p>
        <strong>{getStatusText(competition)}</strong>
        <span>{competition.currentWeek}주차</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">User team</p>
        <strong>
          {userStanding?.teamName ?? career.userTeam.name} · {career.userTeam.wins}W{" "}
          {career.userTeam.losses}L
        </strong>
        <span>현재 대회 기준 성적을 추적합니다.</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Next</p>
        <strong>
          {nextMatches[0] ? `${nextMatches[0].week}주차` : "예정 경기 없음"}
        </strong>
        <span>
          {nextMatches[0]
            ? `${nextMatches.length}개 시리즈 대기 중`
            : "다음 단계 연결을 기다리는 중입니다."}
        </span>
      </article>
    </section>
  );
}

function LckRoundsSummary({
  career,
  competition,
}: {
  career: CareerSave;
  competition: CompetitionState;
}) {
  const [showFormatRules, setShowFormatRules] = useState(false);

  return (
    <section className="competition-summary-grid competition-summary-grid-compact">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">Competition</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Stage</p>
        <strong>{getStatusText(competition)}</strong>
        <span>{competition.currentWeek}주차</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Format</p>
        <button
          className="format-summary-button"
          onClick={() => setShowFormatRules(true)}
          type="button"
        >
          <strong>{getLckRoundsFormatTitle(competition)}</strong>
          <span>대회 포맷 상세 보기</span>
        </button>
      </article>
      {showFormatRules && (
        <LckRoundsFormatModal
          competition={competition}
          onClose={() => setShowFormatRules(false)}
        />
      )}
    </section>
  );
}

function LckRoundsFormatModal({
  competition,
  onClose,
}: {
  competition: CompetitionState;
  onClose: () => void;
}) {
  const isRounds34 = isLckRounds34Competition(competition);
  const isRounds35 = isLckRounds35Competition(competition);
  const isLateRounds = isLateLckRoundsCompetition(competition);
  const lateRoundsLabel = getLckRoundsFormatTitle(competition);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="lck-rounds-format-title"
        aria-modal="true"
        className="competition-rules-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="modal-close-button"
          onClick={onClose}
          type="button"
        >
          x
        </button>
        <p className="eyebrow">Competition Regulations</p>
        <h2 id="lck-rounds-format-title">
          {getLckRoundsFormatTitle(competition)}
        </h2>
        <div className="competition-rules-list">
          {isLateRounds ? (
            <>
              <article>
                <strong>제1조 그룹 분리</strong>
                <p>
                  Rounds 1-2 최종 순위 기준 상위 5팀은 Legend Group, 하위 5팀은
                  Rise Group으로 편성한다.
                </p>
              </article>
              <article>
                <strong>제2조 기록 승계</strong>
                <p>
                  Rounds 1-2의 승패와 세트 기록은 초기화하지 않고 {lateRoundsLabel}
                  순위표에 그대로 이어진다.
                </p>
              </article>
              <article>
                <strong>제3조 경기 방식</strong>
                <p>
                  {isRounds35
                    ? "각 그룹은 그룹 내부 5팀 트리플 라운드로빈을 치른다. 각 팀은 12시리즈를 추가로 진행하며 모든 경기는 BO3 Fearless로 기록한다."
                    : "각 그룹은 그룹 내부 5팀 더블 라운드로빈을 치른다. 각 팀은 8시리즈를 추가로 진행하며 모든 경기는 BO3 Fearless로 기록한다."}
                </p>
              </article>
              <article>
                <strong>제4조 후속 경로</strong>
                <p>
                  Legend 1-2위는 Playoffs Round 2, Legend 3-4위는 Playoffs
                  Round 1로 직행한다. Legend 5위와 Rise 1-3위는 Season
                  Play-In을 치르며, 모든 포스트시즌 경기는 BO5 Fearless로
                  기록한다.
                </p>
              </article>
              <article>
                <strong>제5조 Worlds 후보 저장</strong>
                <p>
                  포스트시즌 종료 후 최종 1~4위를 저장한다. 1~3위는 기본
                  Worlds 진출권 후보, 4위는 MSI 추가 시드 조건부 후보로 해석한다.
                  {isRounds34 ? " 아시안게임 시즌은 이후 Asian Games로 이동한다." : " 일반 시즌은 이후 Worlds로 바로 이동한다."}
                </p>
              </article>
            </>
          ) : (
            <>
              <article>
                <strong>제1조 참가팀</strong>
                <p>LCK 소속 10팀이 동일한 정규시즌 테이블에서 경쟁한다.</p>
              </article>
              <article>
                <strong>제2조 경기 방식</strong>
                <p>
                  각 팀은 9주 동안 총 18시리즈를 치른다. 모든 경기는 BO3
                  시리즈 단위로 기록하며, 시스템 내 AI 경기 역시 동일하게
                  처리한다.
                </p>
              </article>
              <article>
                <strong>제3조 순위 산정</strong>
                <p>
                  순위는 승수, 세트 득실, 세트 승수, 초기 시드순으로 산정한다.
                  별도 타이브레이커 경기는 1차 구현 범위에서 제외한다.
                </p>
              </article>
              <article>
                <strong>제4조 포스트시즌 진출</strong>
                <p>
                  정규시즌 종료 시 상위 6팀이 포스트시즌에 진출한다. 순위표의
                  PO 배지는 남은 경기 결과와 무관하게 진출이 산술적으로 확정된
                  팀에만 표시한다.
                </p>
              </article>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function LckRoundsTabs({
  activeTab,
  competition,
  onTabChange,
}: {
  activeTab: LckRoundsDashboardTab;
  competition: CompetitionState;
  onTabChange: (tab: LckRoundsDashboardTab) => void;
}) {
  const tournamentLabel = isLateLckRoundsCompetition(competition)
    ? "진출 경로"
    : "토너먼트";

  return (
    <div className="competition-tabs" role="tablist">
      <button
        className={`competition-tab ${
          activeTab === "standings" ? "competition-tab-active" : ""
        }`}
        onClick={() => onTabChange("standings")}
        type="button"
      >
        순위표
      </button>
      <button
        className={`competition-tab ${
          activeTab === "schedule" ? "competition-tab-active" : ""
        }`}
        onClick={() => onTabChange("schedule")}
        type="button"
      >
        일정
      </button>
      <button
        className={`competition-tab ${
          activeTab === "tournament" ? "competition-tab-active" : ""
        }`}
        onClick={() => onTabChange("tournament")}
        type="button"
      >
        {tournamentLabel}
      </button>
    </div>
  );
}

function LckRoundsSidePanel({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const nextUserMatch = getNextUserMatch(competition, userTeamId);
  const recentUserRecord = getRecentUserRecord({
    competition,
    records,
    userTeamId,
  });
  const scheduleById = new Map(competition.schedule.map((match) => [match.id, match]));
  const recentUserMatch = recentUserRecord
    ? scheduleById.get(recentUserRecord.scheduleId)
    : undefined;

  return (
    <aside className="lck-rounds-side-panel">
      <article className="competition-panel lck-rounds-side-card">
        <p className="eyebrow">다음 우리 팀 경기</p>
        {nextUserMatch ? (
          <>
            <strong>{getMatchTitle(nextUserMatch)}</strong>
            <span>{getDateLabel(nextUserMatch.scheduledDate)}</span>
            <small>
              {nextUserMatch.stageName} · {getFormatLabel(nextUserMatch)}
            </small>
          </>
        ) : (
          <>
            <strong>예정 경기 없음</strong>
            <span>정규시즌 일정이 모두 처리되었습니다.</span>
          </>
        )}
      </article>
      <article className="competition-panel lck-rounds-side-card">
        <p className="eyebrow">최근 우리 팀 결과</p>
        {recentUserRecord ? (
          <>
            <strong>
              {recentUserMatch
                ? getMatchTitle(recentUserMatch)
                : recentUserRecord.winnerTeamName}
            </strong>
            <span>
              {getUserResultLabel(recentUserRecord)} ·{" "}
              {recentUserRecord.score.blueWins}-{recentUserRecord.score.redWins}
            </span>
            <small>Winner: {recentUserRecord.winnerTeamName}</small>
          </>
        ) : (
          <>
            <strong>아직 결과 없음</strong>
            <span>첫 우리 팀 경기 후 결과가 표시됩니다.</span>
          </>
        )}
      </article>
    </aside>
  );
}

function LckRoundsStandingsTable({
  competition,
  table,
  userTeamId,
}: {
  competition: CompetitionState;
  table: StandingEntry[];
  userTeamId: string | undefined;
}) {
  const isLateRounds = isLateLckRoundsCompetition(competition);
  const playoffClinchedTeamIds = isLateRounds
    ? new Set<string>()
    : getPlayoffClinchedTeamIds(competition);
  const groupRankByTeamId = new Map<string, number>();

  if (isLateRounds) {
    table.forEach((entry) => {
      const groupRank =
        table.filter(
          (candidate) =>
            candidate.lckRoundsGroup === entry.lckRoundsGroup &&
            compareStandingEntries(candidate, entry) < 0,
        ).length + 1;

      groupRankByTeamId.set(entry.teamId, groupRank);
    });
  }

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Standings</p>
          <h2>{getLckRoundsFormatTitle(competition)} 순위표</h2>
        </div>
        <span className="panel-note">
          {isLateRounds ? "R1-2 기록 승계 · 그룹 내 순위" : "타이브레이커 경기 제외"}
        </span>
      </div>
      <div className="lck-standings-table lck-standings-header">
        <span>순위</span>
        <span>팀명</span>
        <span>경기</span>
        <span>승</span>
        <span>패</span>
        <span>세트득실</span>
        <span>{isLateRounds ? "그룹" : "진출"}</span>
      </div>
      <div className="lck-standings-scroll">
        {table.map((entry, index) => {
          const isPlayoffClinched = playoffClinchedTeamIds.has(entry.teamId);
          const displayRank = isLateRounds
            ? groupRankByTeamId.get(entry.teamId) ?? index + 1
            : index + 1;

          return (
            <div key={entry.teamId}>
              <div
                className={`lck-standings-table ${
                  entry.teamId === userTeamId ? "lck-standings-user" : ""
                }`}
              >
                <span>{displayRank}</span>
                <strong>{entry.teamName}</strong>
                <span>{getMatchCount(entry)}</span>
                <span>{entry.wins}</span>
                <span>{entry.losses}</span>
                <span>{getSetDiff(entry)}</span>
                {isLateRounds ? (
                  <b
                    className={`po-badge lck-rounds-group-badge lck-rounds-group-badge-${entry.lckRoundsGroup}`}
                  >
                    {getLckRounds34GroupLabel(entry.lckRoundsGroup)}
                  </b>
                ) : (
                  isPlayoffClinched && <b className="po-badge">PO</b>
                )}
              </div>
              {((isLateRounds && index === 4) ||
                (!isLateRounds && index === 5)) &&
                table.length > index + 1 && (
                <div
                  aria-label={isLateRounds ? "그룹 컷라인" : "포스트시즌 컷라인"}
                  className="playoff-cutline"
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="standings-footnote">
        {isLateRounds
          ? "Legend 1-2위는 Playoffs Round 2, Legend 3-4위는 Round 1, Legend 5위와 Rise 1-3위는 Season Play-In에 진출합니다. 최종 1~4위는 Worlds 후보로 저장됩니다."
          : "상위 6팀이 포스트시즌에 진출합니다. PO 배지는 진출이 산술적으로 확정된 팀에만 표시됩니다."}
      </p>
    </section>
  );
}

function groupMatchesByDate(matches: MatchSchedule[]) {
  const groups = new Map<string, MatchSchedule[]>();

  matches.forEach((match) => {
    const dateKey = match.scheduledDate ?? "undated";
    const group = groups.get(dateKey) ?? [];

    group.push(match);
    groups.set(dateKey, group);
  });

  return [...groups.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([dateKey, groupedMatches]) => ({
      dateKey,
      matches: groupedMatches.sort((left, right) => left.id.localeCompare(right.id)),
    }));
}

function LckRoundsScheduleView({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const groupedSchedule = groupMatchesByDate(competition.schedule);

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>일정 / 결과</h2>
        </div>
        <span className="panel-note">날짜별 시리즈 · 우리 팀 경기 강조</span>
      </div>
      <div className="lck-schedule-scroll">
        {groupedSchedule.map(({ dateKey, matches }) => (
          <article className="lck-schedule-day" key={dateKey}>
            <header>
              <strong>{getDateLabel(dateKey)}</strong>
              <span>{matches.length} series</span>
            </header>
            <div className="lck-schedule-day-list">
              {matches.map((match) => {
                const record = recordsByScheduleId.get(match.id);
                const isUserMatch =
                  match.blueTeamId === userTeamId || match.redTeamId === userTeamId;

                return (
                  <div
                    className={`lck-schedule-row ${
                      isUserMatch ? "lck-schedule-row-user" : ""
                    }`}
                    key={match.id}
                  >
                    <div>
                      <strong>{getMatchTitle(match)}</strong>
                      <span>
                        {match.stageName} · {getFormatLabel(match)}
                      </span>
                    </div>
                    <b
                      className={`schedule-status-badge ${
                        record
                          ? getScheduleStatusClass({ match, record, userTeamId })
                          : "schedule-status-scheduled"
                      }`}
                    >
                      {record ? getScoreLabel(record) : "예정"}
                    </b>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LckPlayoffTeamSlot({
  slot,
  userTeamId,
}: {
  slot: LckPlayoffSlot;
  userTeamId: string | undefined;
}) {
  const classes = [
    "lck-playoff-team",
    slot.isPlaceholder ? "lck-playoff-team-placeholder" : "",
    slot.teamId === userTeamId ? "lck-playoff-team-user" : "",
    slot.isWinner ? "lck-playoff-team-winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span>{slot.label}</span>
      <strong>{slot.teamName}</strong>
      <small>{slot.detail}</small>
    </div>
  );
}

function LckPlayoffMatchCard({
  isCurrent,
  match,
  userTeamId,
}: {
  isCurrent: boolean;
  match: LckPlayoffMatch;
  userTeamId: string | undefined;
}) {
  return (
    <article
      className={`lck-playoff-match ${
        isCurrent ? "lck-playoff-match-current" : ""
      }`}
    >
      <header>
        <strong>{match.title}</strong>
        <span>{isCurrent ? `현재 라운드 · ${match.subtitle}` : match.subtitle}</span>
      </header>
      <div className="lck-playoff-match-slots">
        {match.slots.map((slot) => (
          <LckPlayoffTeamSlot
            key={`${match.id}-${slot.label}`}
            slot={slot}
            userTeamId={userTeamId}
          />
        ))}
      </div>
    </article>
  );
}

function LckRoundsTournamentView({
  competition,
  records,
  table,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  table: StandingEntry[];
  userTeamId: string | undefined;
}) {
  const playoffRounds = getLckRoundsPlayoffMatches({
    competition,
    records,
    table,
  });
  const finalists = getLckRounds12Finalists(competition, records);
  const currentPlayoffStageName = isLckRounds12PlayoffStageName(
    competition.currentStageName,
  )
    ? competition.currentStageName
    : null;
  const bracketStatus = competition.completed
    ? "포스트시즌 종료 · 우승/준우승 확정"
    : competition.schedule.some((match) =>
          isLckRounds12PlayoffStageName(match.stageName),
        )
      ? "포스트시즌 진행 중 · 승자가 다음 라운드로 진출"
      : "정규시즌 진행 중 · 슬롯은 최종 순위 기준으로 확정";

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Tournament</p>
          <h2>LCK Rounds 1-2 포스트시즌</h2>
        </div>
        <span className="panel-note">{bracketStatus}</span>
      </div>
      <div className="lck-playoff-frame">
        <div className="lck-playoff-bracket">
          {playoffRounds.map((round) => (
            <section
              className={`lck-playoff-round ${
                round.matches.some(
                  (match) => match.stageName === currentPlayoffStageName,
                )
                  ? "lck-playoff-round-current"
                  : ""
              }`}
              key={round.id}
            >
              <h3>{round.title}</h3>
              <div className="lck-playoff-match-stack">
                {round.matches.map((match) => (
                  <LckPlayoffMatchCard
                    isCurrent={match.stageName === currentPlayoffStageName}
                    key={match.id}
                    match={match}
                    userTeamId={userTeamId}
                  />
                ))}
              </div>
            </section>
          ))}
          <section className="lck-playoff-round lck-playoff-champion-round">
            <h3>Champion</h3>
            <article className="lck-playoff-champion-card">
              <span>우승팀</span>
              <strong>{competition.winnerTeamName ?? "우승팀 미정"}</strong>
              <small>
                {finalists[1]
                  ? `준우승: ${finalists[1].teamName}`
                  : "결승 결과가 확정되면 우승팀과 준우승팀이 표시됩니다."}
              </small>
            </article>
          </section>
        </div>
      </div>
    </section>
  );
}

function createLckRounds34PathSlot({
  detail,
  entry,
  label,
}: {
  detail: string;
  entry: StandingEntry | undefined;
  label: string;
}): LckPlayoffSlot {
  return {
    label,
    teamId: entry?.teamId,
    teamName: entry?.teamName ?? label,
    detail,
    isPlaceholder: !entry,
  };
}

function createLckRounds34TeamSlot({
  detail,
  label,
  team,
}: {
  detail: string;
  label: string;
  team: { teamId: string; teamName: string } | undefined;
}): LckPlayoffSlot {
  return {
    label,
    teamId: team?.teamId,
    teamName: team?.teamName ?? label,
    detail,
    isPlaceholder: !team,
  };
}

function getLckRounds34ProjectedPathGroups(table: StandingEntry[]) {
  const legendStandings = table
    .filter((entry) => entry.lckRoundsGroup === "legend")
    .sort(compareStandingEntries);
  const riseStandings = table
    .filter((entry) => entry.lckRoundsGroup === "rise")
    .sort(compareStandingEntries);

  return [
    {
      id: "playoffs-round-2",
      title: "Playoffs R2",
      matches: [
        {
          id: "lck-r34-path-r2",
          stageName: "Playoffs Round 2",
          title: "Round 2 직행",
          subtitle: "Legend 1-2위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Legend Group 1위",
              entry: legendStandings[0],
              label: "Legend 1위",
            }),
            createLckRounds34PathSlot({
              detail: "Legend Group 2위",
              entry: legendStandings[1],
              label: "Legend 2위",
            }),
          ],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-1",
      title: "Playoffs R1",
      matches: [
        {
          id: "lck-r34-path-r1",
          stageName: "Playoffs Round 1",
          title: "Round 1 직행",
          subtitle: "Legend 3-4위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Legend Group 3위",
              entry: legendStandings[2],
              label: "Legend 3위",
            }),
            createLckRounds34PathSlot({
              detail: "Legend Group 4위",
              entry: legendStandings[3],
              label: "Legend 4위",
            }),
          ],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "season-play-in",
      title: "Season Play-In",
      matches: [
        {
          id: "lck-r34-path-play-in",
          stageName: "Season Play-In",
          title: "Play-In 후보",
          subtitle: "Legend 5위 + Rise 1-3위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Legend Group 5위",
              entry: legendStandings[4],
              label: "Legend 5위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise Group 1위",
              entry: riseStandings[0],
              label: "Rise 1위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise Group 2위",
              entry: riseStandings[1],
              label: "Rise 2위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise Group 3위",
              entry: riseStandings[2],
              label: "Rise 3위",
            }),
          ],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "season-locked",
      title: "Final Rank",
      matches: [
        {
          id: "lck-r34-path-out",
          stageName: "Season Final Rank",
          title: "9-10위 확정",
          subtitle: "Rise 4-5위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Rise Group 4위",
              entry: riseStandings[3],
              label: "Rise 4위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise Group 5위",
              entry: riseStandings[4],
              label: "Rise 5위",
            }),
          ],
        },
      ] satisfies LckPlayoffMatch[],
    },
  ];
}

function getLckRounds34SeedSlots(competition: CompetitionState) {
  const seeds = isLckRounds35Competition(competition)
    ? getLckRounds35PostseasonSeeds(competition)
    : getLckRounds34PostseasonSeeds(competition);

  return Array.from({ length: 8 }, (_, index) => {
    const seed = seeds[index];
    const label =
      index < 5 ? `Legend ${index + 1}위` : `Rise ${index - 4}위`;

    return createLckRounds34TeamSlot({
      detail: seed?.sourceDetail ?? "정규 그룹 종료 후 확정",
      label,
      team: seed,
    });
  });
}

function createLckRounds34MatchCard({
  competition,
  fallbackSlots,
  recordsByScheduleId,
  scheduleId,
  slotLabels,
  subtitle,
  title,
}: {
  competition: CompetitionState;
  fallbackSlots: LckPlayoffSlot[];
  recordsByScheduleId: Map<string, MatchRecord>;
  scheduleId: string;
  slotLabels: [string, string];
  subtitle: string;
  title: string;
}): LckPlayoffMatch {
  const match = getPlayoffMatch(competition, scheduleId);

  return {
    id: scheduleId,
    stageName: match?.stageName ?? "Pending",
    title,
    subtitle,
    slots: match
      ? [
          createSlotFromMatchSide({
            label: slotLabels[0],
            match,
            record: recordsByScheduleId.get(match.id),
            side: "blue",
          }),
          createSlotFromMatchSide({
            label: slotLabels[1],
            match,
            record: recordsByScheduleId.get(match.id),
            side: "red",
          }),
        ]
      : fallbackSlots,
  };
}

function getLckRounds34FinalPlacementSlots({
  competition,
  records,
  worldsQualification,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  worldsQualification: WorldsQualificationState | undefined;
}) {
  const placements = isLckRounds35Competition(competition)
    ? getLckRounds35FinalPlacements(competition, records)
    : getLckRounds34FinalPlacements(competition, records);
  const fallbackPlacements =
    placements.length >= 4
      ? placements
      : competition.qualifiedTeamIds.slice(0, 4).map((teamId, index) => ({
          teamId,
          teamName: competition.qualifiedTeamNames[index] ?? `최종 ${index + 1}위`,
        }));
  const fourthSeed = worldsQualification?.lckSeeds.find((seed) => seed.seed === 4);
  const fourthSeedDetail = !worldsQualification
    ? "MSI 추가 시드 조건부 4시드"
    : fourthSeed?.status === "qualified"
      ? worldsQualification.status === "lck-seeds-decided"
        ? "Worlds 4시드 확정"
        : "MSI 추가 시드 확보"
      : "MSI 추가 시드 조건 미충족";

  return [
    createLckRounds34TeamSlot({
      detail: "Worlds 기본 진출권",
      label: "최종 1위",
      team: fallbackPlacements[0],
    }),
    createLckRounds34TeamSlot({
      detail: "Worlds 기본 진출권",
      label: "최종 2위",
      team: fallbackPlacements[1],
    }),
    createLckRounds34TeamSlot({
      detail: "Worlds 기본 진출권",
      label: "최종 3위",
      team: fallbackPlacements[2],
    }),
    createLckRounds34TeamSlot({
      detail: fourthSeedDetail,
      label: "최종 4위",
      team: fallbackPlacements[3],
    }),
  ];
}

function getLckRounds34ActualPostseasonGroups({
  competition,
  records,
  worldsQualification,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  worldsQualification: WorldsQualificationState | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const seedSlots = getLckRounds34SeedSlots(competition);
  const matchIds = isLckRounds35Competition(competition)
    ? lckRounds35PostseasonMatchIds
    : lckRounds34PostseasonMatchIds;

  return [
    {
      id: "season-play-in",
      title: "Season Play-In",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[4], seedSlots[5]],
          recordsByScheduleId,
          scheduleId: matchIds.playInFirstQualifier,
          slotLabels: ["Legend 5위", "Rise 1위"],
          subtitle: "BO5 · 승자는 Playoffs 진출",
          title: "Qualifier 1",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[6], seedSlots[7]],
          recordsByScheduleId,
          scheduleId: matchIds.playInElimination,
          slotLabels: ["Rise 2위", "Rise 3위"],
          subtitle: "BO5 · 승자는 최종 진출전",
          title: "Elimination",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("Qualifier 1 패자"),
            createWinnerSlot("Elimination 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.playInSecondQualifier,
          slotLabels: ["Qualifier 1 패자", "Elimination 승자"],
          subtitle: "BO5 · 승자는 Playoffs 마지막 자리",
          title: "Qualifier 2",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-1",
      title: "Playoffs R1",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[2], createWinnerSlot("Play-In 2번")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound1Legend3VsPlayIn2,
          slotLabels: ["Legend 3위", "Play-In 2번"],
          subtitle: "BO5 · 패자는 하위조",
          title: "R1 Match A",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[3], createWinnerSlot("Play-In 1번")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound1Legend4VsPlayIn1,
          slotLabels: ["Legend 4위", "Play-In 1번"],
          subtitle: "BO5 · 패자는 하위조",
          title: "R1 Match B",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-2",
      title: "Playoffs R2",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[0], createWinnerSlot("R1 Match B 승자")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound2Legend1VsRound1B,
          slotLabels: ["Legend 1위", "R1 Match B 승자"],
          subtitle: "BO5 · 승자는 Playoffs R3",
          title: "R2 Match A",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[1], createWinnerSlot("R1 Match A 승자")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound2Legend2VsRound1A,
          slotLabels: ["Legend 2위", "R1 Match A 승자"],
          subtitle: "BO5 · 승자는 Playoffs R3",
          title: "R2 Match B",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "lower-round-1",
      title: "Lower R1",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("R2 Match A 패자"),
            createWinnerSlot("R1 Match A 패자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerRound1A,
          slotLabels: ["R2 Match A 패자", "R1 Match A 패자"],
          subtitle: "BO5 · 패자는 탈락",
          title: "Lower Match A",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("R2 Match B 패자"),
            createWinnerSlot("R1 Match B 패자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerRound1B,
          slotLabels: ["R2 Match B 패자", "R1 Match B 패자"],
          subtitle: "BO5 · 패자는 탈락",
          title: "Lower Match B",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-3",
      title: "Playoffs R3",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("R2 Match A 승자"),
            createWinnerSlot("R2 Match B 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound3,
          slotLabels: ["R2 Match A 승자", "R2 Match B 승자"],
          subtitle: "BO5 · 승자는 Grand Final",
          title: "Upper Final",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "lower-round-2",
      title: "Lower R2",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("Lower Match A 승자"),
            createWinnerSlot("Lower Match B 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerRound2,
          slotLabels: ["Lower Match A 승자", "Lower Match B 승자"],
          subtitle: "BO5 · 패자는 최종 4위",
          title: "Lower Semifinal",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "finals",
      title: "Finals",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("Upper Final 패자"),
            createWinnerSlot("Lower Semifinal 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerFinal,
          slotLabels: ["Upper Final 패자", "Lower Semifinal 승자"],
          subtitle: "BO5 · 패자는 최종 3위",
          title: "Lower Final",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("Upper Final 승자"),
            createWinnerSlot("Lower Final 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.grandFinal,
          slotLabels: ["Upper Final 승자", "Lower Final 승자"],
          subtitle: "BO5 · 우승 결정전",
          title: "Grand Final",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "worlds-path",
      title: "Worlds Path",
      matches: [
        {
          id: "lck-r34-worlds-candidates",
          stageName: "Worlds Qualification",
          title: "최종 1-4위",
          subtitle:
            worldsQualification?.bonusLeagueLabels.includes("LCK")
              ? "1-3위 기본 진출 · 4위 MSI 추가 시드 확보"
              : "1-3위 기본 진출 · 4위 MSI 추가 시드 조건 미충족",
          slots: getLckRounds34FinalPlacementSlots({
            competition,
            records,
            worldsQualification,
          }),
        },
      ] satisfies LckPlayoffMatch[],
    },
  ];
}

function LckRounds34PostseasonPathView({
  competition,
  records,
  table,
  userTeamId,
  worldsQualification,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  table: StandingEntry[];
  userTeamId: string | undefined;
  worldsQualification: WorldsQualificationState | undefined;
}) {
  const hasPostseasonSchedule = competition.schedule.some((match) =>
    isLckRounds35Competition(competition)
      ? isLckRounds35PostseasonStageName(match.stageName)
      : isLckRounds34PostseasonStageName(match.stageName),
  );
  const pathGroups = hasPostseasonSchedule
    ? getLckRounds34ActualPostseasonGroups({
        competition,
        records,
        worldsQualification,
      })
    : getLckRounds34ProjectedPathGroups(table);
  const currentPostseasonStageName =
    (isLckRounds35Competition(competition)
      ? isLckRounds35PostseasonStageName(competition.currentStageName)
      : isLckRounds34PostseasonStageName(competition.currentStageName))
      ? competition.currentStageName
      : null;
  const bracketStatus = competition.completed
    ? worldsQualification?.bonusLeagueLabels.includes("LCK")
      ? "최종 1~4위 저장 완료 · LCK 4시드 Worlds 확정"
      : "최종 1~4위 저장 완료 · 4위는 조건 미충족"
    : hasPostseasonSchedule
      ? "실제 경기 진행 중 · 전 경기 BO5 Fearless"
      : "현 순위 기준 예상 슬롯";

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Postseason Path</p>
          <h2>{getLckRoundsFormatTitle(competition)} 후속 경로</h2>
        </div>
        <span className="panel-note">{bracketStatus}</span>
      </div>
      <div className="lck-playoff-frame">
        <div className="lck-playoff-bracket">
          {pathGroups.map((round) => (
            <section
              className={`lck-playoff-round ${
                round.matches.some(
                  (match) => match.stageName === currentPostseasonStageName,
                )
                  ? "lck-playoff-round-current"
                  : ""
              }`}
              key={round.id}
            >
              <h3>{round.title}</h3>
              <div className="lck-playoff-match-stack">
                {round.matches.map((match) => (
                  <LckPlayoffMatchCard
                    isCurrent={match.stageName === currentPostseasonStageName}
                    key={match.id}
                    match={match}
                    userTeamId={userTeamId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function LckRoundsDashboard({
  career,
  competition,
  subPage,
  onSubPageChange,
  records,
  table,
  userTeamId,
}: {
  career: CareerSave;
  competition: CompetitionState;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
  records: MatchRecord[];
  table: StandingEntry[];
  userTeamId: string | undefined;
}) {
  const [fallbackTab, setFallbackTab] =
    useState<LckRoundsDashboardTab>("standings");
  const activeTab = isLckRoundsDashboardTab(subPage) ? subPage : fallbackTab;
  const handleTabChange = (nextTab: LckRoundsDashboardTab) => {
    if (onSubPageChange) {
      onSubPageChange(nextTab);
      return;
    }

    setFallbackTab(nextTab);
  };

  return (
    <section className="competition-dashboard lck-rounds-dashboard">
      <LckRoundsSummary career={career} competition={competition} />
      <LckRoundsTabs
        activeTab={activeTab}
        competition={competition}
        onTabChange={handleTabChange}
      />
      <div className="lck-rounds-content-grid">
        {activeTab === "standings" && (
          <LckRoundsStandingsTable
            competition={competition}
            table={table}
            userTeamId={userTeamId}
          />
        )}
        {activeTab === "schedule" && (
          <LckRoundsScheduleView
            competition={competition}
            records={records}
            userTeamId={userTeamId}
          />
        )}
        {activeTab === "tournament" && (
          isLateLckRoundsCompetition(competition) ? (
            <LckRounds34PostseasonPathView
              competition={competition}
              records={records}
              table={table}
              userTeamId={userTeamId}
              worldsQualification={career.seasonState.worldsQualification}
            />
          ) : (
            <LckRoundsTournamentView
              competition={competition}
              records={records}
              table={table}
              userTeamId={userTeamId}
            />
          )
        )}
        <LckRoundsSidePanel
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      </div>
    </section>
  );
}

function StandingsTable({
  table,
  userTeamId,
}: {
  table: StandingEntry[];
  userTeamId: string | undefined;
}) {
  return (
    <section className="competition-panel competition-table-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Standings</p>
          <h2>전체 순위표</h2>
        </div>
        <span className="panel-note">경기승 · 세트득실 · 세트승 · 초기 시드 순</span>
      </div>
      <div className="competition-table competition-table-header">
        <span>순위</span>
        <span>팀명</span>
        <span>경기</span>
        <span>세트득실</span>
      </div>
      <div className="competition-table-scroll">
        {table.length === 0 && (
          <div className="competition-empty-state">
            순위표는 대회 일정이 생성되면 표시됩니다.
          </div>
        )}
        {table.map((entry, index) => (
          <div
            className={`competition-table ${
              entry.teamId === userTeamId ? "competition-table-user" : ""
            }`}
            key={entry.teamId}
          >
            <span>{index + 1}</span>
            <strong>{entry.teamName}</strong>
            <span>
              {entry.wins}-{entry.losses}
            </span>
            <span>{getSetDiff(entry)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function GroupStatusPanel({
  competition,
  records,
  table,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  table: StandingEntry[];
}) {
  if (competition.competitionId !== "lck-cup") {
    return (
      <section className="competition-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Format</p>
            <h2>{competition.name} 현황</h2>
          </div>
          <span className="panel-note">{competition.status}</span>
        </div>
        <p className="muted">
          이 대회는 이후 단계에서 조별리그, 진출권, 토너먼트 세부 일정이
          생성되면 상세 현황을 표시합니다.
        </p>
      </section>
    );
  }

  const summary = getLckCupGroupPointSummary(competition, records);

  return (
    <section className="competition-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Groups</p>
          <h2>Baron / Elder 현황</h2>
        </div>
        <span className="panel-note">
          현재 승자 그룹: {getGroupLabel(summary.winnerGroup)}
        </span>
      </div>
      <div className="competition-group-grid">
        {(["baron", "elder"] as LckCupGroupName[]).map((group) => {
          const groupTeams = table.filter((entry) => entry.lckCupGroup === group);

          return (
            <article
              className={`competition-group-card ${
                summary.winnerGroup === group ? "competition-group-card-leading" : ""
              }`}
              key={group}
            >
              <div className="competition-group-head">
                <strong>{getGroupLabel(group)}</strong>
                <span>
                  {summary.groups[group].points} pts / diff{" "}
                  {summary.groups[group].setDiff}
                </span>
              </div>
              <div className="competition-group-team-list">
                {groupTeams.map((entry) => (
                  <span key={entry.teamId}>{entry.teamName}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SchedulePanel({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const currentWeekMatches = getCurrentWeekMatches(competition);
  const recentRecords = getRecentRecords(competition, records);
  const nextMatches = getNextWeekMatches(competition);
  const scheduleById = new Map(competition.schedule.map((match) => [match.id, match]));

  return (
    <section className="competition-panel competition-schedule-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>일정 / 결과</h2>
        </div>
        <span className="panel-note">현재 주차 · 최근 결과 · 다음 예정</span>
      </div>
      <div className="competition-schedule-columns">
        <ScheduleList
          matches={currentWeekMatches}
          records={records}
          title="현재 주차"
          userTeamId={userTeamId}
        />
        <div className="competition-list-block">
          <strong>최근 결과</strong>
          <div className="competition-list-scroll">
            {recentRecords.length === 0 && <span className="muted">완료된 경기 없음</span>}
            {recentRecords.map((record) => {
              const match = scheduleById.get(record.scheduleId);

              return (
                <div
                  className={`competition-list-row ${
                    record.userResult !== "none" ? "competition-list-row-user" : ""
                  }`}
                  key={record.id}
                >
                  <div>
                    <strong>
                      {match ? getMatchTitle(match) : record.winnerTeamName}
                    </strong>
                    <span>Winner: {record.winnerTeamName}</span>
                  </div>
                  <span>{getScoreLabel(record)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <ScheduleList
          matches={nextMatches}
          records={records}
          title="다음 예정"
          userTeamId={userTeamId}
        />
      </div>
    </section>
  );
}

function ScheduleList({
  matches,
  records,
  title,
  userTeamId,
}: {
  matches: MatchSchedule[];
  records: MatchRecord[];
  title: string;
  userTeamId: string | undefined;
}) {
  return (
    <div className="competition-list-block">
      <strong>{title}</strong>
      <div className="competition-list-scroll">
        {matches.length === 0 && <span className="muted">표시할 경기 없음</span>}
        {matches.map((match) => {
          const record = getMatchRecord(match, records);
          const isUserMatch =
            match.blueTeamId === userTeamId || match.redTeamId === userTeamId;

          return (
            <div
              className={`competition-list-row ${
                isUserMatch ? "competition-list-row-user" : ""
              }`}
              key={match.id}
            >
              <div>
                <strong>{getMatchTitle(match)}</strong>
                <span>
                  {match.stageName} · {getFormatLabel(match)}
                </span>
              </div>
              <span>{getScoreLabel(record)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketPanel({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);

  if (competition.competitionId !== "lck-cup") {
    return (
      <section className="competition-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Tournament</p>
            <h2>{competition.name} 브래킷</h2>
          </div>
          <span className="panel-note">대회 포맷 구현 후 자동 생성</span>
        </div>
        <div className="competition-bracket-frame competition-bracket-placeholder">
          <strong>{competition.name}</strong>
          <span>
            아직 이 대회의 토너먼트 일정은 생성되지 않았습니다. 진행 엔진이
            연결되면 좌측에서 우측으로 진행되는 브래킷으로 표시됩니다.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="competition-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Tournament</p>
          <h2>LCK Cup 토너먼트 브래킷</h2>
        </div>
        <span className="panel-note">16:9 와이드 패널 · 좌에서 우로 진행</span>
      </div>
      <div className="competition-bracket-frame">
        <div className="competition-bracket">
          {knockoutRounds.map((round) => {
            const matches = competition.schedule.filter(
              (match) => match.stageName === round.stageName,
            );
            const slots =
              matches.length > 0
                ? matches
                : Array.from({ length: round.slots }, (_, index) => index);

            return (
              <div className="bracket-round" key={round.id}>
                <strong className="bracket-round-title">{round.title}</strong>
                <div className="bracket-match-stack">
                  {slots.map((slot) =>
                    typeof slot === "number" ? (
                      <div className="bracket-match bracket-match-empty" key={slot}>
                        <span>진출팀 대기</span>
                        <small>{round.stageName}</small>
                      </div>
                    ) : (
                      <BracketMatch
                        key={slot.id}
                        match={slot}
                        record={recordsByScheduleId.get(slot.id)}
                        userTeamId={userTeamId}
                      />
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BracketMatch({
  match,
  record,
  userTeamId,
}: {
  match: MatchSchedule;
  record: MatchRecord | undefined;
  userTeamId: string | undefined;
}) {
  return (
    <div className="bracket-match">
      <span className={getTeamClass({ teamId: match.blueTeamId, record, userTeamId })}>
        {match.blueTeamName}
      </span>
      <span className={getTeamClass({ teamId: match.redTeamId, record, userTeamId })}>
        {match.redTeamName}
      </span>
      <small>
        {getFormatLabel(match)} · {getScoreLabel(record)}
      </small>
    </div>
  );
}

function getAsianGamesTeamClass({
  record,
  teamId,
}: {
  record: MatchRecord | undefined;
  teamId: string;
}) {
  const classes = ["asian-games-team-slot"];

  if (teamId === asianGamesKoreaTeamId) {
    classes.push("asian-games-team-korea");
  }

  if (record?.winnerTeamId === teamId) {
    classes.push("asian-games-team-winner");
  }

  return classes.join(" ");
}

function getAsianGamesRosterRoleLabel(role: string) {
  if (role === "jungle") {
    return "JGL";
  }

  return role.toUpperCase();
}

function AsianGamesTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: AsianGamesDashboardTab;
  onTabChange: (tab: AsianGamesDashboardTab) => void;
}) {
  const tabs: Array<{ id: AsianGamesDashboardTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "bracket", label: "Bracket" },
  ];

  return (
    <div className="competition-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          className={`competition-tab ${
            activeTab === tab.id ? "competition-tab-active" : ""
          }`}
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AsianGamesSummary({
  career,
  competition,
}: {
  career: CareerSave;
  competition: CompetitionState;
}) {
  const asianGamesState = career.seasonState.asianGames;
  const medals = asianGamesState?.medals;

  return (
    <section className="competition-summary-grid competition-summary-grid-compact">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">National Team</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Mode</p>
        <strong>{getAsianGamesModeLabel(asianGamesState?.playMode ?? "undecided")}</strong>
        <span>선택은 대회 전체에 적용</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Medals</p>
        <strong>{medals ? `금 ${medals.goldTeamName}` : "미정"}</strong>
        <span>
          {medals
            ? `은 ${medals.silverTeamName} · 동 ${medals.bronzeTeamName}`
            : "결승과 동메달전 완료 후 확정"}
        </span>
      </article>
    </section>
  );
}

function AsianGamesOverview({ career }: { career: CareerSave }) {
  const asianGamesState = career.seasonState.asianGames;
  const timeline = asianGamesState ? getAsianGamesTimelineLabel(asianGamesState) : [];

  return (
    <section className="asian-games-overview-grid">
      <article className="competition-panel asian-games-country-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Entrants</p>
            <h2>참가국</h2>
          </div>
          <span className="panel-note">8개 국가 싱글 엘리미네이션</span>
        </div>
        <div className="asian-games-country-grid">
          {asianGamesCountryProfiles.map((country) => (
            <article
              className={`asian-games-country-card ${
                country.teamId === asianGamesKoreaTeamId
                  ? "asian-games-country-korea"
                  : ""
              }`}
              key={country.teamId}
            >
              <span>{country.code}</span>
              <strong>{country.name}</strong>
              <small>
                전력 {country.strength} · {country.style}
              </small>
            </article>
          ))}
        </div>
      </article>
      <article className="competition-panel asian-games-roster-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Korea</p>
            <h2>대한민국 대표 6인</h2>
          </div>
          <span className="panel-note">
            {asianGamesState?.status === "decision-pending"
              ? "진행 방식 선택 대기"
              : getAsianGamesModeLabel(asianGamesState?.playMode ?? "undecided")}
          </span>
        </div>
        <div className="asian-games-roster-grid">
          {(asianGamesState?.roster ?? []).map((member) => (
            <article
              className={`asian-games-roster-card ${
                member.isStarter ? "asian-games-roster-starter" : ""
              }`}
              key={member.playerId}
            >
              <span>
                {member.isStarter
                  ? getAsianGamesRosterRoleLabel(member.role)
                  : "6TH"}
              </span>
              <strong>{member.playerName}</strong>
              <small>
                {getAsianGamesRoleSelectionLabel(member)} · 폼{" "}
                {member.formAtSelection}
              </small>
            </article>
          ))}
          {!asianGamesState && (
            <div className="competition-empty-state">대표 선발 전입니다.</div>
          )}
        </div>
        <div className="asian-games-timeline-list">
          {timeline.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </article>
    </section>
  );
}

function getCompetitionScheduleGroups(competition: CompetitionState) {
  return [...competition.schedule]
    .sort((left, right) => {
      const dateDiff = (left.scheduledDate ?? "").localeCompare(
        right.scheduledDate ?? "",
      );

      return dateDiff !== 0 ? dateDiff : left.id.localeCompare(right.id);
    })
    .reduce<Array<{ dateKey: string; matches: MatchSchedule[] }>>((groups, match) => {
      const dateKey = match.scheduledDate ?? "날짜 미정";
      const existingGroup = groups.find((group) => group.dateKey === dateKey);

      if (existingGroup) {
        existingGroup.matches.push(match);
        return groups;
      }

      return [...groups, { dateKey, matches: [match] }];
    }, []);
}

function AsianGamesScheduleView({
  competition,
  records,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const groups = getCompetitionScheduleGroups(competition);

  return (
    <section className="competition-panel asian-games-schedule-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>Asian Games 일정 / 결과</h2>
        </div>
        <span className="panel-note">결승만 BO5 · 나머지 BO3</span>
      </div>
      <div className="asian-games-schedule-list">
        {groups.map((group) => (
          <article className="asian-games-schedule-day" key={group.dateKey}>
            <header>{getDateLabel(group.dateKey)}</header>
            {group.matches.map((match) => {
              const record = recordsByScheduleId.get(match.id);
              const isKoreaMatch =
                match.blueTeamId === asianGamesKoreaTeamId ||
                match.redTeamId === asianGamesKoreaTeamId;

              return (
                <div
                  className={`asian-games-schedule-row ${
                    isKoreaMatch ? "asian-games-schedule-korea" : ""
                  }`}
                  key={match.id}
                >
                  <div>
                    <strong>{getMatchTitle(match)}</strong>
                    <span>
                      {match.stageName} · {getFormatLabel(match)}
                    </span>
                  </div>
                  <span>{getScoreLabel(record)}</span>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}

function AsianGamesBracketMatchCard({
  match,
  placeholder,
  record,
}: {
  match?: MatchSchedule;
  placeholder: string;
  record?: MatchRecord;
}) {
  if (!match) {
    return (
      <article className="asian-games-bracket-match asian-games-bracket-placeholder">
        <strong>{placeholder}</strong>
        <span>진출팀 대기</span>
      </article>
    );
  }

  return (
    <article
      className={`asian-games-bracket-match ${
        match.blueTeamId === asianGamesKoreaTeamId ||
        match.redTeamId === asianGamesKoreaTeamId
          ? "asian-games-bracket-korea"
          : ""
      }`}
    >
      <header>
        <strong>{match.stageName}</strong>
        <span>
          {getDateLabel(match.scheduledDate)} · {getFormatLabel(match)}
        </span>
      </header>
      <div className="asian-games-bracket-slots">
        <span className={getAsianGamesTeamClass({ teamId: match.blueTeamId, record })}>
          {match.blueTeamName}
        </span>
        <span className={getAsianGamesTeamClass({ teamId: match.redTeamId, record })}>
          {match.redTeamName}
        </span>
      </div>
      <small>{getScoreLabel(record)}</small>
    </article>
  );
}

function AsianGamesBracketView({
  competition,
  records,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const scheduleById = new Map(competition.schedule.map((match) => [match.id, match]));
  const bracketSlots = [
    {
      id: "qf-a",
      className: "asian-games-slot-qf-a asian-games-bracket-node-source",
      matchId: asianGamesMatchIds.quarterfinalA,
      placeholder: "대한민국 vs 마카오",
    },
    {
      id: "qf-b",
      className: "asian-games-slot-qf-b asian-games-bracket-node-source",
      matchId: asianGamesMatchIds.quarterfinalB,
      placeholder: "일본 vs 홍콩",
    },
    {
      id: "qf-c",
      className: "asian-games-slot-qf-c asian-games-bracket-node-source",
      matchId: asianGamesMatchIds.quarterfinalC,
      placeholder: "중국 vs 인도",
    },
    {
      id: "qf-d",
      className: "asian-games-slot-qf-d asian-games-bracket-node-source",
      matchId: asianGamesMatchIds.quarterfinalD,
      placeholder: "대만 vs 베트남",
    },
    {
      id: "sf-a",
      className: "asian-games-slot-sf-a asian-games-bracket-node-merge",
      matchId: asianGamesMatchIds.semifinalA,
      placeholder: "8강 A/B 승자",
    },
    {
      id: "sf-b",
      className: "asian-games-slot-sf-b asian-games-bracket-node-merge",
      matchId: asianGamesMatchIds.semifinalB,
      placeholder: "8강 C/D 승자",
    },
    {
      id: "final",
      className: "asian-games-slot-final asian-games-bracket-node-merge",
      matchId: asianGamesMatchIds.final,
      placeholder: "4강 승자 결승",
    },
    {
      id: "bronze",
      className: "asian-games-slot-bronze asian-games-bracket-node-merge",
      matchId: asianGamesMatchIds.bronzeMedal,
      placeholder: "4강 패자 동메달전",
    },
  ];
  const medals = competition.completed
    ? {
        gold: competition.qualifiedTeamNames[0] ?? "미정",
        silver: competition.qualifiedTeamNames[1] ?? "미정",
        bronze: competition.qualifiedTeamNames[2] ?? "미정",
      }
    : null;

  return (
    <section className="competition-panel asian-games-bracket-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Bracket</p>
          <h2>Asian Games 브래킷</h2>
        </div>
        <span className="panel-note">8강 · 4강 · 동메달전 · 결승</span>
      </div>
      <div className="asian-games-bracket-frame">
        <div className="asian-games-bracket-board">
          <h3 className="asian-games-bracket-heading asian-games-heading-qf">8강</h3>
          <h3 className="asian-games-bracket-heading asian-games-heading-sf">4강</h3>
          <h3 className="asian-games-bracket-heading asian-games-heading-medal">
            결승 / 동메달전
          </h3>
          <h3 className="asian-games-bracket-heading asian-games-heading-result">
            메달
          </h3>
          {bracketSlots.map((slot) => (
            <div
              className={`asian-games-bracket-node ${slot.className} ${
                scheduleById.get(slot.matchId)?.stageName ===
                competition.currentStageName
                  ? "asian-games-bracket-node-current"
                  : ""
              }`}
              key={slot.id}
            >
              <AsianGamesBracketMatchCard
                match={scheduleById.get(slot.matchId)}
                placeholder={slot.placeholder}
                record={recordsByScheduleId.get(slot.matchId)}
              />
            </div>
          ))}
          <section className="asian-games-medal-board">
            <div className="asian-games-medal-card asian-games-medal-gold">
              <span>GOLD</span>
              <strong>{medals?.gold ?? "미정"}</strong>
            </div>
            <div className="asian-games-medal-card asian-games-medal-silver">
              <span>SILVER</span>
              <strong>{medals?.silver ?? "미정"}</strong>
            </div>
            <div className="asian-games-medal-card asian-games-medal-bronze">
              <span>BRONZE</span>
              <strong>{medals?.bronze ?? "미정"}</strong>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function AsianGamesDashboard({
  career,
  competition,
  subPage,
  onSubPageChange,
  records,
}: {
  career: CareerSave;
  competition: CompetitionState;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
  records: MatchRecord[];
}) {
  const [fallbackTab, setFallbackTab] =
    useState<AsianGamesDashboardTab>("overview");
  const activeTab = isAsianGamesDashboardTab(subPage) ? subPage : fallbackTab;
  const handleTabChange = (nextTab: AsianGamesDashboardTab) => {
    if (onSubPageChange) {
      onSubPageChange(nextTab);
      return;
    }

    setFallbackTab(nextTab);
  };

  return (
    <section className="competition-dashboard asian-games-dashboard">
      <AsianGamesSummary career={career} competition={competition} />
      <AsianGamesTabs activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === "overview" && <AsianGamesOverview career={career} />}
      {activeTab === "schedule" && (
        <AsianGamesScheduleView competition={competition} records={records} />
      )}
      {activeTab === "bracket" && (
        <AsianGamesBracketView competition={competition} records={records} />
      )}
    </section>
  );
}

const worldsPlayInGroupIds: WorldsGroupId[] = ["play-in-a", "play-in-b"];
const worldsGroupStageGroupIds: WorldsGroupId[] = [
  "group-a",
  "group-b",
  "group-c",
  "group-d",
];

function getWorldsSourceLabel(source: WorldsEntrant["source"]) {
  if (source === "msi-bonus") {
    return "MSI 추가 시드";
  }

  if (source === "lcq-placeholder") {
    return "LCQ placeholder";
  }

  return "지역 기본 시드";
}

function getWorldsStageLabel(entrant: WorldsEntrant) {
  return getWorldsEntryStage(entrant) === "direct"
    ? "Group Stage 직행"
    : "Play-In";
}

function WorldsTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: WorldsDashboardTab;
  onTabChange: (tab: WorldsDashboardTab) => void;
}) {
  const tabs: Array<{ id: WorldsDashboardTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "groups", label: "Groups" },
    { id: "bracket", label: "Bracket" },
  ];

  return (
    <div className="competition-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          className={`competition-tab ${
            activeTab === tab.id ? "competition-tab-active" : ""
          }`}
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function WorldsSummary({
  career,
  competition,
}: {
  career: CareerSave;
  competition: CompetitionState;
}) {
  const qualification = career.seasonState.worldsQualification;
  const worldsState = career.seasonState.worlds;
  const lckQualifiedSeeds =
    qualification?.lckSeeds.filter((seed) => seed.status === "qualified") ?? [];
  const bonusLabel = formatWorldsBonusLeagueLabel(qualification);
  const entrantCount =
    qualification?.totalEntrants ?? competition.qualifiedTeamIds.length;
  const statusLabel = competition.completed
    ? competition.winnerTeamName
      ? `${competition.winnerTeamName} 우승`
      : "Completed"
    : worldsState?.status === "play-in"
      ? "Play-In 진행"
      : worldsState?.status === "group-stage"
        ? "Group Stage 진행"
        : worldsState?.status === "knockout"
          ? "Knockout 진행"
          : competition.currentStageName;

  return (
    <section className="competition-summary-grid competition-summary-grid-compact">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">International</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Status</p>
        <strong>{statusLabel}</strong>
        <span>Play-In · Group Stage · Knockout</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Entrants</p>
        <strong>{entrantCount || 20} teams</strong>
        <span>12팀 직행 · 8팀 Play-In</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">MSI Bonus</p>
        <strong>{bonusLabel}</strong>
        <span>상위 2개 리그에 보너스 시드</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">LCK Seeds</p>
        <strong>
          {lckQualifiedSeeds.length
            ? lckQualifiedSeeds.map((seed) => seed.teamName).join(" / ")
            : "진출팀 대기"}
        </strong>
        <span>
          {qualification?.bonusLeagueLabels.includes("LCK")
            ? "LCK 4시드 포함"
            : "LCK 기본 3시드"}
        </span>
      </article>
    </section>
  );
}

function WorldsEntrantCard({
  entrant,
  userTeamId,
}: {
  entrant: WorldsEntrant;
  userTeamId: string;
}) {
  return (
    <article
      className={`worlds-entrant-card worlds-entrant-${entrant.source} ${
        entrant.teamId === userTeamId ? "worlds-entrant-user" : ""
      }`}
    >
      <span>{entrant.slotLabel}</span>
      <strong>{entrant.teamName}</strong>
      <small>
        {entrant.leagueLabel} · {getWorldsStageLabel(entrant)} ·{" "}
        {getWorldsSourceLabel(entrant.source)}
      </small>
    </article>
  );
}

function WorldsOverview({
  career,
  competition,
  userTeamId,
}: {
  career: CareerSave;
  competition: CompetitionState;
  userTeamId: string;
}) {
  const qualification = career.seasonState.worldsQualification;
  const entrants = qualification?.entrants ?? [];
  const { directEntrants, playInEntrants } = splitWorldsEntrants(entrants);
  const lckSeeds = qualification?.lckSeeds ?? [];

  return (
    <section className="competition-panel worlds-pool-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Worlds 참가 풀</h2>
        </div>
        <span className="panel-note">
          LCK/LPL/LCS/LEC 1-3시드 직행 · 나머지 8팀 Play-In
        </span>
      </div>
      <div className="worlds-overview-split">
        <article>
          <header>
            <strong>Group Stage 직행</strong>
            <span>{directEntrants.length}/12</span>
          </header>
          <div className="worlds-entrant-grid worlds-entrant-grid-compact">
            {directEntrants.map((entrant) => (
              <WorldsEntrantCard
                entrant={entrant}
                key={entrant.teamId}
                userTeamId={userTeamId}
              />
            ))}
          </div>
        </article>
        <article>
          <header>
            <strong>Play-In</strong>
            <span>{playInEntrants.length}/8</span>
          </header>
          <div className="worlds-entrant-grid worlds-entrant-grid-compact">
            {playInEntrants.map((entrant) => (
              <WorldsEntrantCard
                entrant={entrant}
                key={entrant.teamId}
                userTeamId={userTeamId}
              />
            ))}
          </div>
        </article>
      </div>
      <div className="worlds-lck-path-strip">
        {lckSeeds.map((seed) => (
          <span
            className={`worlds-lck-seed worlds-lck-seed-${seed.status}`}
            key={seed.seed}
          >
            <strong>{seed.seed}시드</strong>
            {seed.teamName}
          </span>
        ))}
        {lckSeeds.length === 0 && (
          <span>MSI와 LCK 후반 결과가 확정되면 LCK Worlds 경로가 표시됩니다.</span>
        )}
      </div>
      {entrants.length === 0 && (
        <div className="competition-empty-state">
          MSI와 LCK 후반 결과가 확정되면 20팀 참가 풀이 표시됩니다.
        </div>
      )}
      {competition.completed && competition.winnerTeamName && (
        <div className="worlds-champion-strip">
          <span>Worlds Champion</span>
          <strong>{competition.winnerTeamName}</strong>
        </div>
      )}
    </section>
  );
}

function WorldsScheduleView({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const groups = getCompetitionScheduleGroups(competition);

  return (
    <section className="competition-panel worlds-schedule-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>Worlds 일정 / 결과</h2>
        </div>
        <span className="panel-note">Play-In/Group BO1 · Knockout BO5</span>
      </div>
      <div className="worlds-schedule-list">
        {groups.map((group) => (
          <article className="worlds-schedule-day" key={group.dateKey}>
            <header>{getDateLabel(group.dateKey)}</header>
            {group.matches.map((match) => {
              const record = recordsByScheduleId.get(match.id);
              const isUserMatch =
                match.blueTeamId === userTeamId || match.redTeamId === userTeamId;

              return (
                <div
                  className={`worlds-schedule-row ${
                    isUserMatch ? "worlds-schedule-user" : ""
                  }`}
                  key={match.id}
                >
                  <div>
                    <strong>{getMatchTitle(match)}</strong>
                    <span>
                      {match.stageName} · {getFormatLabel(match)}
                    </span>
                  </div>
                  <span className={getScheduleStatusClass({ match, record, userTeamId })}>
                    {getScoreLabel(record)}
                  </span>
                </div>
              );
            })}
          </article>
        ))}
        {groups.length === 0 && (
          <div className="competition-empty-state">
            Worlds가 활성화되면 Play-In 일정부터 표시됩니다.
          </div>
        )}
      </div>
    </section>
  );
}

function WorldsGroupTable({
  assignments,
  competition,
  groupId,
  records,
  userTeamId,
}: {
  assignments: WorldsGroupAssignment[];
  competition: CompetitionState;
  groupId: WorldsGroupId;
  records: MatchRecord[];
  userTeamId: string;
}) {
  const standings = getWorldsGroupStandings({
    assignments,
    competition,
    groupId,
    records,
  });

  return (
    <article className="worlds-group-card">
      <header>
        <strong>{getWorldsGroupTitle(groupId)}</strong>
        <span>상위 2팀 진출</span>
      </header>
      <div className="worlds-group-table worlds-group-header">
        <span>#</span>
        <span>팀</span>
        <span>리그</span>
        <span>승</span>
        <span>패</span>
        <span>세트</span>
      </div>
      <div className="worlds-group-table-scroll">
        {standings.map((entry) => {
          const assignment = assignments.find(
            (candidate) => candidate.teamId === entry.teamId,
          );

          return (
            <div
              className={`worlds-group-table ${
                entry.teamId === userTeamId ? "worlds-group-user" : ""
              }`}
              key={`${groupId}-${entry.teamId}`}
            >
              <span>{entry.rank}</span>
              <strong>{entry.teamName}</strong>
              <span>{assignment?.leagueLabel ?? "-"}</span>
              <span>{entry.wins}</span>
              <span>{entry.losses}</span>
              <span>{getSetDiff(entry)}</span>
            </div>
          );
        })}
        {standings.length === 0 && (
          <div className="competition-empty-state">조 편성 대기</div>
        )}
      </div>
    </article>
  );
}

function WorldsGroupsView({
  career,
  competition,
  records,
  userTeamId,
}: {
  career: CareerSave;
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string;
}) {
  const worldsState = career.seasonState.worlds;
  const playInAssignments = worldsState?.playInGroups ?? [];
  const groupStageAssignments = worldsState?.groupStageGroups ?? [];

  return (
    <section className="competition-panel worlds-groups-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Groups</p>
          <h2>Worlds 조별 순위</h2>
        </div>
        <span className="panel-note">승수 · 세트 득실 · 세트 승수 · 초기 시드</span>
      </div>
      <div className="worlds-groups-section">
        <header>
          <strong>Play-In</strong>
          <span>4팀 2개 조 · 싱글 라운드 로빈</span>
        </header>
        <div className="worlds-groups-grid">
          {worldsPlayInGroupIds.map((groupId) => (
            <WorldsGroupTable
              assignments={playInAssignments}
              competition={competition}
              groupId={groupId}
              key={groupId}
              records={records}
              userTeamId={userTeamId}
            />
          ))}
        </div>
      </div>
      <div className="worlds-groups-section">
        <header>
          <strong>Group Stage</strong>
          <span>4팀 4개 조 · 더블 라운드 로빈</span>
        </header>
        <div className="worlds-groups-grid worlds-groups-grid-four">
          {worldsGroupStageGroupIds.map((groupId) => (
            <WorldsGroupTable
              assignments={groupStageAssignments}
              competition={competition}
              groupId={groupId}
              key={groupId}
              records={records}
              userTeamId={userTeamId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function getWorldsTeamClass({
  teamId,
  record,
  userTeamId,
}: {
  teamId: string;
  record?: MatchRecord;
  userTeamId: string;
}) {
  return [
    "worlds-bracket-team",
    teamId === userTeamId ? "worlds-bracket-team-user" : "",
    record?.winnerTeamId === teamId ? "worlds-bracket-team-winner" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function WorldsBracketMatchCard({
  match,
  placeholder,
  record,
  userTeamId,
}: {
  match?: MatchSchedule;
  placeholder: string;
  record?: MatchRecord;
  userTeamId: string;
}) {
  if (!match) {
    return (
      <article className="worlds-bracket-match worlds-bracket-placeholder">
        <strong>{placeholder}</strong>
        <span>진출팀 대기</span>
      </article>
    );
  }

  return (
    <article className="worlds-bracket-match">
      <header>
        <strong>{match.stageName}</strong>
        <span>
          {getDateLabel(match.scheduledDate)} · {getFormatLabel(match)}
        </span>
      </header>
      <div className="worlds-bracket-slots">
        <span className={getWorldsTeamClass({ teamId: match.blueTeamId, record, userTeamId })}>
          {match.blueTeamName}
        </span>
        <span className={getWorldsTeamClass({ teamId: match.redTeamId, record, userTeamId })}>
          {match.redTeamName}
        </span>
      </div>
      <small>{getScoreLabel(record)}</small>
    </article>
  );
}

function WorldsBracketView({
  career,
  competition,
  records,
  userTeamId,
}: {
  career: CareerSave;
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const scheduleById = new Map(competition.schedule.map((match) => [match.id, match]));
  const worldsState = career.seasonState.worlds;
  const quarterfinals = [
    {
      id: worldsMatchIds.quarterfinalA1VsB2,
      label: "A1 vs B2",
    },
    {
      id: worldsMatchIds.quarterfinalB1VsA2,
      label: "B1 vs A2",
    },
    {
      id: worldsMatchIds.quarterfinalC1VsD2,
      label: "C1 vs D2",
    },
    {
      id: worldsMatchIds.quarterfinalD1VsC2,
      label: "D1 vs C2",
    },
  ];
  const semifinals = [
    {
      id: worldsMatchIds.semifinalTop,
      label: "QF 1/2 승자",
    },
    {
      id: worldsMatchIds.semifinalBottom,
      label: "QF 3/4 승자",
    },
  ];

  return (
    <section className="competition-panel worlds-bracket-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Bracket</p>
          <h2>Worlds Knockout</h2>
        </div>
        <span className="panel-note">8강 · 4강 · 결승 전 경기 BO5</span>
      </div>
      <div className="worlds-bracket-frame">
        <div className="worlds-bracket-round">
          <h3>{worldsStageNames.quarterfinals}</h3>
          <div className="worlds-bracket-stack">
            {quarterfinals.map((item) => (
              <WorldsBracketMatchCard
                key={item.id}
                match={scheduleById.get(item.id)}
                placeholder={item.label}
                record={recordsByScheduleId.get(item.id)}
                userTeamId={userTeamId}
              />
            ))}
          </div>
        </div>
        <div className="worlds-bracket-round">
          <h3>{worldsStageNames.semifinals}</h3>
          <div className="worlds-bracket-stack worlds-bracket-stack-centered">
            {semifinals.map((item) => (
              <WorldsBracketMatchCard
                key={item.id}
                match={scheduleById.get(item.id)}
                placeholder={item.label}
                record={recordsByScheduleId.get(item.id)}
                userTeamId={userTeamId}
              />
            ))}
          </div>
        </div>
        <div className="worlds-bracket-round">
          <h3>{worldsStageNames.final}</h3>
          <div className="worlds-bracket-stack worlds-bracket-stack-final">
            <WorldsBracketMatchCard
              match={scheduleById.get(worldsMatchIds.final)}
              placeholder="Semifinal 승자"
              record={recordsByScheduleId.get(worldsMatchIds.final)}
              userTeamId={userTeamId}
            />
          </div>
        </div>
        <article className="worlds-champion-card">
          <span>Worlds Champion</span>
          <strong>
            {worldsState?.championTeamName ??
              competition.winnerTeamName ??
              "우승팀 미정"}
          </strong>
          <small>
            Runner-up:{" "}
            {worldsState?.runnerUpTeamName ??
              (competition.completed ? "기록 없음" : "미정")}
          </small>
        </article>
      </div>
    </section>
  );
}

function getWorldsUserTeamId(career: CareerSave, competition: CompetitionState) {
  return (
    getUserTeamId(competition) ??
    career.seasonState.worldsQualification?.entrants.find(
      (entrant) => entrant.teamName === career.userTeam.name,
    )?.teamId ??
    ""
  );
}

function WorldsDashboard({
  career,
  competition,
  subPage,
  onSubPageChange,
  records,
}: {
  career: CareerSave;
  competition: CompetitionState;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
  records: MatchRecord[];
}) {
  const [fallbackTab, setFallbackTab] = useState<WorldsDashboardTab>("overview");
  const activeTab = isWorldsDashboardTab(subPage) ? subPage : fallbackTab;
  const userTeamId = getWorldsUserTeamId(career, competition);
  const handleTabChange = (nextTab: WorldsDashboardTab) => {
    if (onSubPageChange) {
      onSubPageChange(nextTab);
      return;
    }

    setFallbackTab(nextTab);
  };

  return (
    <section className="competition-dashboard worlds-dashboard">
      <WorldsSummary career={career} competition={competition} />
      <WorldsTabs activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === "overview" && (
        <WorldsOverview
          career={career}
          competition={competition}
          userTeamId={userTeamId}
        />
      )}
      {activeTab === "schedule" && (
        <WorldsScheduleView
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      )}
      {activeTab === "groups" && (
        <WorldsGroupsView
          career={career}
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      )}
      {activeTab === "bracket" && (
        <WorldsBracketView
          career={career}
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      )}
    </section>
  );
}

export function CompetitionDashboard({
  career,
  competitionId,
  subPage,
  onSubPageChange,
}: CompetitionDashboardProps) {
  const competition = getCurrentCompetition(career, competitionId);

  if (!competition) {
    return (
      <section className="competition-dashboard">
        <section className="competition-panel">
          <p className="eyebrow">Competition</p>
          <h1>진행 중인 대회 없음</h1>
          <p className="muted">스토브리그가 끝나면 LCK Cup 현황이 표시됩니다.</p>
        </section>
      </section>
    );
  }

  const records = career.seasonState.matchRecords;
  const userTeamId = getUserTeamId(competition);
  const table = getSortedTable(competition, records);

  if (isLckRoundsDashboardCompetition(competition)) {
    return (
      <LckRoundsDashboard
        career={career}
        competition={competition}
        subPage={subPage}
        onSubPageChange={onSubPageChange}
        records={records}
        table={table}
        userTeamId={userTeamId}
      />
    );
  }

  if (competition.competitionId === "first-stand") {
    return (
      <FirstStandDashboard
        career={career}
        competition={competition}
        subPage={subPage}
        onSubPageChange={onSubPageChange}
        records={records}
      />
    );
  }

  if (competition.competitionId === "msi") {
    return (
      <MsiDashboard
        career={career}
        competition={competition}
        subPage={subPage}
        onSubPageChange={onSubPageChange}
        records={records}
      />
    );
  }

  if (competition.competitionId === "asian-games") {
    return (
      <AsianGamesDashboard
        career={career}
        competition={competition}
        subPage={subPage}
        onSubPageChange={onSubPageChange}
        records={records}
      />
    );
  }

  if (competition.competitionId === "worlds") {
    return (
      <WorldsDashboard
        career={career}
        competition={competition}
        subPage={subPage}
        onSubPageChange={onSubPageChange}
        records={records}
      />
    );
  }

  return (
    <section className="competition-dashboard">
      <CompetitionSummary
        career={career}
        competition={competition}
        userTeamId={userTeamId}
      />
      <div className="competition-overview-grid">
        <StandingsTable table={table} userTeamId={userTeamId} />
        <GroupStatusPanel
          competition={competition}
          records={records}
          table={table}
        />
      </div>
      <SchedulePanel
        competition={competition}
        records={records}
        userTeamId={userTeamId}
      />
      <BracketPanel
        competition={competition}
        records={records}
        userTeamId={userTeamId}
      />
    </section>
  );
}
