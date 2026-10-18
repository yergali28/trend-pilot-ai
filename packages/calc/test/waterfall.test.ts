import { describe, expect, it } from "vitest";
import golden from "../../../fixtures/calc-golden-cases.json" with { type: "json" };
import { calculate, waterfall, type CalcInput, type SourceRef } from "../src";

const source = golden.source as SourceRef;
// Тот же разворот сокращений, что в golden.test.ts, для одного кейса.
const expand = (raw: Record<string, unknown>): CalcInput =>
  Object.fromEntries(
    Object.entries(raw).map(([k, v]) => {
      if (k === "currency") return [k, v];
      if (k === "tax") return [k, (v as { mode: string }).mode === "off" ? { source, ...(v as object) } : v];
      if (k === "fxRates") return [k, v];
      return [k, typeof v === "number" ? { value: v, status: "verified", source } : { status: "verified", source, ...(v as object) }];
    }),
  ) as unknown as CalcInput;

const byId = (id: string) => calculate(expand(golden.cases.find((c) => c.id === id)!.input as Record<string, unknown>));

describe("waterfall", () => {
  it("walks from sale price to net profit (kzt-base-tax-off, hand arithmetic in fixture)", () => {
    const steps = waterfall(byId("kzt-base-tax-off"));
    expect(steps.map((s) => [s.key, s.value])).toEqual([
      ["salePrice", 10000],
      ["purchase", 2000],
      ["delivery", 1100], // 100 + 1000
      ["customs", 719.2], // 310 + 409.2
      ["otherLanded", 300], // 0 + 200 + 100
      ["marketplace", 1600], // 1000 + 500 + 100
      ["ads", 500],
      ["returns", 30],
      ["tax", 0],
      ["netProfit", 3750.8],
    ]);
    const last = steps.at(-2)!;
    expect(last.end).toBeCloseTo(3750.8, 6);
    expect(steps.every((s) => s.status === "verified")).toBe(true);
  });

  it("missing cargo tariff breaks the chain into no_data from delivery on", () => {
    const steps = waterfall(byId("kzt-no-cargo-tariff"));
    const delivery = steps.find((s) => s.key === "delivery")!;
    expect(delivery).toMatchObject({ status: "no_data", value: null, end: null });
    expect(steps.find((s) => s.key === "ads")).toMatchObject({ start: null, end: null });
    expect(steps.at(-1)).toMatchObject({ key: "netProfit", status: "no_data", value: null });
  });

  it("missing sale price gives no_data start", () => {
    expect(waterfall(byId("kzt-no-sale-price"))[0]).toMatchObject({ status: "no_data", value: null, start: null });
  });

  it("uses the requested scenario and marks estimated groups", () => {
    const steps = waterfall(byId("kzt-range-estimated"), "pessimistic");
    expect(steps[0]!.value).toBe(9000);
    expect(steps.find((s) => s.key === "delivery")).toMatchObject({ status: "estimated", value: 1300 });
    expect(steps.at(-1)!.value).toBeCloseTo(2664.4, 6);
  });
});
