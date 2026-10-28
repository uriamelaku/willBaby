"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import { getPregnancyStatus, parseLocalDate, validateLmp } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";

// Temporary until the full Today screen; shows that onboarding data was saved.
export function TodayPlaceholder() {
  const t = useTranslations();
  const router = useRouter();
  const [weekAndDay, setWeekAndDay] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    storage
      .list("pregnancy")
      .then(([pregnancy]) => {
        if (!pregnancy) {
          router.replace("/onboarding");
          return;
        }
        const lmp = parseLocalDate(pregnancy.lmpDate);
        const today = new Date();
        if (!validateLmp(lmp, today).valid) return;
        const status = getPregnancyStatus(lmp, today);
        setWeekAndDay(`${status.week}+${status.dayOfWeek}`);
      })
      .catch((error) => {
        console.error("Reading storage failed", error);
        setFailed(true);
      });
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      {failed && (
        <p role="alert" className="text-danger">
          {t("common.storageError")}
        </p>
      )}
      {weekAndDay && <p className="text-lg">{t("today.comingSoon", { weekAndDay })}</p>}
    </main>
  );
}
