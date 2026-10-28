const pad = (value: number) => String(value).padStart(2, "0");

/** Milliseconds as `m:ss`, or `h:mm:ss` from one hour; negative values count as 0. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Milliseconds between two ISO timestamps. */
export const elapsedMs = (from: string, to: string | Date) =>
  new Date(to).getTime() - new Date(from).getTime();
