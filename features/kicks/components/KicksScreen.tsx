"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  KICK_GOAL,
  addKick,
  endKickSession,
  findActiveKickSession,
  finishedKickSessions,
  newKickSession,
  summarizeKickSession,
  undoKick,
} from "@/features/kicks/kicks";
import { formatDuration } from "@/lib/duration";
import { storage } from "@/lib/storage";
import type { KickSession } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";
import { useNow } from "@/lib/useNow";

export function KicksScreen() {
  const t = useTranslations("kicks");
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      <KickCounter />
      <MedicalDisclaimer sensitive />
    </Screen>
  );
}

function KickCounter() {
  const t = useTranslations();
  const format = useFormatter();
  const { records, failed, reload } = useRecords("kickSessions");
  const [actionFailed, setActionFailed] = useState(false);
  const [deleting, setDeleting] = useState<KickSession | null>(null);
  const active = records ? findActiveKickSession(records) : undefined;
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

  const saveSession = (session: KickSession) =>
    run(() => storage.save("kickSessions", session), "Saving the kick session failed");

  const confirmDelete = async () => {
    if (deleting) {
      await run(() => storage.remove("kickSessions", deleting.id), "Deleting the kick session failed");
    }
    setDeleting(null);
  };

  if (failed) return <StorageError />;
  if (!records) return null;

  const history = finishedKickSessions(records);

  return (
    <>
      {actionFailed && <StorageError />}
      {active ? (
        <Card className="flex flex-col items-center gap-4">
          <p className="text-muted" aria-live="off">
            {t("kicks.elapsed", { time: formatDuration(summarizeKickSession(active, now).durationMs) })}
          </p>
          <button
            type="button"
            onClick={() => saveSession(addKick(active, new Date()))}
            className="flex size-44 flex-col items-center justify-center gap-1 rounded-full bg-brand text-on-brand shadow-hero transition active:scale-95 motion-reduce:transition-none"
          >
            <span aria-hidden className="text-4xl">
              👣
            </span>
            <span className="text-lg font-semibold">{t("kicks.kick")}</span>
          </button>
          <p className="text-3xl font-bold" aria-live="polite">
            {t("kicks.count", { count: active.kicks.length })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled={active.kicks.length === 0}
              onClick={() => saveSession(undoKick(active))}
            >
              {t("kicks.undo")}
            </Button>
            <Button onClick={() => saveSession(endKickSession(active, new Date()))}>
              {t("kicks.finish")}
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() =>
            run(() => storage.save("kickSessions", newKickSession(new Date())), "Starting a kick session failed")
          }
        >
          {t("kicks.start")}
        </Button>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t("kicks.history")}</h2>
        {history.length === 0 && <p className="text-muted">{t("kicks.empty")}</p>}
        <ul className="flex flex-col gap-3">
          {history.map((session) => {
            const summary = summarizeKickSession(session, now);
            return (
              <li key={session.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {format.dateTime(new Date(session.startedAt), { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <p className="text-sm text-muted">
                      {t("kicks.summary", {
                        count: summary.count,
                        time: formatDuration(summary.durationMs),
                      })}
                    </p>
                    {summary.timeToGoalMs !== undefined && (
                      <p className="text-sm text-muted">
                        {t("kicks.timeToGoal", { goal: KICK_GOAL, time: formatDuration(summary.timeToGoalMs) })}
                      </p>
                    )}
                  </div>
                  <Button variant="secondary" className="text-sm" onClick={() => setDeleting(session)}>
                    {t("common.delete")}
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={deleting !== null}
        title={t("kicks.deleteTitle")}
        message={t("common.deleteForever")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
