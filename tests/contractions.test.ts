import { describe, expect, it } from "vitest";
import {
  SESSION_GAP_MS,
  endContraction,
  findActiveContraction,
  groupContractionSessions,
  recentStats,
  startContraction,
} from "@/features/contractions/contractions";
import type { Contraction } from "@/lib/storage/types";

const base = new Date("2026-09-20T02:00:00.000Z").getTime();
const at = (minutes: number) => new Date(base + minutes * 60_000);

let nextId = 0;
const contraction = (sessionId: string, startMinute: number, durationSeconds?: number): Contraction => ({
  id: `c${nextId++}`,
  createdAt: at(startMinute).toISOString(),
  updatedAt: at(startMinute).toISOString(),
  sessionId,
  startedAt: at(startMinute).toISOString(),
  endedAt:
    durationSeconds === undefined
      ? undefined
      : new Date(at(startMinute).getTime() + durationSeconds * 1000).toISOString(),
});

describe("startContraction", () => {
  it("opens a new session for the first contraction", () => {
    expect(startContraction([], at(0), () => "new")).toEqual({
      sessionId: "new",
      startedAt: at(0).toISOString(),
    });
  });

  it("continues the latest session within the gap, and opens a new one after it", () => {
    const list = [contraction("old", 0, 40), contraction("s1", 30, 50)];
    expect(startContraction(list, at(35), () => "new").sessionId).toBe("s1");
    const afterGap = new Date(at(30).getTime() + SESSION_GAP_MS);
    expect(startContraction(list, afterGap, () => "new").sessionId).toBe("new");
  });
});

describe("contraction sessions", () => {
  it("finds the running contraction and ends it", () => {
    const running = contraction("s1", 10);
    expect(findActiveContraction([contraction("s1", 0, 30), running])).toBe(running);
    expect(endContraction(running, at(11)).endedAt).toBe(at(11).toISOString());
  });

  it("groups by session, newest first, with durations and intervals", () => {
    const sessions = groupContractionSessions([
      contraction("b", 200, 60),
      contraction("a", 0, 30),
      contraction("a", 10, 45),
      contraction("b", 206),
    ]);
    expect(sessions.map((session) => session.id)).toEqual(["b", "a"]);
    expect(sessions[1].contractions.map(({ durationMs, intervalMs }) => [durationMs, intervalMs])).toEqual([
      [30_000, undefined],
      [45_000, 10 * 60_000],
    ]);
    expect(sessions[0].contractions[1]).toMatchObject({ durationMs: undefined, intervalMs: 6 * 60_000 });
  });

  it("averages contractions started in the last hour, ignoring a running contraction's duration", () => {
    const [session] = groupContractionSessions([
      contraction("s", 0, 20),
      contraction("s", 40, 40),
      contraction("s", 50, 60),
      contraction("s", 56),
    ]);
    expect(recentStats(session, at(95))).toEqual({
      count: 3,
      averageDurationMs: 50_000,
      averageIntervalMs: ((40 + 10 + 6) / 3) * 60_000,
    });
    expect(recentStats(session, at(500))).toEqual({
      count: 0,
      averageDurationMs: undefined,
      averageIntervalMs: undefined,
    });
  });
});
