import { z } from "zod";
import { MAX_CONTENT_WEEK } from "@/lib/pregnancy";
import { SCHEMA_VERSION } from "@/lib/db";
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
  StorageSnapshot,
  WeightEntry,
} from "@/lib/storage/types";

// Backup file: every table as JSON, photos as Base64. Imports are validated before anything is replaced.

export const BACKUP_APP_ID = "willbaby";
export const BACKUP_INTERVAL_DAYS = 28;

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestamp = z.iso.datetime({ offset: true });
const shortText = z.string().max(200);
const week = z.int().min(1).max(MAX_CONTENT_WEEK);

const base = { id: z.string().min(1), createdAt: timestamp, updatedAt: timestamp };

const profileSchema: z.ZodType<Profile> = z.object({
  ...base,
  name: shortText,
  role: z.enum(["pregnant", "partner"]),
  partnerName: shortText.optional(),
});

const pregnancySchema: z.ZodType<Pregnancy> = z.object({
  ...base,
  method: z.enum(["lmp", "due", "ivf3", "ivf5"]),
  inputDate: calendarDate,
  lmpDate: calendarDate,
  dueDate: calendarDate,
  babiesCount: z.int().min(1).max(10),
  dueDateHistory: z.array(z.object({ dueDate: calendarDate, changedAt: timestamp })),
  status: z.enum(["active", "born"]),
});

const babySchema: z.ZodType<Baby> = z.object({
  ...base,
  index: z.int().min(0),
  sex: z.enum(["unknown", "boy", "girl"]),
  name: shortText.optional(),
  revealedAt: timestamp.optional(),
});

const journalSchema: z.ZodType<JournalEntry> = z.object({
  ...base,
  date: calendarDate,
  week,
  text: z.string().max(5000),
  mood: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  tags: z.array(shortText),
});

const serializedPhotoSchema = z.object({
  ...base,
  week,
  image: z.object({ type: z.string().regex(/^image\//), base64: z.base64() }),
  caption: shortText.optional(),
  takenAt: timestamp,
});

const appointmentSchema: z.ZodType<Appointment> = z.object({
  ...base,
  title: shortText,
  date: calendarDate,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  place: shortText.optional(),
  linkedTestId: shortText.optional(),
  done: z.boolean(),
  notes: shortText.optional(),
});

const settingsSchema: z.ZodType<Settings> = z.object({
  ...base,
  seenSurprises: z.array(week).optional(),
  disclaimerAcceptedAt: timestamp.optional(),
  lastBackupAt: timestamp.optional(),
  schemaVersion: z.int().min(1),
});

const weightSchema: z.ZodType<WeightEntry> = z.object({
  ...base,
  date: calendarDate,
  kg: z.number().positive().max(500),
});

const kickSessionSchema: z.ZodType<KickSession> = z.object({
  ...base,
  startedAt: timestamp,
  endedAt: timestamp.optional(),
  kicks: z.array(timestamp).max(1000),
});

const contractionSchema: z.ZodType<Contraction> = z.object({
  ...base,
  sessionId: z.string().min(1),
  startedAt: timestamp,
  endedAt: timestamp.optional(),
});

const checklistSchema: z.ZodType<ChecklistItem> = z.object({
  ...base,
  listType: z.literal("hospitalBag"),
  itemId: shortText.optional(),
  customText: shortText.optional(),
  checked: z.boolean(),
});

const vote = z.union([z.literal(-1), z.literal(0), z.literal(1)]);

const nameSchema: z.ZodType<BabyName> = z.object({
  ...base,
  name: shortText,
  sex: z.enum(["boy", "girl", "any"]),
  votes: z.object({ me: vote.optional(), partner: vote.optional() }),
  favorite: z.boolean(),
});

const betSchema: z.ZodType<Bet> = z.object({
  ...base,
  guesserName: shortText,
  dueDateGuess: calendarDate,
  weightGuess: z.number().positive().max(10),
  sexGuess: z.enum(["boy", "girl", "mixed"]).optional(),
  nameGuess: shortText.optional(),
});

const badgeSchema: z.ZodType<EarnedBadge> = z.object({
  ...base,
  badgeId: shortText,
  earnedAt: timestamp,
  seenAt: timestamp.optional(),
});

const backupFileSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  schemaVersion: z.int().min(1),
  exportedAt: timestamp,
  tables: z.object({
    profile: z.array(profileSchema),
    pregnancy: z.array(pregnancySchema),
    babies: z.array(babySchema),
    journal: z.array(journalSchema),
    photos: z.array(serializedPhotoSchema),
    appointments: z.array(appointmentSchema),
    settings: z.array(settingsSchema),
    // Added in schema version 2; missing in version 1 files.
    weights: z.array(weightSchema).default([]),
    kickSessions: z.array(kickSessionSchema).default([]),
    contractions: z.array(contractionSchema).default([]),
    checklist: z.array(checklistSchema).default([]),
    names: z.array(nameSchema).default([]),
    bets: z.array(betSchema).default([]),
    badges: z.array(badgeSchema).default([]),
  }),
});

export type BackupFile = z.infer<typeof backupFileSchema>;

export type BackupError = "invalidFile" | "notWillbaby" | "newerVersion";

export type ParsedBackup =
  | { ok: true; snapshot: StorageSnapshot; exportedAt: string }
  | { ok: false; error: BackupError };

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], { type });
}

export async function createBackup(snapshot: StorageSnapshot, now: Date): Promise<BackupFile> {
  const photos = await Promise.all(
    snapshot.photos.map(async ({ blob, ...photo }) => ({
      ...photo,
      image: { type: blob.type || "image/jpeg", base64: await blobToBase64(blob) },
    })),
  );
  return {
    app: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    tables: { ...snapshot, photos },
  };
}

export const backupFileName = (date: string) => `willbaby-backup-${date}.json`;

/** Parses and validates a backup file's text. Nothing is written here. */
export function parseBackup(text: string): ParsedBackup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalidFile" };
  }
  if ((json as { app?: unknown } | null)?.app !== BACKUP_APP_ID) {
    return { ok: false, error: "notWillbaby" };
  }
  if (Number((json as { schemaVersion?: unknown }).schemaVersion) > SCHEMA_VERSION) {
    return { ok: false, error: "newerVersion" };
  }
  const result = backupFileSchema.safeParse(json);
  if (!result.success) {
    console.error("Backup file failed validation", result.error.issues);
    return { ok: false, error: "invalidFile" };
  }
  // Version 1 files only lack the version 2 tables, which the schema defaults to empty.
  const { tables, exportedAt } = result.data;
  const photos: Photo[] = tables.photos.map(({ image, ...photo }) => ({
    ...photo,
    blob: base64ToBlob(image.base64, image.type),
  }));
  return { ok: true, snapshot: { ...tables, photos }, exportedAt };
}

/** A reminder is due 28 days after the last backup (or after onboarding when there was none). */
export function isBackupDue(lastBackupAt: string | undefined, onboardedAt: string, now: Date) {
  const since = new Date(lastBackupAt ?? onboardedAt).getTime();
  return now.getTime() - since >= BACKUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
}
