import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import type { AppRoute, RouteSubPage } from "../app/routes";
import { gameActions } from "../app/state";
import { OffseasonMarket } from "../features/offseason";
import { CareerRequiredFallback } from "./CareerRequiredFallback";
import type { CompetitionId } from "../types/game";

type OffseasonPageProps = {
  onGoTo: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      subPage?: RouteSubPage | null;
    },
  ) => void;
};

export function OffseasonPage({ onGoTo }: OffseasonPageProps) {
  const career = useGameSelector((state) => state.career);
  const dispatch = useGameDispatch();

  if (!career) {
    return <CareerRequiredFallback title="스토브리그를 열 수 없습니다" />;
  }

  return (
    <OffseasonMarket
      career={career}
      onCancelFreeAgentSigning={(offerId) =>
        dispatch(gameActions.cancelFreeAgentSigning(offerId))
      }
      onConfirmFreeAgentSigning={(offerId) =>
        dispatch(gameActions.confirmFreeAgentSigning(offerId))
      }
      onReleaseExpiredPlayer={(playerId) =>
        dispatch(gameActions.releaseExpiredOffseasonPlayer(playerId))
      }
      onSubmitFreeAgentOffer={(offer) =>
        dispatch(gameActions.submitFreeAgentOffer(offer))
      }
      onSubmitRenewalOffer={(offer) =>
        dispatch(gameActions.submitOffseasonRenewalOffer(offer))
      }
      onViewRoster={() => onGoTo("roster-builder")}
    />
  );
}
