import type { LibraryTopic } from "@/content/schema";

const normalize = (text: string) => text.toLocaleLowerCase("he").replace(/\s+/g, " ").trim();

/** Topics whose title, intro or entries contain every word of the query; all topics for an empty query. */
export function searchLibrary(topics: LibraryTopic[], query: string): LibraryTopic[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return topics;
  return topics.filter((topic) => {
    const haystack = normalize(
      [topic.title, topic.intro, ...topic.entries.flatMap((entry) => [entry.title, entry.text, entry.whenToCall ?? ""])].join(" "),
    );
    return words.every((word) => haystack.includes(word));
  });
}
