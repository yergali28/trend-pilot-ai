import { describe, expect, it } from "vitest";
import { budgetInCurrency, calculate, evaluate, summarize, type CalcInput, type Input, type SourceRef } from "../src";

// Синтетические входы только для проверки логики отбора.
const source: SourceRef = { sourceId: "synthetic:selection", method: "user_input", fetchedAt: "2026-10-18T00:00:00Z" };
const n = (value: number): Input => ({ value, status: "verified", source });
const kzt = (value: number) => ({ ...n(value), currency: "KZT" });
const zero = { status: "verified" as const, source };

// Цена 10 000, все расходы кроме закупки нулевые: landed = закупка, кратность = 10 000 / закупка.
const input = (purchase: number | null, price: number | null = 10000): CalcInput => ({
  currency: "KZT",
  fxRates: { USD: n(480) },
  ...(price === null ? {} : { salePrice: kzt(price) }),
  ...(purchase === null ? {} : { purchasePrice: kzt(purchase) }),
  chinaDelivery: kzt(0),
  cargoTariff: { ...kzt(0), basis: "kg" },
  shippingQuantity: n(0),
  customsDutyRate: n(0),
  importVatRate: n(0),
  certification: kzt(0),
  packaging: kzt(0),
  agentCommissionRate: n(0),
  marketplaceCommissionRate: n(0),
  acquiringRate: n(0),
  adRate: n(0),
  marketplaceLogistics: kzt(0),
  returnRate: n(0),
  reverseLogistics: kzt(0),
  tax: { mode: "off", ...zero },
});

const opts = { metric: "priceToCost" as const, target: 3, budget: null, moq: 1, salesPerMonth: 10 };

describe("evaluate", () => {
  it("eligible when multiple meets target", () => {
    // 10 000 / 2 000 = 5x ≥ 3x
    expect(evaluate(calculate(input(2000)), opts)).toEqual({ verdict: "eligible", metric: 5, batchCost: 2000, missing: [] });
  });

  it("below target", () => {
    // 10 000 / 5 000 = 2x < 3x
    expect(evaluate(calculate(input(5000)), opts).verdict).toBe("below_target");
  });

  it("ROI metric: profit 8 000 / landed 2 000 = 4", () => {
    const e = evaluate(calculate(input(2000)), { ...opts, metric: "roi", target: 4 });
    expect(e).toMatchObject({ verdict: "eligible", metric: 4 });
  });

  it("over budget for the minimum batch", () => {
    // партия 100 × 2 000 = 200 000 > 150 000
    expect(evaluate(calculate(input(2000)), { ...opts, moq: 100, budget: 150000 })).toMatchObject({ verdict: "over_budget", batchCost: 200000 });
  });

  it("insufficient data lists what is missing, never a substitute", () => {
    expect(evaluate(calculate(input(null)), opts)).toMatchObject({ verdict: "insufficient", missing: ["purchasePrice"] });
    expect(evaluate(calculate(input(2000, null)), opts)).toMatchObject({ verdict: "insufficient", missing: ["salePrice"] });
    expect(evaluate(calculate(input(2000)), { ...opts, salesPerMonth: null })).toMatchObject({ verdict: "insufficient", missing: ["demand"] });
  });

  it("missing input without its own rule is still reported", () => {
    const i = input(2000);
    delete i.cargoTariff;
    expect(evaluate(calculate(i), opts)).toMatchObject({ verdict: "insufficient", metric: null, batchCost: null, missing: ["cargoTariff"] });
  });

  it("zero landed cost: multiple undefined, insufficient", () => {
    expect(evaluate(calculate(input(0)), opts)).toMatchObject({ verdict: "insufficient", metric: null, batchCost: 0 });
  });
});

describe("budgetInCurrency", () => {
  it("same currency, converted, and missing rate", () => {
    expect(budgetInCurrency(1000, "KZT", input(1))).toBe(1000);
    expect(budgetInCurrency(1000, "USD", input(1))).toBe(480000);
    expect(budgetInCurrency(1000, "CNY", input(1))).toBeNull();
  });
});

describe("summarize", () => {
  it("count, mean, median (odd and even)", () => {
    expect(summarize([])).toEqual({ count: 0, mean: null, median: null });
    expect(summarize([3, 1, 2])).toEqual({ count: 3, mean: 2, median: 2 });
    expect(summarize([4, 1, 3, 2])).toEqual({ count: 4, mean: 2.5, median: 2.5 });
  });
});
