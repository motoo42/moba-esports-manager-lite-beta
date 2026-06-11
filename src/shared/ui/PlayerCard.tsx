import type { KeyboardEvent, ReactNode } from "react";
import type { Player } from "../../types/game";
import { EvaluationStars } from "./EvaluationStars";
import { PlayerPortrait } from "./PlayerPortrait";

type PlayerCardVariant = "starter" | "standard" | "compact" | "detail";

type PlayerCardProps = {
  actions?: ReactNode;
  className?: string;
  draggableProps?: Record<string, unknown>;
  meta?: ReactNode;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  player: Player;
  rosterLabel?: string;
  variant?: PlayerCardVariant;
};

const roleLabels: Record<Player["role"], string> = {
  top: "TOP",
  jungle: "JGL",
  mid: "MID",
  bot: "BOT",
  support: "SUP",
};

function getPortraitSize(variant: PlayerCardVariant) {
  if (variant === "compact") {
    return "md";
  }

  return "lg";
}

export function PlayerCard({
  actions,
  className = "",
  draggableProps,
  meta,
  onClick,
  onKeyDown,
  player,
  rosterLabel,
  variant = "standard",
}: PlayerCardProps) {
  const interactive = Boolean(onClick);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented || !onClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={`game-player-card game-player-card-${variant} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...draggableProps}
    >
      <PlayerPortrait
        className="game-player-card-portrait"
        player={player}
        size={getPortraitSize(variant)}
      />
      <div className="game-player-card-body">
        <div className="game-player-card-title-row">
          <strong>{player.name}</strong>
          <span>{roleLabels[player.role]}</span>
        </div>
        {rosterLabel && <small>{rosterLabel}</small>}
        <EvaluationStars compact={variant === "compact"} player={player} />
        {meta && <div className="game-player-card-meta">{meta}</div>}
      </div>
      {actions && <div className="game-player-card-actions">{actions}</div>}
    </article>
  );
}
