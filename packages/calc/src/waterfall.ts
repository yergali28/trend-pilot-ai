import type { CalcResult, ResultValue, Status } from "./types";

export type Scenario = "pessimistic" | "realistic" | "optimistic";

export interface WaterfallStep {
  key: "salePrice" | "purchase" | "delivery" | "customs" | "otherLanded" | "marketplace" | "ads" | "returns" | "tax" | "netProfit";
  kind: "total" | "decrease" | "result";
  status: Status;
  /** Величина шага (для расходов — положительное число, которое вычитается). */
  value: number | null;
  /** Уровень до и после шага: геометрия столбца waterfall. */
  start: number | null;
  end: number | null;
}

function group(values: ResultValue[], scenario: Scenario): { value: number | null; status: Status } {
  if (values.some((v) => v.status === "no_data" || v[scenario] === null)) return { value: null, status: "no_data" };
  const status: Status = values.some((v) => v.status === "estimated") ? "estimated" : "verified";
  return { value: values.reduce((s, v) => s + (v[scenario] as number), 0), status };
}

/** Шаги waterfall от цены продажи до чистой прибыли по уже рассчитанному результату. */
export function waterfall(r: CalcResult, scenario: Scenario = "realistic"): WaterfallStep[] {
  const { landed: l, selling: s } = r;
  const decreases: [WaterfallStep["key"], ResultValue[]][] = [
    ["purchase", [l.purchase]],
    ["delivery", [l.chinaDelivery, l.internationalShipping]],
    ["customs", [l.customsDuty, l.importVat]],
    ["otherLanded", [l.certification, l.packaging, l.agentCommission]],
    ["marketplace", [s.marketplaceCommission, s.marketplaceLogistics, s.acquiring]],
    ["ads", [s.ads]],
    ["returns", [s.returns]],
    ["tax", [s.tax]],
  ];

  const price = r.salePrice[scenario];
  const steps: WaterfallStep[] = [
    { key: "salePrice", kind: "total", status: r.salePrice.status, value: price, start: price === null ? null : 0, end: price },
  ];
  let level = price;
  for (const [key, values] of decreases) {
    const g = group(values, scenario);
    const start = level;
    level = start === null || g.value === null ? null : start - g.value;
    steps.push({ key, kind: "decrease", status: g.status, value: g.value, start, end: level });
  }
  const profit = r.netProfit[scenario];
  steps.push({ key: "netProfit", kind: "result", status: r.netProfit.status, value: profit, start: profit === null ? null : 0, end: profit });
  return steps;
}
