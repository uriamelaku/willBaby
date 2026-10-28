import { SCHEMA_VERSION } from "@/lib/db";
import {
  dueDateFromLmp,
  formatLocalDate,
  lmpFromInput,
  parseLocalDate,
  validateLmp,
  type CalculationMethod,
  type LmpValidation,
} from "@/lib/pregnancy";
import type {
  BabySex,
  CalendarDate,
  RecordInput,
  Role,
  StorageAdapter,
} from "@/lib/storage/types";

export const MAX_NAME_LENGTH = 40;
export const MAX_BABIES = 6;

export interface BabyAnswer {
  sex: BabySex;
  name: string;
}

export interface OnboardingAnswers {
  role: Role;
  name: string;
  partnerName: string;
  method: CalculationMethod;
  inputDate: CalendarDate;
  babies: BabyAnswer[];
}

export interface OnboardingRecords {
  profile: RecordInput<"profile">;
  pregnancy: RecordInput<"pregnancy">;
  babies: RecordInput<"babies">[];
  settings: RecordInput<"settings">;
}

/** Validates the date entered for a method (as `YYYY-MM-DD` from the date input). */
export function validateInputDate(
  method: CalculationMethod,
  inputDate: string,
  today: Date,
): LmpValidation {
  let date: Date;
  try {
    date = parseLocalDate(inputDate);
  } catch {
    return { valid: false, reason: "invalidDate" };
  }
  return validateLmp(lmpFromInput(method, date), today);
}

const optionalText = (value: string) => value.trim() || undefined;

/** Turns onboarding answers into storage records. Expects answers that passed validation. */
export function buildOnboardingRecords(
  answers: OnboardingAnswers,
  now: Date,
): OnboardingRecords {
  const lmpDate = lmpFromInput(answers.method, parseLocalDate(answers.inputDate));
  const dueDate = formatLocalDate(dueDateFromLmp(lmpDate));

  return {
    profile: {
      name: answers.name.trim(),
      role: answers.role,
      partnerName: optionalText(answers.partnerName),
    },
    pregnancy: {
      method: answers.method,
      inputDate: answers.inputDate,
      lmpDate: formatLocalDate(lmpDate),
      dueDate,
      babiesCount: answers.babies.length,
      dueDateHistory: [{ dueDate, changedAt: now.toISOString() }],
      status: "active",
    },
    babies: answers.babies.map((baby, index) => ({
      index,
      sex: baby.sex,
      name: optionalText(baby.name),
    })),
    settings: { theme: "auto", schemaVersion: SCHEMA_VERSION },
  };
}

/** Saves all records; the pregnancy goes last because it marks onboarding as done. */
export async function saveOnboarding(
  storage: StorageAdapter,
  records: OnboardingRecords,
): Promise<void> {
  await storage.save("profile", records.profile);
  for (const baby of records.babies) {
    await storage.save("babies", baby);
  }
  await storage.save("settings", records.settings);
  await storage.save("pregnancy", records.pregnancy);
}

export async function hasCompletedOnboarding(storage: StorageAdapter): Promise<boolean> {
  return (await storage.list("pregnancy")).length > 0;
}
