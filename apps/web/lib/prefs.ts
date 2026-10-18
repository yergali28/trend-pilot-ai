import { cookies } from "next/headers";
import { isLocale, translator, type Locale } from "./i18n";

export const LANG_COOKIE = "tp-lang";
export const THEME_COOKIE = "tp-theme";

export async function prefs() {
  const store = await cookies();
  const lang = store.get(LANG_COOKIE)?.value;
  const locale: Locale = isLocale(lang) ? lang : "ru";
  const theme = store.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
  return { locale, theme, t: translator(locale) } as const;
}
