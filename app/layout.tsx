import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { locale } from "@/i18n/request";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["400", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: "will·B·aby", description: t("description") };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme on <html> before React hydrates.
    <html
      lang={locale}
      dir="rtl"
      className={`${rubik.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Must run inline before paint; next/script defers inline scripts until the runtime loads. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
