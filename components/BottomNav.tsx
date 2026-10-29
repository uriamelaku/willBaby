"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarIcon, HomeIcon, JournalIcon, MoreIcon, ToolsIcon } from "@/components/icons";
import { useBackupDue } from "@/features/backup/useBackupDue";

const tabs: { href: string; key: "today" | "week" | "journal" | "tools" | "more"; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { href: "/today", key: "today", Icon: HomeIcon },
  { href: "/week", key: "week", Icon: CalendarIcon },
  { href: "/journal", key: "journal", Icon: JournalIcon },
  { href: "/tools", key: "tools", Icon: ToolsIcon },
  { href: "/more", key: "more", Icon: MoreIcon },
];

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const backupDue = useBackupDue();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 rounded-t-card bg-card px-2 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] shadow-nav"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, key, Icon }) => {
          // The knowledge library is opened from Tools, so it counts as that tab.
          const active =
            pathname === href || pathname.startsWith(`${href}/`) || (key === "tools" && pathname.startsWith("/library"));
          const showDot = key === "more" && backupDue;
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={showDot ? `${t(key)} (${t("backupDue")})` : undefined}
                className={`relative flex min-h-12 flex-col items-center justify-center gap-1 py-1 text-xs ${active ? "font-semibold text-brand-text" : "text-muted"}`}
              >
                <Icon />
                {t(key)}
                {showDot && (
                  <span aria-hidden className="absolute top-1 left-1/2 ms-2 size-2.5 rounded-full bg-brand" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
