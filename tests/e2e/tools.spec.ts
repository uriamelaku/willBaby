import { expect, test } from "@playwright/test";
import { completeOnboarding, enterApp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
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

test("weight tracking saves weights, shows the change and the chart", async ({ page }) => {
  await page.getByRole("link", { name: /מעקב משקל/ }).click();

  await page.getByLabel("תאריך").fill("2026-07-13");
  await page.getByLabel("משקל (ק״ג)").fill("61");
  await page.getByRole("button", { name: "שמירה" }).click();
  await page.getByLabel("תאריך").fill("2026-10-28");
  await page.getByLabel("משקל (ק״ג)").fill("20");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("המשקל צריך להיות בין 30 ל-250 ק״ג")).toBeVisible();

  await page.getByLabel("משקל (ק״ג)").fill("64.5");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("עלייה של 3.5 ק״ג מהשקילה הראשונה")).toBeVisible();
  await expect(page.getByRole("img", { name: "גרף המשקל לפי שבוע היריון" })).toBeVisible();
  await expect(page.locator(".recharts-line-dot")).toHaveCount(2);
  // Local dates show as entered, in the device's time zone.
  await expect(page.getByText("28 באוק׳ 2026")).toBeVisible();
  await expect(page.getByText("13 ביולי 2026")).toBeVisible();
});

test("hospital bag checks default items and adds custom ones", async ({ page }) => {
  await page.getByRole("link", { name: /תיק לידה/ }).click();
  const progress = page.getByText(/מתוך \d+ בתיק/);
  await expect(progress).toHaveText("0 מתוך 23 בתיק");

  await page.getByLabel("תעודת זהות").click();
  await expect(progress).toHaveText("1 מתוך 23 בתיק");

  await page.getByLabel("פריט חדש").fill("כרית הנקה");
  await page.getByRole("button", { name: "הוספה" }).click();
  await expect(progress).toHaveText("1 מתוך 24 בתיק");
  await page.getByLabel("כרית הנקה").click();

  await page.reload();
  await expect(page.getByText("2 מתוך 24 בתיק")).toBeVisible();
  await expect(page.getByLabel("תעודת זהות")).toBeChecked();
});

test("the bag reminder shows from week 32", async ({ page }) => {
  await expect(page.getByText(/הגיע הזמן לארוז/)).toHaveCount(0);
  await page.goto("/more");
  // Moving the due date earlier puts the pregnancy in week 33.
  await page.getByRole("button", { name: "עדכון תאריך הלידה" }).click();
  await page.getByLabel("תאריך לידה משוער חדש").fill("2026-12-20");
  await page.getByRole("button", { name: "שמירה" }).click();
  await page.goto("/tools");
  await expect(page.getByRole("link", { name: /הגיע הזמן לארוז את תיק הלידה \(0 מתוך 23\)/ })).toBeVisible();
});

test("names: both people vote in turn on one phone", async ({ page }) => {
  await page.getByRole("link", { name: /שמות/ }).click();
  for (const name of ["נגה", "ליה"]) {
    await page.getByLabel("שם חדש").fill(name);
    await page.getByRole("button", { name: "הוספה לרשימה" }).click();
  }
  await page.getByLabel("שם חדש").fill("נגה");
  await page.getByRole("button", { name: "הוספה לרשימה" }).click();
  await expect(page.getByText("השם הזה כבר ברשימה")).toBeVisible();

  const voting = page.getByRole("group", { name: /הצבעה על/ });
  await expect(page.getByText("התור של בדיקה")).toBeVisible();
  await voting.getByRole("button", { name: "כן" }).click();
  await voting.getByRole("button", { name: "לא" }).click();
  await expect(page.getByText(/סיימת להצביע על כל השמות/)).toBeVisible();

  await page.getByText("בן או בת הזוג", { exact: true }).click();
  await voting.getByRole("button", { name: "כן" }).click();
  await voting.getByRole("button", { name: "כן" }).click();

  await expect(page.getByRole("img", { name: "שניכם אוהבים" })).toHaveCount(1);
  await page.getByRole("button", { name: "מועדף: ליה" }).click();
  await expect(page.getByRole("button", { name: "מועדף: ליה" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main li").first()).toContainText("ליה");
});

test("finishing the first kick session earns a badge, shown once", async ({ page }) => {
  await page.getByRole("link", { name: /מונה בעיטות/ }).click();
  await page.getByRole("button", { name: "מתחילים לספור" }).click();
  await page.getByRole("button", { name: "סיום" }).click();

  const toast = page.getByRole("status").filter({ hasText: "תג חדש!" });
  await expect(toast).toContainText("כדורגלן קטן");
  await toast.getByRole("button", { name: "יופי!" }).click();
  await expect(toast).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "מונה בעיטות" })).toBeVisible();
  await expect(page.getByText("תג חדש!")).toHaveCount(0);

  await page.goto("/more");
  await expect(page.getByRole("heading", { name: "תגים (3/10)" })).toBeVisible();
});

test("family bets are added, edited and deleted", async ({ page }) => {
  await page.getByRole("link", { name: /הימורים משפחתיים/ }).click();
  await page.getByRole("button", { name: "הימור חדש" }).click();
  // The date starts at the due date.
  await expect(page.getByLabel("תאריך הלידה")).toHaveValue("2027-04-19");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("צריך לכתוב מי מנחש")).toBeVisible();

  await page.getByLabel("מי מנחש?").fill("סבתא רותי");
  await page.getByLabel("משקל לידה (ק״ג)").fill("3.25");
  await page.getByText("בת", { exact: true }).click();
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByRole("heading", { name: "סבתא רותי" })).toBeVisible();
  await expect(page.getByText("משקל: 3.25 ק״ג")).toBeVisible();
  await expect(page.getByText("מין: בת")).toBeVisible();

  await page.getByRole("button", { name: "עריכה" }).click();
  await page.getByLabel("משקל לידה (ק״ג)").fill("3.4");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByText("משקל: 3.4 ק״ג")).toBeVisible();

  await page.getByRole("button", { name: "מחיקה" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "מחיקה" }).click();
  await expect(page.getByText("עוד אין הימורים. מי ראשון?")).toBeVisible();
});

test("the sex reveal sets the sex and the wording follows it", async ({ page }) => {
  await page.getByRole("link", { name: /חשיפת המין/ }).click();
  await expect(page).toHaveURL(/\/reveal$/);
  const ready = page.getByRole("button", { name: "מוכנים לחשיפה" });
  await expect(ready).toBeDisabled();
  await page.getByText("בת", { exact: true }).click();
  await ready.click();

  await page.getByRole("button", { name: /לוחצים וחושפים/ }).click();
  await expect(page.getByRole("heading", { name: "זו בת! ✨" })).toBeVisible();

  await page.getByRole("link", { name: "חזרה להיום" }).click();
  await page.goto("/week/16");
  await expect(page.getByText("הבייבי זזה הרבה", { exact: false })).toBeVisible();

  await page.goto("/reveal");
  await expect(page.getByRole("heading", { name: "כבר יודעים!" })).toBeVisible();
});
