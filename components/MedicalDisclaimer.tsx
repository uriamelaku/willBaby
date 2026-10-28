import { useTranslations } from "next-intl";

/** Shown on every screen with medical information. */
export function MedicalDisclaimer() {
  const t = useTranslations("common");
  return <p className="mt-auto pt-4 text-center text-xs text-muted">{t("disclaimer")}</p>;
}
