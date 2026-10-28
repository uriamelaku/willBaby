import { describe, expect, it } from "vitest";
import { applyReveal, isRevealReady, revealResult, unrevealedBabies } from "@/features/reveal/reveal";
import type { Baby, BabySex } from "@/lib/storage/types";

const baby = (id: string, sex: BabySex): Baby => ({
  id,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  index: Number(id),
  sex,
});

describe("sex reveal", () => {
  const twins = [baby("0", "unknown"), baby("1", "unknown")];

  it("needs a choice for every unrevealed baby", () => {
    expect(unrevealedBabies([baby("0", "boy"), ...twins.slice(1)]).map((b) => b.id)).toEqual(["1"]);
    expect(isRevealReady(twins, { "0": "boy" })).toBe(false);
    expect(isRevealReady(twins, { "0": "boy", "1": "girl" })).toBe(true);
  });

  it("sets the sex and the reveal time of the unrevealed babies only", () => {
    const now = new Date("2026-10-28T10:00:00.000Z");
    const revealed = applyReveal([baby("0", "girl"), baby("1", "unknown")], { "1": "boy" }, now);
    expect(revealed).toEqual([{ ...baby("1", "unknown"), sex: "boy", revealedAt: now.toISOString() }]);
  });

  it.each([
    [["boy"], "boy"],
    [["girl"], "girl"],
    [["boy", "boy"], "boys"],
    [["girl", "girl", "girl"], "girls"],
    [["boy", "girl"], "mixed"],
    [["unknown"], null],
  ] as const)("%j → %s", (sexes, result) => {
    expect(revealResult(sexes.map((sex) => ({ sex })))).toBe(result);
  });
});
