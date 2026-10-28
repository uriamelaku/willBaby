import { expect, test } from "@playwright/test";
import { completeOnboarding } from "./helpers";

test("a backup restores a deleted journal entry", async ({ page }, testInfo) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "קדימה" }).click();

  await page.goto("/journal");
  await page.getByRole("button", { name: "רשומה חדשה" }).click();
  await page.getByLabel("מה רוצים לזכור מהיום?").fill("רשומה לגיבוי");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("רשומה לגיבוי")).toBeVisible();

  await page.goto("/more");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "הורדת קובץ גיבוי" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("willbaby-backup-2026-10-28.json");
  const backupPath = testInfo.outputPath("backup.json");
  await download.saveAs(backupPath);
  await expect(page.getByText("גיבוי אחרון: 28 באוקטובר 2026")).toBeVisible();

  await page.goto("/journal");
  await page.getByRole("button", { name: "מחיקה" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "מחיקה" }).click();
  await expect(page.getByText("רשומה לגיבוי")).toHaveCount(0);

  await page.goto("/more");
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await expect(page.getByRole("dialog")).toContainText("לשחזר מהקובץ?");
  await page.getByRole("dialog").getByRole("button", { name: "שחזור" }).click();
  await expect(page).toHaveURL(/\/today$/);

  await page.goto("/journal");
  await expect(page.getByText("רשומה לגיבוי")).toBeVisible();
});

test("an invalid backup file is rejected without changes", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "קדימה" }).click();
  await page.goto("/more");
  await page.locator('input[type="file"]').setInputFiles({
    name: "other.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ app: "something-else" })),
  });
  await expect(page.getByText("זה לא קובץ גיבוי של will·B·aby.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});
