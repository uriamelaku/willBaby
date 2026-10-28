"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { useThemePreference } from "@/features/settings/useThemePreference";
import type { ThemePreference } from "@/lib/theme";

const themes: ThemePreference[] = ["light", "dark", "auto"];

export function MoreScreen() {
  const t = useTranslations("more");
  const [theme, setTheme] = useThemePreference();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Card>
        <ChoiceGroup
          legend={t("appearance")}
          inline
          value={theme}
          onChange={setTheme}
          options={themes.map((value) => ({ value, label: t(`themes.${value}`) }))}
        />
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("about")}</h2>
        <p>{t("aboutBody")}</p>
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("medical")}</h2>
        <p>{t("medicalBody")}</p>
      </Card>
    </main>
  );
}
