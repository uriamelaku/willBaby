// Sharing is always started by the user; only the shown text is shared, never stored data.

export const whatsappShareUrl = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;

export const withSignature = (text: string, signature: string) => `${text}\n\n${signature}`;

/** Opens the system share sheet when available, otherwise WhatsApp. */
export async function shareText(text: string): Promise<void> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      // Closing the share sheet rejects with AbortError; that is a choice, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Web Share failed, falling back to WhatsApp", error);
    }
  }
  window.open(whatsappShareUrl(text), "_blank", "noopener,noreferrer");
}
