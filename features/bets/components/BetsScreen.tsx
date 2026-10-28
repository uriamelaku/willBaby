"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { emptyBetInput, sortBets, toBetInput, toBetRecord, type BetInput } from "@/features/bets/bets";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import type { Bet } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";
import { BetForm } from "./BetForm";

export function BetsScreen() {
  const t = useTranslations("bets");
  const state = usePregnancy();
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <BetsList data={state.data} />}
    </Screen>
  );
}

interface Editing {
  bet?: Bet;
  input: BetInput;
}

function BetsList({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const format = useFormatter();
  const { records, failed, reload } = useRecords("bets");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Bet | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const { babiesCount, dueDate } = data.pregnancy;

  const save = async (input: BetInput) => {
    await storage.save("bets", toBetRecord(input, editing?.bet));
    setEditing(null);
    await reload();
  };

  const confirmDelete = async () => {
    if (deleting) {
      try {
        await storage.remove("bets", deleting.id);
        setDeleteFailed(false);
        await reload();
      } catch (error) {
        console.error("Deleting the bet failed", error);
        setDeleteFailed(true);
      }
    }
    setDeleting(null);
  };

  if (failed) return <StorageError />;
  if (!records) return null;

  return (
    <>
      {editing ? (
        <BetForm
          key={editing.bet?.id ?? "new"}
          initial={editing.input}
          babiesCount={babiesCount}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button onClick={() => setEditing({ input: { ...emptyBetInput, dueDateGuess: dueDate } })}>
          {t("bets.new")}
        </Button>
      )}
      {deleteFailed && <StorageError />}

      {records.length === 0 && !editing && <p className="text-center text-muted">{t("bets.empty")}</p>}
      <ul className="flex flex-col gap-3">
        {sortBets(records).map((bet) => (
          <li key={bet.id}>
            <Card className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{bet.guesserName}</h2>
              <ul className="text-sm">
                <li>{t("bets.guess.date", { date: format.dateTime(parseLocalDate(bet.dueDateGuess), { dateStyle: "long" }) })}</li>
                <li>{t("bets.guess.weight", { kg: bet.weightGuess })}</li>
                {bet.sexGuess && <li>{t("bets.guess.sex", { sex: t(`bets.sexes.${bet.sexGuess}`) })}</li>}
                {bet.nameGuess && <li>{t("bets.guess.name", { name: bet.nameGuess })}</li>}
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => setEditing({ bet, input: toBetInput(bet) })}
                >
                  {t("common.edit")}
                </Button>
                <Button variant="secondary" className="text-sm" onClick={() => setDeleting(bet)}>
                  {t("common.delete")}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {records.length > 0 && <p className="text-center text-sm text-muted">{t("bets.scoring")}</p>}

      <ConfirmDialog
        open={deleting !== null}
        title={t("bets.deleteTitle", { name: deleting?.guesserName ?? "" })}
        message={t("common.deleteForever")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
