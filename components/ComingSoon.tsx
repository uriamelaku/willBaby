import { useTranslations } from "next-intl";

/** Placeholder for tabs whose feature is not built yet. */
export function ComingSoon({ title }: { title: string }) {
  const t = useTranslations("common");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="opacity-75">{t("comingSoon")}</p>
    </main>
  );
}
