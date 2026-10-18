import type { CalcInput, CalcResult, ResultValue } from "./types";

/** Метрика фильтра кратности (раздел 4.2): цена ÷ себестоимость (по умолчанию) или ROI. */
export type MultipleMetric = "priceToCost" | "roi";

export const metricValue = (r: CalcResult, metric: MultipleMetric): ResultValue =>
  metric === "roi" ? r.roi : r.priceToCostMultiple;

/** Бюджет в валюте расчёта по курсу из входа; null, если курса нет. */
export function budgetInCurrency(amount: number, currency: string, input: CalcInput): number | null {
  if (currency === input.currency) return amount;
  const rate = input.fxRates?.[currency]?.value;
  return rate === undefined ? null : amount * rate;
}

export type Verdict = "eligible" | "below_target" | "over_budget" | "insufficient";

export interface Evaluation {
  verdict: Verdict;
  /** Значение метрики (реалистичный сценарий) или null. */
  metric: number | null;
  /** Стоимость минимальной партии в валюте расчёта. */
  batchCost: number | null;
  /** Чего не хватает для попадания в выдачу (раздел 5.1, п. 3). */
  missing: string[];
}

export interface EvaluateOptions {
  metric: MultipleMetric;
  target: number;
  /** Бюджет в валюте расчёта; null — бюджет не ограничивает или не пересчитан. */
  budget: number | null;
  moq: number;
  /** Сигнал спроса: продаж в месяц от провайдера; null — нет данных. */
  salesPerMonth: number | null;
}

/**
 * Порог выдачи: цена закупки, цена продажи и сигнал спроса обязательны,
 * иначе «Недостаточно данных» с перечнем недостающего; затем кратность и бюджет.
 */
export function evaluate(r: CalcResult, o: EvaluateOptions): Evaluation {
  const m = metricValue(r, o.metric);
  const missing: string[] = [];
  if (r.landed.purchase.status === "no_data") missing.push("purchasePrice");
  if (r.salePrice.status === "no_data") missing.push("salePrice");
  if (o.salesPerMonth === null) missing.push("demand");
  for (const f of m.missing) if (!missing.includes(f)) missing.push(f);

  const landed = r.landed.total.realistic;
  const batchCost = landed === null ? null : landed * o.moq;
  if (missing.length > 0 || m.realistic === null) return { verdict: "insufficient", metric: m.realistic, batchCost, missing };
  if (m.realistic < o.target) return { verdict: "below_target", metric: m.realistic, batchCost, missing };
  if (o.budget !== null && batchCost !== null && batchCost > o.budget) return { verdict: "over_budget", metric: m.realistic, batchCost, missing };
  return { verdict: "eligible", metric: m.realistic, batchCost, missing };
}

/** Сводка по набору значений (кратности товаров категории): число, среднее, медиана. */
export function summarize(values: number[]) {
  if (values.length === 0) return { count: 0, mean: null, median: null };
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  return { count: values.length, mean: values.reduce((s, v) => s + v, 0) / values.length, median };
}
