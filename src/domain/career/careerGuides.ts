import type { CareerGuideId, CareerGuideState, CareerSave } from "../../types/game";

export const OFFSEASON_RULES_GUIDE_ID: CareerGuideId = "offseason-rules";
export const ROSTER_MANAGEMENT_GUIDE_ID: CareerGuideId = "roster-management";
export const COMPETITION_DASHBOARD_GUIDE_ID: CareerGuideId =
  "competition-dashboard";
export const INBOX_GUIDE_ID: CareerGuideId = "inbox";

export type CareerGuidePoint = {
  label: string;
  title: string;
  body: string;
};

export type CareerGuideDefinition = {
  id: CareerGuideId;
  eyebrow: string;
  title: string;
  summary: string;
  bannerTitle: string;
  bannerBody: string;
  buttonLabel: string;
  points: CareerGuidePoint[];
  noteTitle: string;
  noteBody: string;
};

export const careerGuideDefinitions: CareerGuideDefinition[] = [
  {
    id: OFFSEASON_RULES_GUIDE_ID,
    eyebrow: "Stove League Guide",
    title: "스토브리그 기본 룰",
    summary:
      "이번 스토브리그의 목표는 복잡하지 않습니다. 먼저 1군 5인을 완성하고, 2군은 필요한 만큼만 직접 보강하면 됩니다.",
    bannerTitle: "1군 5인 구성이 먼저입니다",
    bannerBody:
      "2군 영입은 선택입니다. 부족한 2군 인원은 최종 등록 시 자동으로 채워집니다.",
    buttonLabel: "스토브리그 룰 보기",
    points: [
      {
        label: "01",
        title: "1군 5인 완성이 핵심 목표",
        body: "탑, 정글, 미드, 바텀, 서포터 선발 라인을 먼저 안정적으로 구성하세요.",
      },
      {
        label: "02",
        title: "2군 영입은 선택 사항",
        body: "유망주를 직접 고르고 싶다면 영입해도 되지만, 반드시 5명을 모두 채울 필요는 없습니다.",
      },
      {
        label: "03",
        title: "부족한 2군은 자동 배치",
        body: "최종 등록 단계에서 2군 인원이 부족하면 시스템이 자동으로 보충합니다.",
      },
    ],
    noteTitle: "언제 다시 볼 수 있나요?",
    noteBody:
      "스토브리그 화면의 안내 카드에서 이 룰을 다시 열 수 있습니다. 설정에서는 최초 진입 안내 표시 여부를 조정할 수 있습니다.",
  },
  {
    id: ROSTER_MANAGEMENT_GUIDE_ID,
    eyebrow: "Roster Guide",
    title: "로스터 관리 기본",
    summary:
      "선발 5인, 1군 후보, 2군은 역할이 다릅니다. 경기 라인업을 안정적으로 유지하면서 필요한 선수를 콜업하거나 내려보내세요.",
    bannerTitle: "선발과 후보의 역할을 나눠 봅니다",
    bannerBody:
      "선발 5인은 경기 출전 라인업이고, 1군 후보는 즉시 교체 가능한 예비 전력입니다.",
    buttonLabel: "로스터 가이드 보기",
    points: [
      {
        label: "01",
        title: "선발 5인이 경기 라인업",
        body: "TOP, JGL, MID, BOT, SUP 슬롯에 등록된 선수가 다음 경기의 기본 출전 라인입니다.",
      },
      {
        label: "02",
        title: "1군 후보는 즉시 교체 자원",
        body: "컨디션이나 폼을 보고 같은 포지션 선발과 교체할 수 있는 예비 전력입니다.",
      },
      {
        label: "03",
        title: "2군은 콜업 후 활용",
        body: "2군 선수는 콜업하면 1군 후보가 되며, 필요하면 다시 2군으로 내려보낼 수 있습니다.",
      },
    ],
    noteTitle: "처음 볼 때 어디부터 보면 좋나요?",
    noteBody:
      "선발 5인의 컨디션과 평가를 먼저 확인한 뒤, 같은 포지션 후보와 2군 자원을 비교하면 됩니다.",
  },
  {
    id: COMPETITION_DASHBOARD_GUIDE_ID,
    eyebrow: "Competition Guide",
    title: "대회 현황 읽는 법",
    summary:
      "대회 현황은 시즌 흐름을 보는 중심 화면입니다. 대회별 탭에서 순위, 일정, 토너먼트 흐름을 확인하세요.",
    bannerTitle: "순위표와 일정이 시즌의 지도입니다",
    bannerBody:
      "현재 대회, 다음 경기, 포스트시즌 흐름을 함께 보면 무엇을 준비해야 할지 빨리 파악할 수 있습니다.",
    buttonLabel: "대회 가이드 보기",
    points: [
      {
        label: "01",
        title: "대회별 탭을 먼저 선택",
        body: "LCK Cup, LCK Rounds, 국제대회처럼 보고 싶은 대회를 선택해 세부 화면으로 들어갑니다.",
      },
      {
        label: "02",
        title: "순위표와 일정 함께 확인",
        body: "현재 순위만 보지 말고 남은 경기와 다음 상대까지 같이 확인해야 준비 방향이 명확해집니다.",
      },
      {
        label: "03",
        title: "팀 정보로 연결",
        body: "팀 이름이나 구단 정보 이동을 통해 상대 전력과 로스터를 더 자세히 확인할 수 있습니다.",
      },
    ],
    noteTitle: "대회가 많아지면 어떻게 보나요?",
    noteBody:
      "현재 진행 중인 대회를 먼저 보고, 국제대회와 포스트시즌은 일정이 가까워질 때 세부 탭을 확인하면 됩니다.",
  },
  {
    id: INBOX_GUIDE_ID,
    eyebrow: "Inbox Guide",
    title: "메시지함 활용법",
    summary:
      "메시지함은 장기 플레이 중 놓치기 쉬운 일정, 이적, 선수 상태, 중요 알림을 한곳에 모아 보여줍니다.",
    bannerTitle: "중요 탭부터 훑으면 흐름을 놓치지 않습니다",
    bannerBody:
      "일정, 이적 소식, 뉴스가 쌓이면 중요 탭에서 먼저 확인하고 필요한 메시지만 자세히 읽으세요.",
    buttonLabel: "메시지함 가이드 보기",
    points: [
      {
        label: "01",
        title: "중요 메시지 우선 확인",
        body: "경기 일정, 스토브리그 결과, 선수 상태처럼 놓치면 손해인 소식은 중요 탭에 모입니다.",
      },
      {
        label: "02",
        title: "분류 탭으로 빠르게 필터",
        body: "일정과 이적 탭을 나눠 보면 지금 필요한 정보만 빠르게 찾을 수 있습니다.",
      },
      {
        label: "03",
        title: "읽음 처리는 정리 도구",
        body: "확인한 메시지는 읽음 처리해두면 다음에 새로 들어온 소식이 더 잘 보입니다.",
      },
    ],
    noteTitle: "뉴스가 너무 많아지면?",
    noteBody:
      "중요 탭을 먼저 확인하고, 전체 탭은 시즌 흐름을 되짚어볼 때 사용하면 됩니다.",
  },
];

