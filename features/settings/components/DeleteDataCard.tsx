"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { storage } from "@/lib/storage";
import { emptySnapshot } from "@/lib/storage/types";

/** Deletes all user data from this device after confirmation, then starts over at onboarding. */
export function DeleteDataCard() {
  const t = useTranslations();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  const deleteAll = async () => {
    setConfirming(false);
    try {
      await storage.replaceAll(emptySnapshot());
      router.replace("/onboarding");
    } catch (error) {
      console.error("Deleting all data failed", error);
      setFailed(true);
    }
  };

  return (
    <Card className="flex flex-col gap-3 border-2 border-danger/40">
      <h2 className="font-semibold">{t("deleteData.title")}</h2>
      <p className="text-sm">{t("deleteData.body")}</p>
      <Button variant="secondary" onClick={() => setConfirming(true)} className="text-danger">
        {t("deleteData.button")}
      </Button>
      {failed && <StorageError />}
      <ConfirmDialog
        open={confirming}
        title={t("deleteData.confirmTitle")}
        message={t("deleteData.confirmMessage")}
        confirmLabel={t("deleteData.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={deleteAll}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}
