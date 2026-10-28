"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/TextField";
import {
  MAX_NAME_LENGTH,
  VOTERS,
  VOTES,
  castVote,
  isMatch,
  nextToVote,
  rankNames,
  toNameRecord,
  validateNameInput,
  type NameInputError,
} from "@/features/names/names";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { storage } from "@/lib/storage";
import type { BabyName, NameSex, Vote, Voter } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";

const SEXES: NameSex[] = ["girl", "boy", "any"];
const VOTE_EMOJI: Record<Vote, string> = { [-1]: "👎", 0: "🤔", 1: "👍" };
const VOTE_KEY: Record<Vote, "no" | "maybe" | "yes"> = { [-1]: "no", 0: "maybe", 1: "yes" };

export function NamesScreen() {
  const t = useTranslations("names");
  const state = usePregnancy();
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <NamesList data={state.data} />}
    </Screen>
  );
}

function NamesList({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const { records, failed, reload } = useRecords("names");
  const [newName, setNewName] = useState("");
  const [sex, setSex] = useState<NameSex>("any");
  const [error, setError] = useState<NameInputError>();
  const [voter, setVoter] = useState<Voter>("me");
  const [actionFailed, setActionFailed] = useState(false);
  const [deleting, setDeleting] = useState<BabyName | null>(null);

  const voterNames: Record<Voter, string> = {
    me: data.profile.name,
    partner: data.profile.partnerName || t(`text.partnerFallback.${data.profile.role}`),
  };

  const run = async (action: () => Promise<unknown>, description: string) => {
    try {
      await action();
      setActionFailed(false);
      await reload();
      return true;
    } catch (failure) {
      console.error(description, failure);
      setActionFailed(true);
      return false;
    }
  };

  const addName = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateNameInput(newName, records ?? []);
    if (validationError) {
      setError(validationError);
      return;
    }
    const added = await run(() => storage.save("names", toNameRecord(newName, sex)), "Adding a name failed");
    if (added) setNewName("");
  };

  const vote = (name: BabyName, value: Vote) =>
    run(() => storage.save("names", castVote(name, voter, value)), "Voting failed");

  const confirmDelete = async () => {
    if (deleting) await run(() => storage.remove("names", deleting.id), "Deleting a name failed");
    setDeleting(null);
  };

  if (failed) return <StorageError />;
  if (!records) return null;

  const next = nextToVote(records, voter);
  const other = VOTERS.find((candidate) => candidate !== voter)!;

  return (
    <>
      <Card>
        <form onSubmit={addName} noValidate className="flex flex-col gap-4">
          <TextField
            label={t("names.newName")}
            value={newName}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => {
              setError(undefined);
              setNewName(event.target.value);
            }}
            error={error ? t(`names.errors.${error}`) : undefined}
          />
          <ChoiceGroup
            legend={t("names.sex")}
            inline
            value={sex}
            onChange={setSex}
            options={SEXES.map((value) => ({ value, label: t(`names.sexes.${value}`) }))}
          />
          <Button type="submit">{t("names.add")}</Button>
        </form>
      </Card>
      {actionFailed && <StorageError />}

      {records.length > 0 && (
        <Card className="flex flex-col gap-4">
          <ChoiceGroup
            legend={t("names.whoVotes")}
            value={voter}
            onChange={setVoter}
            options={VOTERS.map((value) => ({ value, label: voterNames[value] }))}
          />
          {next ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted">{t("names.turn", { name: voterNames[voter] })}</p>
              <p className="text-4xl font-bold">{next.name}</p>
              <div className="flex gap-3" role="group" aria-label={t("names.voteFor", { name: next.name })}>
                {VOTES.map((value) => (
                  <Button key={value} variant="secondary" onClick={() => vote(next, value)} className="flex items-center gap-1">
                    <span aria-hidden>{VOTE_EMOJI[value]}</span>
                    {t(`names.votes.${VOTE_KEY[value]}`)}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center">{t("names.allVoted", { name: voterNames[other] })}</p>
          )}
        </Card>
      )}

      {records.length === 0 ? (
        <p className="text-center text-muted">{t("names.empty")}</p>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{t("names.ranking")}</h2>
          <ul className="flex flex-col gap-3">
            {rankNames(records).map((name) => (
              <li key={name.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-semibold">
                      {name.name}
                      {isMatch(name) && (
                        <span role="img" aria-label={t("names.match")} className="ms-2">
                          💞
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted">
                      {t(`names.sexes.${name.sex}`)}
                      {VOTERS.map((person) => {
                        const value = name.votes[person];
                        return ` · ${voterNames[person]}: ${value === undefined ? t("names.notVoted") : `${VOTE_EMOJI[value]} ${t(`names.votes.${VOTE_KEY[value]}`)}`}`;
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-pressed={name.favorite}
                      aria-label={t("names.favorite", { name: name.name })}
                      onClick={() => run(() => storage.save("names", { ...name, favorite: !name.favorite }), "Updating a name failed")}
                      className="flex size-11 items-center justify-center rounded-full text-2xl"
                    >
                      {name.favorite ? "⭐" : "☆"}
                    </button>
                    <Button variant="secondary" className="px-4 text-sm" onClick={() => setDeleting(name)}>
                      {t("common.delete")}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t("names.deleteTitle", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
