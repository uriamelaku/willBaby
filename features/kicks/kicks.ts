import { elapsedMs } from "@/lib/duration";
import type { KickSession, RecordInput } from "@/lib/storage/types";

/** Kicks counted for "time to N kicks" in a session summary. */
export const KICK_GOAL = 10;

export const newKickSession = (now: Date): RecordInput<"kickSessions"> => ({
  startedAt: now.toISOString(),
  kicks: [],
});

export const addKick = (session: KickSession, now: Date): KickSession => ({
  ...session,
  kicks: [...session.kicks, now.toISOString()],
});

export const undoKick = (session: KickSession): KickSession => ({
  ...session,
  kicks: session.kicks.slice(0, -1),
});

export const endKickSession = (session: KickSession, now: Date): KickSession => ({
  ...session,
  endedAt: now.toISOString(),
});

/** The running session, if any (there is at most one). */
export const findActiveKickSession = (sessions: KickSession[]) =>
  sessions.find((session) => !session.endedAt);

/** Finished sessions, newest first. */
export const finishedKickSessions = (sessions: KickSession[]) =>
  sessions
    .filter((session) => session.endedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

export interface KickSummary {
  count: number;
  durationMs: number;
  /** From the start of the session to the KICK_GOAL-th kick; missing when there were fewer. */
  timeToGoalMs?: number;
}

export function summarizeKickSession(session: KickSession, now: Date): KickSummary {
  const goalKick = session.kicks[KICK_GOAL - 1];
  return {
    count: session.kicks.length,
    durationMs: elapsedMs(session.startedAt, session.endedAt ?? now),
    timeToGoalMs: goalKick ? elapsedMs(session.startedAt, goalKick) : undefined,
  };
}
