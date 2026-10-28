import type { Baby } from "@/lib/storage/types";

export type KnownSex = "boy" | "girl";
export type RevealResult = "boy" | "girl" | "boys" | "girls" | "mixed";

export const unrevealedBabies = (babies: Baby[]) => babies.filter((baby) => baby.sex === "unknown");

/** True when every unrevealed baby has a chosen sex. */
export const isRevealReady = (babies: Baby[], choices: Partial<Record<string, KnownSex>>) =>
  unrevealedBabies(babies).every((baby) => choices[baby.id] !== undefined);

/** The unrevealed babies with their chosen sex and the reveal time. Expects every choice to be made. */
export const applyReveal = (babies: Baby[], choices: Partial<Record<string, KnownSex>>, now: Date): Baby[] =>
  unrevealedBabies(babies).map((baby) => ({
    ...baby,
    sex: choices[baby.id]!,
    revealedAt: now.toISOString(),
  }));

/** The headline of the reveal, from all babies' sexes (unknown ones are ignored). */
export function revealResult(babies: Pick<Baby, "sex">[]): RevealResult | null {
  const sexes = babies.map((baby) => baby.sex).filter((sex) => sex !== "unknown");
  if (sexes.length === 0) return null;
  const boys = sexes.filter((sex) => sex === "boy").length;
  if (boys > 0 && boys < sexes.length) return "mixed";
  if (sexes.length === 1) return boys ? "boy" : "girl";
  return boys ? "boys" : "girls";
}
