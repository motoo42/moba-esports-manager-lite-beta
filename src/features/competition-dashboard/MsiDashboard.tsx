import { useState } from "react";
import type { CompetitionSubPage } from "../../app/routes";
import {
  getMsiLeagueForTeam,
  msiMatchIds,
  msiStageNames,
} from "../../domain/season";
import type {
  CareerSave,
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  StandingEntry,
  WorldsQualificationState,
} from "../../types/game";
import {
  formatWorldsBonusLeagueLabel,
  getDateLabel,
  getFormatLabel,
  getMatchTitle,
  getRecordByScheduleId,
  getScheduleStatusClass,
  getScoreLabel,
  getUserTeamId,
  groupMatchesByDate,
} from "./competitionDashboardShared";
import {
  CompetitionBracket,
  type CompetitionBracketColumn,
  type CompetitionBracketMatch,
  type CompetitionBracketSlot,
} from "./competitionBracket";

type MsiDashboardTab = "overview" | "schedule" | "bracket";
function isMsiDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is MsiDashboardTab {
  return value === "overview" || value === "schedule" || value === "bracket";
}
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
    title: "준결승",
    stageName: msiStageNames.playInSemifinals,
    matchIds: [msiMatchIds.playInSemifinal1, msiMatchIds.playInSemifinal2],
    placeholders: [
      ["플레이-인 1시드", "플레이-인 4시드"],
      ["플레이-인 2시드", "플레이-인 3시드"],
    ],
  },
  {
    id: "play-in-final",
    title: "결승",
    stageName: msiStageNames.playInFinal,
    matchIds: [msiMatchIds.playInFinal],
    placeholders: [["준결승 1 승자", "준결승 2 승자"]],
  },
];

const msiUpperRounds: MsiBracketRound[] = [
  {
    id: "upper-round-1",
    title: "승자조 1라운드",
    stageName: msiStageNames.upperRound1,
    matchIds: [
      msiMatchIds.upperRound1A,
      msiMatchIds.upperRound1B,
      msiMatchIds.upperRound1C,
      msiMatchIds.upperRound1D,
    ],
    placeholders: [
      ["토너먼트 시드", "토너먼트 시드"],
      ["토너먼트 시드", "토너먼트 시드"],
      ["토너먼트 시드", "토너먼트 시드"],
      ["토너먼트 시드", "플레이-인 승자"],
    ],
  },
  {
    id: "upper-round-2",
    title: "승자조 2라운드",
    stageName: msiStageNames.upperRound2,
    matchIds: [msiMatchIds.upperRound2A, msiMatchIds.upperRound2B],
    placeholders: [
      ["승자조 R1 A 승자", "승자조 R1 B 승자"],
      ["승자조 R1 C 승자", "승자조 R1 D 승자"],
    ],
  },
  {
    id: "upper-final",
    title: "승자조 결승",
    stageName: msiStageNames.upperFinal,
    matchIds: [msiMatchIds.upperFinal],
    placeholders: [["승자조 R2 A 승자", "승자조 R2 B 승자"]],
  },
];

const msiLowerRounds: MsiBracketRound[] = [
  {
    id: "lower-round-1",
    title: "패자조 1라운드",
    stageName: msiStageNames.lowerRound1,
    matchIds: [msiMatchIds.lowerRound1A, msiMatchIds.lowerRound1B],
    placeholders: [
      ["승자조 R1 A/C 패자", "승자조 R1 A/C 패자"],
      ["승자조 R1 B/D 패자", "승자조 R1 B/D 패자"],
    ],
  },
  {
    id: "lower-round-2",
    title: "패자조 2라운드",
    stageName: msiStageNames.lowerRound2,
    matchIds: [msiMatchIds.lowerRound2A, msiMatchIds.lowerRound2B],
    placeholders: [
      ["승자조 R2 A 패자", "패자조 R1 승자"],
      ["승자조 R2 B 패자", "패자조 R1 승자"],
    ],
  },
  {
    id: "lower-round-3",
    title: "패자조 3라운드",
    stageName: msiStageNames.lowerRound3,
    matchIds: [msiMatchIds.lowerRound3],
    placeholders: [["패자조 R2 A 승자", "패자조 R2 B 승자"]],
  },
  {
    id: "lower-final",
    title: "패자조 결승",
    stageName: msiStageNames.lowerFinal,
    matchIds: [msiMatchIds.lowerFinal],
    placeholders: [["승자조 결승 패자", "패자조 R3 승자"]],
  },
];

