"use client";

import { usePathname, useSearchParams } from "next/navigation";

const link = "rounded-control px-2 py-1 text-sm outline-none pointer-coarse:py-2.5 focus-visible:outline-2 focus-visible:outline-focus";
const on = "bg-action-soft font-medium text-action-soft-ink";
const off = "text-muted hover:text-ink";

/** Язык и тема: ссылки на /api/prefs с возвратом на текущую страницу. */
export function PrefsSwitch({ locale, theme, labels }: { locale: string; theme: string; labels: { language: string; theme: string; light: string; dark: string } }) {
  const path = usePathname();
  const qs = useSearchParams().toString();
  const back = encodeURIComponent(qs ? `${path}?${qs}` : path);
  return (
    <div className="flex items-center gap-3">
      <nav aria-label={labels.language} className="flex items-center gap-0.5">
        {(["ru", "en", "kk"] as const).map((l) => (
          <a key={l} href={`/api/prefs?lang=${l}&back=${back}`} lang={l} aria-current={locale === l ? "true" : undefined} className={`${link} uppercase ${locale === l ? on : off}`}>
            {l}
          </a>
        ))}
      </nav>
      <nav aria-label={labels.theme} className="flex items-center gap-0.5">
        {(["light", "dark"] as const).map((v) => (
          <a key={v} href={`/api/prefs?theme=${v}&back=${back}`} aria-current={theme === v ? "true" : undefined} className={`${link} ${theme === v ? on : off}`}>
            {v === "light" ? labels.light : labels.dark}
          </a>
        ))}
      </nav>
    </div>
  );
}
