import { Golos_Text } from "next/font/google";
import type { ReactNode } from "react";
import { prefs } from "../lib/prefs";
import "./globals.css";

const golos = Golos_Text({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--tp-font-sans", display: "swap" });

export async function generateMetadata() {
  const { t } = await prefs();
  return { title: t("app.title") };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, theme } = await prefs();
  return (
    <html lang={locale} data-theme={theme} className={golos.variable}>
      <body className="min-h-screen bg-bg text-ink">{children}</body>
    </html>
  );
}
