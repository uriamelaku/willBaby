import type { HospitalBagItem } from "@/content/schema";
import type { ChecklistItem, RecordInput } from "@/lib/storage/types";

/** From this content week the app reminds to pack the bag until it is complete. */
export const BAG_REMINDER_WEEK = 32;
export const MAX_CUSTOM_ITEM_LENGTH = 100;

const bagRecords = (records: ChecklistItem[]) => records.filter((record) => record.listType === "hospitalBag");

export const customBagItems = (records: ChecklistItem[]) =>
  bagRecords(records)
    .filter((record) => record.customText !== undefined)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/** Ids of the default items that are checked. */
export const checkedDefaultIds = (records: ChecklistItem[]) =>
  new Set(
    bagRecords(records)
      .filter((record) => record.itemId !== undefined && record.checked)
      .map((record) => record.itemId),
  );

/** Record data that flips a default item; reuses its record when there is one. */
export function toggleDefaultItem(records: ChecklistItem[], itemId: string): RecordInput<"checklist"> {
  const existing = bagRecords(records).find((record) => record.itemId === itemId);
  return existing
    ? { ...existing, checked: !existing.checked }
    : { listType: "hospitalBag", itemId, checked: true };
}

export const newCustomItem = (text: string): RecordInput<"checklist"> => ({
  listType: "hospitalBag",
  customText: text.trim(),
  checked: false,
});

export type BagProgress = { checked: number; total: number };

export function bagProgress(defaults: HospitalBagItem[], records: ChecklistItem[]): BagProgress {
  const checkedDefaults = checkedDefaultIds(records);
  const custom = customBagItems(records);
  return {
    checked: defaults.filter((item) => checkedDefaults.has(item.id)).length +
      custom.filter((item) => item.checked).length,
    total: defaults.length + custom.length,
  };
}

export const isBagComplete = ({ checked, total }: BagProgress) => total > 0 && checked === total;

export const showBagReminder = (contentWeek: number, progress: BagProgress) =>
  contentWeek >= BAG_REMINDER_WEEK && !isBagComplete(progress);
