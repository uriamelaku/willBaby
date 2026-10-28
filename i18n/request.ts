import { getRequestConfig } from "next-intl/server";

// Hebrew only for now; no locale routing (static export).
export const locale = "he";

export default getRequestConfig(async () => ({
  locale,
  messages: (await import(`../messages/${locale}.json`)).default,
}));
