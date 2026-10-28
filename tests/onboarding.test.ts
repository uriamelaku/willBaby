import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildOnboardingRecords,
  hasCompletedOnboarding,
  saveOnboarding,
  validateInputDate,
  type OnboardingAnswers,
} from "@/features/onboarding/onboarding";
import { SCHEMA_VERSION, WillBabyDb } from "@/lib/db";
import { createIndexedDbStorage } from "@/lib/storage/indexedDb";

const now = new Date(2026, 5, 1, 10, 0);

const answers: OnboardingAnswers = {
  role: "pregnant",
  name: "  נועה ",
  partnerName: "",
  method: "lmp",
  inputDate: "2026-01-01",
  babies: [{ sex: "unknown", name: "" }],
};

describe("validateInputDate", () => {
  it("accepts a date in range", () => {
    expect(validateInputDate("lmp", "2026-01-01", now)).toEqual({ valid: true });
  });

  it("accepts a due date in the future", () => {
    expect(validateInputDate("due", "2026-12-01", now)).toEqual({ valid: true });
  });

  it.each([
    ["lmp", "2026-06-02", "inFuture"],
    ["lmp", "2025-01-01", "tooFarInPast"],
    ["due", "2027-06-01", "inFuture"],
    ["ivf5", "", "invalidDate"],
    ["ivf3", "2026-02-30", "invalidDate"],
  ] as const)("%s %j is %s", (method, inputDate, reason) => {
    expect(validateInputDate(method, inputDate, now)).toEqual({ valid: false, reason });
  });
});

describe("buildOnboardingRecords", () => {
  it("builds profile, pregnancy, babies and settings", () => {
    expect(buildOnboardingRecords(answers, now)).toEqual({
      profile: { name: "נועה", role: "pregnant", partnerName: undefined },
      pregnancy: {
        method: "lmp",
        inputDate: "2026-01-01",
        lmpDate: "2026-01-01",
        dueDate: "2026-10-08",
        babiesCount: 1,
        dueDateHistory: [{ dueDate: "2026-10-08", changedAt: now.toISOString() }],
        status: "active",
      },
      babies: [{ index: 0, sex: "unknown", name: undefined }],
      settings: { schemaVersion: SCHEMA_VERSION },
    });
  });

  it("converts the input date to day 0 for IVF", () => {
    const { pregnancy } = buildOnboardingRecords(
      { ...answers, method: "ivf5", inputDate: "2026-01-20" },
      now,
    );
    expect(pregnancy).toMatchObject({
      inputDate: "2026-01-20",
      lmpDate: "2026-01-01",
      dueDate: "2026-10-08",
    });
  });

  it("keeps partner and baby names, trimmed, for twins", () => {
    const records = buildOnboardingRecords(
      {
        ...answers,
        role: "partner",
        partnerName: " דני ",
        babies: [
          { sex: "girl", name: " מאיה" },
          { sex: "boy", name: "" },
        ],
      },
      now,
    );
    expect(records.profile).toMatchObject({ role: "partner", partnerName: "דני" });
    expect(records.pregnancy.babiesCount).toBe(2);
    expect(records.babies).toEqual([
      { index: 0, sex: "girl", name: "מאיה" },
      { index: 1, sex: "boy", name: undefined },
    ]);
  });
});

describe("saveOnboarding", () => {
  const db = new WillBabyDb(`test-${crypto.randomUUID()}`);
  const storage = createIndexedDbStorage(db);

  afterEach(() => db.delete());

  it("saves all records and marks onboarding as done", async () => {
    expect(await hasCompletedOnboarding(storage)).toBe(false);

    const twins = { ...answers, babies: [answers.babies[0], answers.babies[0]] };
    await saveOnboarding(storage, buildOnboardingRecords(twins, now));

    expect(await hasCompletedOnboarding(storage)).toBe(true);
    expect(await storage.list("profile")).toHaveLength(1);
    expect(await storage.list("babies")).toHaveLength(2);
    expect(await storage.list("settings")).toHaveLength(1);
  });
});
