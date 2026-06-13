import { useMemo, useState } from "react";
import type { OffseasonSubPage } from "../../app/routes";
import { OFFSEASON_RULES_GUIDE_ID } from "../../domain/career/careerGuides";
import {
  getOffseasonMarketViewStatus,
  type OffseasonContractOfferInput,
} from "../../domain/season";
import { CareerGuideEntry } from "../career-guides";
import { Card } from "../../shared/ui/Card";
import { PlayerDetailModal } from "../../shared/ui/PlayerDetailModal";
import type { CareerSave } from "../../types/game";
import { ClosedOffseasonInfo } from "./ClosedOffseasonInfo";
import { ContractOfferModal } from "./ContractOfferModal";
import { ContractTab } from "./ContractTab";
import { FreeAgentTab } from "./FreeAgentTab";
import { LogTab } from "./LogTab";
import { RosterTab } from "./RosterTab";
import {
  getOffseasonSubPageFromTab,
  getOffseasonTabFromSubPage,
  getPlayer,
  getRosterTierLabel,
  OffseasonBudgetSummary,
  OffseasonPlayerMarketDetails,
  tabs,
  WeekTimeline,
  type NegotiationTarget,
  type OffseasonTab,
} from "./offseasonMarketShared";

type OffseasonMarketProps = {
  career: CareerSave;
  subPage?: OffseasonSubPage | null;
  onCancelFreeAgentSigning: (offerId: string) => void;
  onConfirmFreeAgentSigning: (offerId: string) => void;
  onReleaseExpiredPlayer: (playerId: string) => void;
  onSubmitFreeAgentOffer: (offer: OffseasonContractOfferInput) => void;
  onSubmitRenewalOffer: (offer: OffseasonContractOfferInput) => void;
  onSubPageChange?: (subPage: OffseasonSubPage) => void;
  onViewRoster: () => void;
  showFirstEntryGuide?: boolean;
  hasSeenRulesGuide?: boolean;
  onMarkRulesGuideSeen?: () => void;
};

export function OffseasonMarket({
  career,
  subPage,
  onCancelFreeAgentSigning,
  onConfirmFreeAgentSigning,
  onReleaseExpiredPlayer,
  onSubmitFreeAgentOffer,
  onSubmitRenewalOffer,
  onSubPageChange,
  onViewRoster,
  showFirstEntryGuide = false,
  hasSeenRulesGuide = true,
  onMarkRulesGuideSeen,
}: OffseasonMarketProps) {
  const [fallbackActiveTab, setFallbackActiveTab] =
    useState<OffseasonTab>("contracts");
  const [negotiationTarget, setNegotiationTarget] =
    useState<NegotiationTarget | null>(null);
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const offseason = career.seasonState.offseason;
  const validationErrors = offseason?.validationErrors ?? [];
  const marketViewStatus = getOffseasonMarketViewStatus(career);
  const activeTab = subPage
    ? getOffseasonTabFromSubPage(subPage)
    : fallbackActiveTab;
  const detailPlayer = detailPlayerId
    ? getPlayer(career.lckPlayers, detailPlayerId)
    : undefined;

  const activePanel = useMemo(() => {
    if (activeTab === "contracts") {
      return (
        <ContractTab
          career={career}
          onOpenNegotiation={setNegotiationTarget}
          onReleaseExpiredPlayer={onReleaseExpiredPlayer}
          onViewPlayer={(player) => setDetailPlayerId(player.id)}
        />
      );
    }

    if (activeTab === "free-agents") {
      return (
        <FreeAgentTab
          career={career}
          onCancelFreeAgentSigning={onCancelFreeAgentSigning}
          onConfirmFreeAgentSigning={onConfirmFreeAgentSigning}
          onOpenNegotiation={setNegotiationTarget}
          onViewPlayer={(player) => setDetailPlayerId(player.id)}
        />
      );
    }

    if (activeTab === "roster") {
      return <RosterTab career={career} onViewRoster={onViewRoster} />;
    }

    return <LogTab career={career} />;
  }, [
    activeTab,
    career,
    onCancelFreeAgentSigning,
    onConfirmFreeAgentSigning,
    onReleaseExpiredPlayer,
    onViewRoster,
  ]);

  if (marketViewStatus === "closed-info") {
    return <ClosedOffseasonInfo career={career} subPage={subPage} />;
  }

  return (
    <section className="stack offseason-page">
      <WeekTimeline career={career} />
      <OffseasonBudgetSummary career={career} />
      <CareerGuideEntry
        guideId={OFFSEASON_RULES_GUIDE_ID}
        hasSeenGuide={hasSeenRulesGuide}
        onMarkGuideSeen={() => onMarkRulesGuideSeen?.()}
        showFirstEntryGuide={showFirstEntryGuide}
      />
      {validationErrors.length > 0 && (
        <div className="offseason-validation-box">
          {validationErrors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}
      <Card>
        <div className="offseason-tab-list">
          {tabs.map((tab) => (
            <button
              className={`offseason-tab ${
                activeTab === tab.id ? "offseason-tab-active" : ""
              }`}
              key={tab.id}
              onClick={() => {
                setFallbackActiveTab(tab.id);
                onSubPageChange?.(getOffseasonSubPageFromTab(tab.id));
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activePanel}
      </Card>
      {negotiationTarget && (
        <ContractOfferModal
          career={career}
          key={`${negotiationTarget.mode}-${negotiationTarget.playerId}`}
          onClose={() => setNegotiationTarget(null)}
          onSubmit={
            negotiationTarget.mode === "renewal"
              ? onSubmitRenewalOffer
              : onSubmitFreeAgentOffer
          }
          target={negotiationTarget}
        />
      )}
      {detailPlayer && (
        <PlayerDetailModal
          extraContent={<OffseasonPlayerMarketDetails player={detailPlayer} />}
          onClose={() => setDetailPlayerId(null)}
          player={detailPlayer}
          rosterLabel={getRosterTierLabel(detailPlayer)}
          titlePrefix="Stove League Profile"
        />
      )}
    </section>
  );
}
