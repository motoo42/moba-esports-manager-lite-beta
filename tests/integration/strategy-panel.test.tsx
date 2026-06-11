import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StrategyPanel } from "../../src/features/match-week/StrategyPanel";

describe("StrategyPanel", () => {
  it("emits selected strategy and training intensity changes", () => {
    const onStrategyChange = vi.fn();
    const onTrainingIntensityChange = vi.fn();

    render(
      <StrategyPanel
        weeklyPlan={{
          strategy: "balanced",
          trainingIntensity: "normal",
        }}
        subPage="strategy"
        onStrategyChange={onStrategyChange}
        onTrainingIntensityChange={onTrainingIntensityChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /템포 지향/i }));
    fireEvent.click(screen.getByRole("button", { name: /고강도 훈련/i }));

    expect(onStrategyChange).toHaveBeenCalledWith("tempo");
    expect(onTrainingIntensityChange).toHaveBeenCalledWith("high");
    expect(screen.getByText("주간 계획")).toBeVisible();
    expect(
      screen.getAllByText(/특정 능력치에 크게 기대지 않는/).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/경기력 \+/).length).toBeGreaterThan(0);
  });
});
