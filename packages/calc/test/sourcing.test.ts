import { describe, expect, it } from "vitest";
import { sourcingMargin, type MarginConfig } from "../src";

const cfg: MarginConfig = { cnyRubRate: 12, shippingPerUnitRub: 50, wbCommissionPct: 20, otherCostsPerUnitRub: 30 };

describe("sourcingMargin: маржа закупки в Китае при продаже на WB", () => {
  it("прибыль и маржинальность от цены WB", () => {
    // 10 ¥ × 12 = 120 ₽; комиссия 20 % от 1000 = 200 ₽; себестоимость 120 + 50 + 200 + 30 = 400 ₽.
    expect(sourcingMargin(10, 1000, cfg)).toEqual({ purchaseRub: 120, commissionRub: 200, costRub: 400, profitRub: 600, marginPct: 60 });
  });

  it("нулевая закупочная цена допустима; нулевая цена WB — маржинальность null", () => {
    expect(sourcingMargin(0, 1000, cfg).profitRub).toBe(720);
    expect(sourcingMargin(10, 0, cfg)).toMatchObject({ profitRub: -200, marginPct: null });
  });

  it("нулевой или нечисловой курс, отрицательные суммы и комиссия больше 100 % — ошибка конфигурации", () => {
    expect(() => sourcingMargin(10, 1000, { ...cfg, cnyRubRate: 0 })).toThrow(RangeError);
    expect(() => sourcingMargin(10, 1000, { ...cfg, cnyRubRate: Number.NaN })).toThrow(RangeError);
    expect(() => sourcingMargin(-1, 1000, cfg)).toThrow(RangeError);
    expect(() => sourcingMargin(10, Number.POSITIVE_INFINITY, cfg)).toThrow(RangeError);
    expect(() => sourcingMargin(10, 1000, { ...cfg, shippingPerUnitRub: -5 })).toThrow(RangeError);
    expect(() => sourcingMargin(10, 1000, { ...cfg, wbCommissionPct: 101 })).toThrow(RangeError);
  });
});

describe("volumetricWeightKg", () => {
  it("Д×Ш×В ÷ 6000 по умолчанию, делитель задаётся; нулевые габариты — ошибка", async () => {
    const { volumetricWeightKg } = await import("../src");
    expect(volumetricWeightKg({ length: 30, width: 20, height: 10 })).toBe(1);
    expect(volumetricWeightKg({ length: 30, width: 20, height: 10 }, 5000)).toBe(1.2);
    expect(() => volumetricWeightKg({ length: 0, width: 20, height: 10 })).toThrow(RangeError);
  });
});

describe("wbBoxLogistics", () => {
  it("первый литр по базе, каждый следующий неполный литр — по ставке за литр", async () => {
    const { wbBoxLogistics } = await import("../src");
    expect(wbBoxLogistics({ length: 10, width: 10, height: 10 }, 46, 14)).toBe(46); // 1 л
    expect(wbBoxLogistics({ length: 20, width: 10, height: 12 }, 46, 14)).toBe(46 + 2 * 14); // 2,4 л → 2 доп. литра
    expect(() => wbBoxLogistics({ length: 0, width: 1, height: 1 }, 46, 14)).toThrow(RangeError);
    expect(() => wbBoxLogistics({ length: 1, width: 1, height: 1 }, -1, 14)).toThrow(RangeError);
  });
});
