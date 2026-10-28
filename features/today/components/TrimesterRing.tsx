import { useTranslations } from "next-intl";
import {
  RING_CENTER,
  RING_RADIUS,
  RING_SEGMENT,
  RING_STARTS,
  trimesterRing,
} from "@/features/today/today";
import type { PregnancyStatus } from "@/lib/pregnancy";

const STROKE = 12;

/** Three trimester arcs; done ones filled, the current one by its progress, with a dot at "now". */
export function TrimesterRing({ status }: { status: PregnancyStatus }) {
  const t = useTranslations();
  const ring = trimesterRing(status.daysPregnant);
  const arc = (start: number, length: number, className: string) => (
    <circle
      cx={RING_CENTER}
      cy={RING_CENTER}
      r={RING_RADIUS}
      fill="none"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeDasharray={`${length} ${2 * Math.PI * RING_RADIUS - length}`}
      transform={`rotate(${start} ${RING_CENTER} ${RING_CENTER})`}
      className={className}
    />
  );

  return (
    <div
      role="img"
      aria-label={t("today.ring", {
        weekAndDay: `${status.week}+${status.dayOfWeek}`,
        trimester: t("pregnancy.trimester", { trimester: status.trimester }),
      })}
      className="relative size-[170px] flex-none"
    >
      <svg viewBox="0 0 160 160" className="absolute inset-0 size-full" aria-hidden>
        {RING_STARTS.map((start) => (
          <g key={`track-${start}`}>{arc(start, RING_SEGMENT, "stroke-brand-soft")}</g>
        ))}
        {RING_STARTS.map((start, index) =>
          ring.fills[index] > 0 ? (
            <g key={`fill-${start}`}>{arc(start, ring.fills[index], "stroke-brand")}</g>
          ) : null,
        )}
        <circle cx={ring.dot.x} cy={ring.dot.y} r={8} strokeWidth={4} className="fill-card stroke-brand" />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <span dir="ltr" className="text-[50px] leading-none font-bold">
          {status.week}
          <span className="text-2xl font-medium text-muted">+{status.dayOfWeek}</span>
        </span>
        <span className="text-sm text-muted">{t("today.weeks")}</span>
      </div>
    </div>
  );
}
