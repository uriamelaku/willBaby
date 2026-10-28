"use client";

import { useTranslations } from "next-intl";
import type { Baby, Profile } from "@/lib/storage/types";
import { babyNoun, renderText, type TextContext, type TextVocabulary } from "@/lib/text";

/** Renders content templates for the given user and babies. */
export function useContentText(
  profile: Pick<Profile, "role" | "name" | "partnerName">,
  babies: Pick<Baby, "sex" | "name">[],
) {
  const t = useTranslations("text");
  const vocabulary: TextVocabulary = {
    baby: t("baby"),
    twins: t("twins"),
    multiples: t("multiples"),
    partnerFallback: {
      pregnant: t("partnerFallback.pregnant"),
      partner: t("partnerFallback.partner"),
    },
  };
  const context: TextContext = {
    role: profile.role,
    userName: profile.name,
    partnerName: profile.partnerName,
    babies,
  };
  return {
    render: (template: string) => renderText(template, context, vocabulary),
    babyNoun: babyNoun(context, vocabulary),
  };
}
