import { expect, type Page, test } from "@playwright/test";

async function clickButtonByName(page: Page, name: string) {
  const button = page.getByRole("button", { name });

  await expect(button).toBeVisible();
  await button.dispatchEvent("click");
}

test("user can create a career, build a roster, and simulate a match", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: /team name/i }).fill("System Test FC");
  await page.getByRole("button", { name: /start career/i }).click();

  await expect(page).toHaveURL(/\/roster$/);
  await expect(
    page.getByRole("heading", { name: "System Test FC roster contracts" }),
  ).toBeVisible();

  const signedPlayers = [
    "Zeus",
    "Oner",
    "Faker",
    "Gumayusi",
    "Keria",
    "Chovy",
    "Doran",
    "Kiin",
    "Siwoo",
    "Canyon",
  ];
  const starters = ["Zeus", "Oner", "Faker", "Gumayusi", "Keria"];

  for (const playerName of signedPlayers) {
    await clickButtonByName(page, `Sign ${playerName}`);
    await expect(
      page.getByRole("button", { name: `Signed ${playerName}` }),
    ).toBeDisabled();
  }

  for (const playerName of starters) {
    await clickButtonByName(page, `Start ${playerName}`);
    await expect(
      page.getByRole("button", { name: `Starter ${playerName}` }),
    ).toBeDisabled();
  }

  await page.getByRole("button", { name: /confirm roster and contracts/i }).click();
  await expect(page).toHaveURL(/\/hub$/);

  await page.getByTestId("shell-menu-training").click();
  await expect(page).toHaveURL(/\/match$/);
  await page.getByRole("button", { name: /simulate match/i }).dispatchEvent("click");

  await expect(page.getByText(/winner:/i)).toBeVisible();
});
