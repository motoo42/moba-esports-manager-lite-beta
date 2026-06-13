import { useEffect, useState } from "react";
import {
  getCareerGuideDefinition,
  type CareerGuideDefinition,
} from "../../domain/career/careerGuides";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import type { CareerGuideId } from "../../types/game";

type CareerGuideEntryProps = {
  guideId: CareerGuideId;
  hasSeenGuide: boolean;
  onMarkGuideSeen: () => void;
  showFirstEntryGuide: boolean;
};

function CareerGuideBanner({
  definition,
  onOpenGuide,
}: {
  definition: CareerGuideDefinition;
  onOpenGuide: () => void;
}) {
  return (
    <Card>
      <div className="career-guide-banner">
        <div>
          <span>{definition.eyebrow}</span>
          <strong>{definition.bannerTitle}</strong>
          <p>{definition.bannerBody}</p>
        </div>
        <Button variant="ghost" onClick={onOpenGuide}>
          {definition.buttonLabel}
        </Button>
      </div>
    </Card>
  );
}

function CareerGuideModal({
  definition,
  onClose,
}: {
  definition: CareerGuideDefinition;
  onClose: () => void;
}) {
  const titleId = `career-guide-${definition.id}-title`;

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="career-guide-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="modal-close-button"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <div>
          <p className="eyebrow">{definition.eyebrow}</p>
          <h2 id={titleId}>{definition.title}</h2>
          <p>{definition.summary}</p>
        </div>
        <div className="career-guide-points">
          {definition.points.map((point) => (
            <article key={point.label}>
              <span>{point.label}</span>
              <strong>{point.title}</strong>
              <p>{point.body}</p>
            </article>
          ))}
        </div>
        <div className="career-guide-note">
          <strong>{definition.noteTitle}</strong>
          <p>{definition.noteBody}</p>
        </div>
        <div className="season-summary-actions">
          <Button onClick={onClose}>확인</Button>
        </div>
      </section>
    </div>
  );
}

export function CareerGuideEntry({
  guideId,
  hasSeenGuide,
  onMarkGuideSeen,
  showFirstEntryGuide,
}: CareerGuideEntryProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const definition = getCareerGuideDefinition(guideId);

  useEffect(() => {
    if (showFirstEntryGuide && !hasSeenGuide) {
      setIsGuideOpen(true);
    }
  }, [guideId, hasSeenGuide, showFirstEntryGuide]);

  if (!definition) {
    return null;
  }

  function handleCloseGuide() {
    if (!hasSeenGuide) {
      onMarkGuideSeen();
    }

    setIsGuideOpen(false);
  }

  return (
    <>
      <CareerGuideBanner
        definition={definition}
        onOpenGuide={() => setIsGuideOpen(true)}
      />
      {isGuideOpen && (
        <CareerGuideModal definition={definition} onClose={handleCloseGuide} />
      )}
    </>
  );
}
