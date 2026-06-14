import { getLckTeamProfile, lck2026Teams } from "../../data/lckTeams";
import { appendCareerMessages } from "../messages";
import { createNextEvaluationStatus, clampStatusValue } from "../players";
import { createSeededRandom } from "../rng/createSeededRandom";
import { addDaysToDateKey, formatSeasonDateLabel } from "../season/seasonScheduleDates";
import type {
  CareerSave,
  MatchSchedule,
  ScrimSchedule,
  ScrimState,
  SeasonState,
} from "../../types/game";

export type ScrimRequestInput = {
  scheduledDateKey: string;
  opponentTeamId: string;
  matchCount: number;
};

export type ScrimDateOption = {
  dateKey: string;
  dateLabel: string;
  shortLabel: string;
  isDisabled: boolean;
  disabledReason?: string;
};

export type ScrimOpponentOption = {
  teamId: string;
  teamName: string;
  shortName: string;
  baseElo: number;
  acceptanceChance: number;
  isDisabled: boolean;
  disabledReason?: string;
};

export type ScrimRequestValidation = {
  isValid: boolean;
  errors: string[];
};

export type RunTodayScrimResult = {
  career: CareerSave;
  summary?: ScrimSchedule;
  error?: string;
};

const maxScrimRequestRangeDays = 7;
const scrimMatchCounts = [1, 2, 3, 4, 5] as const;
const scrimMatchMultipliers: Record<number, number> = {
  1: 2,
  2: 2.5,
  3: 3,
  4: 3.5,
  5: 4,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createScrimReportBody({
  bullets,
  footer,
  title,
}: {
  bullets: string[];
  footer?: string;
  title: string;
}) {
  return [
    title,
    ...bullets.map((bullet) => `- ${bullet}`),
    ...(footer ? [footer] : []),
  ].join("\n");
}

function createScrimParagraph(sentences: string[]) {
  return sentences.join(" ");
}

export function createEmptyScrimState(): ScrimState {
  return {
    requests: [],
  };
}

export function normalizeScrimState(value: ScrimState | undefined): ScrimState {
  if (!value) {
    return createEmptyScrimState();
  }

  return {
    requests: Array.isArray(value.requests) ? value.requests : [],
    lastResultId: value.lastResultId,
  };
}

function getScrimState(career: CareerSave) {
  return normalizeScrimState(career.seasonState.scrim);
}

function withScrimState(career: CareerSave, scrim: ScrimState): CareerSave {
  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      scrim,
    },
  };
}

export function getScrimUserTeamId(seasonState: SeasonState) {
  if (seasonState.currentCompetitionId === "asian-games") {
    return undefined;
  }

  const currentCompetition = seasonState.competitions.find(
    (competition) => competition.competitionId === seasonState.currentCompetitionId,
  );
  const userStanding = currentCompetition?.standings.find(
    (entry) => entry.isUserTeam,
  );

  if (userStanding) {
    return userStanding.teamId;
  }

  return seasonState.competitions
    .flatMap((competition) => competition.standings)
    .find((entry) => entry.isUserTeam)?.teamId;
}

function getUserTeamElo(career: CareerSave) {
  return career.userTeam.elo;
}

function getOpponentTeamElo(career: CareerSave, teamId: string) {
  return (
    getLckTeamProfile(teamId, career.seasonState.teamBalanceAdjustments)?.baseElo ??
    1500
  );
}

export function getScrimAcceptanceChance({
  opponentElo,
  userElo,
}: {
  opponentElo: number;
  userElo: number;
}) {
  return Math.round(clampNumber(70 - (opponentElo - userElo) / 10, 50, 90));
}

function getLckScrimTeams(career: CareerSave) {
  const userTeamId = getScrimUserTeamId(career.seasonState);
  const currentCompetition = career.seasonState.competitions.find(
    (competition) => competition.competitionId === career.seasonState.currentCompetitionId,
  );
  const standingTeams = currentCompetition?.standings
    .filter((entry) => !entry.isUserTeam && getLckTeamProfile(entry.teamId))
    .map((entry) => {
      const profile = getLckTeamProfile(
        entry.teamId,
        career.seasonState.teamBalanceAdjustments,
      );

      return {
        id: entry.teamId,
        name: entry.teamName,
        shortName: profile?.shortName ?? entry.teamName,
      };
    });

  if (standingTeams?.length) {
    return standingTeams;
  }

  return lck2026Teams
    .filter((team) => team.id !== userTeamId)
    .map((team) => ({
      id: team.id,
      name: team.name,
      shortName: team.shortName,
    }));
}

