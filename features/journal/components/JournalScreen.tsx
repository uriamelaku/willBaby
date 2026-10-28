"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  sortJournalEntries,
  toJournalRecord,
  type JournalInput,
} from "@/features/journal/journal";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import type { JournalEntry } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";
import { JournalForm } from "./JournalForm";
import { JournalTabs } from "./JournalTabs";
import { MOOD_EMOJI } from "./MoodPicker";

export function JournalScreen() {
  const state = usePregnancy();
  return (
    <Screen>
      <JournalTabs />
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <JournalEntries data={state.data} />}
    </Screen>
  );
}

function JournalEntries({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const format = useFormatter();
  const { records, failed, reload } = useRecords("journal");
  const [editing, setEditing] = useState<JournalEntry | "new" | null>(null);
  const [deleting, setDeleting] = useState<JournalEntry | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const lmpDate = data.pregnancy.lmpDate;

  const save = async (input: JournalInput) => {
    const existing = editing === "new" ? undefined : (editing ?? undefined);
    await storage.save("journal", toJournalRecord(input, lmpDate, existing));
    setEditing(null);
    await reload();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await storage.remove("journal", deleting.id);
      setDeleteFailed(false);
      await reload();
    } catch (error) {
      console.error("Deleting the journal entry failed", error);
      setDeleteFailed(true);
    }
    setDeleting(null);
  };

  if (failed) return <StorageError />;
  if (!records) return null;

  const entries = sortJournalEntries(records);

  return (
    <>
      {editing ? (
        <JournalForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          lmpDate={lmpDate}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button onClick={() => setEditing("new")}>{t("journal.new")}</Button>
      )}

      {deleteFailed && <StorageError />}
      {entries.length === 0 && !editing && <p className="text-center text-muted">{t("journal.empty")}</p>}

      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Card className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {format.dateTime(parseLocalDate(entry.date), { dateStyle: "long" })}
                  </p>
                  <p className="text-sm text-muted">{t("week.title", { week: entry.week })}</p>
                </div>
                {entry.mood && (
                  <span role="img" aria-label={t(`journal.moods.${entry.mood}`)} className="text-3xl">
                    {MOOD_EMOJI[entry.mood]}
                  </span>
                )}
              </div>
              {entry.text && <p className="whitespace-pre-wrap">{entry.text}</p>}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(entry)} className="text-sm">
                  {t("common.edit")}
                </Button>
                <Button variant="secondary" onClick={() => setDeleting(entry)} className="text-sm">
                  {t("common.delete")}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        title={t("journal.deleteTitle")}
        message={t("common.deleteForever")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
