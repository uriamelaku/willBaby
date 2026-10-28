import Link from "next/link";
import { useTranslations } from "next-intl";
import { Screen } from "@/components/Screen";

const tools = [
  { href: "/tools/appointments", icon: "🩺", title: "appointments", description: "appointmentsDescription" },
] as const;

export function ToolsScreen() {
  const t = useTranslations("tools");
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <ul className="flex flex-col gap-3">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex min-h-11 items-center gap-4 rounded-3xl bg-card p-5 shadow-sm"
            >
              <span aria-hidden className="text-3xl">
                {tool.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{t(tool.title)}</span>
                <span className="text-sm opacity-75">{t(tool.description)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm opacity-75">{t("more")}</p>
    </Screen>
  );
}