const careerGuideDefinitionById = new Map(
  careerGuideDefinitions.map((definition) => [definition.id, definition]),
);

const knownCareerGuideIds = new Set<CareerGuideId>(
  careerGuideDefinitions.map((definition) => definition.id),
);

export function getCareerGuideDefinition(guideId: CareerGuideId) {
  return careerGuideDefinitionById.get(guideId);
}

function normalizeGuideIds(value: unknown): CareerGuideId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter((guideId): guideId is CareerGuideId =>
        knownCareerGuideIds.has(guideId as CareerGuideId),
      ),
    ),
  ];
}

export function normalizeCareerGuideState(
  value: Partial<CareerGuideState> | undefined,
): CareerGuideState {
  return {
    seenGuideIds: normalizeGuideIds(value?.seenGuideIds),
  };
}

export function hasSeenCareerGuide(
  career: CareerSave,
  guideId: CareerGuideId,
) {
  return career.guideState?.seenGuideIds.includes(guideId) ?? false;
}

export function markCareerGuideSeen(
  career: CareerSave,
  guideId: CareerGuideId,
): CareerSave {
  const guideState = normalizeCareerGuideState(career.guideState);

  if (guideState.seenGuideIds.includes(guideId)) {
    return {
      ...career,
      guideState,
    };
  }

  return {
    ...career,
    guideState: {
      seenGuideIds: [...guideState.seenGuideIds, guideId],
    },
  };
}
