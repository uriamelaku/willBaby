"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  endContraction,
  findActiveContraction,
  groupContractionSessions,
  recentStats,
  startContraction,
  type ContractionSession,
} from "@/features/contractions/contractions";
import { elapsedMs, formatDuration } from "@/lib/duration";
import { storage } from "@/lib/storage";
import { useRecords } from "@/lib/storage/useRecords";
import { useNow } from "@/lib/useNow";

export function ContractionsScreen() {
  const t = useTranslations("contractions");
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      <ContractionTimer />
      <MedicalDisclaimer sensitive />
    </Screen>
  );
}

const optionalDuration = (ms: number | undefined) => (ms === undefined ? "–" : formatDuration(ms));

function ContractionTimer() {
  const t = useTranslations();
  const format = useFormatter();
  const { records, failed, reload } = useRecords("contractions");
  const [actionFailed, setActionFailed] = useState(false);
  const [deleting, setDeleting] = useState<ContractionSession | null>(null);
  const active = records ? findActiveContraction(records) : undefined;
  const now = useNow(active !== undefined);

  const run = async (action: () => Promise<unknown>, description: string) => {
    try {
      await action();
      setActionFailed(false);
      await reload();
    } catch (error) {
      console.error(description, error);
      setActionFailed(true);
    }
  };

  const toggle = () =>
    active
      ? run(() => storage.save("contractions", endContraction(active, new Date())), "Ending a contraction failed")
      : run(
          () => storage.save("contractions", startContraction(records ?? [], new Date())),
          "Starting a contraction failed",
        );

  const confirmDelete = async () => {
    if (deleting) {
      const session = deleting;
      await run(
        () => Promise.all(session.contractions.map(({ contraction }) => storage.remove("contractions", contraction.id))),
        "Deleting the contraction session failed",
      );
    }
    setDeleting(null);
  };

  if (failed) return <StorageError />;
  if (!records) return null;

  const sessions = groupContractionSessions(records);
  const [latest, ...older] = sessions;
  const stats = latest && recentStats(latest, now);
  const time = (iso: string) => format.dateTime(new Date(iso), { timeStyle: "short" });

  return (
    <>
      {actionFailed && <StorageError />}
      <Card className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={active !== undefined}
          className={`flex size-44 flex-col items-center justify-center gap-1 rounded-full text-lg font-semibold shadow-hero transition active:scale-95 motion-reduce:transition-none ${active ? "bg-sun text-sun-text" : "bg-brand text-on-brand"}`}
        >
          {active ? t("contractions.stop") : t("contractions.start")}
          {active && (
            <span className="text-3xl font-bold tabular-nums">
              {formatDuration(elapsedMs(active.startedAt, now))}
            </span>
          )}
        </button>
        {stats && stats.count > 0 && (
          <dl className="grid w-full grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-xs text-muted">{t("contractions.lastHour")}</dt>
              <dd className="text-xl font-bold">{stats.count}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("contractions.averageDuration")}</dt>
              <dd className="text-xl font-bold tabular-nums">{optionalDuration(stats.averageDurationMs)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("contractions.averageInterval")}</dt>
              <dd className="text-xl font-bold tabular-nums">{optionalDuration(stats.averageIntervalMs)}</dd>
            </div>
          </dl>
        )}
      </Card>

      {latest && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">
              {format.dateTime(new Date(latest.startedAt), { dateStyle: "medium" })}
            </h2>
            <Button variant="secondary" className="text-sm" onClick={() => setDeleting(latest)}>
              {t("contractions.clear")}
            </Button>
          </div>
          <table className="w-full text-center tabular-nums">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="pb-2 font-normal">{t("contractions.startedAt")}</th>
                <th scope="col" className="pb-2 font-normal">{t("contractions.duration")}</th>
                <th scope="col" className="pb-2 font-normal">{t("contractions.interval")}</th>
              </tr>
            </thead>
            <tbody>
              {[...latest.contractions].reverse().map(({ contraction, durationMs, intervalMs }) => (
                <tr key={contraction.id} className="border-t border-text/10">
                  <td className="py-2">{time(contraction.startedAt)}</td>
                  <td className="py-2">{optionalDuration(durationMs)}</td>
                  <td className="py-2">{optionalDuration(intervalMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {older.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{t("contractions.history")}</h2>
          <ul className="flex flex-col gap-3">
            {older.map((session) => (
              <li key={session.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {format.dateTime(new Date(session.startedAt), { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <p className="text-sm text-muted">
                      {t("contractions.sessionCount", { count: session.contractions.length })}
                    </p>
                  </div>
                  <Button variant="secondary" className="text-sm" onClick={() => setDeleting(session)}>
                    {t("common.delete")}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t("contractions.deleteTitle")}
        message={t("common.deleteForever")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
