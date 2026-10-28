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

test("contraction timer records contractions and their interval", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-28T10:00:00+02:00") });
  await page.getByRole("link", { name: /טיימר צירים/ }).click();

  await page.getByRole("button", { name: "ציר התחיל" }).click();
  await page.clock.runFor(45_000);
  await page.getByRole("button", { name: /הציר נגמר/ }).click();
  await page.clock.runFor(5 * 60_000);
  await page.getByRole("button", { name: "ציר התחיל" }).click();
  await page.clock.runFor(60_000);
  await page.getByRole("button", { name: /הציר נגמר/ }).click();

  const rows = page.getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("1:00");
  await expect(rows.nth(1)).toContainText("5:45");
  await expect(rows.nth(2)).toContainText("0:45");
  await expect(page.getByText("אם משהו מרגיש לא בסדר")).toBeVisible();
});
