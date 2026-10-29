"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/ui/TextField";
import { librarySections } from "@/content/schema";
import { searchLibrary } from "@/features/library/library";
import { getLibraryTopics } from "@/lib/content";

/** The knowledge library by section, with a search over all topics. */
export function LibraryScreen() {
  const t = useTranslations("library");
  const [query, setQuery] = useState("");
  const topics = searchLibrary(getLibraryTopics(), query);

  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      <TextField
        type="search"
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {topics.length === 0 && <p className="text-center text-muted">{t("noResults")}</p>}
      {librarySections.map((section) => {
        const sectionTopics = topics.filter((topic) => topic.section === section);
        if (sectionTopics.length === 0) return null;
        return (
          <section key={section} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{t(`sections.${section}`)}</h2>
            <ul className="grid grid-cols-2 gap-3">
              {sectionTopics.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`/library/${topic.id}`}
                    className="flex h-full min-h-11 flex-col gap-1 rounded-card bg-card p-4"
                  >
                    <span aria-hidden className="text-3xl">
                      {topic.icon}
                    </span>
                    <span className="leading-tight font-semibold">{topic.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <MedicalDisclaimer />
    </Screen>
  );
}
