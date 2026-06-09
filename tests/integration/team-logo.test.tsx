import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lck2026Teams } from "../../src/data/lckTeams";
import { TeamLogo } from "../../src/shared/ui/TeamLogo";

describe("TeamLogo", () => {
  it("renders a local team logo when a logo url exists", () => {
    const team = lck2026Teams.find((candidate) => candidate.id === "t1")!;

    render(<TeamLogo team={team} />);

    expect(screen.getByRole("img", { name: "T1 logo" })).toHaveAttribute(
      "src",
      "/assets/logos/lck/teams/2026/t1.webp",
    );
  });

  it("renders the LCK league logo", () => {
    render(<TeamLogo variant="league" />);

    expect(screen.getByRole("img", { name: "LCK logo" })).toHaveAttribute(
      "src",
      "/assets/logos/lck/lck-logo.svg",
    );
  });

  it("falls back to the team short name when the image fails to load", () => {
    const team = {
      id: "test-team",
      name: "Test Team",
      shortName: "TT",
      logoUrl: "/assets/logos/lck/teams/2026/missing.webp",
    };

    render(<TeamLogo team={team} />);

    fireEvent.error(screen.getByRole("img", { name: "Test Team logo" }));

    expect(screen.getByText("TT")).toBeInTheDocument();
  });
});
