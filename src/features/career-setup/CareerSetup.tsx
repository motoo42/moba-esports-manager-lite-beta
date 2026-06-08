import { type ReactNode, useState } from "react";
import { lck2026Teams } from "../../data/lckTeams";
import { formatSalaryAmount } from "../../shared/format/money";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";

type CareerSetupProps = {
  savePanel?: ReactNode;
  onStart: (teamName: string) => void;
};

export function CareerSetup({ savePanel, onStart }: CareerSetupProps) {
  const defaultTeam = lck2026Teams.find((team) => team.shortName === "T1") ?? lck2026Teams[0];
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeam.id);
  const selectedTeam =
    lck2026Teams.find((team) => team.id === selectedTeamId) ?? defaultTeam;

  return (
    <section className="stack">
      <header>
        <p className="eyebrow">Career setup</p>
        <h1>LCK 팀을 선택하세요</h1>
        <p className="lede">
          2026 LCK 기존 선수단으로 프리시즌 스토브리그를 시작합니다.
        </p>
      </header>

      <Card>
        <div className="career-team-selection">
          {lck2026Teams.map((team) => {
            const isSelected = team.id === selectedTeam.id;

            return (
              <button
                aria-pressed={isSelected}
                className={`career-team-card ${isSelected ? "career-team-card-selected" : ""}`}
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                type="button"
              >
                <span className="career-team-short-name">{team.shortName}</span>
                <strong>{team.name}</strong>
                <dl>
                  <div>
                    <dt>티어</dt>
                    <dd>{team.tier}</dd>
                  </div>
                  <div>
                    <dt>전력</dt>
                    <dd>{team.strength}</dd>
                  </div>
                  <div>
                    <dt>예산</dt>
                    <dd>{formatSalaryAmount(team.budget)}</dd>
                  </div>
                  <div>
                    <dt>예상 순위</dt>
                    <dd>{team.previousSeasonRank}위</dd>
                  </div>
                </dl>
              </button>
            );
          })}
        </div>
        <div className="career-team-start-row">
          <p>
            선택 팀: <strong>{selectedTeam.name}</strong>
          </p>
          <Button onClick={() => onStart(selectedTeam.name)}>Start career</Button>
        </div>
      </Card>
      {savePanel}
    </section>
  );
}
