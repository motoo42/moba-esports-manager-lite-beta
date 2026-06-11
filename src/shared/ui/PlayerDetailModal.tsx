import type { ReactNode } from "react";
import { getLckTeamDisplayName } from "../../data/lckTeams";
import {
  getPlayerCareerEntries,
  getPlayerProfileSummary,
} from "../../domain/players";
import { getMoraleLabel } from "../../domain/player-status";
import type { Player, Role } from "../../types/game";
import { EvaluationStars } from "./EvaluationStars";
import { MoraleIndicator } from "./MoraleIndicator";
import { PlayerPortrait } from "./PlayerPortrait";

type PlayerDetailModalProps = {
  extraContent?: ReactNode;
  onClose: () => void;
  player: Player;
  rosterLabel?: string;
  titlePrefix?: string;
};

const roleLabels: Record<Role, string> = {
  top: "탑",
  jungle: "정글",
  mid: "미드",
  bot: "원딜",
  support: "서폿",
};

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <article className="player-detail-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function PlayerDetailModal({
  extraContent,
  onClose,
  player,
  rosterLabel,
  titlePrefix = "Player Profile",
}: PlayerDetailModalProps) {
  const currentTeamLabel = player.currentTeam
    ? getLckTeamDisplayName(player.currentTeam)
    : "FA";
  const careerEntries = getPlayerCareerEntries(player);

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-label={`${player.name} 선수 상세`}
        aria-modal="true"
        className="player-detail-modal player-detail-modal-large"
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

        <div className="player-detail-hero player-detail-hero-large">
          <PlayerPortrait
            className="player-detail-portrait"
            player={player}
            size="lg"
          />
          <div className="player-detail-hero-copy">
            <p className="eyebrow">{titlePrefix}</p>
            <h2>{player.name}</h2>
            <p className="player-detail-subtitle">
              {roleLabels[player.role]} · {player.age}세 · {currentTeamLabel}
              {rosterLabel ? ` · ${rosterLabel}` : ""}
            </p>
            <EvaluationStars player={player} />
            <p className="player-detail-profile-summary">
              {getPlayerProfileSummary(player)}
            </p>
          </div>
        </div>

        <div className="player-detail-grid">
          <DetailMetric label="컨디션" value={player.status.condition} />
          <DetailMetric label="피로도" value={player.status.fatigue} />
          <DetailMetric label="부상 위험" value={player.status.injuryRisk} />
          <DetailMetric
            label="사기"
            value={
              <span className="player-detail-morale-value">
                <MoraleIndicator level={player.status.morale} />
                {getMoraleLabel(player.status.morale)}
              </span>
            }
          />
        </div>

        <section className="player-detail-section">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Career</p>
              <h3>커리어</h3>
            </div>
            <span className="panel-note">대표 기록 / 현재 소속 기반</span>
          </div>
          <div className="player-detail-career-list">
            {careerEntries.map((entry) => (
              <article
                className="player-detail-career-entry"
                key={`${entry.teamName}-${entry.period}`}
              >
                <strong>{entry.teamName}</strong>
                <span>{entry.period}</span>
                {entry.note && <small>{entry.note}</small>}
              </article>
            ))}
          </div>
        </section>

        {extraContent}

        <section className="player-detail-section">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Traits</p>
              <h3>특징</h3>
            </div>
          </div>
          <div className="trait-row">
            {player.traits.length > 0 ? (
              player.traits.map((trait) => <span key={trait}>{trait}</span>)
            ) : (
              <span>기록된 특징 없음</span>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
