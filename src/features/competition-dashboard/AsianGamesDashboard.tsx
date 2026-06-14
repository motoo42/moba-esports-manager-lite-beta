import { useState } from "react";
import type { CompetitionSubPage } from "../../app/routes";
import { EvaluationStars } from "../../shared/ui/EvaluationStars";
import {
  asianGamesCountryProfiles,
  asianGamesKoreaTeamId,
  asianGamesMatchIds,
  asianGamesStageNames,
  getAsianGamesModeLabel,
  getAsianGamesRoleSelectionLabel,
  getAsianGamesTimelineLabel,
} from "../../domain/season";
import type { CareerSave, CompetitionState, MatchRecord, MatchSchedule } from "../../types/game";
import {
  getCompetitionScheduleGroups,
  getDateLabel,
  getFormatLabel,
  getMatchTitle,
  getRecordByScheduleId,
  getScoreLabel,
  getSelectionStarsFromForm,
} from "./competitionDashboardShared";
import {
  CompetitionBracket,
  type CompetitionBracketColumn,
  type CompetitionBracketMatch,
  type CompetitionBracketSlot,
} from "./competitionBracket";

type AsianGamesDashboardTab = "overview" | "schedule" | "bracket";
function isAsianGamesDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is AsianGamesDashboardTab {
  return value === "overview" || value === "schedule" || value === "bracket";
}

function getAsianGamesRosterRoleLabel(role: string) {
  if (role === "jungle") {
    return "JGL";
  }

  return role.toUpperCase();
}

function getAsianGamesStageLabel(stageName: string) {
  const labels: Record<string, string> = {
    [asianGamesStageNames.quarterfinals]: "8강",
    [asianGamesStageNames.semifinals]: "4강",
    [asianGamesStageNames.bronzeMedal]: "동메달전",
    [asianGamesStageNames.final]: "결승",
  };

  return labels[stageName] ?? stageName;
}

function AsianGamesTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: AsianGamesDashboardTab;
  onTabChange: (tab: AsianGamesDashboardTab) => void;
}) {
  const tabs: Array<{ id: AsianGamesDashboardTab; label: string }> = [
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
        <p className="eyebrow">국가대표</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">진행 방식</p>
        <strong>{getAsianGamesModeLabel(asianGamesState?.playMode ?? "undecided")}</strong>
        <span>선택은 대회 전체에 적용</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">메달</p>
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
            <p className="eyebrow">참가국</p>
            <h2>참가국</h2>
          </div>
          <span className="panel-note">8개 국가 싱글 엘리미네이션</span>
        </div>
        <p className="competition-overview-copy">
          Asian Games는 2026 시즌에만 삽입되는 국가대표 이벤트입니다. 대한민국은
          LCK 선수 풀에서 선발한 6인 로스터로 참가하며, 진행 방식 선택에 따라
          직접 플레이하거나 자동 진행할 수 있습니다.
        </p>
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
            <p className="eyebrow">대한민국</p>
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
                {getAsianGamesRoleSelectionLabel(member)} · 선발 당시 평가
              </small>
              <EvaluationStars compact value={getSelectionStarsFromForm(member.formAtSelection)} />
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
          <p className="eyebrow">일정</p>
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
                      {getAsianGamesStageLabel(match.stageName)} ·{" "}
                      {getFormatLabel(match)}
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

function createAsianGamesBracketSlot({
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
      detail: "진출팀 대기",
      isPlaceholder: true,
      label,
      teamName: label,
    };
  }

  const teamId = side === "blue" ? match.blueTeamId : match.redTeamId;
  const teamName = side === "blue" ? match.blueTeamName : match.redTeamName;

  return {
    detail: record ? getScoreLabel(record) : `${getDateLabel(match.scheduledDate)} · ${getFormatLabel(match)}`,
    isWinner: record?.winnerTeamId === teamId,
    label,
    teamId,
    teamName,
  };
}

function createAsianGamesBracketMatch({
  currentStageName,
  flowHint,
  match,
  placeholder,
  record,
  title,
}: {
  currentStageName: string;
  flowHint: string;
  match: MatchSchedule | undefined;
  placeholder: string;
  record: MatchRecord | undefined;
  title: string;
}): CompetitionBracketMatch {
  return {
    flowHint,
    id: match?.id ?? placeholder,
    isCurrent: match?.stageName === currentStageName && match.status === "scheduled",
    meta: match ? getFormatLabel(match) : "대기",
    slots: match
      ? [
          createAsianGamesBracketSlot({
            label: "블루",
            match,
            record,
            side: "blue",
          }),
          createAsianGamesBracketSlot({
            label: "레드",
            match,
            record,
            side: "red",
          }),
        ]
      : [
          {
            detail: "진출팀 대기",
            isPlaceholder: true,
            label: "대진",
            teamName: placeholder,
          },
        ],
    subtitle: match
      ? `${getDateLabel(match.scheduledDate)} · ${getScoreLabel(record)}`
      : placeholder,
    title,
  };
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
  const medals = competition.completed
    ? {
        gold: competition.qualifiedTeamNames[0] ?? "미정",
        silver: competition.qualifiedTeamNames[1] ?? "미정",
        bronze: competition.qualifiedTeamNames[2] ?? "미정",
      }
    : null;
  const bracketColumns: CompetitionBracketColumn[] = [
    {
      align: "spread",
      id: "quarterfinals",
      matches: [
        {
          matchId: asianGamesMatchIds.quarterfinalA,
          placeholder: "대한민국 vs 마카오",
          title: "8강 A",
        },
        {
          matchId: asianGamesMatchIds.quarterfinalB,
          placeholder: "일본 vs 홍콩",
          title: "8강 B",
        },
        {
          matchId: asianGamesMatchIds.quarterfinalC,
          placeholder: "중국 vs 인도",
          title: "8강 C",
        },
        {
          matchId: asianGamesMatchIds.quarterfinalD,
          placeholder: "대만 vs 베트남",
          title: "8강 D",
        },
      ].map((item) => {
        const match = scheduleById.get(item.matchId);

        return createAsianGamesBracketMatch({
          currentStageName: competition.currentStageName,
          flowHint: "승자는 4강으로 진출합니다.",
          match,
          placeholder: item.placeholder,
          record: recordsByScheduleId.get(item.matchId),
          title: item.title,
        });
      }),
      title: "8강",
    },
    {
      align: "spread",
      id: "semifinals",
      matches: [
        {
          matchId: asianGamesMatchIds.semifinalA,
          placeholder: "8강 A/B 승자",
          title: "4강 A",
        },
        {
          matchId: asianGamesMatchIds.semifinalB,
          placeholder: "8강 C/D 승자",
          title: "4강 B",
        },
      ].map((item) => {
        const match = scheduleById.get(item.matchId);

        return createAsianGamesBracketMatch({
          currentStageName: competition.currentStageName,
          flowHint: "승자는 결승, 패자는 동메달전으로 이동합니다.",
          match,
          placeholder: item.placeholder,
          record: recordsByScheduleId.get(item.matchId),
          title: item.title,
        });
      }),
      title: "4강",
    },
    {
      align: "center",
      id: "medal-matches",
      matches: [
        {
          matchId: asianGamesMatchIds.final,
          placeholder: "4강 승자 결승",
          title: "결승",
        },
        {
          matchId: asianGamesMatchIds.bronzeMedal,
          placeholder: "4강 패자 동메달전",
          title: "동메달전",
        },
      ].map((item) => {
        const match = scheduleById.get(item.matchId);

        return createAsianGamesBracketMatch({
          currentStageName: competition.currentStageName,
          flowHint: "결과는 메달 보드에 반영됩니다.",
          match,
          placeholder: item.placeholder,
          record: recordsByScheduleId.get(item.matchId),
          title: item.title,
        });
      }),
      title: "결승 / 동메달전",
    },
  ];
  const resultCards = [
    {
      id: "gold",
      label: "금메달",
      title: "금메달",
      tone: "gold" as const,
      value: medals?.gold ?? "미정",
    },
    {
      id: "silver",
      label: "은메달",
      title: "은메달",
      tone: "silver" as const,
      value: medals?.silver ?? "미정",
    },
    {
      id: "bronze",
      label: "동메달",
      title: "동메달",
      tone: "bronze" as const,
      value: medals?.bronze ?? "미정",
    },
  ];

  return (
    <section className="competition-panel asian-games-bracket-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">토너먼트</p>
          <h2>Asian Games 토너먼트</h2>
        </div>
        <span className="panel-note">8강 · 4강 · 동메달전 · 결승</span>
      </div>
      <CompetitionBracket
        boardClassName="asian-games-flow-board"
        columns={bracketColumns}
        minWidth="780px"
        resultCards={resultCards}
        resultTitle="메달"
        userTeamId={asianGamesKoreaTeamId}
      />
    </section>
  );
}

export function AsianGamesDashboard({
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
