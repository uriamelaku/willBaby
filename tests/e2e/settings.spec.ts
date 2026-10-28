import { expect, test } from "@playwright/test";
import { completeOnboarding, weekRing } from "./helpers";

test.beforeEach(async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "קדימה" }).click();
  await expect(weekRing(page, "15+2")).toBeVisible();
});

test("updating the due date moves the pregnancy week and keeps a history", async ({ page }) => {
  await page.goto("/more");
  await expect(page.getByText("תאריך לידה משוער: 19 באפריל 2027")).toBeVisible();

  await page.getByRole("button", { name: "עדכון תאריך הלידה" }).click();
  await page.getByLabel("תאריך לידה משוער חדש").fill("2027-04-12");
  await page.getByRole("button", { name: "שמירה" }).click();

  await expect(page.getByText("תאריך לידה משוער: 12 באפריל 2027")).toBeVisible();
  await expect(page.getByText("היסטוריית תאריכים")).toBeVisible();

  await page.getByRole("link", { name: "היום" }).click();
  await expect(weekRing(page, "16+2")).toBeVisible();
});

test("saving the same due date again is rejected", async ({ page }) => {
  await page.goto("/more");
  await page.getByRole("button", { name: "עדכון תאריך הלידה" }).click();
  await page.getByLabel("תאריך לידה משוער חדש").fill("2027-04-19");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("זה כבר התאריך השמור.")).toBeVisible();
});

test("deleting all data starts over at onboarding", async ({ page }) => {
  await page.goto("/more");
  await page.getByRole("button", { name: "מחיקת כל הנתונים" }).click();
  await expect(page.getByRole("dialog")).toContainText("למחוק את כל הנתונים?");
  await page.getByRole("dialog").getByRole("button", { name: "מחיקה של הכול" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);
});
