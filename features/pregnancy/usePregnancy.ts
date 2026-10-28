"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import type { Baby, Pregnancy, Profile } from "@/lib/storage/types";

export interface PregnancyData {
  profile: Profile;
  pregnancy: Pregnancy;
  babies: Baby[];
}

export type PregnancyState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: PregnancyData };

async function loadPregnancyData(): Promise<PregnancyData | null> {
  const [[profile], [pregnancy], babies] = await Promise.all([
    storage.list("profile"),
    storage.list("pregnancy"),
    storage.list("babies"),
  ]);
  if (!profile || !pregnancy) return null;
  return { profile, pregnancy, babies: babies.sort((a, b) => a.index - b.index) };
}

/** Loads the saved pregnancy; without one, sends the user to onboarding. */
export function usePregnancy(): PregnancyState {
  const router = useRouter();
  const [state, setState] = useState<PregnancyState>({ kind: "loading" });

  useEffect(() => {
    loadPregnancyData()
      .then((data) => {
        if (data) setState({ kind: "ready", data });
        else router.replace("/onboarding");
      })
      .catch((error) => {
        console.error("Reading storage failed", error);
        setState({ kind: "error" });
      });
  }, [router]);

  return state;
}
