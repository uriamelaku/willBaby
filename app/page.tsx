"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import { hasCompletedOnboarding } from "@/features/onboarding/onboarding";
import { storage } from "@/lib/storage";

// Data lives on the device, so the start page is chosen in the browser.
export default function Home() {
  const t = useTranslations();
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    hasCompletedOnboarding(storage)
      .then((done) => router.replace(done ? "/today" : "/onboarding"))
      .catch((error) => {
        console.error("Reading storage failed", error);
        setFailed(true);
      });
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <p role={failed ? "alert" : "status"} className={failed ? "text-danger" : undefined}>
        {failed ? t("common.storageError") : t("home.loading")}
      </p>
    </main>
  );
}
