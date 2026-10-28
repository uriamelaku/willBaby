import type { CalculationMethod } from "@/lib/pregnancy";

/** Local calendar date, `YYYY-MM-DD` (see `formatLocalDate` / `parseLocalDate`). */
export type CalendarDate = string;
/** ISO 8601 timestamp. */
export type Timestamp = string;

export interface BaseRecord {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Role = "pregnant" | "partner";

export interface Profile extends BaseRecord {
  name: string;
  role: Role;
  partnerName?: string;
}

export interface DueDateChange {
  dueDate: CalendarDate;
  changedAt: Timestamp;
}

export interface Pregnancy extends BaseRecord {
  method: CalculationMethod;
  inputDate: CalendarDate;
  lmpDate: CalendarDate;
  dueDate: CalendarDate;
  babiesCount: number;
  dueDateHistory: DueDateChange[];
  status: "active" | "born";
}

export type BabySex = "unknown" | "boy" | "girl";

export interface Baby extends BaseRecord {
  index: number;
  sex: BabySex;
  name?: string;
  revealedAt?: Timestamp;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry extends BaseRecord {
  date: CalendarDate;
  week: number;
  text: string;
  mood?: Mood;
  tags: string[];
}

export interface Photo extends BaseRecord {
  week: number;
  /** Compressed JPEG. */
  blob: Blob;
  caption?: string;
  takenAt: Timestamp;
}

export interface Appointment extends BaseRecord {
  title: string;
  date: CalendarDate;
  /** `HH:mm`, local time. */
  time?: string;
  place?: string;
  linkedTestId?: string;
  done: boolean;
  notes?: string;
}

export interface Settings extends BaseRecord {
  disclaimerAcceptedAt?: Timestamp;
  lastBackupAt?: Timestamp;
  schemaVersion: number;
}

export interface StorageRecords {
  profile: Profile;
  pregnancy: Pregnancy;
  babies: Baby;
  journal: JournalEntry;
  photos: Photo;
  appointments: Appointment;
  settings: Settings;
}

export type TableName = keyof StorageRecords;

export const TABLE_NAMES = [
  "profile",
  "pregnancy",
  "babies",
  "journal",
  "photos",
  "appointments",
  "settings",
] as const satisfies readonly TableName[];

/** Every record of every table, e.g. for backup and restore. */
export type StorageSnapshot = { [T in TableName]: StorageRecords[T][] };

/** Record data as passed to `save`: metadata is filled in, `id` is kept when given (update or restore). */
export type RecordInput<T extends TableName> = Omit<StorageRecords[T], keyof BaseRecord> & {
  id?: string;
};

/** The only way the app reads or writes user data, so a sync backend can replace IndexedDB later. */
export interface StorageAdapter {
  get<T extends TableName>(table: T, id: string): Promise<StorageRecords[T] | undefined>;
  list<T extends TableName>(table: T): Promise<StorageRecords[T][]>;
  /** Creates the record, or updates it when `id` exists; sets `createdAt` and `updatedAt`. */
  save<T extends TableName>(table: T, data: RecordInput<T>): Promise<StorageRecords[T]>;
  remove(table: TableName, id: string): Promise<void>;
  exportAll(): Promise<StorageSnapshot>;
  /** Replaces all data with the snapshot, keeping its ids and timestamps; all or nothing. */
  replaceAll(snapshot: StorageSnapshot): Promise<void>;
}
