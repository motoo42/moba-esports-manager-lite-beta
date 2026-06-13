import { describe, expect, it } from "vitest";
import { lck2026Players } from "../../src/data/lck2026Players";
import { lck2026MainPortraitCount } from "../../src/data/lck2026PlayerPortraits";
import {
  getLckTeamDisplayName,
  lck2026Teams,
  lckLeagueLogo,
} from "../../src/data/lckTeams";
import { offseasonFreeAgentSeeds } from "../../src/data/offseasonFreeAgents";
import { samplePlayers } from "../../src/data/samplePlayers";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import type { Role } from "../../src/types/game";

const requiredRoles: Role[] = ["top", "jungle", "mid", "bot", "support"];

describe("lck2026Players", () => {
  it("covers every 2026 LCK team with a complete 1st+2nd roster shell", () => {
    for (const team of lck2026Teams) {
      const players = lck2026Players.filter(
        (player) => player.currentTeam === team.name,
      );

      expect(players.length, team.name).toBeGreaterThanOrEqual(10);

      const roles = new Set(players.map((player) => player.role));

      for (const role of requiredRoles) {
        expect(roles.has(role), `${team.name} missing ${role}`).toBe(true);
      }
    }
  });

  it("keeps player ids unique", () => {
    const ids = lck2026Players.map((player) => player.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("attaches local portraits to every 2026 LCK main roster player only", () => {
    const mainPlayers = lck2026Players.filter(
      (player) => player.rosterTier === "main",
    );
    const academyPlayers = lck2026Players.filter(
      (player) => player.rosterTier === "academy",
    );

    expect(mainPlayers).toHaveLength(lck2026MainPortraitCount);
    expect(mainPlayers.every((player) => player.portraitUrl)).toBe(true);
    expect(mainPlayers.every((player) => player.portraitSourceUrl)).toBe(true);
    expect(
      mainPlayers.every((player) =>
        player.portraitUrl?.startsWith("/assets/players/lck/2026/main/"),
      ),
    ).toBe(true);
    expect(academyPlayers.some((player) => player.portraitUrl)).toBe(false);
  });

  it("preserves existing sample player ids while allowing rating overrides", () => {
    const sampleFaker = samplePlayers.find((player) => player.name === "Faker");
    const lckFaker = lck2026Players.find((player) => player.name === "Faker");

    expect(sampleFaker).toBeDefined();
    expect(lckFaker).toMatchObject({
      id: sampleFaker?.id,
      ability: 86,
      overall: 86,
      potential: 87,
      currentTeam: "T1",
      rosterTier: "main",
      source: "lck-2026-rounds-1-2",
      age: 30,
    });
  });

  it("uses rating overrides for user-adjustable balance entries", () => {
    const bdd = lck2026Players.find((player) => player.name === "Bdd");

    expect(bdd).toMatchObject({
      currentTeam: "KT Rolster",
      ability: 86,
      overall: 86,
      potential: 87,
      salaryExpectation: 130,
    });
  });

  it("registers Ghost as a KT Rolster academy support", () => {
    const ghost = lck2026Players.find(
      (player) => player.name === "Ghost" && player.currentTeam === "KT Rolster",
    );

    expect(ghost).toMatchObject({
      role: "support",
      rosterTier: "academy",
    });
  });

  it("uses the S-C team balance tier model for 2026", () => {
    expect(
      lck2026Teams.map((team) => [team.name, team.tier]),
    ).toEqual([
      ["Gen.G", "S"],
      ["Hanwha Life Esports", "S"],
      ["T1", "S"],
      ["KT Rolster", "A"],
      ["Dplus KIA", "A"],
      ["Hanjin BRION", "B"],
      ["BNK FEARX", "B"],
      ["Nongshim RedForce", "B"],
      ["Kiwoom DRX", "C"],
      ["DN SOOPers", "C"],
    ]);
  });

  it("provides Korean display names without changing internal team names", () => {
    expect(getLckTeamDisplayName("Gen.G")).toBe("젠지");
    expect(getLckTeamDisplayName("DN SOOPers")).toBe("DN 수퍼스");
    expect(getLckTeamDisplayName("dn-soopers")).toBe("DN 수퍼스");
    expect(getLckTeamDisplayName("Unknown Team")).toBe("Unknown Team");
    expect(lck2026Teams.find((team) => team.id === "dn-soopers")?.name).toBe(
      "DN SOOPers",
    );
  });

  it("attaches local logo assets to every 2026 LCK team", () => {
    expect(lckLeagueLogo.logoUrl).toBe("/assets/logos/lck/lck-logo.svg");
    expect(lckLeagueLogo.logoSourceUrl).toContain("wikimedia.org");

    for (const team of lck2026Teams) {
      expect(team.logoUrl, team.name).toMatch(
        /^\/assets\/logos\/lck\/teams\/2026\/.+\.webp$/,
      );
      expect(team.logoSourceUrl, team.name).toContain("lol.fandom.com");
    }
  });

  it("uses the first-pass 2026 LCK salary budget profile", () => {
    expect(
      Object.fromEntries(lck2026Teams.map((team) => [team.name, team.budget])),
    ).toEqual({
      "BNK FEARX": 350,
      "DN SOOPers": 370,
      "Dplus KIA": 480,
      "Gen.G": 880,
      "Hanjin BRION": 370,
      "Hanwha Life Esports": 900,
      "KT Rolster": 550,
      "Kiwoom DRX": 330,
      "Nongshim RedForce": 430,
      T1: 900,
    });

    expect(lck2026Players.find((player) => player.name === "Faker"))
      .toMatchObject({ salaryExpectation: 250 });
    expect(lck2026Players.find((player) => player.name === "Keria"))
      .toMatchObject({ salaryExpectation: 240 });
    expect(lck2026Players.find((player) => player.name === "Chovy"))
      .toMatchObject({ salaryExpectation: 300 });

    for (const team of lck2026Teams) {
      const salaryTotal = lck2026Players
        .filter((player) => player.currentTeam === team.name)
        .reduce((total, player) => total + player.salaryExpectation, 0);

      expect(salaryTotal, team.name).toBeLessThanOrEqual(team.budget);
    }

    const t1AcademyTotal = lck2026Players
      .filter(
        (player) =>
          player.currentTeam === "T1" && player.rosterTier === "academy",
      )
      .reduce((total, player) => total + player.salaryExpectation, 0);

    expect(t1AcademyTotal).toBe(80);
  });

  it("starts new careers from the selected team balance profile", () => {
    const career = createInitialCareer("T1");

    expect(career.userTeam.budget).toBe(900);
    expect(career.userTeam.elo).toBe(1670);
  });

  it("starts new careers from another selected LCK team profile", () => {
    const career = createInitialCareer("Gen.G");

    expect(career.userTeam.name).toBe("Gen.G");
    expect(career.userTeam.budget).toBe(880);
    expect(career.userTeam.elo).toBe(1690);
    expect(career.seasonState.offseason?.expiredContractPlayerIds.length).toBeGreaterThan(0);
    expect(
      career.lckPlayers
        .filter((player) =>
          career.seasonState.offseason?.expiredContractPlayerIds.includes(player.id),
        )
        .every((player) => player.currentTeam === "Gen.G"),
    ).toBe(true);
  });

  it("deduplicates names that also exist in the offseason free agent seed", () => {
    const overlappingNames = offseasonFreeAgentSeeds
      .map((player) => player.name)
      .filter((name) => lck2026Players.some((player) => player.name === name));

    for (const name of overlappingNames) {
      expect(
        lck2026Players.filter((player) => player.name === name),
        name,
      ).toHaveLength(1);
    }
  });

  it("starts new careers with the 2026 LCK full player pool and true preseason FA seeds", () => {
    const career = createInitialCareer("T1");
    const faker = career.lckPlayers.find((player) => player.id === "lck-mid-01");
    const beryl = career.lckPlayers.find((player) => player.id === "fa-2026-beryl");

    expect(career.lckPlayers.length).toBeGreaterThan(lck2026Players.length);
    expect(faker?.currentTeam).toBe("T1");
    expect(beryl).toBeDefined();
    expect(beryl?.currentTeam).toBeUndefined();
    expect(beryl?.portraitUrl).toBe("/assets/players/lck/2026/fa/beryl.png");
    expect(beryl?.portraitSourceUrl).toBe(
      "https://lol.fandom.com/wiki/File:DK_BeryL_2025_Split_1.png",
    );
    expect(career.seasonState.offseason?.freeAgentPlayerIds).toContain(
      "fa-2026-beryl",
    );
  });

  it("can start directly from the selected team's real 2026 roster into LCK Cup", () => {
    const career = createInitialCareer("KT Rolster", {
      startMode: "real-roster-lck-cup",
    });
    const contractedIds = new Set(
      career.userTeam.contracts.map((contract) => contract.playerId),
    );
    const ktPlayers = career.lckPlayers.filter(
      (player) => player.currentTeam === "KT Rolster",
    );

    expect(career.userTeam.name).toBe("KT Rolster");
    expect(career.seasonState.phase).toBe("competition");
    expect(career.seasonState.currentCompetitionId).toBe("lck-cup");
    expect(career.seasonState.offseason).toBeUndefined();
    expect(career.userTeam.mainRosterPlayerIds.length).toBeGreaterThanOrEqual(5);
    expect(career.userTeam.academyRosterPlayerIds.length).toBeGreaterThanOrEqual(5);
    expect(Object.values(career.userTeam.roster).filter(Boolean)).toHaveLength(5);
    expect(ktPlayers.every((player) => contractedIds.has(player.id))).toBe(true);
    expect(
      career.userTeam.contracts.every((contract) => contract.remainingYears > 0),
    ).toBe(true);
  });
});
