"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import { useRecords } from "@/lib/storage/useRecords";

/** Logo and a profile button (the user's initial) that opens More; shown on every main tab. */
export function AppHeader() {
  const t = useTranslations("nav");
  const { records } = useRecords("profile");
  const name = records?.[0]?.name;

  return (
    <header className="mx-auto flex w-full max-w-md items-center justify-between px-[22px] pt-4 pb-1">
      <Logo className="text-[26px]" />
      {name && (
        <Link
          href="/more"
          aria-label={t("profile", { name })}
          className="flex size-11 items-center justify-center rounded-full bg-brand-soft font-semibold"
        >
          {name.charAt(0)}
        </Link>
      )}
    </header>
  );
}
