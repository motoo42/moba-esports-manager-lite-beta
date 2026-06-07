import { useMemo, useState } from "react";
import { Card } from "../../shared/ui/Card";
import { StatPill } from "../../shared/ui/StatPill";
import type { Player, Role } from "../../types/game";

type PlayerMarketProps = {
  players: Player[];
  selectedRoster: Partial<Record<Role, string>>;
  signedPlayerIds: string[];
  onSignPlayer: (player: Player) => void;
  onSelectStarter: (role: Role, player: Player) => void;
};

export function PlayerMarket({
  players,
  selectedRoster,
  signedPlayerIds,
  onSignPlayer,
  onSelectStarter,
}: PlayerMarketProps) {
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const starterIds = new Set(Object.values(selectedRoster));
  const signedIds = new Set(signedPlayerIds);
  const teamOptions = useMemo(
    () =>
      [
        ...new Set(
          players
            .map((player) => player.currentTeam)
            .filter((teamName): teamName is string => Boolean(teamName)),
        ),
      ]
        .sort((a, b) => a.localeCompare(b)),
    [players],
  );
  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return players
      .filter((player) => {
        const matchesTeam =
          teamFilter === "all" || player.currentTeam === teamFilter;
        const matchesRole = roleFilter === "all" || player.role === roleFilter;
        const matchesTier =
          tierFilter === "all" || (player.rosterTier ?? "main") === tierFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          player.name.toLowerCase().includes(normalizedSearch) ||
          (player.realName?.toLowerCase().includes(normalizedSearch) ?? false);

        return matchesTeam && matchesRole && matchesTier && matchesSearch;
      })
      .sort((a, b) => {
        const teamCompare = (a.currentTeam ?? "").localeCompare(b.currentTeam ?? "");

        if (teamCompare !== 0) {
          return teamCompare;
        }

        const roleCompare = a.role.localeCompare(b.role);

        if (roleCompare !== 0) {
          return roleCompare;
        }

        return b.overall - a.overall || a.name.localeCompare(b.name);
      });
  }, [players, roleFilter, searchQuery, teamFilter, tierFilter]);

  return (
    <Card>
      <h2>LCK player pool</h2>
      <div className="player-market-controls">
        <label className="field compact-field">
          <span>Team</span>
          <select
            aria-label="Filter players by team"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
          >
            <option value="all">All teams</option>
            {teamOptions.map((teamName) => (
              <option key={teamName} value={teamName}>
                {teamName}
              </option>
            ))}
          </select>
        </label>
        <label className="field compact-field">
          <span>Position</span>
          <select
            aria-label="Filter players by position"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | "all")}
          >
            <option value="all">All positions</option>
            <option value="top">TOP</option>
            <option value="jungle">JGL</option>
            <option value="mid">MID</option>
            <option value="bot">BOT</option>
            <option value="support">SUP</option>
          </select>
        </label>
        <label className="field compact-field">
          <span>Tier</span>
          <select
            aria-label="Filter players by roster tier"
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
          >
            <option value="all">All tiers</option>
            <option value="main">Main</option>
            <option value="academy">Academy</option>
          </select>
        </label>
        <label className="field compact-field search-field">
          <span>Search</span>
          <input
            aria-label="Search players"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Name"
          />
        </label>
      </div>
      <p className="muted">
        Showing {filteredPlayers.length} / {players.length} players
      </p>
      <div className="player-list">
        {filteredPlayers.map((player) => {
          const isSigned = signedIds.has(player.id);
          const isStarter = starterIds.has(player.id);

          return (
            <article className="player-card" key={player.id}>
              <span className="player-card-header">
                <strong>{player.name}</strong>
                <span>{player.role}</span>
              </span>
              <span className="muted">
                {player.currentTeam} · {player.rosterTier ?? "main"}
              </span>
              <span className="pill-row">
                <StatPill label="OVR" value={player.overall} />
                <StatPill label="POT" value={player.potential} />
                <StatPill label="Salary" value={player.salaryExpectation} />
              </span>
              <span className="player-card-actions">
                <button
                  aria-label={`${isSigned ? "Signed" : "Sign"} ${player.name}`}
                  className="button button-ghost"
                  disabled={isSigned}
                  onClick={() => onSignPlayer(player)}
                  type="button"
                >
                  {isSigned ? "Signed" : "Sign"}
                </button>
                <button
                  aria-label={`${isStarter ? "Starter" : "Start"} ${player.name}`}
                  className="button button-primary"
                  disabled={!isSigned || isStarter}
                  onClick={() => onSelectStarter(player.role, player)}
                  type="button"
                >
                  {isStarter ? "Starter" : "Start"}
                </button>
              </span>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
