import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding } from "./helpers";

// The approved design requires Today to fit one phone screen (390x844) without scrolling.
test.use({ viewport: { width: 390, height: 844 } });

const verticalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

test("Today shows the approved layout and fits the screen without scrolling", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "קדימה" }).click();
  await expect(page).toHaveURL(/\/today$/);

  await expect(page.getByRole("img", { name: /שבוע 15\+2, שליש שני/ })).toBeVisible();
  await expect(page.getByText("עוד 173 ימים ללידה")).toBeVisible();
  const upcoming = page.getByRole("region").or(page.locator("section")).filter({ hasText: "בקרוב" });
  await expect(upcoming.getByText("סקירה מוקדמת")).toBeVisible();
  await expect(upcoming.getByText("זה הזמן").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /לצלם עכשיו/ })).toBeVisible();
  await expect(page.getByText("סוף סוף מישהו בבית שמבין בטוסט אבוקדו")).toBeVisible();

  expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
});

test("Today still fits with the longest daily tip (three lines)", async ({ page }) => {
  // Day 91: the longest tip in the content, plus the belly-photo prompt and three upcoming tests.
  await completeOnboarding(page, { lmpDate: "2026-07-29" });
  await page.getByRole("button", { name: "קדימה" }).click();
  await expect(page.getByText("הבחילות נרגעות? זה הזמן להחזיר לתפריט")).toBeVisible();
  expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
});
