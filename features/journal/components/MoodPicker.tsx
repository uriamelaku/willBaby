"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { MOODS } from "@/features/journal/journal";
import type { Mood } from "@/lib/storage/types";

export const MOOD_EMOJI: Record<Mood, string> = { 1: "😣", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

export function MoodPicker({ value, onChange }: {
  value?: Mood;
  onChange: (mood: Mood | undefined) => void;
}) {
  const t = useTranslations("journal");
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">{t("mood")}</legend>
      <div className="grid grid-cols-5 gap-2">
        {MOODS.map((mood) => (
          <label
            key={mood}
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border-2 border-text/15 bg-card text-2xl transition has-checked:border-brand has-checked:bg-brand/15 has-focus-visible:outline-2 has-focus-visible:outline-text motion-reduce:transition-none"
          >
            <input
              type="radio"
              name={name}
              checked={value === mood}
              onChange={() => onChange(mood)}
              className="sr-only"
            />
            <span aria-hidden>{MOOD_EMOJI[mood]}</span>
            <span className="sr-only">{t(`moods.${mood}`)}</span>
          </label>
        ))}
      </div>
      {value !== undefined && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="min-h-11 self-start text-sm underline"
        >
          {t("clearMood")}
        </button>
      )}
    </fieldset>
  );
}
