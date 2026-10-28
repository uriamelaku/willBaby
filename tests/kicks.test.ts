import { describe, expect, it } from "vitest";
import {
  KICK_GOAL,
  addKick,
  endKickSession,
  findActiveKickSession,
  finishedKickSessions,
  newKickSession,
  summarizeKickSession,
  undoKick,
} from "@/features/kicks/kicks";
import { elapsedMs, formatDuration } from "@/lib/duration";
import type { KickSession } from "@/lib/storage/types";

const start = new Date("2026-08-01T10:00:00.000Z");
const minutesLater = (minutes: number) => new Date(start.getTime() + minutes * 60_000);

const session = (overrides: Partial<KickSession> = {}): KickSession => ({
  id: "k1",
  createdAt: start.toISOString(),
  updatedAt: start.toISOString(),
  ...(newKickSession(start) as Omit<KickSession, "id" | "createdAt" | "updatedAt">),
  ...overrides,
});

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [59_999, "0:59"],
    [61_000, "1:01"],
    [3_600_000, "1:00:00"],
    [3_725_000, "1:02:05"],
    [-5_000, "0:00"],
  ])("%i ms → %s", (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });

  it("measures time between timestamps", () => {
    expect(elapsedMs(start.toISOString(), minutesLater(2))).toBe(120_000);
  });
});

describe("kick sessions", () => {
  it("counts kicks and undoes the last one", () => {
    let current = session();
    current = addKick(current, minutesLater(1));
    current = addKick(current, minutesLater(2));
    expect(current.kicks).toEqual([minutesLater(1).toISOString(), minutesLater(2).toISOString()]);
    expect(undoKick(current).kicks).toEqual([minutesLater(1).toISOString()]);
    expect(undoKick(session()).kicks).toEqual([]);
  });

  it("summarizes a running session up to now", () => {
    const current = addKick(session(), minutesLater(1));
    expect(summarizeKickSession(current, minutesLater(5))).toEqual({
      count: 1,
      durationMs: 5 * 60_000,
      timeToGoalMs: undefined,
    });
  });

  it("records the time to the goal kick", () => {
    let current = session();
    for (let minute = 1; minute <= KICK_GOAL + 2; minute++) {
      current = addKick(current, minutesLater(minute * 3));
    }
    current = endKickSession(current, minutesLater(60));
    expect(summarizeKickSession(current, minutesLater(90))).toEqual({
      count: KICK_GOAL + 2,
      durationMs: 60 * 60_000,
      timeToGoalMs: KICK_GOAL * 3 * 60_000,
    });
  });

  it("finds the running session and lists finished ones newest first", () => {
    const running = session({ id: "run" });
    const older = session({ id: "old", startedAt: "2026-07-30T10:00:00.000Z", endedAt: "2026-07-30T10:30:00.000Z" });
    const newer = session({ id: "new", startedAt: "2026-07-31T10:00:00.000Z", endedAt: "2026-07-31T10:30:00.000Z" });
    expect(findActiveKickSession([older, running, newer])?.id).toBe("run");
    expect(findActiveKickSession([older])).toBeUndefined();
    expect(finishedKickSessions([older, running, newer]).map((s) => s.id)).toEqual(["new", "old"]);
  });
});
