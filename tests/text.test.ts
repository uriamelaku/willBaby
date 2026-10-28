import { describe, expect, it } from "vitest";
import {
  babyNoun,
  findUnknownVariables,
  hasMalformedSelector,
  renderText,
  type TextContext,
  type TextVocabulary,
} from "@/lib/text";

const vocabulary: TextVocabulary = {
  baby: "הבייבי",
  twins: "התאומים",
  multiples: "הבייביז",
  partnerFallback: { pregnant: "בן או בת הזוג", partner: "בת הזוג" },
};

const context: TextContext = {
  role: "pregnant",
  userName: "נועה",
  babies: [{ sex: "unknown" }],
};

const template = "{baby} כבר [שומע|שומעת|שומעים] את הקול שלך";

describe("renderText", () => {
  it("unknown sex uses the masculine form and the generic noun", () => {
    expect(renderText(template, context, vocabulary)).toBe("הבייבי כבר שומע את הקול שלך");
  });

  it("a boy uses the masculine form", () => {
    const boy = { ...context, babies: [{ sex: "boy" as const }] };
    expect(renderText(template, boy, vocabulary)).toBe("הבייבי כבר שומע את הקול שלך");
  });

  it("a girl uses the feminine form", () => {
    const girl = { ...context, babies: [{ sex: "girl" as const }] };
    expect(renderText(template, girl, vocabulary)).toBe("הבייבי כבר שומעת את הקול שלך");
  });

  it("a named baby uses the name", () => {
    const named = { ...context, babies: [{ sex: "girl" as const, name: "מאיה" }] };
    expect(renderText(template, named, vocabulary)).toBe("מאיה כבר שומעת את הקול שלך");
  });

  it("twins use the plural form, whatever their sex and names", () => {
    const twins = {
      ...context,
      babies: [
        { sex: "girl" as const, name: "מאיה" },
        { sex: "girl" as const },
      ],
    };
    expect(renderText(template, twins, vocabulary)).toBe("התאומים כבר שומעים את הקול שלך");
  });

  it("three or more use the plural form", () => {
    const triplets = { ...context, babies: Array(3).fill({ sex: "unknown" }) };
    expect(renderText(template, triplets, vocabulary)).toBe("הבייביז כבר שומעים את הקול שלך");
  });

  it("fills {you} and {partnerName}", () => {
    const text = "{you}, תני ל{partnerName} לפנק אותך";
    expect(renderText(text, { ...context, partnerName: "דני" }, vocabulary)).toBe(
      "נועה, תני לדני לפנק אותך",
    );
  });

  it("falls back to a role-based partner word without a partner name", () => {
    expect(renderText("{partnerName}", context, vocabulary)).toBe("בן או בת הזוג");
    expect(renderText("{partnerName}", { ...context, role: "partner" }, vocabulary)).toBe(
      "בת הזוג",
    );
  });

  it("replaces every selector and variable in the text", () => {
    const text = "[הוא|היא|הם] [גדל|גדלה|גדלים], {baby} {baby}";
    expect(renderText(text, context, vocabulary)).toBe("הוא גדל, הבייבי הבייבי");
  });

  it("leaves text without placeholders unchanged", () => {
    expect(renderText("שתי מים", context, vocabulary)).toBe("שתי מים");
  });
});

describe("babyNoun", () => {
  it("is the name, the generic word, twins or multiples", () => {
    expect(babyNoun(context, vocabulary)).toBe("הבייבי");
    expect(babyNoun({ ...context, babies: [{ sex: "boy", name: "יואב" }] }, vocabulary)).toBe(
      "יואב",
    );
    expect(babyNoun({ ...context, babies: Array(2).fill({ sex: "boy" }) }, vocabulary)).toBe(
      "התאומים",
    );
    expect(babyNoun({ ...context, babies: Array(4).fill({ sex: "boy" }) }, vocabulary)).toBe(
      "הבייביז",
    );
  });
});

describe("template checks", () => {
  it("finds unknown variables", () => {
    expect(findUnknownVariables("{baby} {babby} {}")).toEqual(["babby", ""]);
  });

  it.each([
    ["[שומע|שומעת]", true],
    ["[שומע|שומעת|שומעים|x]", true],
    ["שומע]", true],
    ["a | b", true],
    ["[שומע|שומעת|שומעים] ו[גדל|גדלה|גדלים]", false],
    ["אין בורר", false],
  ])("%j malformed: %s", (text, malformed) => {
    expect(hasMalformedSelector(text)).toBe(malformed);
  });
});
