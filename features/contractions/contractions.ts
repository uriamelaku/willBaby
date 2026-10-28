import { elapsedMs } from "@/lib/duration";
import type { Contraction, RecordInput } from "@/lib/storage/types";

/** A contraction starting this long after the previous one opens a new session. */
export const SESSION_GAP_MS = 2 * 60 * 60 * 1000;
/** Averages cover the contractions that started in this window. */
export const STATS_WINDOW_MS = 60 * 60 * 1000;

const byStart = (contractions: Contraction[]) =>
  [...contractions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

export const findActiveContraction = (contractions: Contraction[]) =>
  contractions.find((contraction) => !contraction.endedAt);

/** A new running contraction, in the latest session unless that one is SESSION_GAP_MS old. */
export function startContraction(
  contractions: Contraction[],
  now: Date,
  newId: () => string = () => crypto.randomUUID(),
): RecordInput<"contractions"> {
  const last = byStart(contractions).at(-1);
  const continuesSession = last && elapsedMs(last.startedAt, now) < SESSION_GAP_MS;
  return {
    sessionId: continuesSession ? last.sessionId : newId(),
    startedAt: now.toISOString(),
  };
}

export const endContraction = (contraction: Contraction, now: Date): Contraction => ({
  ...contraction,
  endedAt: now.toISOString(),
});

export interface TimedContraction {
  contraction: Contraction;
  /** Missing while running. */
  durationMs?: number;
  /** From the previous contraction's start; missing for the first in a session. */
  intervalMs?: number;
}

export interface ContractionSession {
  id: string;
  startedAt: string;
  /** Oldest first. */
  contractions: TimedContraction[];
}

/** Sessions newest first, each with durations and intervals. */
export function groupContractionSessions(contractions: Contraction[]): ContractionSession[] {
  const sessions = new Map<string, Contraction[]>();
  for (const contraction of byStart(contractions)) {
    sessions.set(contraction.sessionId, [...(sessions.get(contraction.sessionId) ?? []), contraction]);
  }
  return [...sessions.entries()]
    .map(([id, items]) => ({
      id,
      startedAt: items[0].startedAt,
      contractions: items.map((contraction, index) => ({
        contraction,
        durationMs: contraction.endedAt ? elapsedMs(contraction.startedAt, contraction.endedAt) : undefined,
        intervalMs: index > 0 ? elapsedMs(items[index - 1].startedAt, contraction.startedAt) : undefined,
      })),
    }))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export interface ContractionStats {
  count: number;
  averageDurationMs?: number;
  averageIntervalMs?: number;
}

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;

/** Averages over the session's contractions that started in the last STATS_WINDOW_MS. */
export function recentStats(session: ContractionSession, now: Date): ContractionStats {
  const recent = session.contractions.filter(
    ({ contraction }) => elapsedMs(contraction.startedAt, now) <= STATS_WINDOW_MS,
  );
  return {
    count: recent.length,
    averageDurationMs: average(recent.flatMap(({ durationMs }) => durationMs ?? [])),
    averageIntervalMs: average(recent.flatMap(({ intervalMs }) => intervalMs ?? [])),
  };
}
