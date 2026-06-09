import { useGameSelector } from "../app/GameProvider";
import type { AppRoute, RouteSubPage } from "../app/routes";
import { LckTeamInfo } from "../features/lck-team-info";
import type { CompetitionId } from "../types/game";
import { CareerRequiredFallback } from "./CareerRequiredFallback";

type LckTeamInfoPageProps = {
  teamId?: string | null;
  onGoTo: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      teamId?: string | null;
      subPage?: RouteSubPage | null;
    },
  ) => void;
};

export function LckTeamInfoPage({ onGoTo, teamId }: LckTeamInfoPageProps) {
  const career = useGameSelector((state) => state.career);

  if (!career) {
    return <CareerRequiredFallback title="LCK 구단 정보를 열 수 없습니다" />;
  }

  return (
    <LckTeamInfo
      career={career}
      teamId={teamId}
      onViewTeam={(nextTeamId) =>
        onGoTo("lck-team-info", { teamId: nextTeamId })
      }
      onViewTeamList={() => onGoTo("lck-team-info")}
    />
  );
}
