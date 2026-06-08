import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { lck2026Teams } from "../../src/data/lckTeams";
import { CareerSetup } from "../../src/features/career-setup";

describe("CareerSetup", () => {
  it("renders the 10 LCK team choices and starts from the selected team", () => {
    const onStart = vi.fn();

    render(<CareerSetup onStart={onStart} />);

    for (const team of lck2026Teams) {
      expect(
        screen.getByRole("button", { name: new RegExp(team.name) }),
      ).toBeVisible();
    }

    fireEvent.click(screen.getByRole("button", { name: /Gen\.G/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start career" }));

    expect(onStart).toHaveBeenCalledWith("Gen.G");
  });
});
