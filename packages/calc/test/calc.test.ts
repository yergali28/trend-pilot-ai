import { describe, expect, it } from "vitest";
import { calculate, type CalcInput, type CalcResult, type Input, type ResultValue, type SourceRef } from "../src";

// Синтетические значения только для проверки логики, не рыночные данные.
const source: SourceRef = { sourceId: "synthetic:unit", method: "user_input", fetchedAt: "2026-10-18T00:00:00Z" };
const n = (value: number, extra: Partial<Input> = {}): Input => ({ value, status: "verified", source, ...extra });
const kzt = (value: number, extra: Partial<Input> = {}) => ({ ...n(value, extra), currency: "KZT" });

const full = (): CalcInput => ({
  currency: "KZT",
  salePrice: kzt(1000),
  purchasePrice: kzt(100),
  chinaDelivery: kzt(10),
  cargoTariff: { ...kzt(20), basis: "kg" },
  shippingQuantity: n(1),
  customsDutyRate: n(0.1),
  importVatRate: n(0.1),
  certification: kzt(5),
  packaging: kzt(5),
  agentCommissionRate: n(0.1),
  marketplaceCommissionRate: n(0.1),
  acquiringRate: n(0.01),
  adRate: n(0.05),
  marketplaceLogistics: kzt(50),
  returnRate: n(0.1),
  reverseLogistics: kzt(30),
  tax: { mode: "on", regime: "synthetic", base: "revenue", rate: n(0.03) },
});

const values = (r: CalcResult): ResultValue[] => [
  ...Object.values(r.landed),
  ...Object.values(r.selling),
  r.salePrice,
  r.netProfit,
  r.priceToCostMultiple,
  r.roi,
  r.netMarginPct,
];

const fields = Object.keys(full()).filter((k) => k !== "currency") as (keyof CalcInput)[];

describe("calculate", () => {
  it("full input gives verified values with sources for every output", () => {
    for (const v of values(calculate(full()))) {
      expect(v.status).toBe("verified");
      expect(v.realistic).not.toBeNull();
      expect(v.sources.length).toBeGreaterThan(0);
      for (const s of v.sources) expect(s.source).toEqual(source);
    }
  });

  it.each(fields)("missing %s gives no_data, never a substituted number", (field) => {
    const input = full();
    delete input[field];
    const r = calculate(input);
    expect(r.netProfit.status).toBe("no_data");
    expect(r.netProfit.realistic).toBeNull();
    expect(r.netProfit.pessimistic).toBeNull();
    expect(r.netProfit.optimistic).toBeNull();
    expect(r.netProfit.missing).toContain(field);
    expect(r.netProfit.reason).toBe("missing_input");
    for (const v of values(r)) {
      if (v.status === "no_data") expect([v.pessimistic, v.realistic, v.optimistic]).toEqual([null, null, null]);
      else expect(v.missing).toEqual([]);
    }
  });

  it("missing tax rate when tax is on gives no_data", () => {
    const r = calculate({ ...full(), tax: { mode: "on", regime: "synthetic", base: "profit" } });
    expect(r.selling.tax.status).toBe("no_data");
    expect(r.selling.tax.missing).toEqual(["tax.rate"]);
  });

  it("sale price of zero makes margin undefined, not a number", () => {
    const r = calculate({ ...full(), salePrice: kzt(0) });
    expect(r.netMarginPct).toMatchObject({ status: "no_data", realistic: null, reason: "division_by_zero" });
  });

  it("estimated input propagates to dependent outputs only", () => {
    const r = calculate({ ...full(), adRate: n(0.05, { status: "estimated", low: 0.03, high: 0.08 }) });
    expect(r.selling.ads).toMatchObject({ status: "estimated", pessimistic: 80, realistic: 50, optimistic: 30 });
    expect(r.netProfit.status).toBe("estimated");
    expect(r.landed.total.status).toBe("verified");
  });

  it("sale price in foreign currency is converted with fx rate as its source", () => {
    const r = calculate({ ...full(), salePrice: { ...n(10), currency: "USD" }, fxRates: { USD: n(100) } });
    expect(r.salePrice.realistic).toBe(1000);
    expect(r.salePrice.sources.map((s) => s.field)).toEqual(["salePrice", "fxRates.USD"]);
  });
});
