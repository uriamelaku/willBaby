import { describe, expect, it } from "vitest";
import {
  findPhotoForWeek,
  scaledSize,
  sortPhotosByWeek,
  toPhotoRecord,
} from "@/features/photos/photos";
import type { Photo } from "@/lib/storage/types";

describe("scaledSize", () => {
  it("scales wide images down to 1080px, keeping the ratio", () => {
    expect(scaledSize(4032, 3024)).toEqual({ width: 1080, height: 810 });
    expect(scaledSize(3000, 4000)).toEqual({ width: 1080, height: 1440 });
  });

  it("never upscales", () => {
    expect(scaledSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(scaledSize(1080, 500)).toEqual({ width: 1080, height: 500 });
  });
});

const photo = (id: string, week: number) => ({ id, week }) as Photo;

describe("toPhotoRecord", () => {
  const blob = new Blob(["x"], { type: "image/jpeg" });
  const now = new Date("2026-05-01T10:00:00Z");

  it("creates a new photo for a week without one", () => {
    expect(toPhotoRecord(16, blob, [photo("a", 15)], now)).toEqual({
      id: undefined,
      week: 16,
      blob,
      caption: undefined,
      takenAt: "2026-05-01T10:00:00.000Z",
    });
  });

  it("replaces the photo of the same week", () => {
    expect(toPhotoRecord(15, blob, [photo("a", 15)], now).id).toBe("a");
  });
});

describe("photo lists", () => {
  it("finds by week and sorts by week", () => {
    const photos = [photo("b", 20), photo("a", 12)];
    expect(findPhotoForWeek(photos, 12)?.id).toBe("a");
    expect(findPhotoForWeek(photos, 13)).toBeUndefined();
    expect(sortPhotosByWeek(photos).map((p) => p.id)).toEqual(["a", "b"]);
  });
});