const msiGrandFinalRound: MsiBracketRound = {
  id: "grand-finals",
  title: "최종 결승",
  stageName: msiStageNames.grandFinal,
  matchIds: [msiMatchIds.grandFinal],
  placeholders: [["승자조 결승 승자", "패자조 결승 승자"]],
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

function getMsiEntryStageLabel(stage: MsiEntrantView["entryStage"]) {
  return stage === "Bracket Stage" ? "토너먼트 직행" : "플레이-인";
}

function getMsiStageLabel(stageName: string) {
  const labels: Record<string, string> = {
    [msiStageNames.playInSemifinals]: "플레이-인 준결승",
    [msiStageNames.playInFinal]: "플레이-인 결승",
    [msiStageNames.upperRound1]: "승자조 1라운드",
    [msiStageNames.upperRound2]: "승자조 2라운드",
    [msiStageNames.upperFinal]: "승자조 결승",
    [msiStageNames.lowerRound1]: "패자조 1라운드",
    [msiStageNames.lowerRound2]: "패자조 2라운드",
    [msiStageNames.lowerRound3]: "패자조 3라운드",
    [msiStageNames.lowerFinal]: "패자조 결승",
    [msiStageNames.grandFinal]: "최종 결승",
  };

  return labels[stageName] ?? stageName;
}

function getMsiMatchStatusLabel(
  match: MatchSchedule | undefined,
  record: MatchRecord | undefined,
  expectedFormatLabel: string,
) {
  if (!match) {
    return `${expectedFormatLabel} · 대기`;
  }

  if (!record) {
    return `${getFormatLabel(match)} · 예정`;
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
    { id: "overview", label: "개요" },
    { id: "schedule", label: "일정" },
    { id: "bracket", label: "토너먼트" },
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
    ? competition.winnerTeamName ?? "우승팀 미정"
    : competition.currentStageName;
  const worldsQualification = career.seasonState.worldsQualification;

  return (
    <section className="competition-summary-grid competition-summary-grid-compact msi-summary-grid">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">국제대회</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">단계</p>
        <strong>{championLabel}</strong>
        <span>{competition.completed ? "토너먼트 완료" : "MSI 진행 중"}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">참가팀</p>
        <strong>{entrants.length}팀</strong>
        <span>
          직행 {directEntrants.length}팀 · 플레이-인 {playInEntrants.length}팀
        </span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">LCK 시드</p>
        <strong>{lckEntrants.map((entrant) => entrant.teamName).join(" / ")}</strong>
        <span>
          {competition.qualifiedTeamNames[1]
            ? `준우승: ${competition.qualifiedTeamNames[1]}`
            : "LCK 1-2라운드 결승 진출팀"}
        </span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">Worlds 보너스</p>
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
        {entrant.leagueLabel} · {getMsiEntryStageLabel(entrant.entryStage)}
      </small>
      <em>초기 시드 #{entrant.initialSeed}</em>
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
          <p className="eyebrow">개요</p>
          <h2>MSI 참가팀과 토너먼트 진출</h2>
        </div>
        <span className="panel-note">1시드 6팀과 First Stand 보너스 2시드 직행</span>
      </div>
      <div className="msi-overview-split">
        <article>
          <header>
            <strong>토너먼트 직행</strong>
            <span>{directEntrants.length}팀</span>
          </header>
          <div className="msi-entrant-grid">
            {directEntrants.map((entrant) => (
              <MsiEntrantCard entrant={entrant} key={entrant.teamId} />
            ))}
          </div>
        </article>
        <article>
          <header>
            <strong>플레이-인</strong>
            <span>{playInEntrants.length}팀</span>
          </header>
          <div className="msi-entrant-grid msi-entrant-grid-compact">
            {playInEntrants.map((entrant) => (
              <MsiEntrantCard entrant={entrant} key={entrant.teamId} />
            ))}
          </div>
        </article>
      </div>
      <div className="first-stand-format-strip msi-format-strip">
        <span>플레이-인 · 4팀 · BO3/BO5</span>
        <span>승자조/패자조 토너먼트 · 8팀</span>
        <span>승자조 결승 / 패자조 결승 / 최종 결승 · BO5</span>
      </div>
      <p className="competition-overview-copy">
        MSI는 각 지역 상위권 팀이 모여 Worlds 전 국제 서열과 보너스 시드를
        결정하는 대회입니다. 최종 리그 성적 상위 2개 지역은 Worlds 추가 시드를
        획득합니다.
      </p>
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
          <p className="eyebrow">일정</p>
          <h2>MSI 일정 / 결과</h2>
        </div>
        <span className="panel-note">BO5 경기와 우리 팀 경기 강조</span>
      </div>
      <div className="msi-schedule-scroll">
        {groupedSchedule.map(({ dateKey, matches }) => (
          <article className="first-stand-schedule-day" key={dateKey}>
            <header>
              <strong>{getDateLabel(dateKey)}</strong>
              <span>{matches.length}시리즈</span>
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
                        {getMsiStageLabel(match.stageName)} · {getFormatLabel(match)}
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

function createMsiBracketSlot({
  label,
  match,
  record,
  side,
}: {
  label: string;
  match: MatchSchedule | undefined;
  record: MatchRecord | undefined;
  side: "blue" | "red";
}): CompetitionBracketSlot {
  if (!match) {
    return {
      detail: "이전 경기 결과 대기",
      isPlaceholder: true,
      label,
      teamName: "대기 중",
    };
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
  const isWinner = record?.winnerTeamId === teamId;

  return {
    detail: record
      ? `${teamScore}-${opponentScore}${isWinner ? " 승리" : " 패배"}`
      : `${getMsiLeagueForTeam(teamId)} · ${getFormatLabel(match)}`,
    isWinner,
    label,
    teamId,
    teamName,
  };
}

function createMsiBracketMatch({
  competition,
  flowHint,
  matchId,
  placeholderLabels,
  recordsByScheduleId,
  title,
}: {
  competition: CompetitionState;
  flowHint: string;
  matchId: string;
  placeholderLabels: [string, string];
  recordsByScheduleId: Map<string, MatchRecord>;
  title: string;
}): CompetitionBracketMatch {
  const match = getMsiBracketMatch(competition, matchId);
  const record = match ? recordsByScheduleId.get(match.id) : undefined;
  const expectedFormatLabel = getMsiExpectedFormatLabel(matchId);
  const isCurrent = match ? isMsiStageCurrent(match.stageName, competition) : false;

  return {
    flowHint,
    id: matchId,
    isCurrent,
    meta: expectedFormatLabel,
    slots: [
      createMsiBracketSlot({
        label: placeholderLabels[0],
        match,
        record,
        side: "blue",
      }),
      createMsiBracketSlot({
        label: placeholderLabels[1],
        match,
        record,
        side: "red",
      }),
    ],
    subtitle: match
      ? `${getMsiStageLabel(match.stageName)} · ${getMsiMatchStatusLabel(
          match,
          record,
          expectedFormatLabel,
        )}`
      : `${expectedFormatLabel} · 대기`,
    title,
  };
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
  const championName = competition.winnerTeamName ?? "우승팀 미정";
  const runnerUpName = competition.qualifiedTeamNames[1] ?? "준우승팀 미정";
  const flowHints: Record<string, string> = {
    "grand-finals": "최종 결승 승자가 MSI 우승팀으로 기록됩니다.",
    "lower-final": "승자는 최종 결승으로, 패자는 MSI 3위권으로 정리됩니다.",
    "lower-round-1": "승자는 패자조 2라운드로, 패자는 탈락합니다.",
    "lower-round-2": "승자는 패자조 3라운드로, 패자는 탈락합니다.",
    "lower-round-3": "승자는 패자조 결승으로, 패자는 탈락합니다.",
    "play-in-final": "승자는 토너먼트 본선 마지막 시드로 합류합니다.",
    "play-in-semifinals": "승자는 플레이-인 결승으로 진출합니다.",
    "upper-final": "승자는 최종 결승으로, 패자는 패자조 결승으로 내려갑니다.",
    "upper-round-1": "승자는 승자조 2라운드로, 패자는 패자조 1라운드로 내려갑니다.",
    "upper-round-2": "승자는 승자조 결승으로, 패자는 패자조 2라운드로 내려갑니다.",
  };
  const bracketRounds = [
    ...msiPlayInRounds,
    ...msiUpperRounds,
    ...msiLowerRounds,
    msiGrandFinalRound,
  ];
  const bracketColumns: CompetitionBracketColumn[] = bracketRounds.map((round) => ({
    align: round.matchIds.length === 1 ? "center" : "spread",
    id: round.id,
    matches: round.matchIds.map((matchId, index) =>
      createMsiBracketMatch({
        competition,
        flowHint: flowHints[round.id],
        matchId,
        placeholderLabels: round.placeholders[index] ?? ["대기 중", "대기 중"],
        recordsByScheduleId,
        title: `${round.title} ${round.matchIds.length > 1 ? index + 1 : ""}`.trim(),
      }),
    ),
    title: round.title,
  }));
  const resultCards = [
    {
      detail: competition.completed
        ? `준우승: ${runnerUpName}`
        : "최종 결승 결과 대기",
      id: "msi-champion",
      label: competition.completed ? "우승팀" : "대기 중",
      title: "우승",
      tone: "gold" as const,
      value: championName,
    },
  ];

  return (
    <section className="competition-panel msi-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">토너먼트</p>
          <h2>MSI 토너먼트</h2>
        </div>
        <span className="panel-note">플레이-인 승자가 승자조/패자조 토너먼트에 합류합니다</span>
      </div>
      <div className="competition-bracket-flow-legend">
        <span>플레이-인</span>
        <span>승자조</span>
        <span>패자조</span>
        <span>결승</span>
      </div>
      <CompetitionBracket
        boardClassName="msi-flow-board"
        columns={bracketColumns}
        minWidth="1420px"
        resultCards={resultCards}
        resultTitle="우승"
        userTeamId={userTeamId}
      />
    </section>
  );
}

export function MsiDashboard({
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
