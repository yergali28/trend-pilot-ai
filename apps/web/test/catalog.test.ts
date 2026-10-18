import { afterEach, describe, expect, it } from "vitest";
import { buildInput, type Catalog } from "../lib/catalog";

// Синтетический мини-каталог в памяти: проверка приоритета источников, не рыночные данные.
const at = "2026-10-18T00:00:00Z";
function catalog(refs: Catalog["refs"]): Catalog {
  return {
    refs,
    products: new Map([
      ["s", { id: "s", source_id: "aliexpress", kind: "source", external_id: "s", title: "S", weight_kg: 1, synthetic: true, category_id: null }],
      ["l", { id: "l", source_id: "kaspi", kind: "listing", external_id: "l", title: "L", weight_kg: null, synthetic: true, category_id: null }],
    ]),
    offers: new Map([
      ["s", { product_id: "s", source_id: "aliexpress", method: "api", price: 2, currency: "USD", moq: null, fetched_at: at, synthetic: true }],
      ["l", { product_id: "l", source_id: "kaspi", method: "api", price: 5000, currency: "KZT", moq: null, fetched_at: at, synthetic: true }],
    ]),
    demand: new Map(),
    listingsBySource: new Map([["s", ["l"]]]),
    categories: new Map(),
  };
}
const empty = { fx: [], cargo: [], fees: [] };
const refs = {
  fx: [{ base_currency: "USD", quote_currency: "KZT", rate: 500, rate_date: "2026-10-17", fetched_at: at }],
  cargo: [{ basis: "kg" as const, rate: 3, currency: "USD", fetched_at: at, status: "verified" as const }],
  fees: [{ marketplace_id: "kaspi", country: "KZ", fee_type: "commission", rate: 0.1, valid_from: "2026-10-01", fetched_at: at, status: "verified" as const }],
};

afterEach(() => {
  delete process.env.TP_DEMO_DATA;
});

describe("buildInput: приоритет источников", () => {
  it("без справочников и демо-режима поля отсутствуют (нет данных), числа не подставляются", () => {
    const { input } = buildInput(catalog(empty), "s", "kaspi", "KZ");
    expect(input.fxRates).toBeUndefined();
    expect(input.cargoTariff).toBeUndefined();
    expect(input.marketplaceCommissionRate).toBeUndefined();
    expect(input.salePrice).toMatchObject({ value: 5000, status: "verified", source: { sourceId: "kaspi" } });
  });

  it("демо-допущения помечены оценкой и источником demo:assumptions", () => {
    process.env.TP_DEMO_DATA = "1";
    const { input, synthetic } = buildInput(catalog(empty), "s", "kaspi", "KZ");
    expect(synthetic).toBe(true);
    expect(input.fxRates?.USD).toMatchObject({ status: "estimated", source: { sourceId: "demo:assumptions" } });
  });

  it("справочник администратора перекрывает демо-допущение", () => {
    process.env.TP_DEMO_DATA = "1";
    const { input } = buildInput(catalog(refs), "s", "kaspi", "KZ");
    expect(input.fxRates?.USD).toMatchObject({ value: 500, status: "verified", source: { sourceId: "reference:fx_rates" } });
    expect(input.cargoTariff).toMatchObject({ value: 3, currency: "USD", source: { sourceId: "reference:cargo_rates" } });
    expect(input.marketplaceCommissionRate).toMatchObject({ value: 0.1, source: { sourceId: "reference:fee_rules" } });
  });

  it("комиссия другой площадки или страны не применяется", () => {
    const { input } = buildInput(catalog(refs), "s", "ozon", "KZ");
    expect(input.marketplaceCommissionRate).toBeUndefined();
    expect(buildInput(catalog(refs), "s", "kaspi", "RU").input.fxRates).toBeUndefined();
  });
});
