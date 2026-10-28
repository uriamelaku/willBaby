import { describe, expect, it } from "vitest";
import {
  castVote,
  isMatch,
  nameScore,
  nextToVote,
  rankNames,
  toNameRecord,
  validateNameInput,
} from "@/features/names/names";
import type { BabyName } from "@/lib/storage/types";

const name = (value: string, overrides: Partial<BabyName> = {}): BabyName => ({
  id: value,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  name: value,
  sex: "any",
  votes: {},
  favorite: false,
  ...overrides,
});

describe("names", () => {
  it("validates a new name", () => {
    expect(validateNameInput("  ", [])).toBe("empty");
    expect(validateNameInput(" נגה ", [name("נגה")])).toBe("duplicate");
    expect(validateNameInput("Noa", [name("noa")])).toBe("duplicate");
    expect(validateNameInput("יואב", [name("נגה")])).toBeNull();
  });

  it("creates a trimmed record without votes", () => {
    expect(toNameRecord(" אורי ", "boy")).toEqual({ name: "אורי", sex: "boy", votes: {}, favorite: false });
  });

  it("records a vote per person", () => {
    const voted = castVote(castVote(name("נגה"), "me", 1), "partner", 0);
    expect(voted.votes).toEqual({ me: 1, partner: 0 });
    expect(castVote(voted, "me", -1).votes).toEqual({ me: -1, partner: 0 });
  });

  it("gives each person the oldest name they have not voted on", () => {
    const names = [
      name("ב", { createdAt: "2026-09-02T10:00:00.000Z", votes: { me: 1 } }),
      name("א", { createdAt: "2026-09-01T10:00:00.000Z", votes: { partner: 0 } }),
      name("ג", { createdAt: "2026-09-03T10:00:00.000Z" }),
    ];
    expect(nextToVote(names, "me")?.name).toBe("א");
    expect(nextToVote(names, "partner")?.name).toBe("ב");
    expect(nextToVote([names[0]], "me")).toBeUndefined();
  });

  it("scores, matches and ranks with favorites first", () => {
    const loved = name("ליה", { votes: { me: 1, partner: 1 } });
    const mixed = name("אלה", { votes: { me: 1, partner: -1 } });
    const favorite = name("תמר", { votes: { me: -1 }, favorite: true });
    const unvoted = name("בר");
    expect(nameScore(loved)).toBe(2);
    expect(nameScore(unvoted)).toBe(0);
    expect(isMatch(loved)).toBe(true);
    expect(isMatch(mixed)).toBe(false);
    expect(rankNames([mixed, unvoted, loved, favorite]).map((n) => n.name)).toEqual(["תמר", "ליה", "אלה", "בר"]);
  });
});
