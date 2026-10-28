import { describe, expect, it } from "vitest";
import {
  actualSex,
  emptyBetInput,
  rankBets,
  scoreBet,
  toBetInput,
  toBetRecord,
  validateBetInput,
  type BirthOutcome,
} from "@/features/bets/bets";
import type { Bet } from "@/lib/storage/types";

const bet = (overrides: Partial<Bet>): Bet => ({
  id: crypto.randomUUID(),
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  guesserName: "סבתא",
  dueDateGuess: "2027-04-19",
  weightGuess: 3.2,
  ...overrides,
});

const outcome: BirthOutcome = { birthDate: "2027-04-15", weightsKg: [3.4], sexes: ["girl"], names: ["נגה"] };

describe("validateBetInput", () => {
  const valid = { ...emptyBetInput, guesserName: "דוד", dueDateGuess: "2027-04-10", weightGuess: "3.3" };

  it("needs a name, a date and a plausible weight; sex and name are optional", () => {
    expect(validateBetInput(valid)).toBeNull();
    expect(validateBetInput({ ...valid, guesserName: " " })).toBe("nameRequired");
    expect(validateBetInput({ ...valid, dueDateGuess: "" })).toBe("invalidDate");
    expect(validateBetInput({ ...valid, weightGuess: "" })).toBe("invalidWeight");
    expect(validateBetInput({ ...valid, weightGuess: "3200" })).toBe("invalidWeight");
  });

  it("round-trips through a record", () => {
    const record = toBetRecord({ ...valid, guesserName: " דוד ", sexGuess: "boy", nameGuess: " " });
    expect(record).toEqual({
      id: undefined,
      guesserName: "דוד",
      dueDateGuess: "2027-04-10",
      weightGuess: 3.3,
      sexGuess: "boy",
      nameGuess: undefined,
    });
    expect(toBetInput(bet({ ...record, id: "x" }))).toEqual({ ...valid, sexGuess: "boy" });
  });
});

describe("scoring", () => {
  it("derives the actual sex, also for multiples", () => {
    expect(actualSex(["girl"])).toBe("girl");
    expect(actualSex(["boy", "boy"])).toBe("boy");
    expect(actualSex(["boy", "girl"])).toBe("mixed");
    expect(actualSex(["boy", "unknown"])).toBeNull();
  });

  it("adds days and kg × 10, and subtracts 3 for the sex and 10 for the name", () => {
    expect(scoreBet(bet({}), outcome)).toBe(4 + 2);
    expect(scoreBet(bet({ sexGuess: "girl" }), outcome)).toBe(6 - 3);
    expect(scoreBet(bet({ sexGuess: "boy" }), outcome)).toBe(6);
    expect(scoreBet(bet({ sexGuess: "girl", nameGuess: " נגה " }), outcome)).toBe(6 - 3 - 10);
  });

  it("compares twins with their average weight", () => {
    const twins: BirthOutcome = { ...outcome, weightsKg: [2.4, 2.6], sexes: ["boy", "girl"] };
    expect(scoreBet(bet({ dueDateGuess: "2027-04-15", weightGuess: 2.5, sexGuess: "mixed" }), twins)).toBe(-3);
  });

  it("ranks the lowest score first, keeping ties in the order the bets were made", () => {
    const early = bet({ guesserName: "א", createdAt: "2026-09-01T10:00:00.000Z" });
    const tie = bet({ guesserName: "ב", createdAt: "2026-09-02T10:00:00.000Z" });
    const best = bet({ guesserName: "ג", dueDateGuess: "2027-04-15", weightGuess: 3.4 });
    expect(rankBets([tie, best, early], outcome).map(({ bet: b, score }) => [b.guesserName, score])).toEqual([
      ["ג", 0],
      ["א", 6],
      ["ב", 6],
    ]);
  });
});
