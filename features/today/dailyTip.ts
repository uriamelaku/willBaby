// Which of the day's daily items Today shows. Each load moves on to the next item of the day,
// and a new day starts again from the first. A small device preference, so it lives in localStorage.

export const DAILY_TIP_STORAGE_KEY = "willbaby-daily-tip";

export interface DailyTipPosition {
  day: number;
  index: number;
}

export const parseDailyTipPosition = (value: string | null): DailyTipPosition | undefined => {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    const { day, index } = (parsed ?? {}) as Partial<DailyTipPosition>;
    return Number.isInteger(day) && Number.isInteger(index) ? { day: day!, index: index! } : undefined;
  } catch {
    return undefined; // A corrupt value just restarts the rotation.
  }
};

/** The item to show on a new load: the one after the last shown today, or the first on a new day. */
export const nextDailyTipIndex = (last: DailyTipPosition | undefined, day: number, count: number) =>
  last && last.day === day && count > 0 ? (last.index + 1) % count : 0;

export function readDailyTipPosition(): DailyTipPosition | undefined {
  try {
    return parseDailyTipPosition(localStorage.getItem(DAILY_TIP_STORAGE_KEY));
  } catch (error) {
    console.error("Reading the daily tip position failed", error);
    return undefined;
  }
}

export function saveDailyTipPosition(position: DailyTipPosition): void {
  try {
    localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(position));
  } catch (error) {
    console.error("Saving the daily tip position failed", error);
  }
}
