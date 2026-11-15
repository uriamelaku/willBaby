import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding, enterApp } from "./helpers";

// The approved design requires Today to fit one phone screen (390x844) without scrolling.
test.use({ viewport: { width: 390, height: 844 } });

const verticalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

const upcomingCard = (page: Page) => page.locator("section").filter({ hasText: "בקרוב" });

/** Adds recommended tests to "my tests" on the tests screen, then returns to Today. */
async function planTests(page: Page, names: string[]) {
  await upcomingCard(page).getByRole("link", { name: "כל הבדיקות" }).click();
  for (const name of names) {
    const card = page.locator("li").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await card.getByRole("button", { name: "הוספה לבדיקות שלי" }).click();
    await expect(card.getByRole("button", { name: "✓ בבדיקות שלי" })).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("link", { name: "היום" }).click();
}

const SOON_TESTS = ["סקירת מערכות מוקדמת", "סקר שליש שני (תבחין משולש)", "סקירת מערכות מאוחרת"];

test("Today shows the approved layout and fits the screen without scrolling", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  await expect(page).toHaveURL(/\/today$/);

  await expect(page.getByRole("img", { name: /שבוע 15\+2, שליש שני/ })).toBeVisible();
  await expect(page.getByText("עוד 173 ימים ללידה")).toBeVisible();
  await expect(page.getByText("תאריך משוער: 19 באפר׳ 2027")).toBeVisible();
  // Recommended tests stay off Today until the user adds them.
  await expect(upcomingCard(page).getByText("עוד לא הוספתם בדיקות או תורים")).toBeVisible();
  await expect(page.getByRole("link", { name: /לצלם עכשיו/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /ספריית ידע/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "קיצורי דרך לכלים" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByText("סוף סוף מישהו בבית שמבין בטוסט אבוקדו")).toBeVisible();

  expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
});

test("Today still fits with the longest daily tip (three lines)", async ({ page }) => {
  // Day 91: the longest tip in the content, plus the belly-photo prompt and three upcoming tests.
  await completeOnboarding(page, { lmpDate: "2026-07-29" });
  await enterApp(page);
  await planTests(page, SOON_TESTS);
  // Coming back to Today moved the rotation on, so go through all four of the day's items.
  const longest = page.getByText("הבחילות נרגעות? זה הזמן להחזיר לתפריט");
  let sawLongest = false;
  for (let shown = 0; shown < 4; shown++) {
    if (shown > 0) await page.getByRole("button", { name: /טיפ נוסף/ }).click();
    await expect(page.getByRole("button", { name: /טיפ נוסף/ })).toBeVisible();
    sawLongest ||= (await longest.count()) > 0;
    expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
  }
  expect(sawLongest).toBe(true);
});

test("the daily tip moves to the next of the day's four on each load and with the button", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  const first = "סוף סוף מישהו בבית שמבין בטוסט אבוקדו";
  const second = "העיניים של הבייבי כבר מתחילות לזוז";
  const third = "אם יש צרבת, אוכל חריף ושומני";
  const fourth = "לצלם אותך עם הבטן כל שבוע";
  await expect(page.getByText(first)).toBeVisible();

  const next = page.getByRole("button", { name: /טיפ נוסף/ });
  await next.click();
  await expect(page.getByText(second)).toBeVisible();

  await page.reload();
  await expect(page.getByText(third)).toBeVisible();

  await next.click();
  await expect(page.getByText(fourth)).toBeVisible();
  await next.click();
  await expect(page.getByText(first)).toBeVisible();
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

  await planTests(page, ["סקירת מערכות מוקדמת"]);
  const upcoming = upcomingCard(page);
  await expect(upcoming.getByText("לקבוע תור")).toHaveCount(1);

  await upcoming.getByRole("link", { name: "כל הבדיקות" }).click();
  // The planned test waits under "my tests" until it is booked.
  await expect(page.getByText("עוד לא נקבע תור")).toBeVisible();
  await page.getByRole("button", { name: "קביעת תור" }).first().click();
  await page.getByLabel("תאריך").fill("2026-11-02");
  await page.getByRole("button", { name: "שמירה" }).click();
  await page.getByRole("link", { name: "היום" }).click();
  await expect(upcoming.getByText(/נקבע:/)).toHaveCount(1);
  await expect(upcoming.getByText("לקבוע תור")).toHaveCount(0);
  await expect(upcoming.getByText("עוד 5 ימים")).toBeVisible();

  // Moving the appointment updates Today.
  await upcoming.getByRole("link", { name: "כל הבדיקות" }).click();
  await page.getByRole("button", { name: "עריכה" }).click();
  await page.getByLabel("תאריך").fill("2026-11-09");
  await page.getByRole("button", { name: "שמירה" }).click();
  await page.getByRole("link", { name: "היום" }).click();
  await expect(upcoming.getByText("עוד 12 ימים")).toBeVisible();
});

test("tapping an upcoming item books the test or opens the appointment", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  await planTests(page, ["סקירת מערכות מאוחרת"]);
  const upcoming = upcomingCard(page);

  await upcoming.getByRole("link", { name: /סקירה מאוחרת/ }).click();
  await expect(page.getByLabel("מה הבדיקה או הפגישה?")).toHaveValue("סקירת מערכות מאוחרת");
  await page.getByLabel("תאריך").fill("2026-11-20");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page).toHaveURL(/\/tools\/appointments$/);

  await page.getByRole("link", { name: "היום" }).click();
  await upcoming.getByRole("link", { name: /סקירה מאוחרת|סקירת מערכות מאוחרת/ }).click();
  await expect(page.getByLabel("תאריך")).toHaveValue("2026-11-20");
});

