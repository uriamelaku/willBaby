"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { hospitalBagCategories } from "@/content/schema";
import {
  MAX_CUSTOM_ITEM_LENGTH,
  bagProgress,
  checkedDefaultIds,
  customBagItems,
  isBagComplete,
  newCustomItem,
  toggleDefaultItem,
} from "@/features/hospitalBag/hospitalBag";
import { getHospitalBagItems } from "@/lib/content";
import { storage } from "@/lib/storage";
import type { ChecklistItem } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";

export function HospitalBagScreen() {
  const t = useTranslations("hospitalBag");
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      <BagChecklist />
    </Screen>
  );
}

function CheckRow({ label, checked, onChange, children }: {
  label: string;
  checked: boolean;
  onChange: () => void;
  children?: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-2 border-t border-text/10 first:border-t-0">
      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 py-1">
        <input type="checkbox" checked={checked} onChange={onChange} className="size-5 shrink-0 accent-brand" />
        <span className={checked ? "text-muted line-through" : ""}>{label}</span>
      </label>
      {children}
    </li>
  );
}

function BagChecklist() {
  const t = useTranslations();
  const { records, failed, reload } = useRecords("checklist");
  const [newItem, setNewItem] = useState("");
  const [actionFailed, setActionFailed] = useState(false);
  const defaults = getHospitalBagItems();

  const run = async (action: () => Promise<unknown>, description: string) => {
    try {
      await action();
      setActionFailed(false);
      await reload();
      return true;
    } catch (error) {
      console.error(description, error);
      setActionFailed(true);
      return false;
    }
  };

  const addItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!newItem.trim()) return;
    const added = await run(() => storage.save("checklist", newCustomItem(newItem)), "Adding a bag item failed");
    if (added) setNewItem("");
  };

  const toggleCustom = (item: ChecklistItem) =>
    run(() => storage.save("checklist", { ...item, checked: !item.checked }), "Updating a bag item failed");

  if (failed) return <StorageError />;
  if (!records) return null;

  const checked = checkedDefaultIds(records);
  const custom = customBagItems(records);
  const progress = bagProgress(defaults, records);

  return (
    <>
      <Card className="flex flex-col gap-2">
        <p className="font-semibold" aria-live="polite">
          {isBagComplete(progress) ? t("hospitalBag.complete") : t("hospitalBag.progress", progress)}
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.checked}
          aria-label={t("hospitalBag.title")}
          className="h-3 overflow-hidden rounded-full bg-brand-soft"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
            style={{ width: `${(progress.checked / progress.total) * 100}%` }}
          />
        </div>
      </Card>
      {actionFailed && <StorageError />}

      {hospitalBagCategories.map((category) => (
        <Card key={category} className="flex flex-col gap-1">
          <h2 className="font-semibold">{t(`hospitalBag.categories.${category}`)}</h2>
          <ul>
            {defaults
              .filter((item) => item.category === category)
              .map((item) => (
                <CheckRow
                  key={item.id}
                  label={item.text}
                  checked={checked.has(item.id)}
                  onChange={() =>
                    run(() => storage.save("checklist", toggleDefaultItem(records, item.id)), "Updating a bag item failed")
                  }
                />
              ))}
          </ul>
        </Card>
      ))}

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("hospitalBag.categories.custom")}</h2>
        {custom.length > 0 && (
          <ul>
            {custom.map((item) => (
              <CheckRow key={item.id} label={item.customText ?? ""} checked={item.checked} onChange={() => toggleCustom(item)}>
                <Button
                  variant="secondary"
                  className="px-4 text-sm"
                  onClick={() => run(() => storage.remove("checklist", item.id), "Deleting a bag item failed")}
                >
                  {t("common.delete")}
                </Button>
              </CheckRow>
            ))}
          </ul>
        )}
        <form onSubmit={addItem} className="flex items-end gap-2">
          <div className="flex-1">
            <TextField
              label={t("hospitalBag.newItem")}
              value={newItem}
              maxLength={MAX_CUSTOM_ITEM_LENGTH}
              onChange={(event) => setNewItem(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={!newItem.trim()}>
            {t("hospitalBag.add")}
          </Button>
        </form>
      </Card>
    </>
  );
}
