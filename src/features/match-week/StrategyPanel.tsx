import {
  getStrategyEffectSummary,
  getTrainingIntensityPowerBonus,
  getTrainingIntensityStatusSummary,
  strategyOptions,
  trainingIntensityOptions,
} from "../../domain/weekly-plan";
import type { TrainingSubPage } from "../../app/routes";
import type { StrategyId, TrainingIntensity, WeeklyPlan } from "../../types/game";

type StrategyPanelProps = {
  subPage?: TrainingSubPage | null;
  weeklyPlan: WeeklyPlan;
  onStrategyChange: (strategy: StrategyId) => void;
  onTrainingIntensityChange: (trainingIntensity: TrainingIntensity) => void;
};

export function StrategyPanel({
  subPage,
  weeklyPlan,
  onStrategyChange,
  onTrainingIntensityChange,
}: StrategyPanelProps) {
  const activeSection = subPage ?? "plan";
  const selectedStrategy = strategyOptions.find(
    (option) => option.id === weeklyPlan.strategy,
  );
  const selectedTrainingIntensity = trainingIntensityOptions.find(
    (option) => option.id === weeklyPlan.trainingIntensity,
  );

  return (
    <div className="strategy-panel">
      <section
        className={`strategy-plan-summary ${
          activeSection === "plan" ? "strategy-plan-summary-active" : ""
        }`}
        id="weekly-plan"
      >
        <p className="eyebrow">주간 계획</p>
        <h3>
          {selectedStrategy?.label ?? "균형 전술"} /{" "}
          {selectedTrainingIntensity?.label ?? "일반 훈련"}
        </h3>
        <p>
          다음 경기는 현재 전략의 선수 능력치 적합도, 훈련 강도 보정, 경기 후
          선수 상태 변화를 함께 반영합니다.
        </p>
        <dl>
          <div>
            <dt>전술 효과</dt>
            <dd>{getStrategyEffectSummary(weeklyPlan.strategy)}</dd>
          </div>
          <div>
            <dt>훈련 효과</dt>
            <dd>
              경기력 +{getTrainingIntensityPowerBonus(weeklyPlan.trainingIntensity)}
              · {getTrainingIntensityStatusSummary(weeklyPlan.trainingIntensity)}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className={`strategy-subsection ${
          activeSection === "strategy" ? "strategy-subsection-active" : ""
        }`}
        id="strategy"
      >
        <h3>전략</h3>
        <div className="option-grid">
          {strategyOptions.map((option) => (
            <button
              className={`option-card ${
                weeklyPlan.strategy === option.id ? "option-card-active" : ""
              }`}
              key={option.id}
              onClick={() => onStrategyChange(option.id)}
              type="button"
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
              <small>{option.effectSummary}</small>
            </button>
          ))}
        </div>
      </section>

      <section
        className={`strategy-subsection ${
          activeSection === "intensity" ? "strategy-subsection-active" : ""
        }`}
        id="training-intensity"
      >
        <h3>훈련 강도</h3>
        <div className="option-grid option-grid-compact">
          {trainingIntensityOptions.map((option) => (
            <button
              className={`option-card ${
                weeklyPlan.trainingIntensity === option.id
                  ? "option-card-active"
                  : ""
              }`}
              key={option.id}
              onClick={() => onTrainingIntensityChange(option.id)}
              type="button"
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
              <small>
                경기력 +{option.powerBonus} · {option.statusSummary}
              </small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
