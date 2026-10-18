// Форматирование чисел для показа (не расчёт): разряды и знаки по локали.
export type Locale = "ru" | "en" | "kk";

const intl = (locale: Locale) => (locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU");

export function formatMoney(value: number, currency: string, locale: Locale, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(intl(locale), { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits, minimumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number, locale: Locale, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(intl(locale), { maximumFractionDigits, minimumFractionDigits: 0 }).format(value);
}

export function formatPercent(fraction: number, locale: Locale) {
  return new Intl.NumberFormat(intl(locale), { style: "percent", maximumFractionDigits: 0 }).format(fraction);
}
