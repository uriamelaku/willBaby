"use client";

import type { ReactNode } from "react";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";

/**
 * Formats dates in the device's time zone. Without this, next-intl uses the build machine's zone
 * (UTC), and a local date like 2026-07-13 00:00 in Israel would show as July 12.
 */
export function DeviceTimeZone({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const messages = useMessages();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
