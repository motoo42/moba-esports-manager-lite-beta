import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

describe("App routing", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ saves: [] })),
    );
  });

  it("navigates calendar submenu clicks to URL subpages", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    fireEvent.click(await screen.findByTestId("shell-menu-calendar"));

    await waitFor(() => expect(window.location.pathname).toBe("/calendar"));

    fireEvent.click(screen.getAllByRole("button", { name: "달력" })[0]);

    await waitFor(() =>
      expect(window.location.pathname).toBe("/calendar/calendar"),
    );
    expect(screen.getByText("Selected Day")).toBeVisible();
  });
});
