import { useGame } from "../app/GameProvider";
import { OffseasonMarket } from "../features/offseason";

export function OffseasonPage() {
  const { state, dispatch } = useGame();

  if (!state.career) {
    return null;
  }

  return (
    <OffseasonMarket
      career={state.career}
      onReleaseExpiredPlayer={(playerId) =>
        dispatch({ type: "release-expired-offseason-player", playerId })
      }
      onSubmitFreeAgentOffer={(offer) =>
        dispatch({ type: "submit-free-agent-offer", offer })
      }
      onSubmitRenewalOffer={(offer) =>
        dispatch({ type: "submit-offseason-renewal-offer", offer })
      }
      onViewRoster={() => dispatch({ type: "go-to", route: "roster-builder" })}
    />
  );
}
