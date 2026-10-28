import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/ComingSoon";

export default function Page() {
  const t = useTranslations("nav");
  return <ComingSoon title={t("tools")} />;
}
