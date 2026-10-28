import Link from "next/link";
import { useTranslations } from "next-intl";
import { shortcutsFor } from "@/features/today/today";

const SHORTCUTS = {
  kicks: { href: "/tools/kicks", icon: "👣" },
  contractions: { href: "/tools/contractions", icon: "⏱️" },
  weight: { href: "/tools/weight", icon: "⚖️" },
  hospitalBag: { href: "/tools/hospital-bag", icon: "🧳" },
  names: { href: "/tools/names", icon: "📝" },
  bets: { href: "/tools/bets", icon: "🎲" },
} as const;

/** Four tool shortcuts that fit the stage of the pregnancy (2×2, next to the belly-photo square). */
export function ToolShortcuts({ contentWeek }: { contentWeek: number }) {
  const t = useTranslations("tools");
  return (
    <nav aria-label={t("shortcuts")} className="grid h-[120px] flex-1 grid-cols-2 gap-2">
      {shortcutsFor(contentWeek).map((tool) => (
        <Link
          key={tool}
          href={SHORTCUTS[tool].href}
          className="flex min-h-11 items-center gap-2 rounded-2xl bg-card px-3 text-[13px] leading-tight font-semibold"
        >
          <span aria-hidden className="text-xl">
            {SHORTCUTS[tool].icon}
          </span>
          {t(tool === "bets" ? "betsShort" : tool)}
        </Link>
      ))}
    </nav>
  );
}
