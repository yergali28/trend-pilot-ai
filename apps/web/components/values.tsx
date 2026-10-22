import type { ResultValue } from "@tp/calc";
import { MultipleBadge, NoData, RiskIcon, Value, formatMoney, formatNumber, formatPercent, type Locale } from "@tp/ui";
import type { MessageKey } from "../lib/i18n";

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;
type V = Pick<ResultValue, "status" | "realistic">;

/** Набор форматтеров значений расчёта с честным «нет данных» и пометкой оценки. */
export function valueKit(t: T, locale: Locale, currency: string) {
  const nd = t("value.nodata");
  const est = t("value.estimated");
  const money = (v: V) => (
    <Value status={v.status} noDataLabel={nd} estimatedLabel={est}>
      {v.realistic === null ? null : formatMoney(v.realistic, currency, locale)}
    </Value>
  );
  const profit = (v: V) =>
    v.realistic !== null && v.realistic < 0 ? (
      <span className="inline-flex items-center gap-1 font-medium text-risk">
        <RiskIcon className="size-3.5" />
        <span className="sr-only">{t("value.loss")}</span>
        {money(v)}
      </span>
    ) : (
      money(v)
    );
  const percent = (v: V) =>
    v.realistic === null ? (
      <NoData label={nd} />
    ) : (
      <Value status={v.status} noDataLabel={nd} estimatedLabel={est}>
        {formatPercent(v.realistic, locale)}
      </Value>
    );
  /** Строка для подсказок графика: «≈» у оценки, «нет данных» без значения. */
  const text = (v: V) => (v.realistic === null ? nd : `${v.status === "estimated" ? "≈ " : ""}${formatMoney(v.realistic, currency, locale)}`);
  const multiple = (value: number | null) => <MultipleBadge value={value} locale={locale} noDataLabel={nd} />;
  const sales = (n: number | null) => (n === null ? <NoData label={nd} /> : <span className="tabular-nums">{t("value.salesPerMonth", { n: formatNumber(n, locale, 0) })}</span>);
  return { money, profit, percent, multiple, sales, text, nd, est };
}

/** Подпись недостающего поля для «Недостаточно данных». */
export function missingLabel(t: T, field: string) {
  if (field.startsWith("fxRates.")) return t("field.fxRate", { currency: field.slice(8) });
  return t(`field.${field}` as MessageKey);
}
