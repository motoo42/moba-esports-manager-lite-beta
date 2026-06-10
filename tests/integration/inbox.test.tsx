import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

function getMainContent() {
  const main = document.querySelector(".app-main");

  if (!main) {
    throw new Error("App main content was not rendered.");
  }

  return within(main as HTMLElement);
}

describe("Inbox", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ saves: [] })),
    );
  });

  it("opens the inbox route from the sidebar and marks messages read", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));

    fireEvent.click(await screen.findByTestId("shell-menu-inbox"));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));

    expect(
      screen.getByRole("heading", { level: 1, name: "메시지함" }),
    ).toBeVisible();
    expect(
      within(screen.getByLabelText("메시지 목록")).getByText(
        "프리시즌 스토브리그 시작",
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: /중요/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox/important"));
    expect(
      within(screen.getByLabelText("메시지 목록")).getByText(
        "프리시즌 스토브리그 시작",
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: /전체/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));

    fireEvent.click(screen.getByRole("button", { name: "모두 읽음" }));
    expect(screen.getByText(/읽지 않음/)).toHaveTextContent("읽지 않음 0");
  });

  it("opens inbox category routes directly from the sidebar submenu", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));

    fireEvent.click(await screen.findByTestId("shell-menu-inbox"));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));

    fireEvent.click(screen.getByRole("button", { name: "이적" }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox/transfer"));
    expect(screen.getByRole("tab", { name: /이적/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "일정" }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox/schedule"));
    expect(screen.getByRole("tab", { name: /일정/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("shows recent messages on the main dashboard", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));

    fireEvent.click(await screen.findByTestId("shell-menu-home"));
    await waitFor(() => expect(window.location.pathname).toBe("/hub"));

    expect(getMainContent().getByText("최근 메시지")).toBeVisible();
    expect(getMainContent().getByText("프리시즌 스토브리그 시작")).toBeVisible();

    fireEvent.click(
      getMainContent().getByRole("button", { name: "메시지함으로 이동" }),
    );
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));
  });
});
