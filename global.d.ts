import type messages from "./messages/he.json";

// Type-checks translation keys against messages/he.json.
declare module "next-intl" {
  interface AppConfig {
    Locale: "he";
    Messages: typeof messages;
  }
}
