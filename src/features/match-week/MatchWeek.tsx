import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import type {
  MatchResult,
  StrategyId,
  TrainingIntensity,
  WeeklyPlan,
} from "../../types/game";
import type { TrainingSubPage } from "../../app/routes";
import { MatchResultPanel } from "./MatchResultPanel";
import { StrategyPanel } from "./StrategyPanel";

export type MatchWeekOpponentReport = {
  opponentTeamName: string;
  competitionName: string;
  stageName: string;
  formatLabel: string;
  styleLabel: string;
  strength: number;
  outlookGrade?: string;
  keyLaneLabel?: string;
  statusSummary?: string;
};

type MatchWeekProps = {
  opponentReport: MatchWeekOpponentReport;
  result: MatchResult | null;
  subPage?: TrainingSubPage | null;
  weeklyPlan: WeeklyPlan;
  onStrategyChange: (strategy: StrategyId) => void;
  onTrainingIntensityChange: (trainingIntensity: TrainingIntensity) => void;
  onViewCalendar: () => void;
};

export function MatchWeek({
  opponentReport,
  result,
  subPage,
  weeklyPlan,
  onStrategyChange,
  onTrainingIntensityChange,
  onViewCalendar,
}: MatchWeekProps) {
  return (
    <section className="stack">
      <header>
        <p className="eyebrow">Match week</p>
        <h1>다음 상대: {opponentReport.opponentTeamName}</h1>
        <p className="lede">
          이번 주 전략과 훈련 강도는 상단 진행 버튼으로 처리되는 다음 경기부터 반영됩니다.
        </p>
      </header>

      <div className="two-column">
        <Card>
          <h2>상대 리포트</h2>
          <div className="match-week-report-grid">
            <article>
              <span>대회</span>
              <strong>{opponentReport.competitionName}</strong>
            </article>
            <article>
              <span>스테이지</span>
              <strong>{opponentReport.stageName}</strong>
            </article>
            <article>
              <span>Format</span>
              <strong>{opponentReport.formatLabel}</strong>
            </article>
            <article>
              <span>상대 스타일</span>
              <strong>{opponentReport.styleLabel}</strong>
            </article>
            <article>
              <span>상대 전력</span>
              <strong>{opponentReport.strength}</strong>
            </article>
            {opponentReport.outlookGrade && (
              <article>
                <span>전망</span>
                <strong>{opponentReport.outlookGrade}</strong>
              </article>
            )}
            {opponentReport.keyLaneLabel && (
              <article className="match-week-report-wide">
                <span>핵심 라인</span>
                <strong>{opponentReport.keyLaneLabel}</strong>
              </article>
            )}
            {opponentReport.statusSummary && (
              <article className="match-week-report-wide">
                <span>우리 상태</span>
                <strong>{opponentReport.statusSummary}</strong>
              </article>
            )}
          </div>
          <StrategyPanel
            subPage={subPage}
            weeklyPlan={weeklyPlan}
            onStrategyChange={onStrategyChange}
            onTrainingIntensityChange={onTrainingIntensityChange}
          />
          <Button onClick={onViewCalendar}>시즌 일정 보기</Button>
        </Card>

        <MatchResultPanel result={result} onViewCalendar={onViewCalendar} />
      </div>
    </section>
  );
}
