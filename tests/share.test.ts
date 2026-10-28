import { afterEach, describe, expect, it, vi } from "vitest";
import { shareText, whatsappShareUrl, withSignature } from "@/lib/share";

describe("whatsappShareUrl", () => {
  it("encodes Hebrew, spaces and newlines", () => {
    expect(whatsappShareUrl("שלום עולם\nשורה")).toBe(
      "https://wa.me/?text=%D7%A9%D7%9C%D7%95%D7%9D%20%D7%A2%D7%95%D7%9C%D7%9D%0A%D7%A9%D7%95%D7%A8%D7%94",
    );
  });

  it("encodes characters that would break the query", () => {
    expect(whatsappShareUrl("a&b=c?#")).toBe("https://wa.me/?text=a%26b%3Dc%3F%23");
  });
});

describe("withSignature", () => {
  it("adds the signature after a blank line", () => {
    expect(withSignature("טיפ", "מתוך willBaby")).toBe("טיפ\n\nמתוך willBaby");
  });
});

describe("shareText", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubBrowser = (share?: (data: ShareData) => Promise<void>) => {
    const open = vi.fn();
    vi.stubGlobal("navigator", share ? { share } : {});
    vi.stubGlobal("window", { open });
    return open;
  };

  it("uses the Web Share API when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const open = stubBrowser(share);
    await shareText("טיפ");
    expect(share).toHaveBeenCalledWith({ text: "טיפ" });
    expect(open).not.toHaveBeenCalled();
  });

  it("does nothing more when the user closes the share sheet", async () => {
    const open = stubBrowser(() => Promise.reject(new DOMException("closed", "AbortError")));
    await shareText("טיפ");
    expect(open).not.toHaveBeenCalled();
  });

  it("falls back to WhatsApp when Web Share fails or is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = stubBrowser(() => Promise.reject(new Error("not allowed")));
    await shareText("טיפ");
    expect(failing).toHaveBeenCalledWith(whatsappShareUrl("טיפ"), "_blank", "noopener,noreferrer");

    const missing = stubBrowser();
    await shareText("טיפ");
    expect(missing).toHaveBeenCalledWith(whatsappShareUrl("טיפ"), "_blank", "noopener,noreferrer");
  });
});