test("the upcoming card swipes sideways to later tests", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  await planTests(page, [...SOON_TESTS, "העמסת סוכר", "תרבית GBS"]);
  const list = upcomingCard(page).getByRole("list", { name: "בקרוב" });
  await expect(list.getByRole("listitem")).toHaveCount(5);
  const gbs = list.getByRole("link", { name: /תרבית GBS/ });
  await expect(gbs).not.toBeInViewport();
  await gbs.scrollIntoViewIfNeeded();
  await expect(gbs).toBeInViewport();
  expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
});

test("the week's progress can be shared", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { shared: string[] }).shared = [];
    navigator.share = async (data?: ShareData) => {
      (window as unknown as { shared: string[] }).shared.push(data?.text ?? "");
    };
  });
  await completeOnboarding(page);
  await enterApp(page);
  await page.getByRole("button", { name: "שיתוף ההתקדמות של השבוע" }).click();
  const [text] = await page.evaluate(() => (window as unknown as { shared: string[] }).shared);
  expect(text).toContain("אני בשבוע 15+2 של ההיריון, 38% מהדרך!");
  expect(text).toContain("🥑 הבייבי בגודל של אבוקדו");
  expect(text).toContain("עוד 173 ימים לתאריך המשוער");
});

test("week 38 (long fruit name) still fits with each of the day's tips", async ({ page }) => {
  // Day 260 is in week 38.
  await completeOnboarding(page, { lmpDate: "2026-02-10" });
  await enterApp(page);
  expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
  for (const current of [2, 3, 4]) {
    await page.getByRole("button", { name: /טיפ נוסף/ }).click();
    await expect(page.getByRole("button", { name: `טיפ נוסף (${current} מתוך 4)` })).toBeVisible();
    expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
  }
});

test("the date calculator tells the week on a future date", async ({ page }) => {
  await completeOnboarding(page);
  await enterApp(page);
  await page.getByRole("button", { name: /מחשבון תאריכים/ }).click();
  const calculator = page.getByRole("dialog", { name: "מחשבון תאריכים" });

  // Starts from the saved day 0 and today (15+2).
  await expect(calculator.getByLabel("תחילת ההיריון (יום 0)")).toHaveValue("2026-07-13");
  await expect(calculator.getByText("שבוע 15+2")).toBeVisible();

  await calculator.getByLabel("באיזה תאריך?").fill("2026-12-25");
  await expect(calculator.getByText("שבוע 23+4")).toBeVisible();
  await expect(calculator.getByText("השבוע ה-24 של ההיריון · שליש שני")).toBeVisible();
  await expect(calculator.getByText("115 ימים לפני התאריך המשוער")).toBeVisible();

  // Day 0 can be changed for the calculation only.
  await calculator.getByLabel("תחילת ההיריון (יום 0)").fill("2026-07-20");
  await expect(calculator.getByText("שבוע 22+4")).toBeVisible();
  await calculator.getByLabel("באיזה תאריך?").fill("2026-07-01");
  await expect(calculator.getByText("התאריך הזה לפני תחילת ההיריון.")).toBeVisible();

  await calculator.getByRole("button", { name: "סגירה" }).click();
  await expect(calculator).toBeHidden();
  await page.getByRole("button", { name: /מחשבון תאריכים/ }).click();
  await expect(calculator.getByLabel("תחילת ההיריון (יום 0)")).toHaveValue("2026-07-13");
  expect(await verticalOverflow(page)).toBeLessThanOrEqual(0);
});
