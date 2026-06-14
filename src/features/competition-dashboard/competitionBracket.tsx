import type { CSSProperties } from "react";

export type CompetitionBracketSlot = {
  detail?: string;
  isPlaceholder?: boolean;
  isWinner?: boolean;
  label: string;
  teamId?: string;
  teamName: string;
};

export type CompetitionBracketMatch = {
  flowHint?: string;
  id: string;
  isCurrent?: boolean;
  meta?: string;
  slots: CompetitionBracketSlot[];
  subtitle?: string;
  title: string;
};

export type CompetitionBracketColumn = {
  align?: "center" | "spread" | "start";
  className?: string;
  id: string;
  matches: CompetitionBracketMatch[];
  note?: string;
  title: string;
};

export type CompetitionBracketResultCard = {
  detail?: string;
  id: string;
  label: string;
  title: string;
  tone?: "bronze" | "gold" | "silver" | "worlds";
  value: string;
};

type CompetitionBracketProps = {
  boardClassName?: string;
  className?: string;
  columns: CompetitionBracketColumn[];
  minWidth?: string;
  resultCards?: CompetitionBracketResultCard[];
  resultTitle?: string;
  userTeamId?: string;
};

function CompetitionBracketTeamSlot({
  slot,
  userTeamId,
}: {
  slot: CompetitionBracketSlot;
  userTeamId: string | undefined;
}) {
  const classes = [
    "competition-bracket-team",
    slot.isPlaceholder ? "competition-bracket-team-placeholder" : "",
    slot.teamId === userTeamId ? "competition-bracket-team-user" : "",
    slot.isWinner ? "competition-bracket-team-winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span>{slot.label}</span>
      <strong>{slot.teamName}</strong>
      {slot.detail && <small>{slot.detail}</small>}
    </div>
  );
}

function CompetitionBracketMatchCard({
  match,
  userTeamId,
}: {
  match: CompetitionBracketMatch;
  userTeamId: string | undefined;
}) {
  return (
    <article
      className={`competition-bracket-match ${
        match.isCurrent ? "competition-bracket-match-current" : ""
      }`}
    >
      <header>
        <div>
          <strong>{match.title}</strong>
          {match.subtitle && <span>{match.subtitle}</span>}
        </div>
        {match.meta && <b>{match.meta}</b>}
      </header>
      <div className="competition-bracket-team-list">
        {match.slots.map((slot, index) => (
          <CompetitionBracketTeamSlot
            key={`${match.id}-${slot.label}-${index}`}
            slot={slot}
            userTeamId={userTeamId}
          />
        ))}
      </div>
      {match.flowHint && <small className="competition-bracket-flow">{match.flowHint}</small>}
    </article>
  );
}

function CompetitionBracketResult({
  card,
}: {
  card: CompetitionBracketResultCard;
}) {
  return (
    <article
      className={`competition-bracket-result ${
        card.tone ? `competition-bracket-result-${card.tone}` : ""
      }`}
    >
      <span>{card.label}</span>
      <strong>{card.value}</strong>
      {card.detail && <small>{card.detail}</small>}
    </article>
  );
}

export function CompetitionBracket({
  boardClassName,
  className,
  columns,
  minWidth = "920px",
  resultCards,
  resultTitle = "결과",
  userTeamId,
}: CompetitionBracketProps) {
  const style = {
    "--competition-bracket-min-width": minWidth,
  } as CSSProperties;

  return (
    <div className={`competition-bracket-frame ${className ?? ""}`} style={style}>
      <div className={`competition-bracket-board ${boardClassName ?? ""}`}>
        {columns.map((column) => (
          <section
            className={[
              "competition-bracket-column",
              `competition-bracket-column-${column.align ?? "spread"}`,
              `competition-bracket-column-${column.id}`,
              column.className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={column.id}
          >
            <h3>{column.title}</h3>
            {column.note && <p>{column.note}</p>}
            <div className="competition-bracket-match-stack">
              {column.matches.map((match) => (
                <CompetitionBracketMatchCard
                  key={match.id}
                  match={match}
                  userTeamId={userTeamId}
                />
              ))}
            </div>
          </section>
        ))}
        {resultCards && resultCards.length > 0 && (
          <aside className="competition-bracket-results">
            <h3>{resultTitle}</h3>
            <div className="competition-bracket-result-stack">
              {resultCards.map((card) => (
                <CompetitionBracketResult card={card} key={card.id} />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
