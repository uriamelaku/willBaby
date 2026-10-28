import Link from "next/link";
import { useTranslations } from "next-intl";
import { Screen } from "@/components/Screen";
import { BagReminder } from "@/features/hospitalBag/components/BagReminder";

const tools = [
  { href: "/tools/appointments", icon: "🩺", title: "appointments", description: "appointmentsDescription" },
  { href: "/tools/kicks", icon: "👣", title: "kicks", description: "kicksDescription" },
  { href: "/tools/contractions", icon: "⏱️", title: "contractions", description: "contractionsDescription" },
  { href: "/tools/weight", icon: "⚖️", title: "weight", description: "weightDescription" },
  { href: "/tools/hospital-bag", icon: "🧳", title: "hospitalBag", description: "hospitalBagDescription" },
  { href: "/tools/names", icon: "📝", title: "names", description: "namesDescription" },
  { href: "/tools/bets", icon: "🎲", title: "bets", description: "betsDescription" },
  { href: "/reveal", icon: "🎁", title: "reveal", description: "revealDescription" },
] as const;

export function ToolsScreen() {
  const t = useTranslations("tools");
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <BagReminder />
      <ul className="flex flex-col gap-3">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex min-h-11 items-center gap-4 rounded-card bg-card p-5"
            >
              <span aria-hidden className="text-3xl">
                {tool.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{t(tool.title)}</span>
                <span className="text-sm text-muted">{t(tool.description)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
