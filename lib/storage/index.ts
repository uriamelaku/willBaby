import { WillBabyDb } from "@/lib/db";
import { createIndexedDbStorage } from "@/lib/storage/indexedDb";

/** The app's storage; swap the implementation here to add a sync backend. */
export const storage = createIndexedDbStorage(new WillBabyDb());
