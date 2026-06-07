import { type ReactNode, useState } from "react";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";

type CareerSetupProps = {
  savePanel?: ReactNode;
  onStart: (teamName: string) => void;
};

export function CareerSetup({ savePanel, onStart }: CareerSetupProps) {
  const [teamName, setTeamName] = useState("T1");

  return (
    <section className="stack">
      <header>
        <p className="eyebrow">Career setup</p>
        <h1>Build a League of Legends roster</h1>
        <p className="lede">
          Start with an LCK player pool, then grow the team through LoL Esports seasons.
        </p>
      </header>

      <Card>
        <label className="field">
          <span>Team name</span>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            maxLength={40}
          />
        </label>
        <Button onClick={() => onStart(teamName)}>Start career</Button>
      </Card>
      {savePanel}
    </section>
  );
}
