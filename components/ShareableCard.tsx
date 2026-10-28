"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { shareText, withSignature } from "@/lib/share";

/** A titled text card (tip, fact) with a share button. */
export function ShareableCard({ title, text, large }: {
  title: string;
  text: string;
  large?: boolean;
}) {
  const t = useTranslations("share");
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-brand-text">{title}</h2>
        <button
          type="button"
          onClick={() => shareText(withSignature(text, t("signature")))}
          aria-label={t("label", { title })}
          className="-my-2 -me-2 flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-text/80 hover:bg-text/5"
        >
          {t("button")}
        </button>
      </div>
      <p className={large ? "text-lg" : undefined}>{text}</p>
    </Card>
  );
}
