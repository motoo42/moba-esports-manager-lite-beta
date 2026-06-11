import type { StrategyId, TrainingIntensity } from "../../types/game";

export type StrategyOption = {
  id: StrategyId;
  label: string;
  description: string;
  effectSummary: string;
};

export type TrainingIntensityOption = {
  id: TrainingIntensity;
  label: string;
  description: string;
  statusSummary: string;
  powerBonus: number;
};

export const strategyOptions: StrategyOption[] = [
  {
    id: "aggressive",
    label: "공격 지향",
    description: "강한 교전, 다이브, 한타 개시를 우선합니다.",
    effectSummary: "메카닉, 라인전, 한타가 높은 선발진일수록 경기력 보정이 커집니다.",
  },
  {
    id: "tempo",
    label: "템포 지향",
    description: "초반 주도권과 빠른 스노우볼을 노립니다.",
    effectSummary: "라인전과 메카닉, 운영 전환 능력이 좋은 팀에게 유리합니다.",
  },
  {
    id: "macro",
    label: "운영 지향",
    description: "로테이션, 사이드 운영, 맵 전체 설계를 중시합니다.",
    effectSummary: "운영, 멘탈, 챔피언 폭이 높은 선수단에서 안정적으로 힘을 냅니다.",
  },
  {
    id: "vision",
    label: "시야 중심형",
    description: "시야 장악과 오브젝트 준비로 안정적인 정보를 확보합니다.",
    effectSummary: "운영과 팀워크, 커뮤니케이션이 좋은 팀에게 보정이 붙습니다.",
  },
  {
    id: "scaling",
    label: "후반 설계형",
    description: "후반 밸류와 캐리 라인의 성장 시간을 확보합니다.",
    effectSummary: "한타, 멘탈, 챔피언 폭이 좋은 팀일수록 후반 설계 효과가 큽니다.",
  },
  {
    id: "balanced",
    label: "균형 전술",
    description: "큰 약점 없이 밴픽과 경기 운영을 안정적으로 가져갑니다.",
    effectSummary: "특정 능력치에 크게 기대지 않는 기본 전술입니다.",
  },
];

export const trainingIntensityOptions: TrainingIntensityOption[] = [
  {
    id: "high",
    label: "고강도 훈련",
    description: "이번 주 경기력 보정이 가장 큽니다.",
    statusSummary: "경기 후 선발 피로도가 크게 오르고, 폼은 소폭 상승합니다.",
    powerBonus: 3,
  },
  {
    id: "normal",
    label: "일반 훈련",
    description: "기본 훈련 강도입니다. 안정적인 경기 준비를 제공합니다.",
    statusSummary: "경기력과 상태 변화를 가장 무난하게 유지합니다.",
    powerBonus: 2,
  },
  {
    id: "light",
    label: "가벼운 훈련",
    description: "경기력 보정은 작지만 부담이 낮은 준비 방식입니다.",
    statusSummary: "경기 후 피로 회복이 좋아지고, 경기력 보정은 낮아집니다.",
    powerBonus: 1,
  },
  {
    id: "rest",
    label: "휴식",
    description: "경기력 보정은 없고 선수 회복에 집중합니다.",
    statusSummary: "폼은 약간 떨어질 수 있지만 선발과 후보 모두 피로 회복 폭이 큽니다.",
    powerBonus: 0,
  },
];

export function getStrategyLabel(strategy: StrategyId) {
  return strategyOptions.find((option) => option.id === strategy)?.label ?? strategy;
}

export function getTrainingIntensityLabel(trainingIntensity: TrainingIntensity) {
  return (
    trainingIntensityOptions.find((option) => option.id === trainingIntensity)?.label ??
    trainingIntensity
  );
}

export function getTrainingIntensityPowerBonus(trainingIntensity: TrainingIntensity) {
  return (
    trainingIntensityOptions.find((option) => option.id === trainingIntensity)?.powerBonus ??
    0
  );
}

export function getStrategyEffectSummary(strategy: StrategyId) {
  return (
    strategyOptions.find((option) => option.id === strategy)?.effectSummary ??
    "선택한 전술이 선발 선수의 능력치에 따라 경기력에 반영됩니다."
  );
}

export function getTrainingIntensityStatusSummary(
  trainingIntensity: TrainingIntensity,
) {
  return (
    trainingIntensityOptions.find((option) => option.id === trainingIntensity)
      ?.statusSummary ?? "훈련 강도에 따라 경기력과 선수 상태 변화가 함께 조정됩니다."
  );
}
