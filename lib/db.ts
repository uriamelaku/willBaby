import Dexie, { type EntityTable } from "dexie";
import type {
  Appointment,
  Baby,
  BabyName,
  Bet,
  ChecklistItem,
  Contraction,
  EarnedBadge,
  JournalEntry,
  KickSession,
  Photo,
  Pregnancy,
  Profile,
  Settings,
  WeightEntry,
} from "@/lib/storage/types";

/** Bump together with a new `this.version(n)` block below; checked on backup import. */
export const SCHEMA_VERSION = 2;

// Use through StorageAdapter only; never from UI components.
export class WillBabyDb extends Dexie {
  profile!: EntityTable<Profile, "id">;
  pregnancy!: EntityTable<Pregnancy, "id">;
  babies!: EntityTable<Baby, "id">;
  journal!: EntityTable<JournalEntry, "id">;
  photos!: EntityTable<Photo, "id">;
  appointments!: EntityTable<Appointment, "id">;
  settings!: EntityTable<Settings, "id">;
  weights!: EntityTable<WeightEntry, "id">;
  kickSessions!: EntityTable<KickSession, "id">;
  contractions!: EntityTable<Contraction, "id">;
  checklist!: EntityTable<ChecklistItem, "id">;
  names!: EntityTable<BabyName, "id">;
  bets!: EntityTable<Bet, "id">;
  badges!: EntityTable<EarnedBadge, "id">;

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
    // Phase 2 tools and gamification: new tables only, existing records are kept.
    this.version(2)
      .stores({
        weights: "id, date",
        kickSessions: "id, startedAt",
        contractions: "id, sessionId, startedAt",
        checklist: "id, listType",
        names: "id",
        bets: "id",
        badges: "id, badgeId",
      })
      .upgrade((tx) =>
        tx.table<Settings, string>("settings").toCollection().modify({ schemaVersion: 2 }),
      );
  }
}
