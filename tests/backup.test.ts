import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  backupFileName,
  createBackup,
  isBackupDue,
  parseBackup,
} from "@/lib/backup";
import { SCHEMA_VERSION, WillBabyDb } from "@/lib/db";
import { createIndexedDbStorage } from "@/lib/storage/indexedDb";
import type { StorageAdapter } from "@/lib/storage/types";

const now = new Date("2026-05-01T10:00:00.000Z");

let db: WillBabyDb;
let storage: StorageAdapter;

beforeEach(() => {
  db = new WillBabyDb(`test-${crypto.randomUUID()}`);
  storage = createIndexedDbStorage(db);
});

afterEach(() => db.delete());

async function seed(target: StorageAdapter) {
  await target.save("profile", { name: "נועה", role: "pregnant", partnerName: "דני" });
  await target.save("pregnancy", {
    method: "lmp",
    inputDate: "2026-01-01",
    lmpDate: "2026-01-01",
    dueDate: "2026-10-08",
    babiesCount: 1,
    dueDateHistory: [{ dueDate: "2026-10-08", changedAt: now.toISOString() }],
    status: "active",
  });
  await target.save("babies", { index: 0, sex: "girl" });
  await target.save("journal", { date: "2026-04-01", week: 13, text: "שלום", mood: 5, tags: [] });
  await target.save("appointments", { title: "סקירה", date: "2026-06-10", time: "09:30", done: false });
  await target.save("settings", { schemaVersion: SCHEMA_VERSION, seenSurprises: [12] });
  await target.save("weights", { date: "2026-04-01", kg: 62.5 });
  await target.save("kickSessions", {
    startedAt: now.toISOString(),
    endedAt: now.toISOString(),
    kicks: [now.toISOString()],
  });
  await target.save("contractions", { sessionId: "s1", startedAt: now.toISOString() });
  await target.save("checklist", { listType: "hospitalBag", itemId: "id-card", checked: true });
  await target.save("names", { name: "נגה", sex: "girl", votes: { me: 1 }, favorite: true });
  await target.save("bets", { guesserName: "סבתא", dueDateGuess: "2026-10-01", weightGuess: 3.2 });
  await target.save("badges", { badgeId: "welcome", earnedAt: now.toISOString() });
  await target.save("photos", {
    week: 13,
    blob: new Blob([new Uint8Array([255, 216, 255, 0, 1, 2, 3])], { type: "image/jpeg" }),
    takenAt: now.toISOString(),
  });
}

/** Snapshot with photo blobs replaced by their bytes, so it can be compared. */
async function comparable(target: StorageAdapter) {
  const snapshot = await target.exportAll();
  const photos = await Promise.all(
    snapshot.photos.map(async ({ blob, ...photo }) => ({
      ...photo,
      type: blob.type,
      bytes: [...new Uint8Array(await blob.arrayBuffer())],
    })),
  );
  return { ...snapshot, photos };
}

describe("backup round trip", () => {
  it("restores exactly what was exported, photos included", async () => {
    await seed(storage);
    const file = JSON.stringify(await createBackup(await storage.exportAll(), now));

    const target = createIndexedDbStorage(new WillBabyDb(`test-${crypto.randomUUID()}`));
    const parsed = parseBackup(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await target.replaceAll(parsed.snapshot);

    expect(await comparable(target)).toEqual(await comparable(storage));
    expect(parsed.exportedAt).toBe(now.toISOString());
  });

  it("replaces existing data instead of merging", async () => {
    await seed(storage);
    const file = JSON.stringify(await createBackup(await storage.exportAll(), now));
    await storage.save("journal", { date: "2026-04-02", week: 14, text: "חדש", tags: [] });

    const parsed = parseBackup(file);
    if (!parsed.ok) throw new Error("expected a valid backup");
    await storage.replaceAll(parsed.snapshot);

    expect((await storage.list("journal")).map((entry) => entry.text)).toEqual(["שלום"]);
  });

  it("restores a version 1 file, which has no phase 2 tables", async () => {
    await seed(storage);
    const backup = await createBackup(await storage.exportAll(), now);
    const { profile, pregnancy, babies, journal, photos, appointments, settings } = backup.tables;
    const v1File = {
      ...backup,
      schemaVersion: 1,
      tables: { profile, pregnancy, babies, journal, photos, appointments, settings },
    };
    const parsed = parseBackup(JSON.stringify(v1File));
    if (!parsed.ok) throw new Error("expected a valid backup");
    expect(parsed.snapshot.journal).toHaveLength(1);
    expect(parsed.snapshot.weights).toEqual([]);
    expect(parsed.snapshot.badges).toEqual([]);
  });

  it("stores the schema version and app id in the file", async () => {
    const backup = await createBackup(await storage.exportAll(), now);
    expect(backup).toMatchObject({ app: "willbaby", schemaVersion: SCHEMA_VERSION });
  });
});

describe("parseBackup rejects bad files without writing", () => {
  it.each([
    ["not JSON", "{oops", "invalidFile"],
    ["another app", JSON.stringify({ app: "other" }), "notWillbaby"],
    ["null", "null", "notWillbaby"],
    ["a newer version", JSON.stringify({ app: "willbaby", schemaVersion: SCHEMA_VERSION + 1 }), "newerVersion"],
    ["missing tables", JSON.stringify({ app: "willbaby", schemaVersion: 1, exportedAt: now.toISOString() }), "invalidFile"],
  ])("%s", (_, text, error) => {
    expect(parseBackup(text)).toEqual({ ok: false, error });
  });

  it("rejects a record with a bad field", async () => {
    await seed(storage);
    const backup = await createBackup(await storage.exportAll(), now);
    backup.tables.journal[0] = { ...backup.tables.journal[0], date: "01/04/2026" };
    const originalError = console.error;
    console.error = () => {};
    try {
      expect(parseBackup(JSON.stringify(backup))).toEqual({ ok: false, error: "invalidFile" });
    } finally {
      console.error = originalError;
    }
  });
});

describe("backup helpers", () => {
  it("names the file by date", () => {
    expect(backupFileName("2026-05-01")).toBe("willbaby-backup-2026-05-01.json");
  });

  it("is due 28 days after the last backup, or after onboarding", () => {
    const at = (iso: string) => new Date(iso);
    expect(isBackupDue(undefined, "2026-04-04T10:00:00Z", at("2026-05-01T10:00:00Z"))).toBe(false);
    expect(isBackupDue(undefined, "2026-04-03T10:00:00Z", at("2026-05-01T10:00:00Z"))).toBe(true);
    expect(isBackupDue("2026-04-20T10:00:00Z", "2026-01-01T10:00:00Z", at("2026-05-01T10:00:00Z"))).toBe(false);
  });
});
