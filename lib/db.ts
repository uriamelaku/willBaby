import Dexie, { type EntityTable } from "dexie";
import type {
  Appointment,
  Baby,
  JournalEntry,
  Photo,
  Pregnancy,
  Profile,
  Settings,
} from "@/lib/storage/types";

/** Bump together with a new `this.version(n)` block below; checked on backup import. */
export const SCHEMA_VERSION = 1;

// Use through StorageAdapter only; never from UI components.
export class WillBabyDb extends Dexie {
  profile!: EntityTable<Profile, "id">;
  pregnancy!: EntityTable<Pregnancy, "id">;
  babies!: EntityTable<Baby, "id">;
  journal!: EntityTable<JournalEntry, "id">;
  photos!: EntityTable<Photo, "id">;
  appointments!: EntityTable<Appointment, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor(name = "willbaby") {
    super(name);
    // Schema changes: add this.version(n + 1).stores(...) with an upgrade(); never edit a released version.
    this.version(1).stores({
      profile: "id",
      pregnancy: "id, status",
      babies: "id, index",
      journal: "id, date",
      photos: "id, week",
      appointments: "id, date",
      settings: "id",
    });
  }
}
