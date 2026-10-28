import { useTranslations } from "next-intl";

const daysLeftStatus = (daysLeft: number) =>
  daysLeft > 0 ? "before" : daysLeft === 0 ? "today" : "after";

export function DaysLeft({ daysLeft, className }: { daysLeft: number; className?: string }) {
  const t = useTranslations("pregnancy");
  return (
    <p className={className}>
      {t("daysLeft", { status: daysLeftStatus(daysLeft), days: Math.abs(daysLeft) })}
    </p>
  );
}
