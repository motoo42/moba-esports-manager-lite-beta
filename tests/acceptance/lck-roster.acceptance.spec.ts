import { expect, test } from "@playwright/test";

test("acceptance: roster confirmation requires all five roles", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /start career/i }).click();
  await expect(page).toHaveURL(/\/roster$/);

  await expect(page.getByText("Missing top starter.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /confirm roster and contracts/i }),
  ).toBeDisabled();
});
