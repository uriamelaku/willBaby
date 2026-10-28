"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const tabs = [
  { href: "/journal", key: "entriesTab" },
  { href: "/journal/photos", key: "photosTab" },
] as const;

/** Switches between the journal entries and the belly photos. */
export function JournalTabs() {
  const t = useTranslations("journal");
  const pathname = usePathname();
  return (
    <nav aria-label={t("tabsLabel")} className="grid grid-cols-2 gap-1 rounded-full bg-text/10 p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-full ${active ? "bg-card font-semibold shadow-sm" : ""}`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
