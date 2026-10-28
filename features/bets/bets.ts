import { differenceInCalendarDays } from "date-fns";
import { parseLocalDate } from "@/lib/pregnancy";
import type { BabySex, Bet, CalendarDate, RecordInput, SexGuess } from "@/lib/storage/types";

export const MIN_WEIGHT_GUESS = 0.5;
export const MAX_WEIGHT_GUESS = 6;
export const MAX_GUESSER_NAME = 40;

/** Form values; empty strings mean "no guess". */
export interface BetInput {
  guesserName: string;
  dueDateGuess: CalendarDate;
  weightGuess: string;
  sexGuess: SexGuess | "";
  nameGuess: string;
}

export const emptyBetInput: BetInput = {
  guesserName: "",
  dueDateGuess: "",
  weightGuess: "",
  sexGuess: "",
  nameGuess: "",
};

export type BetInputError = "nameRequired" | "invalidDate" | "invalidWeight";

export function validateBetInput(input: BetInput): BetInputError | null {
  if (!input.guesserName.trim()) return "nameRequired";
  try {
    parseLocalDate(input.dueDateGuess);
  } catch {
    return "invalidDate";
  }
  const kg = Number(input.weightGuess);
  if (!input.weightGuess.trim() || !(kg >= MIN_WEIGHT_GUESS && kg <= MAX_WEIGHT_GUESS)) return "invalidWeight";
  return null;
}

/** Record data for `storage.save`; keeps the id when editing. Expects validated input. */
export const toBetRecord = (input: BetInput, existing?: Bet): RecordInput<"bets"> => ({
  id: existing?.id,
  guesserName: input.guesserName.trim(),
  dueDateGuess: input.dueDateGuess,
  weightGuess: Math.round(Number(input.weightGuess) * 100) / 100,
  sexGuess: input.sexGuess || undefined,
  nameGuess: input.nameGuess.trim() || undefined,
});

export const toBetInput = (bet: Bet): BetInput => ({
  guesserName: bet.guesserName,
  dueDateGuess: bet.dueDateGuess,
  weightGuess: String(bet.weightGuess),
  sexGuess: bet.sexGuess ?? "",
  nameGuess: bet.nameGuess ?? "",
});

/** What actually happened; filled in on the "baby is born" screen (phase 3). */
export interface BirthOutcome {
  birthDate: CalendarDate;
  weightsKg: number[];
  sexes: BabySex[];
  names: string[];
}

/** "boy" or "girl" when all babies share it, "mixed" for both; null while any sex is unknown. */
export function actualSex(sexes: BabySex[]): SexGuess | null {
  if (sexes.length === 0 || sexes.includes("unknown")) return null;
  if (sexes.every((sex) => sex === "boy")) return "boy";
  if (sexes.every((sex) => sex === "girl")) return "girl";
  return "mixed";
}

const normalize = (name: string) => name.trim().toLocaleLowerCase("he");

/**
 * Lower is better: days off + kg off × 10, minus 3 for the right sex and 10 for a right name.
 * Twins and more compare with the average weight.
 */
export function scoreBet(bet: Bet, outcome: BirthOutcome): number {
  const averageKg = outcome.weightsKg.reduce((sum, kg) => sum + kg, 0) / outcome.weightsKg.length;
  const daysOff = Math.abs(
    differenceInCalendarDays(parseLocalDate(bet.dueDateGuess), parseLocalDate(outcome.birthDate)),
  );
  const sexCorrect = bet.sexGuess !== undefined && bet.sexGuess === actualSex(outcome.sexes);
  const nameCorrect =
    bet.nameGuess !== undefined && outcome.names.some((name) => normalize(name) === normalize(bet.nameGuess!));
  const score = daysOff + Math.abs(bet.weightGuess - averageKg) * 10 - (sexCorrect ? 3 : 0) - (nameCorrect ? 10 : 0);
  return Math.round(score * 100) / 100;
}

/** Bets with their scores, best first; equal scores keep the order the bets were made. */
export const rankBets = (bets: Bet[], outcome: BirthOutcome) =>
  [...bets]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((bet) => ({ bet, score: scoreBet(bet, outcome) }))
    .sort((a, b) => a.score - b.score);

/** Bets in the order they were made. */
export const sortBets = (bets: Bet[]) => [...bets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
