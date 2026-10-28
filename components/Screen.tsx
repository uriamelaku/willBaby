import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** Page container for the main tabs. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">{children}</main>
  );
}

export function StorageError() {
  const t = useTranslations("common");
  return (
    <p role="alert" className="text-danger">
      {t("storageError")}
    </p>
  );
}
