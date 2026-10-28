import type { BabyName, NameSex, RecordInput, Vote, Voter } from "@/lib/storage/types";

export const MAX_NAME_LENGTH = 40;
export const VOTES: Vote[] = [-1, 0, 1];
export const VOTERS: Voter[] = ["me", "partner"];

export type NameInputError = "empty" | "duplicate";

const normalize = (name: string) => name.trim().toLocaleLowerCase("he");

export function validateNameInput(name: string, names: BabyName[]): NameInputError | null {
  if (!name.trim()) return "empty";
  if (names.some((existing) => normalize(existing.name) === normalize(name))) return "duplicate";
  return null;
}

export const toNameRecord = (name: string, sex: NameSex): RecordInput<"names"> => ({
  name: name.trim(),
  sex,
  votes: {},
  favorite: false,
});

export const castVote = (name: BabyName, voter: Voter, vote: Vote): BabyName => ({
  ...name,
  votes: { ...name.votes, [voter]: vote },
});

/** The oldest name this person has not voted on yet ("whose turn" on one shared phone). */
export const nextToVote = (names: BabyName[], voter: Voter) =>
  [...names]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .find((name) => name.votes[voter] === undefined);

export const nameScore = (name: BabyName) => (name.votes.me ?? 0) + (name.votes.partner ?? 0);

/** Both voted yes. */
export const isMatch = (name: BabyName) => name.votes.me === 1 && name.votes.partner === 1;

/** Favorites first, then by score, then alphabetically. */
export const rankNames = (names: BabyName[]) =>
  [...names].sort(
    (a, b) =>
      Number(b.favorite) - Number(a.favorite) ||
      nameScore(b) - nameScore(a) ||
      a.name.localeCompare(b.name, "he"),
  );