function getOfficialMatchesForDate(career: CareerSave, dateKey: string) {
  return career.seasonState.scheduledMatches.filter(
    (match) => match.status === "scheduled" && match.scheduledDate === dateKey,
  );
}

function findTeamOfficialMatch(
  career: CareerSave,
  teamId: string | undefined,
  dateKey: string,
) {
  if (!teamId) {
    return undefined;
  }

  return getOfficialMatchesForDate(career, dateKey).find(
    (match) => match.blueTeamId === teamId || match.redTeamId === teamId,
  );
}

function isActiveScrimRequest(request: ScrimSchedule) {
  return request.status === "pending" || request.status === "accepted";
}

function getActiveScrimOnDate(career: CareerSave, dateKey: string) {
  return getScrimState(career).requests.find(
    (request) =>
      isActiveScrimRequest(request) && request.scheduledDateKey === dateKey,
  );
}

function getDateShortLabel(currentDateKey: string, dateKey: string, dayOffset: number) {
  if (dayOffset === 0) {
    return "오늘";
  }

  if (dayOffset === 1) {
    return "내일";
  }

  return `D+${dayOffset}`;
}

export function getScrimDateOptions(career: CareerSave): ScrimDateOption[] {
  const currentDateKey = career.seasonState.currentDateKey;
  const userTeamId = getScrimUserTeamId(career.seasonState);

  return Array.from({ length: maxScrimRequestRangeDays + 1 }, (_, dayOffset) => {
    const dateKey = addDaysToDateKey(currentDateKey, dayOffset);
    const officialMatch = findTeamOfficialMatch(career, userTeamId, dateKey);
    const activeScrim = getActiveScrimOnDate(career, dateKey);
    const phaseDisabled =
      career.seasonState.phase !== "competition"
        ? "정규 시즌 진행 중에만 스크림을 요청할 수 있습니다."
        : undefined;
    const sameDayDisabled =
      dayOffset === 0
        ? "승낙 여부를 다음날 확인하므로 오늘 일정은 요청할 수 없습니다."
        : undefined;
    const disabledReason =
      phaseDisabled ??
      sameDayDisabled ??
      (officialMatch
        ? `${officialMatch.stageName} 공식 경기가 있어 요청할 수 없습니다.`
        : undefined) ??
      (activeScrim
        ? "이미 해당 날짜에 스크림 요청 또는 일정이 있습니다."
        : undefined);

    return {
      dateKey,
      dateLabel: formatSeasonDateLabel(dateKey),
      shortLabel: getDateShortLabel(currentDateKey, dateKey, dayOffset),
      isDisabled: Boolean(disabledReason),
      disabledReason,
    };
  });
}

export function getScrimOpponentOptions(
  career: CareerSave,
  dateKey: string | null | undefined,
): ScrimOpponentOption[] {
  const userElo = getUserTeamElo(career);

  return getLckScrimTeams(career).map((team) => {
    const profile = getLckTeamProfile(
      team.id,
      career.seasonState.teamBalanceAdjustments,
    );
    const officialMatch = dateKey
      ? findTeamOfficialMatch(career, team.id, dateKey)
      : undefined;
    const opponentElo = profile?.baseElo ?? getOpponentTeamElo(career, team.id);

    return {
      teamId: team.id,
      teamName: team.name,
      shortName: profile?.shortName ?? team.shortName,
      baseElo: opponentElo,
      acceptanceChance: getScrimAcceptanceChance({ opponentElo, userElo }),
      isDisabled: Boolean(officialMatch),
      disabledReason: officialMatch
        ? `${officialMatch.stageName} 공식 경기가 있습니다.`
        : undefined,
    };
  });
}

function getRequestOpponentOption(career: CareerSave, input: ScrimRequestInput) {
  return getScrimOpponentOptions(career, input.scheduledDateKey).find(
    (option) => option.teamId === input.opponentTeamId,
  );
}

