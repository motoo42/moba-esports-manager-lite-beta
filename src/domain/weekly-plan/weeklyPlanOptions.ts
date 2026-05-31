import type { StrategyId, TrainingIntensity } from "../../types/game";

export type StrategyOption = {
  id: StrategyId;
  label: string;
  description: string;
};

export type TrainingIntensityOption = {
  id: TrainingIntensity;
  label: string;
  description: string;
  powerBonus: number;
};

export const strategyOptions: StrategyOption[] = [
  {
    id: "aggressive",
    label: "공격 지향",
    description: "강한 교전, 다이브, 한타 개시를 우선합니다.",
  },
  {
    id: "tempo",
    label: "템포 지향",
    description: "초반 주도권과 빠른 스노우볼을 노립니다.",
  },
  {
    id: "macro",
    label: "운영 지향",
    description: "로테이션, 사이드 운영, 맵 전체 설계를 중시합니다.",
  },
  {
    id: "vision",
    label: "시야 중심형",
    description: "시야 장악과 오브젝트 준비로 안정적인 정보를 확보합니다.",
  },
  {
    id: "scaling",
    label: "후반 설계형",
    description: "후반 밸류와 캐리 라인의 성장 시간을 확보합니다.",
  },
  {
    id: "balanced",
    label: "균형 전술",
    description: "큰 약점 없이 밴픽과 경기 운영을 안정적으로 가져갑니다.",
  },
];

export const trainingIntensityOptions: TrainingIntensityOption[] = [
  {
    id: "high",
    label: "고강도 훈련",
    description: "이번 주 경기력 보정이 가장 큽니다. 피로도 변화는 이후 단계에서 반영합니다.",
    powerBonus: 3,
  },
  {
    id: "normal",
    label: "일반 훈련",
    description: "기본 훈련 강도입니다. 안정적인 경기 준비를 제공합니다.",
    powerBonus: 2,
  },
  {
    id: "light",
    label: "가벼운 훈련",
    description: "경기력 보정은 작지만 부담이 낮은 준비 방식입니다.",
    powerBonus: 1,
  },
  {
    id: "rest",
    label: "휴식",
    description: "경기력 보정은 없고, 이후 선수 상태 회복 시스템과 연결됩니다.",
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
