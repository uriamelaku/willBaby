import { useTranslations } from "next-intl";
import { Screen } from "@/components/Screen";
import { BagReminder } from "@/features/hospitalBag/components/BagReminder";
import { ToolsList } from "./ToolsList";

export function ToolsScreen() {
  const t = useTranslations("tools");
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <BagReminder />
      <ToolsList />
    </Screen>
  );
}