export function validateScrimRequest(
  career: CareerSave,
  input: ScrimRequestInput,
): ScrimRequestValidation {
  const errors: string[] = [];
  const dateOption = getScrimDateOptions(career).find(
    (option) => option.dateKey === input.scheduledDateKey,
  );
  const opponentOption = getRequestOpponentOption(career, input);

  if (!dateOption) {
    errors.push("요청 가능한 날짜 범위를 벗어났습니다.");
  } else if (dateOption.isDisabled) {
    errors.push(dateOption.disabledReason ?? "선택할 수 없는 날짜입니다.");
  }

  if (!opponentOption) {
    errors.push("선택할 수 없는 스크림 상대입니다.");
  } else if (opponentOption.isDisabled) {
    errors.push(opponentOption.disabledReason ?? "상대 팀 일정이 비어 있지 않습니다.");
  }

  if (!scrimMatchCounts.includes(input.matchCount as (typeof scrimMatchCounts)[number])) {
    errors.push("스크림 경기 수는 1경기부터 5경기까지만 선택할 수 있습니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function requestScrim(
  career: CareerSave,
  input: ScrimRequestInput,
): CareerSave {
  const validation = validateScrimRequest(career, input);

  if (!validation.isValid) {
    return career;
  }

  const opponentOption = getRequestOpponentOption(career, input);

  if (!opponentOption) {
    return career;
  }

  const requestedDateKey = career.seasonState.currentDateKey;
  const requestedDateLabel = career.seasonState.currentDateLabel;
  const scheduledDateLabel = formatSeasonDateLabel(input.scheduledDateKey);
  const request: ScrimSchedule = {
    id: `scrim-${requestedDateKey}-${input.scheduledDateKey}-${input.opponentTeamId}-${career.seasonState.currentTurn}`,
    requestedDateKey,
    requestedDateLabel,
    scheduledDateKey: input.scheduledDateKey,
    scheduledDateLabel,
    opponentTeamId: input.opponentTeamId,
    opponentTeamName: opponentOption.teamName,
    matchCount: input.matchCount,
    acceptanceChance: opponentOption.acceptanceChance,
    status: "pending",
  };
  const nextCareer = withScrimState(career, {
    ...getScrimState(career),
    requests: [...getScrimState(career).requests, request],
  });

  return appendCareerMessages(nextCareer, [
    {
      dateKey: requestedDateKey,
      dateLabel: requestedDateLabel,
      category: "training",
      priority: "normal",
      title: "스크림 요청 발송",
      body: createScrimParagraph([
        `${opponentOption.teamName}에게 ${scheduledDateLabel} ${input.matchCount}경기 스크림을 요청했습니다.`,
        `현재 기준 수락 예상치는 ${opponentOption.acceptanceChance}%이며, 상대가 수락할 경우 해당 날짜 전략/훈련 탭의 스크림 메뉴에서 일정을 진행할 수 있습니다.`,
        "승낙 여부는 다음날 메시지함으로 안내되므로, 같은 날짜의 공식 경기와 주간 계획을 함께 확인해두세요.",
      ]),
      createdTurn: career.seasonState.currentTurn,
      source: "club",
      relatedTeamId: input.opponentTeamId,
    },
  ]);
}

function resolveScrimRequest(career: CareerSave, request: ScrimSchedule) {
  const opponentMatch = findTeamOfficialMatch(
    career,
    request.opponentTeamId,
    request.scheduledDateKey,
  );

  if (opponentMatch) {
    return {
      ...request,
      status: "rejected" as const,
      decisionReason: "opponent-official-match" as const,
      resolvedDateKey: career.seasonState.currentDateKey,
      resolvedDateLabel: career.seasonState.currentDateLabel,
    };
  }

  const random = createSeededRandom(
    `${request.id}-decision-${career.seasonState.currentDateKey}-${career.seasonState.currentTurn}`,
  );
  const accepted = random() * 100 <= request.acceptanceChance;

  return {
    ...request,
    status: accepted ? ("accepted" as const) : ("rejected" as const),
    decisionReason: accepted ? ("accepted" as const) : ("chance-roll" as const),
    resolvedDateKey: career.seasonState.currentDateKey,
    resolvedDateLabel: career.seasonState.currentDateLabel,
  };
}

function createScrimDecisionBody(request: ScrimSchedule) {
  if (request.status === "accepted") {
    return createScrimReportBody({
      title: "스크림 요청 결과",
      bullets: [
        `${request.opponentTeamName}이 ${request.scheduledDateLabel} ${request.matchCount}경기 스크림 요청을 수락했습니다.`,
        "해당 날짜에는 전략/훈련 탭의 스크림 메뉴에서 진행할 수 있습니다.",
        "스크림은 공식 경기보다 부담은 작지만 선수단 피로도와 경기력에 영향을 줍니다.",
      ],
      footer: "권장 행동: 경기 전날에는 피로도 누적을 보고 진행 여부를 다시 판단하세요.",
    });
  }

  if (request.decisionReason === "opponent-official-match") {
    return createScrimReportBody({
      title: "스크림 요청 결과",
      bullets: [
        `${request.opponentTeamName}이 ${request.scheduledDateLabel} 공식 경기 일정으로 인해 요청을 거절했습니다.`,
        `요청 경기 수는 ${request.matchCount}경기였습니다.`,
        "공식 경기가 있는 팀은 해당 날짜 스크림을 수락하지 않습니다.",
      ],
      footer: "권장 행동: 일정이 비어 있는 다른 날짜나 상대 팀을 다시 선택하세요.",
    });
  }

  return createScrimReportBody({
    title: "스크림 요청 결과",
    bullets: [
      `${request.opponentTeamName}이 ${request.scheduledDateLabel} ${request.matchCount}경기 스크림 요청을 거절했습니다.`,
      `요청 당시 수락 예상치는 ${request.acceptanceChance}%였습니다.`,
      "전력 차이와 일정 상황에 따라 같은 상대라도 다른 날짜에는 결과가 달라질 수 있습니다.",
    ],
    footer: "권장 행동: 더 가까운 전력의 상대나 다른 날짜로 다시 요청해보세요.",
  });
}

export function resolvePendingScrimRequests(career: CareerSave): CareerSave {
  const scrim = getScrimState(career);
  const resolvedRequests = scrim.requests.map((request) => {
    if (
      request.status !== "pending" ||
      request.requestedDateKey === career.seasonState.currentDateKey
    ) {
      return request;
    }

    return resolveScrimRequest(career, request);
  });
  const newlyResolved = resolvedRequests.filter((request, index) => {
    const previous = scrim.requests[index];

    return previous.status === "pending" && request.status !== "pending";
  });
  const nextCareer = withScrimState(career, {
    ...scrim,
    requests: resolvedRequests,
  });

  return appendCareerMessages(
    nextCareer,
    newlyResolved.map((request) => ({
      dateKey: career.seasonState.currentDateKey,
      dateLabel: career.seasonState.currentDateLabel,
      category: "training",
      priority: request.status === "accepted" ? "important" : "normal",
      title:
        request.status === "accepted"
          ? "스크림 요청 수락"
          : "스크림 요청 거절",
      body: createScrimDecisionBody(request),
      createdTurn: career.seasonState.currentTurn,
      source: "club",
      relatedTeamId: request.opponentTeamId,
    })),
  );
}

export function getTodayAcceptedScrim(career: CareerSave) {
  return getScrimState(career).requests.find(
    (request) =>
      request.status === "accepted" &&
      request.scheduledDateKey === career.seasonState.currentDateKey,
  );
}

export function getCurrentWeekScrims(career: CareerSave) {
  const currentDateKey = career.seasonState.currentDateKey;
  const maxDateKey = addDaysToDateKey(currentDateKey, 6);

  return getScrimState(career).requests
    .filter(
      (request) =>
        (request.status === "pending" || request.status === "accepted") &&
        request.scheduledDateKey >= currentDateKey &&
        request.scheduledDateKey <= maxDateKey,
    )
    .sort((left, right) =>
      left.scheduledDateKey.localeCompare(right.scheduledDateKey),
    );
}

function getScrimWinProbability(userElo: number, opponentElo: number) {
  return 1 / (1 + 10 ** ((opponentElo - userElo) / 400));
}

function simulateScrimGames(career: CareerSave, request: ScrimSchedule) {
  const random = createSeededRandom(
    `${request.id}-games-${career.seasonState.currentDateKey}-${career.seasonState.currentTurn}`,
  );
  const userElo = getUserTeamElo(career);
  const opponentElo = getOpponentTeamElo(career, request.opponentTeamId);
  const winProbability = getScrimWinProbability(userElo, opponentElo);
  let userWins = 0;

  for (let index = 0; index < request.matchCount; index += 1) {
    if (random() <= winProbability) {
      userWins += 1;
    }
  }

  return {
    userWins,
    opponentWins: request.matchCount - userWins,
  };
}

function getScrimFormDelta(userWins: number, opponentWins: number, matchCount: number) {
  const multiplier = scrimMatchMultipliers[matchCount] ?? 2;
  const baseForm =
    userWins === 0 ? -0.5 : userWins > opponentWins ? 1.25 : 0.65;

  return Math.round(baseForm * multiplier);
}

function getScrimFatigueDelta(matchCount: number) {
  return scrimMatchMultipliers[matchCount] ?? 2;
}

function formatScrimFormText(formDelta: number) {
  if (formDelta > 0) {
    return `경기력 +${formDelta}`;
  }

  if (formDelta < 0) {
    return `경기력 ${formDelta}`;
  }

  return "경기력 변화 없음";
}

function applyScrimStatusEffects({
  career,
  fatigueDelta,
  formDelta,
}: {
  career: CareerSave;
  fatigueDelta: number;
  formDelta: number;
}) {
  const starterIds = new Set(Object.values(career.userTeam.roster).filter(Boolean));
  const contractedPlayerIds = new Set(
    career.userTeam.contracts
      .filter((contract) => contract.remainingYears > 0)
      .map((contract) => contract.playerId),
  );

  return career.lckPlayers.map((player) => {
    if (!starterIds.has(player.id) || !contractedPlayerIds.has(player.id)) {
      return player;
    }

    const nextStatus = {
      ...player.status,
      form: clampStatusValue(player.status.form + formDelta),
      fatigue: clampStatusValue(player.status.fatigue + fatigueDelta),
    };

    return {
      ...player,
      status: createNextEvaluationStatus(player, nextStatus),
    };
  });
}

function getScrimResultSummary({
  fatigueDelta,
  formDelta,
  request,
  userWins,
  opponentWins,
}: {
  fatigueDelta: number;
  formDelta: number;
  request: ScrimSchedule;
  userWins: number;
  opponentWins: number;
}) {
  const formText = formatScrimFormText(formDelta);

  return `${request.opponentTeamName} 상대 ${request.matchCount}경기 결과 ${userWins}승 ${opponentWins}패. ${formText}, 피로도 +${fatigueDelta}.`;
}

export function runTodayScrim(career: CareerSave): RunTodayScrimResult {
  const request = getTodayAcceptedScrim(career);

  if (!request) {
    return {
      career,
      error: "오늘 진행 가능한 스크림 일정이 없습니다.",
    };
  }

  const userOfficialMatch = findTeamOfficialMatch(
    career,
    getScrimUserTeamId(career.seasonState),
    career.seasonState.currentDateKey,
  );

  if (userOfficialMatch) {
    return {
      career,
      error: "오늘 공식 경기가 있어 스크림을 진행할 수 없습니다.",
    };
  }

  const { userWins, opponentWins } = simulateScrimGames(career, request);
  const formDelta = getScrimFormDelta(userWins, opponentWins, request.matchCount);
  const fatigueDelta = getScrimFatigueDelta(request.matchCount);
  const roundedFatigueDelta = Math.round(fatigueDelta);
  const formText = formatScrimFormText(formDelta);
  const resultSummary = getScrimResultSummary({
    fatigueDelta: roundedFatigueDelta,
    formDelta,
    request,
    userWins,
    opponentWins,
  });
  const completedRequest: ScrimSchedule = {
    ...request,
    status: "completed",
    userWins,
    opponentWins,
    formDelta,
    fatigueDelta: roundedFatigueDelta,
    completedDateKey: career.seasonState.currentDateKey,
    resultSummary,
  };
  const scrim = getScrimState(career);
  const careerWithUpdatedScrim = withScrimState(career, {
    ...scrim,
    requests: scrim.requests.map((entry) =>
      entry.id === request.id ? completedRequest : entry,
    ),
    lastResultId: completedRequest.id,
  });
  const careerWithStatus = {
    ...careerWithUpdatedScrim,
    lckPlayers: applyScrimStatusEffects({
      career,
      fatigueDelta: roundedFatigueDelta,
      formDelta,
    }),
  };

  return {
    career: appendCareerMessages(careerWithStatus, [
      {
        dateKey: career.seasonState.currentDateKey,
        dateLabel: career.seasonState.currentDateLabel,
        category: "training",
        priority: "important",
        title: "스크림 결과 보고",
        body: createScrimReportBody({
          title: "스크림 결과 리포트",
          bullets: [
            `${request.opponentTeamName} 상대 ${request.matchCount}경기 결과는 ${userWins}승 ${opponentWins}패입니다.`,
            `${formText}가 선수단 상태에 반영됐습니다.`,
            `선발 선수단 피로도는 +${roundedFatigueDelta}만큼 상승했습니다.`,
            "스크림 승률이 좋을수록 경기력 상승폭이 커지지만, 피로도 누적도 함께 관리해야 합니다.",
          ],
          footer: "권장 행동: 다음 공식 경기 전 선발 컨디션과 피로도를 확인하세요.",
        }),
        createdTurn: career.seasonState.currentTurn,
        source: "club",
        relatedTeamId: request.opponentTeamId,
      },
    ]),
    summary: completedRequest,
  };
}

