import type { WeekContent } from "@/content/schema";

// Isolated so emoji can later be swapped for illustrations without touching screens.
export function WeekFruit({ fruit, className = "" }: {
  fruit: WeekContent["fruit"];
  className?: string;
}) {
  return (
    <span role="img" aria-label={fruit.name} className={`leading-none ${className}`}>
      {fruit.emoji}
    </span>
  );
}
