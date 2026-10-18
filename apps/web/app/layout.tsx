import { Golos_Text } from "next/font/google";
import type { ReactNode } from "react";
import messages from "../messages/ru.json";
import "./globals.css";

const golos = Golos_Text({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--tp-font-sans", display: "swap" });

export const metadata = { title: messages["app.title"] };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={golos.variable}>
      <body>{children}</body>
    </html>
  );
}
