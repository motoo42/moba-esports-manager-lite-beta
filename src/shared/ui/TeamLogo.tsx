import { useEffect, useState } from "react";
import {
  findLckTeamSeed,
  lckLeagueLogo,
  type LckTeamSeed,
} from "../../data/lckTeams";

type TeamLogoProps = {
  className?: string;
  fallbackLabel?: string;
  size?: "sm" | "md" | "lg" | "xl";
  team?: Pick<LckTeamSeed, "id" | "name" | "shortName" | "logoUrl"> | null;
  teamId?: string | null;
  teamName?: string | null;
  variant?: "team" | "league";
};

function getFallbackLabel({
  fallbackLabel,
  team,
  variant,
}: {
  fallbackLabel?: string;
  team?: Pick<LckTeamSeed, "shortName"> | null;
  variant: "team" | "league";
}) {
  if (fallbackLabel) {
    return fallbackLabel;
  }

  if (team?.shortName) {
    return team.shortName;
  }

  return variant === "league" ? "LCK" : "TM";
}

function resolveTeam({
  team,
  teamId,
  teamName,
}: Pick<TeamLogoProps, "team" | "teamId" | "teamName">) {
  if (team) {
    return team;
  }

  if (teamId) {
    return findLckTeamSeed(teamId);
  }

  if (teamName) {
    return findLckTeamSeed(teamName);
  }

  return undefined;
}

export function TeamLogo({
  className = "",
  fallbackLabel,
  size = "md",
  team,
  teamId,
  teamName,
  variant = "team",
}: TeamLogoProps) {
  const resolvedTeam = variant === "league" ? undefined : resolveTeam({ team, teamId, teamName });
  const logoUrl =
    variant === "league" ? lckLeagueLogo.logoUrl : resolvedTeam?.logoUrl;
  const [failed, setFailed] = useState(false);
  const shouldShowImage = Boolean(logoUrl) && !failed;
  const label = getFallbackLabel({
    fallbackLabel,
    team: resolvedTeam,
    variant,
  });
  const name = variant === "league" ? "LCK" : resolvedTeam?.name ?? label;
  const classes = [
    "team-logo",
    `team-logo-${size}`,
    `team-logo-${variant}`,
    shouldShowImage ? "team-logo-image" : "team-logo-fallback",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  return (
    <span className={classes} data-testid="team-logo">
      {shouldShowImage ? (
        <img
          alt={`${name} logo`}
          src={logoUrl}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{label}</span>
      )}
    </span>
  );
}
