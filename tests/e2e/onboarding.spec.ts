import { expect, test } from "@playwright/test";
import { completeOnboarding, enterApp, freezeTime, weekRing } from "./helpers";

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
  await enterApp(page);

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "בוקר טוב, בדיקה" })).toBeVisible();
  await expect(weekRing(page, "15+2")).toBeVisible();
  await expect(page.getByRole("img", { name: "אבוקדו" })).toBeVisible();
  await expect(page.getByText("בגודל של אבוקדו", { exact: true })).toBeVisible();
  await expect(page.getByText("סוף סוף מישהו בבית שמבין בטוסט אבוקדו")).toBeVisible();

  // Onboarding runs once: the start page and /onboarding now go to Today.
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/today$/);
});

test("twins get plural wording", async ({ page }) => {
  await completeOnboarding(page, { twins: true });
  await enterApp(page);
  await expect(page.getByText("כל אחד בגודל של אבוקדו", { exact: true })).toBeVisible();
  await expect(page.getByText("התאומים בגודל של אבוקדו")).toBeVisible();
});

test("the Week tab opens the current week", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  await page.getByRole("link", { name: "השבוע", exact: true }).click();
  await expect(page).toHaveURL(/\/week\/16$/);
  await expect(page.getByRole("heading", { name: "השבוע ה-16" })).toBeVisible();
  await expect(page.getByText("השבוע שלכם")).toBeVisible();
});

test("future weeks stay locked until the pregnancy gets there", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  await page.goto("/week/16");
  await expect(page.getByRole("link", { name: /שבוע 15/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /שבוע 17/ })).toHaveCount(0);

  await page.goto("/week/17");
  await expect(page.getByText("השבוע הזה נפתח בעוד 5 ימים. בלי ספוילרים!")).toBeVisible();
  await page.getByRole("link", { name: "לשבוע הנוכחי" }).click();
  await expect(page).toHaveURL(/\/week\/16$/);
});
