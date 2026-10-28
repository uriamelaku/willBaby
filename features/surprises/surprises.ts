import type { Surprise } from "@/content/schema";
import type { RecordInput, Settings } from "@/lib/storage/types";

/** The surprise of the current content week, unless it was already shown. */
export const surpriseFor = (surprises: Surprise[], contentWeek: number, settings: Settings | undefined) =>
  surprises.find(
    (surprise) => surprise.week === contentWeek && !settings?.seenSurprises?.includes(surprise.week),
  );

/** Settings record data with the week marked as seen. */
export const markSurpriseSeen = (
  settings: RecordInput<"settings">,
  week: number,
): RecordInput<"settings"> => ({
  ...settings,
  seenSurprises: [...new Set([...(settings.seenSurprises ?? []), week])],
});
