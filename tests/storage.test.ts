import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCHEMA_VERSION, WillBabyDb } from "../lib/db";
import { createIndexedDbStorage } from "../lib/storage/indexedDb";
import { emptySnapshot, type RecordInput, type StorageAdapter } from "../lib/storage/types";

const journalEntry: RecordInput<"journal"> = {
  date: "2026-03-15",
  week: 11,
  text: "הבחילות נרגעו קצת",
  mood: 4,
  tags: [],
};

let db: WillBabyDb;
let storage: StorageAdapter;

beforeEach(() => {
  db = new WillBabyDb(`test-${crypto.randomUUID()}`);
  storage = createIndexedDbStorage(db);
});

afterEach(async () => {
  vi.useRealTimers();
  await db.delete();
});

describe("WillBabyDb schema", () => {
  it("opens at the current schema version with the MVP tables", async () => {
    await db.open();
    expect(db.verno).toBe(SCHEMA_VERSION);
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      "appointments",
      "babies",
      "journal",
      "photos",
      "pregnancy",
      "profile",
      "settings",
    ]);
  });
});

describe("IndexedDB StorageAdapter", () => {
  it("creates a record with a UUID and timestamps", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T10:00:00Z"));

    const saved = await storage.save("journal", journalEntry);

    expect(saved).toMatchObject(journalEntry);
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.createdAt).toBe("2026-03-15T10:00:00.000Z");
    expect(saved.updatedAt).toBe(saved.createdAt);
    expect(await storage.get("journal", saved.id)).toEqual(saved);
  });

  it("updates a record, keeping createdAt and bumping updatedAt", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T10:00:00Z"));
    const created = await storage.save("journal", journalEntry);

    vi.setSystemTime(new Date("2026-03-16T08:00:00Z"));
    const updated = await storage.save("journal", { ...created, text: "יום טוב" });

    expect(updated).toMatchObject({
      id: created.id,
      text: "יום טוב",
      createdAt: "2026-03-15T10:00:00.000Z",
      updatedAt: "2026-03-16T08:00:00.000Z",
    });
    expect(await storage.list("journal")).toEqual([updated]);
  });

  it("keeps a given id for a record that does not exist yet (restore)", async () => {
    const id = crypto.randomUUID();
    const saved = await storage.save("journal", { ...journalEntry, id });
    expect(saved.id).toBe(id);
    expect(await storage.get("journal", id)).toEqual(saved);
  });

  it("lists all records of a table only", async () => {
    const first = await storage.save("journal", journalEntry);
    const second = await storage.save("journal", { ...journalEntry, date: "2026-03-16" });
    await storage.save("settings", { schemaVersion: SCHEMA_VERSION });

    const ids = (await storage.list("journal")).map((entry) => entry.id).sort();
    expect(ids).toEqual([first.id, second.id].sort());
  });

  it("returns undefined for a missing record", async () => {
    expect(await storage.get("journal", "missing")).toBeUndefined();
  });

  it("removes a record", async () => {
    const saved = await storage.save("journal", journalEntry);
    await storage.remove("journal", saved.id);
    expect(await storage.get("journal", saved.id)).toBeUndefined();
  });

  it("stores calendar dates as plain YYYY-MM-DD strings", async () => {
    const saved = await storage.save("pregnancy", {
      method: "ivf5",
      inputDate: "2026-01-20",
      lmpDate: "2026-01-01",
      dueDate: "2026-10-08",
      babiesCount: 2,
      dueDateHistory: [{ dueDate: "2026-10-08", changedAt: "2026-03-01T09:00:00.000Z" }],
      status: "active",
    });
    expect((await storage.get("pregnancy", saved.id))?.lmpDate).toBe("2026-01-01");
  });

  it("replaceAll with an empty snapshot deletes all data", async () => {
    await storage.save("journal", journalEntry);
    await storage.save("settings", { schemaVersion: SCHEMA_VERSION });
    await storage.replaceAll(emptySnapshot());
    expect(await storage.exportAll()).toEqual(emptySnapshot());
  });
});
