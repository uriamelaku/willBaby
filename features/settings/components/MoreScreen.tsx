"use client";

import { useTranslations } from "next-intl";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { BackupCard } from "@/features/backup/components/BackupCard";
import { useThemePreference } from "@/features/settings/useThemePreference";
import type { ThemePreference } from "@/lib/theme";

const themes: ThemePreference[] = ["light", "dark", "auto"];

export function MoreScreen() {
  const t = useTranslations("more");
  const [theme, setTheme] = useThemePreference();

  return (
    <Screen>
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
      <div id="backup" className="scroll-mt-4">
        <BackupCard />
      </div>
      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("about")}</h2>
        <p>{t("aboutBody")}</p>
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("medical")}</h2>
        <p>{t("medicalBody")}</p>
      </Card>
    </Screen>
  );
}
