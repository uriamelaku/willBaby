import type { BabySex, Role } from "@/lib/storage/types";

// Builds the final wording of content texts by role, baby sex and number of babies.
// Templates use variables ({baby}, {you}, {partnerName}) and selectors "[masculine|feminine|plural]"
// that agree with the baby; see docs/content.md.

export const TEXT_VARIABLES = ["baby", "you", "partnerName"] as const;

const VARIABLE_PATTERN = /\{(\w*)\}/g;
const SELECTOR_PATTERN = /\[([^[\]|]+)\|([^[\]|]+)\|([^[\]|]+)\]/g;

/** Words the renderer inserts, from messages/he.json (`text`). */
export interface TextVocabulary {
  baby: string;
  twins: string;
  multiples: string;
  partnerFallback: Record<Role, string>;
}

export interface TextContext {
  role: Role;
  userName: string;
  partnerName?: string;
  babies: { sex: BabySex; name?: string }[];
}

/** Variables in a template that the renderer does not know. */
export const findUnknownVariables = (template: string) =>
  [...template.matchAll(VARIABLE_PATTERN)]
    .map((match) => match[1])
    .filter((name) => !(TEXT_VARIABLES as readonly string[]).includes(name));

/** True when a template has brackets or pipes that are not a complete three-form selector. */
export const hasMalformedSelector = (template: string) =>
  /[[\]|]/.test(template.replace(SELECTOR_PATTERN, ""));

/** Index into a selector: 0 masculine (also unknown sex), 1 feminine, 2 plural. */
const selectorIndex = (babies: TextContext["babies"]) => {
  if (babies.length > 1) return 2;
  return babies[0]?.sex === "girl" ? 1 : 0;
};

export function babyNoun(context: TextContext, vocabulary: TextVocabulary): string {
  const { babies } = context;
  if (babies.length === 2) return vocabulary.twins;
  if (babies.length > 2) return vocabulary.multiples;
  return babies[0]?.name || vocabulary.baby;
}

export function renderText(
  template: string,
  context: TextContext,
  vocabulary: TextVocabulary,
): string {
  const index = selectorIndex(context.babies);
  const values: Record<(typeof TEXT_VARIABLES)[number], string> = {
    baby: babyNoun(context, vocabulary),
    you: context.userName,
    partnerName: context.partnerName || vocabulary.partnerFallback[context.role],
  };
  return template
    .replace(SELECTOR_PATTERN, (...forms: string[]) => forms[index + 1])
    .replace(VARIABLE_PATTERN, (match, name: string) =>
      name in values ? values[name as keyof typeof values] : match,
    );
}
