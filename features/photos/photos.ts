import type { Photo, RecordInput } from "@/lib/storage/types";

export const MAX_PHOTO_WIDTH = 1080;
export const PHOTO_QUALITY = 0.8;

/** Size that fits within maxWidth, keeping the aspect ratio; never upscales. */
export function scaledSize(width: number, height: number, maxWidth = MAX_PHOTO_WIDTH) {
  if (width <= maxWidth) return { width, height };
  return { width: maxWidth, height: Math.round((height * maxWidth) / width) };
}

/** Compresses an image file in the browser to a JPEG (max 1080px wide, quality 0.8). */
export async function compressImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = scaledSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed"))),
      "image/jpeg",
      PHOTO_QUALITY,
    ),
  );
}

export const findPhotoForWeek = (photos: Photo[], week: number) =>
  photos.find((photo) => photo.week === week);

export const sortPhotosByWeek = (photos: Photo[]) => [...photos].sort((a, b) => a.week - b.week);

/** One photo per week: a new photo for a week that has one replaces it (same id). */
export function toPhotoRecord(
  week: number,
  blob: Blob,
  photos: Photo[],
  now: Date,
): RecordInput<"photos"> {
  const existing = findPhotoForWeek(photos, week);
  return { id: existing?.id, week, blob, caption: existing?.caption, takenAt: now.toISOString() };
}
