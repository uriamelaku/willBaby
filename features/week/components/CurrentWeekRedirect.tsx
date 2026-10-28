"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePregnancy } from "@/features/pregnancy/usePregnancy";
import { MAX_CONTENT_WEEK, findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";

/** The Week tab opens the current week's summary. */
export function CurrentWeekRedirect() {
  const t = useTranslations("common");
  const router = useRouter();
  const state = usePregnancy();

  useEffect(() => {
    if (state.kind !== "ready") return;
    const status = findPregnancyStatus(parseLocalDate(state.data.pregnancy.lmpDate), new Date());
    router.replace(`/week/${status?.contentWeek ?? MAX_CONTENT_WEEK}`);
  }, [state, router]);

  return state.kind === "error" ? (
    <p role="alert" className="p-4 text-danger">
      {t("storageError")}
    </p>
  ) : null;
}
