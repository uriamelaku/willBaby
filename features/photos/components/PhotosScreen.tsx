"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { JournalTabs } from "@/features/journal/components/JournalTabs";
import {
  compressImage,
  findPhotoForWeek,
  sortPhotosByWeek,
  toPhotoRecord,
} from "@/features/photos/photos";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import type { Photo } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";
import { PhotoImage } from "./PhotoImage";

export function PhotosScreen() {
  const state = usePregnancy();
  return (
    <Screen>
      <JournalTabs />
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <BellyPhotos data={state.data} />}
    </Screen>
  );
}

function BellyPhotos({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const { records, failed, reload } = useRecords("photos");
  const fileInput = useRef<HTMLInputElement>(null);
  const [today] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [deleting, setDeleting] = useState<Photo | null>(null);
  const week = findPregnancyStatus(parseLocalDate(data.pregnancy.lmpDate), today)?.contentWeek;

  if (failed) return <StorageError />;
  if (!records) return null;
  if (!week) return <p>{t("photos.outOfRange")}</p>;

  const currentPhoto = findPhotoForWeek(records, week);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      const blob = await compressImage(file);
      await storage.save("photos", toPhotoRecord(week, blob, records, new Date()));
      await reload();
    } catch (error) {
      console.error("Saving the belly photo failed", error);
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await storage.remove("photos", deleting.id);
      await reload();
    } catch (error) {
      console.error("Deleting the belly photo failed", error);
      setSaveFailed(true);
    }
    setDeleting(null);
  };

  const pickFile = () => fileInput.current?.click();

  return (
    <>
      <Card className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-semibold">{t("photos.thisWeek", { week })}</h2>
        {currentPhoto && (
          <PhotoImage
            blob={currentPhoto.blob}
            alt={t("photos.alt", { week })}
            className="aspect-[3/4] w-full rounded-2xl"
          />
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <Button
          onClick={currentPhoto ? () => setConfirmReplace(true) : pickFile}
          disabled={saving}
          className="w-full"
        >
          {saving ? t("photos.saving") : currentPhoto ? t("photos.replace") : t("photos.add")}
        </Button>
        {saveFailed && (
          <p role="alert" className="text-sm text-danger">
            {t("photos.error")}
          </p>
        )}
      </Card>

      <h2 className="text-xl font-semibold">{t("photos.gallery")}</h2>
      {records.length === 0 ? (
        <p className="text-muted">{t("photos.empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {sortPhotosByWeek(records).map((photo) => (
            <li key={photo.id} className="flex flex-col gap-1">
              <PhotoImage
                blob={photo.blob}
                alt={t("photos.alt", { week: photo.week })}
                className="aspect-[3/4] w-full rounded-2xl"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("week.title", { week: photo.week })}</span>
                <button
                  type="button"
                  onClick={() => setDeleting(photo)}
                  className="min-h-11 px-2 text-sm underline"
                >
                  {t("common.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmReplace}
        title={t("photos.replaceTitle")}
        message={t("photos.replaceMessage")}
        confirmLabel={t("photos.replace")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          setConfirmReplace(false);
          pickFile();
        }}
        onCancel={() => setConfirmReplace(false)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t("photos.deleteTitle")}
        message={t("common.deleteForever")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
