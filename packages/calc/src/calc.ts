import type { CalcInput, CalcResult, Input, InputRef, MoneyInput, ResultValue, Status } from "./types";

// Три сценария в одном значении: [пессимистично, реалистично, оптимистично].
type Tri = [number, number, number];

interface Node {
  tri: Tri | null;
  status: Status;
  sources: InputRef[];
  missing: string[];
}

// В каком направлении значение ухудшает результат: расходы хуже на верхней границе, цена — на нижней.
type Worse = "high" | "low";

function leaf(field: string, input: Input | undefined, worse: Worse): Node {
  if (!input) return { tri: null, status: "no_data", sources: [], missing: [field] };
  const lo = input.low ?? input.value;
  const hi = input.high ?? input.value;
  return {
    tri: worse === "high" ? [hi, input.value, lo] : [lo, input.value, hi],
    status: input.status,
    sources: [{ field, source: input.source }],
    missing: [],
  };
}

function combine(nodes: Node[], f: (...xs: number[]) => number): Node {
  const sources = nodes.flatMap((n) => n.sources).filter((s, i, all) => all.findIndex((t) => t.field === s.field) === i);
  const missing = [...new Set(nodes.flatMap((n) => n.missing))];
  const tris = nodes.map((n) => n.tri);
  if (tris.some((t) => t === null)) return { tri: null, status: "no_data", sources, missing };
  const tri = ([0, 1, 2] as const).map((i) => f(...tris.map((t) => (t as Tri)[i]))) as Tri;
  if (tri.some((v) => !Number.isFinite(v))) return { tri: null, status: "no_data", sources, missing };
  const status: Status = nodes.some((n) => n.status === "estimated") ? "estimated" : "verified";
  return { tri, status, sources, missing };
}

const sum = (...nodes: Node[]) => combine(nodes, (...xs) => xs.reduce((a, b) => a + b, 0));
const mul = (a: Node, b: Node) => combine([a, b], (x, y) => x * y);

function toResult(n: Node): ResultValue {
  const r: ResultValue = {
    status: n.status,
    pessimistic: n.tri?.[0] ?? null,
    realistic: n.tri?.[1] ?? null,
    optimistic: n.tri?.[2] ?? null,
    sources: n.sources,
    missing: n.missing,
  };
  if (!n.tri) r.reason = n.missing.length > 0 ? "missing_input" : "division_by_zero";
  return r;
}

/** Юнит-экономика по разделу 4 docs/TZ.md. Чистая функция, без значений по умолчанию. */
export function calculate(input: CalcInput): CalcResult {
  const money = (field: string, m: MoneyInput | undefined, worse: Worse): Node => {
    const base = leaf(field, m, worse);
    if (!m || m.currency === input.currency) return base;
    return mul(base, leaf(`fxRates.${m.currency}`, input.fxRates?.[m.currency], worse));
  };
  const rate = (field: keyof CalcInput & string) => leaf(field, input[field] as Input | undefined, "high");

  const price = money("salePrice", input.salePrice, "low");

  // Landed cost
  const purchase = money("purchasePrice", input.purchasePrice, "high");
  const chinaDelivery = money("chinaDelivery", input.chinaDelivery, "high");
  const internationalShipping = mul(
    leaf("shippingQuantity", input.shippingQuantity, "high"),
    money("cargoTariff", input.cargoTariff, "high"),
  );
  // Таможенная стоимость = закупка + доставка по Китаю + международная доставка.
  const customsValue = sum(purchase, chinaDelivery, internationalShipping);
  const customsDuty = mul(customsValue, rate("customsDutyRate"));
  const importVat = mul(sum(customsValue, customsDuty), rate("importVatRate"));
  const certification = money("certification", input.certification, "high");
  const packaging = money("packaging", input.packaging, "high");
  const agentCommission = mul(purchase, rate("agentCommissionRate"));
  const landed = sum(
    purchase,
    chinaDelivery,
    internationalShipping,
    customsDuty,
    importVat,
    certification,
    packaging,
    agentCommission,
  );

  // Расходы продажи
  const marketplaceCommission = mul(price, rate("marketplaceCommissionRate"));
  const marketplaceLogistics = money("marketplaceLogistics", input.marketplaceLogistics, "high");
  const acquiring = mul(price, rate("acquiringRate"));
  const ads = mul(price, rate("adRate"));
  const returns = mul(rate("returnRate"), money("reverseLogistics", input.reverseLogistics, "high"));
  const beforeTax = sum(marketplaceCommission, marketplaceLogistics, acquiring, ads, returns);

  const tax = input.tax;
  let taxNode: Node;
  if (!tax) taxNode = leaf("tax", undefined, "high");
  else if (tax.mode === "off") taxNode = { tri: [0, 0, 0], status: "verified", sources: [{ field: "tax", source: tax.source }], missing: [] };
  else {
    const taxRate = leaf("tax.rate", tax.rate, "high");
    taxNode =
      tax.base === "revenue"
        ? mul(price, taxRate)
        : combine([price, landed, beforeTax, taxRate], (p, l, s, r) => Math.max(0, p - l - s) * r);
  }

  const selling = sum(beforeTax, taxNode);
  const netProfit = combine([price, landed, selling], (p, l, s) => p - l - s);

  return {
    currency: input.currency,
    landed: {
      purchase: toResult(purchase),
      chinaDelivery: toResult(chinaDelivery),
      internationalShipping: toResult(internationalShipping),
      customsDuty: toResult(customsDuty),
      importVat: toResult(importVat),
      certification: toResult(certification),
      packaging: toResult(packaging),
      agentCommission: toResult(agentCommission),
      total: toResult(landed),
    },
    selling: {
      marketplaceCommission: toResult(marketplaceCommission),
      marketplaceLogistics: toResult(marketplaceLogistics),
      acquiring: toResult(acquiring),
      ads: toResult(ads),
      returns: toResult(returns),
      tax: toResult(taxNode),
      total: toResult(selling),
    },
    salePrice: toResult(price),
    netProfit: toResult(netProfit),
    priceToCostMultiple: toResult(combine([price, landed], (p, l) => p / l)),
    roi: toResult(combine([netProfit, landed], (n, l) => n / l)),
    netMarginPct: toResult(combine([netProfit, price], (n, p) => (n / p) * 100)),
  };
}
