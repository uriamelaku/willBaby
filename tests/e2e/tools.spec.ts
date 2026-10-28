import { expect, test } from "@playwright/test";
import { completeOnboarding } from "./helpers";

test.beforeEach(async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "קדימה" }).click();
  await page.getByRole("link", { name: "כלים" }).click();
});

test("kick counter counts, undoes and saves a session", async ({ page }) => {
  await page.getByRole("link", { name: /מונה בעיטות/ }).click();
  await page.getByRole("button", { name: "מתחילים לספור" }).click();

  const kick = page.getByRole("button", { name: "בעיטה!" });
  await kick.click();
  await kick.click();
  await kick.click();
  await expect(page.getByText("3 תזוזות", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ביטול האחרונה" }).click();
  await expect(page.getByText("2 תזוזות", { exact: true })).toBeVisible();

  // The running session survives a reload.
  await page.reload();
  await expect(page.getByText("2 תזוזות", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "סיום" }).click();
  await expect(page.getByText(/2 תזוזות ב-/)).toBeVisible();
  await expect(page.getByRole("button", { name: "מתחילים לספור" })).toBeVisible();
  await expect(page.getByText("אם משהו מרגיש לא בסדר")).toBeVisible();
});
