import Link from "next/link";
import { useTranslations } from "next-intl";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Screen } from "@/components/Screen";
import { librarySections } from "@/content/schema";
import { getLibraryTopics } from "@/lib/content";

/** The knowledge library: topics, "what's normal?" and rights, each a list of topic cards. */
export function LibraryScreen() {
  const t = useTranslations("library");
  const topics = getLibraryTopics();
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      {librarySections.map((section) => (
        <section key={section} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{t(`sections.${section}`)}</h2>
          <ul className="grid grid-cols-2 gap-3">
            {topics
              .filter((topic) => topic.section === section)
              .map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`/library/${topic.id}`}
                    className="flex h-full min-h-11 flex-col gap-1 rounded-card bg-card p-4"
                  >
                    <span aria-hidden className="text-3xl">
                      {topic.icon}
                    </span>
                    <span className="font-semibold leading-tight">{topic.title}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <MedicalDisclaimer />
    </Screen>
  );
}
