import { useTranslations } from "next-intl";

/** Shown on every screen with medical information; `sensitive` adds the note for kicks and contractions. */
export function MedicalDisclaimer({ sensitive = false }: { sensitive?: boolean }) {
  const t = useTranslations("common");
  return (
    <div className="mt-auto flex flex-col gap-1 pt-4 text-center text-xs text-muted">
      {sensitive && <p className="font-semibold">{t("sensitiveNote")}</p>}
      <p>{t("disclaimer")}</p>
    </div>
  );
}
