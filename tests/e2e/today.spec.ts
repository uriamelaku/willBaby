import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding, enterApp } from "./helpers";

// The approved design requires Today to fit one phone screen (390x844) without scrolling.
test.use({ viewport: { width: 390, height: 844 } });

const verticalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

test("Today shows the approved layout and fits the screen without scrolling", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
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
  await enterApp(page);
  await expect(page.getByText("הבחילות נרגעות? זה הזמן להחזיר לתפריט")).toBeVisible();
  expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
});

test("a special week shows its surprise once", async ({ page }) => {
  // LMP 2026-06-17 is day 133 on the frozen date: 19+0, the 20th week.
  await completeOnboarding(page, { lmpDate: "2026-06-17" });
  await page.getByRole("button", { name: "קדימה" }).click();
  const surprise = page.getByRole("dialog", { name: "חצי הדרך!" });
  await expect(surprise).toBeVisible();
  await expect(surprise).toContainText("הבייבי כבר שומע קולות מבחוץ");
  await surprise.getByRole("button", { name: "איזה כיף, ממשיכים" }).click();
  await expect(surprise).toHaveCount(0);
  await page.getByRole("button", { name: "יופי!" }).click();

  await page.reload();
  await expect(page.getByRole("heading", { name: /בוקר טוב/ })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "חצי הדרך!" })).toHaveCount(0);
});

test("Today shows the progress percent and tells booked appointments from tests to book", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  // Day 107 of 280.
  await expect(page.getByRole("img", { name: /38% מההיריון/ })).toBeVisible();

  const upcoming = page.locator("section").filter({ hasText: "בקרוב" });
  await expect(upcoming.getByText("לקבוע תור").first()).toBeVisible();

  await upcoming.getByRole("link", { name: "כל הבדיקות" }).click();
  await page.getByRole("button", { name: "הוספת תור" }).first().click();
  await page.getByLabel("תאריך").fill("2026-11-02");
  await page.getByRole("button", { name: "שמירה" }).click();
  await page.getByRole("link", { name: "היום" }).click();
  await expect(upcoming.getByText(/נקבע:/)).toHaveCount(1);
  await expect(upcoming.getByText("עוד 5 ימים")).toBeVisible();

  // Moving the appointment updates Today.
  await upcoming.getByRole("link", { name: "כל הבדיקות" }).click();
  await page.getByRole("button", { name: "עריכה" }).click();
  await page.getByLabel("תאריך").fill("2026-11-09");
  await page.getByRole("button", { name: "שמירה" }).click();
  await page.getByRole("link", { name: "היום" }).click();
  await expect(upcoming.getByText("עוד 12 ימים")).toBeVisible();
});
