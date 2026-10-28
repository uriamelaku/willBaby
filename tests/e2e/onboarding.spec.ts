import { expect, test } from "@playwright/test";
import { completeOnboarding, freezeTime } from "./helpers";

test("asks for a name before continuing", async ({ page }) => {
  await freezeTime(page);
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "יאללה, מתחילים" }).click();
  await page.getByText("אני בהיריון").click();
  await page.getByRole("button", { name: "המשך" }).click();
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page.getByText("נשמח לדעת איך לקרוא לך")).toBeVisible();
});

test("rejects a date that is not in the pregnancy range", async ({ page }) => {
  await freezeTime(page);
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "יאללה, מתחילים" }).click();
  await page.getByText("אני בהיריון").click();
  await page.getByRole("button", { name: "המשך" }).click();
  await page.getByLabel("איך קוראים לך?").fill("בדיקה");
  await page.getByRole("button", { name: "המשך" }).click();
  await page.getByLabel("תאריך הווסת האחרונה").fill("2026-11-01");
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page.getByText("לפי התאריך הזה ההיריון עוד לא התחיל")).toBeVisible();
});

test("onboarding shows the wow screen, then Today with the week's content", async ({ page }) => {
  await completeOnboarding(page);

  await expect(page.getByRole("heading", { name: "את בשבוע 15+2!" })).toBeVisible();
  await expect(page.getByText("השבוע ה-16 של ההיריון")).toBeVisible();
  await page.getByRole("button", { name: "קדימה" }).click();

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "היי בדיקה" })).toBeVisible();
  await expect(page.getByText("שבוע 15+2")).toBeVisible();
  await expect(page.getByRole("img", { name: "אבוקדו" })).toBeVisible();
  await expect(page.getByText("סוף סוף מישהו בבית שמבין בטוסט אבוקדו")).toBeVisible();

  // Onboarding runs once: the start page and /onboarding now go to Today.
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/today$/);
});

test("twins get plural wording", async ({ page }) => {
  await completeOnboarding(page, { twins: true });
  await page.getByRole("button", { name: "קדימה" }).click();
  await expect(page.getByText("התאומים כבר מתחילים לשמוע צלילים")).toBeVisible();
});

test("the Week tab opens the current week", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "קדימה" }).click();
  await page.getByRole("link", { name: "שבוע", exact: true }).click();
  await expect(page).toHaveURL(/\/week\/16$/);
  await expect(page.getByRole("heading", { name: "השבוע ה-16" })).toBeVisible();
  await expect(page.getByText("השבוע שלכם")).toBeVisible();
});
