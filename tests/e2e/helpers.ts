import { expect, type Page } from "@playwright/test";

/** The trimester ring on Today, found by its week+day label (e.g. "15+2"). */
export const weekRing = (page: Page, weekAndDay: string) =>
  page.getByRole("img", { name: `שבוע ${weekAndDay}`, exact: false });

/** Fixed "today" for every e2e test: LMP 2026-07-13 then means week 15+2 (content week 16). */
export const TODAY = new Date("2026-10-28T10:00:00+02:00");
export const LMP_DATE = "2026-07-13";

export async function freezeTime(page: Page) {
  await page.clock.setFixedTime(TODAY);
}

/** Completes onboarding as a pregnant user and lands on Today. */
export async function completeOnboarding(page: Page, { twins = false, lmpDate = LMP_DATE } = {}) {
  await freezeTime(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("button", { name: "יאללה, מתחילים" }).click();
  await page.getByText("אני בהיריון").click();
  await page.getByRole("button", { name: "המשך" }).click();

  await page.getByLabel("איך קוראים לך?").fill("בדיקה");
  await page.getByRole("button", { name: "המשך" }).click();

  await page.getByLabel("תאריך הווסת האחרונה").fill(lmpDate);
  await page.getByRole("button", { name: "המשך" }).click();

  if (twins) await page.getByText("תאומים").click();
  await page.getByRole("button", { name: "סיימנו" }).click();
}
