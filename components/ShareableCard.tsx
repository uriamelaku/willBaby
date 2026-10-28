"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ShareIcon } from "@/components/icons";
import { shareText, withSignature } from "@/lib/share";

const tones = {
  sun: { card: "bg-sun-soft", title: "text-sun-text", button: "text-sun-text" },
  plain: { card: "bg-card", title: "text-brand-text", button: "text-muted" },
} as const;

/** A titled text card (tip, fact) with a share button. */
export function ShareableCard({ title, text, tone = "plain", footnote }: {
  title: string;
  text: string;
  tone?: keyof typeof tones;
  footnote?: ReactNode;
}) {
  const t = useTranslations("share");
  const style = tones[tone];
  return (
    <section className={`flex flex-col gap-1 rounded-card px-5 py-3 ${style.card}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${style.title}`}>{title}</h2>
        <button
          type="button"
          onClick={() => shareText(withSignature(text, t("signature")))}
          aria-label={t("label", { title })}
          className={`-my-3 -me-2.5 flex size-11 items-center justify-center rounded-full ${style.button}`}
        >
          <ShareIcon />
        </button>
      </div>
      <p className="leading-relaxed">{text}</p>
      {footnote}
    </section>
  );
}
