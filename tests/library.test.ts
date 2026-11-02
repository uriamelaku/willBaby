import { describe, expect, it } from "vitest";
import type { LibraryTopic } from "@/content/schema";
import library from "@/content/he/library.json";
import { searchLibrary } from "@/features/library/library";

const topics = library as LibraryTopic[];
const ids = (list: LibraryTopic[]) => list.map((topic) => topic.id);

describe("searchLibrary", () => {
  it("returns everything for an empty query", () => {
    expect(searchLibrary(topics, "  ")).toHaveLength(topics.length);
  });

  it("matches titles and entry texts", () => {
    expect(ids(searchLibrary(topics, "צרבת"))).toContain("heartburn");
    expect(ids(searchLibrary(topics, "אפידורל"))).toEqual(["pain-relief"]);
  });

  it("needs every word to match", () => {
    expect(ids(searchLibrary(topics, "שעלת שבוע"))).toEqual(["vaccines"]);
    expect(searchLibrary(topics, "שעלת דינוזאור")).toEqual([]);
  });
});
