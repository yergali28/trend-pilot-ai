import type { ReactNode } from "react";
import messages from "../messages/ru.json";
import "./globals.css";

export const metadata = { title: messages["app.title"] };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
