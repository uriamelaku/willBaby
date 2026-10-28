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

export interface WeightEntry extends BaseRecord {
  date: CalendarDate;
  kg: number;
}

export interface KickSession extends BaseRecord {
  startedAt: Timestamp;
  /** Missing while the session is running. */
  endedAt?: Timestamp;
  kicks: Timestamp[];
}

export interface Contraction extends BaseRecord {
  /** Contractions close together share a session (see features/contractions). */
  sessionId: string;
  startedAt: Timestamp;
  /** Missing while the contraction is running. */
  endedAt?: Timestamp;
}

export type ChecklistType = "hospitalBag";

export interface ChecklistItem extends BaseRecord {
  listType: ChecklistType;
  /** A default item from content; missing for a custom item. */
  itemId?: string;
  /** The text of a custom item. */
  customText?: string;
  checked: boolean;
}

export type NameSex = "boy" | "girl" | "any";
/** -1 no, 0 maybe, 1 yes; missing until that person votes. */
export type Vote = -1 | 0 | 1;
export type Voter = "me" | "partner";

export interface BabyName extends BaseRecord {
  name: string;
  sex: NameSex;
  votes: Partial<Record<Voter, Vote>>;
  favorite: boolean;
}

/** "mixed" is for multiples with both boys and girls. */
export type SexGuess = "boy" | "girl" | "mixed";

export interface Bet extends BaseRecord {
  guesserName: string;
  dueDateGuess: CalendarDate;
  weightGuess: number;
  sexGuess?: SexGuess;
  nameGuess?: string;
}

export interface EarnedBadge extends BaseRecord {
  badgeId: string;
  earnedAt: Timestamp;
  seenAt?: Timestamp;
}

export interface Settings extends BaseRecord {
  /** Weeks whose one-time surprise was shown. */
  seenSurprises?: number[];
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
  weights: WeightEntry;
  kickSessions: KickSession;
  contractions: Contraction;
  checklist: ChecklistItem;
  names: BabyName;
  bets: Bet;
  badges: EarnedBadge;
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
  "weights",
  "kickSessions",
  "contractions",
  "checklist",
  "names",
  "bets",
  "badges",
] as const satisfies readonly TableName[];

/** Every record of every table, e.g. for backup and restore. */
export type StorageSnapshot = { [T in TableName]: StorageRecords[T][] };

/** A snapshot with no records; `replaceAll(emptySnapshot())` deletes all user data. */
export const emptySnapshot = () =>
  Object.fromEntries(TABLE_NAMES.map((table) => [table, []])) as unknown as StorageSnapshot;

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
