import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerPortrait } from "../../src/shared/ui/PlayerPortrait";

describe("PlayerPortrait", () => {
  it("renders a local player portrait when a portrait url exists", () => {
    render(
      <PlayerPortrait
        player={{
          name: "Faker",
          portraitUrl: "/assets/players/lck/2026/main/t1-faker.png",
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Faker portrait" })).toHaveAttribute(
      "src",
      "/assets/players/lck/2026/main/t1-faker.png",
    );
  });

  it("falls back to initials when the image fails to load", () => {
    render(
      <PlayerPortrait
        player={{
          name: "Faker",
          portraitUrl: "/assets/players/lck/2026/main/missing.png",
        }}
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Faker portrait" }));

    expect(screen.getByText("FA")).toBeInTheDocument();
  });
});
