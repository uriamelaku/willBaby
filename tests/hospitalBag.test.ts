import { describe, expect, it } from "vitest";
import type { HospitalBagItem } from "@/content/schema";
import {
  BAG_REMINDER_WEEK,
  bagProgress,
  checkedDefaultIds,
  customBagItems,
  isBagComplete,
  newCustomItem,
  showBagReminder,
  toggleDefaultItem,
} from "@/features/hospitalBag/hospitalBag";
import type { ChecklistItem } from "@/lib/storage/types";

const defaults: HospitalBagItem[] = [
  { id: "id-card", category: "documents", text: "תעודת זהות" },
  { id: "snacks", category: "forBirth", text: "חטיפים" },
];

const record = (overrides: Partial<ChecklistItem>): ChecklistItem => ({
  id: crypto.randomUUID(),
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  listType: "hospitalBag",
  checked: false,
  ...overrides,
});

describe("hospital bag", () => {
  it("checks a default item with a new record, then flips the existing one", () => {
    expect(toggleDefaultItem([], "id-card")).toEqual({ listType: "hospitalBag", itemId: "id-card", checked: true });
    const existing = record({ itemId: "id-card", checked: true });
    expect(toggleDefaultItem([existing], "id-card")).toEqual({ ...existing, checked: false });
  });

  it("creates a trimmed custom item", () => {
    expect(newCustomItem("  כרית הנקה ")).toEqual({ listType: "hospitalBag", customText: "כרית הנקה", checked: false });
  });

  it("separates checked defaults from custom items", () => {
    const records = [
      record({ itemId: "id-card", checked: true }),
      record({ itemId: "snacks", checked: false }),
      record({ customText: "ב", createdAt: "2026-09-02T10:00:00.000Z" }),
      record({ customText: "א", createdAt: "2026-09-01T09:00:00.000Z", checked: true }),
    ];
    expect([...checkedDefaultIds(records)]).toEqual(["id-card"]);
    expect(customBagItems(records).map((item) => item.customText)).toEqual(["א", "ב"]);
    expect(bagProgress(defaults, records)).toEqual({ checked: 2, total: 4 });
  });

  it("is complete only when everything is checked", () => {
    expect(isBagComplete({ checked: 4, total: 4 })).toBe(true);
    expect(isBagComplete({ checked: 3, total: 4 })).toBe(false);
    expect(isBagComplete({ checked: 0, total: 0 })).toBe(false);
  });

  it("reminds from week 32 until the bag is complete", () => {
    expect(showBagReminder(BAG_REMINDER_WEEK - 1, { checked: 0, total: 4 })).toBe(false);
    expect(showBagReminder(BAG_REMINDER_WEEK, { checked: 3, total: 4 })).toBe(true);
    expect(showBagReminder(38, { checked: 4, total: 4 })).toBe(false);
  });
});
