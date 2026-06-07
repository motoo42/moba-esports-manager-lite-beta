import { CareerSetup } from "../features/career-setup";
import { useGame } from "../app/GameProvider";
import type { ReactNode } from "react";

type CareerSetupPageProps = {
  savePanel?: ReactNode;
};

export function CareerSetupPage({ savePanel }: CareerSetupPageProps) {
  const { dispatch } = useGame();

  return (
    <CareerSetup
      savePanel={savePanel}
      onStart={(teamName) => dispatch({ type: "start-career", teamName })}
    />
  );
}
