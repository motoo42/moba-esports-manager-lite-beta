import {
  getLckRounds34FinalPlacements,
  getLckRounds34PostseasonSeeds,
  getLckRounds35FinalPlacements,
  getLckRounds35PostseasonSeeds,
  isLckRounds34PostseasonStageName,
  isLckRounds35PostseasonStageName,
  lckRounds34PostseasonMatchIds,
  lckRounds35PostseasonMatchIds,
} from "../../domain/season";
import type {
  CompetitionState,
  MatchRecord,
  StandingEntry,
  WorldsQualificationState,
} from "../../types/game";
import {
  compareStandingEntries,
  getLckRoundsFormatTitle,
  getRecordByScheduleId,
  isLckRounds35Competition,
} from "./competitionDashboardShared";
import { CompetitionBracket, type CompetitionBracketColumn } from "./competitionBracket";
import {
  createSlotFromMatchSide,
  createWinnerSlot,
  getPlayoffMatch,
  toCompetitionBracketMatch,
  type LckPlayoffMatch,
  type LckPlayoffSlot,
} from "./lckDashboardShared";

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
      title: "플레이오프 R2",
      matches: [
        {
          id: "lck-r34-path-r2",
          stageName: "Playoffs Round 2",
          title: "2라운드 직행",
          subtitle: "Legend 1-2위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Legend 그룹 1위",
              entry: legendStandings[0],
              label: "Legend 1위",
            }),
            createLckRounds34PathSlot({
              detail: "Legend 그룹 2위",
              entry: legendStandings[1],
              label: "Legend 2위",
            }),
          ],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-1",
      title: "플레이오프 R1",
      matches: [
        {
          id: "lck-r34-path-r1",
          stageName: "Playoffs Round 1",
          title: "1라운드 직행",
          subtitle: "Legend 3-4위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Legend 그룹 3위",
              entry: legendStandings[2],
              label: "Legend 3위",
            }),
            createLckRounds34PathSlot({
              detail: "Legend 그룹 4위",
              entry: legendStandings[3],
              label: "Legend 4위",
            }),
          ],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "season-play-in",
      title: "시즌 플레이-인",
      matches: [
        {
          id: "lck-r34-path-play-in",
          stageName: "Season Play-In",
          title: "플레이-인 후보",
          subtitle: "Legend 5위 + Rise 1-3위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Legend 그룹 5위",
              entry: legendStandings[4],
              label: "Legend 5위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise 그룹 1위",
              entry: riseStandings[0],
              label: "Rise 1위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise 그룹 2위",
              entry: riseStandings[1],
              label: "Rise 2위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise 그룹 3위",
              entry: riseStandings[2],
              label: "Rise 3위",
            }),
          ],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "season-locked",
      title: "최종 순위",
      matches: [
        {
          id: "lck-r34-path-out",
          stageName: "Season Final Rank",
          title: "9-10위 확정",
          subtitle: "Rise 4-5위",
          slots: [
            createLckRounds34PathSlot({
              detail: "Rise 그룹 4위",
              entry: riseStandings[3],
              label: "Rise 4위",
            }),
            createLckRounds34PathSlot({
              detail: "Rise 그룹 5위",
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
    stageName: match?.stageName ?? "대기 중",
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
      title: "시즌 플레이-인",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[4], seedSlots[5]],
          recordsByScheduleId,
          scheduleId: matchIds.playInFirstQualifier,
          slotLabels: ["Legend 5위", "Rise 1위"],
          subtitle: "BO5 · 승자는 플레이오프 진출",
          title: "진출전 1",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[6], seedSlots[7]],
          recordsByScheduleId,
          scheduleId: matchIds.playInElimination,
          slotLabels: ["Rise 2위", "Rise 3위"],
          subtitle: "BO5 · 승자는 최종 진출전",
          title: "탈락전",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("진출전 1 패자"),
            createWinnerSlot("탈락전 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.playInSecondQualifier,
          slotLabels: ["진출전 1 패자", "탈락전 승자"],
          subtitle: "BO5 · 승자는 플레이오프 마지막 자리",
          title: "진출전 2",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-1",
      title: "플레이오프 R1",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[2], createWinnerSlot("플레이-인 2번")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound1Legend3VsPlayIn2,
          slotLabels: ["Legend 3위", "플레이-인 2번"],
          subtitle: "BO5 · 패자는 하위조",
          title: "1라운드 A",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[3], createWinnerSlot("플레이-인 1번")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound1Legend4VsPlayIn1,
          slotLabels: ["Legend 4위", "플레이-인 1번"],
          subtitle: "BO5 · 패자는 하위조",
          title: "1라운드 B",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-2",
      title: "플레이오프 R2",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[0], createWinnerSlot("1라운드 B 승자")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound2Legend1VsRound1B,
          slotLabels: ["Legend 1위", "1라운드 B 승자"],
          subtitle: "BO5 · 승자는 플레이오프 R3",
          title: "2라운드 A",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [seedSlots[1], createWinnerSlot("1라운드 A 승자")],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound2Legend2VsRound1A,
          slotLabels: ["Legend 2위", "1라운드 A 승자"],
          subtitle: "BO5 · 승자는 플레이오프 R3",
          title: "2라운드 B",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "lower-round-1",
      title: "패자조 R1",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("2라운드 A 패자"),
            createWinnerSlot("1라운드 A 패자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerRound1A,
          slotLabels: ["2라운드 A 패자", "1라운드 A 패자"],
          subtitle: "BO5 · 패자는 탈락",
          title: "패자조 A",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("2라운드 B 패자"),
            createWinnerSlot("1라운드 B 패자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerRound1B,
          slotLabels: ["2라운드 B 패자", "1라운드 B 패자"],
          subtitle: "BO5 · 패자는 탈락",
          title: "패자조 B",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "playoffs-round-3",
      title: "플레이오프 R3",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("2라운드 A 승자"),
            createWinnerSlot("2라운드 B 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.playoffsRound3,
          slotLabels: ["2라운드 A 승자", "2라운드 B 승자"],
          subtitle: "BO5 · 승자는 최종 결승",
          title: "승자조 결승",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "lower-round-2",
      title: "패자조 R2",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("패자조 A 승자"),
            createWinnerSlot("패자조 B 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerRound2,
          slotLabels: ["패자조 A 승자", "패자조 B 승자"],
          subtitle: "BO5 · 패자는 최종 4위",
          title: "패자조 준결승",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "finals",
      title: "결승",
      matches: [
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("승자조 결승 패자"),
            createWinnerSlot("패자조 준결승 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.lowerFinal,
          slotLabels: ["승자조 결승 패자", "패자조 준결승 승자"],
          subtitle: "BO5 · 패자는 최종 3위",
          title: "패자조 결승",
        }),
        createLckRounds34MatchCard({
          competition,
          fallbackSlots: [
            createWinnerSlot("승자조 결승 승자"),
            createWinnerSlot("패자조 결승 승자"),
          ],
          recordsByScheduleId,
          scheduleId: matchIds.grandFinal,
          slotLabels: ["승자조 결승 승자", "패자조 결승 승자"],
          subtitle: "BO5 · 우승 결정전",
          title: "최종 결승",
        }),
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "worlds-path",
      title: "Worlds 경로",
      matches: [
        {
          id: "lck-r34-worlds-candidates",
          stageName: "Worlds 진출권",
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

export function LckRounds34PostseasonPathView({
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
  const frameClassName = hasPostseasonSchedule
    ? "lck-postseason-frame"
    : "lck-postseason-projection-frame";
  const boardClassName = hasPostseasonSchedule
    ? "lck-postseason-flow-board"
    : "lck-postseason-projection-flow-board";
  const flowHints: Record<string, string> = hasPostseasonSchedule
    ? {
        finals: "패자조 결승 승자가 최종 결승에서 승자조 결승 승자와 만납니다.",
        "lower-round-1": "승자는 패자조 준결승으로, 패자는 탈락합니다.",
        "lower-round-2": "승자는 패자조 결승으로, 패자는 최종 4위가 됩니다.",
        "playoffs-round-1": "승자는 플레이오프 2라운드로, 패자는 패자조로 내려갑니다.",
        "playoffs-round-2": "승자는 승자조 결승으로, 패자는 패자조 1라운드로 내려갑니다.",
        "playoffs-round-3": "승자는 최종 결승으로, 패자는 패자조 결승으로 내려갑니다.",
        "season-play-in": "두 팀이 플레이오프에 합류하고, 나머지는 탈락합니다.",
        "worlds-path": "최종 1~3위는 Worlds 기본 후보, 4위는 MSI 보너스 조건을 따릅니다.",
      }
    : {
        "playoffs-round-1": "Legend 3~4위는 플레이오프 1라운드로 직행합니다.",
        "playoffs-round-2": "Legend 1~2위는 플레이오프 2라운드로 직행합니다.",
        "season-locked": "Rise 4~5위는 후속 포스트시즌에서 제외됩니다.",
        "season-play-in": "Legend 5위와 Rise 1~3위가 플레이오프 남은 두 자리를 놓고 경쟁합니다.",
      };
  const bracketColumns: CompetitionBracketColumn[] = pathGroups.map((round) => ({
    align:
      round.id === "worlds-path" || round.matches.length === 1 ? "center" : "spread",
    id: round.id,
    matches: round.matches.map((match) =>
      toCompetitionBracketMatch({
        flowHint: flowHints[round.id],
        isCurrent: match.stageName === currentPostseasonStageName,
        match,
        meta: hasPostseasonSchedule ? "BO5" : "예상",
      }),
    ),
    title: round.title,
  }));

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">포스트시즌</p>
          <h2>{getLckRoundsFormatTitle(competition)} 포스트시즌</h2>
        </div>
        <span className="panel-note">{bracketStatus}</span>
      </div>
      <CompetitionBracket
        boardClassName={boardClassName}
        className={frameClassName}
        columns={bracketColumns}
        minWidth={hasPostseasonSchedule ? "1140px" : "760px"}
        userTeamId={userTeamId}
      />
    </section>
  );
}
