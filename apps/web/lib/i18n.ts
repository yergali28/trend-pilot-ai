import en from "../messages/en.json";
import kk from "../messages/kk.json";
import ru from "../messages/ru.json";

export type Locale = "ru" | "en" | "kk";
export type MessageKey = keyof typeof ru;

// Полнота переводов проверяется скриптом i18n:check; здесь запасной вариант, чтобы экран не падал.
const catalogs: Record<Locale, Partial<Record<MessageKey, string>>> = { ru, en, kk };

export const isLocale = (v: unknown): v is Locale => v === "ru" || v === "en" || v === "kk";

/** Переводчик для локали; подстановки вида {name}. Ключи проверяет TypeScript по ru.json. */
export function translator(locale: Locale) {
  return (key: MessageKey, vars: Record<string, string | number> = {}) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), catalogs[locale][key] ?? catalogs.ru[key] ?? key);
}
