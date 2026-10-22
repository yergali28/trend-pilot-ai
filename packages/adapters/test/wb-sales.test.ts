import { afterEach, describe, expect, it, vi } from "vitest";
import { resetRateState } from "../core/http";
import { wildberriesSales } from "../wildberries/sales";

afterEach(() => {
  resetRateState();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("wildberries-sales live: statistics-api по документации", () => {
  it("заказы и продажи за 30 дней, минута между отчётами, личные поля отброшены", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-22T22:30:00Z") }); // по Москве уже 23.10
    const calls: { url: string; init: RequestInit; at: number }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init, at: Date.now() });
      const row = { date: "2026-10-01T10:00:00", nmId: 7, subject: "Органайзеры", supplierArticle: "a-7", srid: "11.x", gNumber: "123", sticker: "9", regionName: "Московская" };
      return new Response(JSON.stringify(url.includes("/orders") ? [{ ...row, isCancel: false }] : [{ ...row, saleID: "S1" }, { ...row, saleID: "S2" }, { ...row, saleID: "R3" }]));
    });
    const pending = wildberriesSales.fetch({ query: "sales" }, { mode: "live", env: { WB_API_TOKEN: "test-token" } });
    await vi.runAllTimersAsync();
    const raw = await pending;

    expect(calls.map((c) => c.url)).toEqual([
      "https://statistics-api.wildberries.ru/api/v1/supplier/orders?dateFrom=2026-09-23",
      "https://statistics-api.wildberries.ru/api/v1/supplier/sales?dateFrom=2026-09-23",
    ]);
    expect(calls[1]!.at - calls[0]!.at).toBeGreaterThanOrEqual(60_000);
    expect(calls.every((c) => (c.init.headers as Record<string, string>).Authorization === "test-token")).toBe(true);
    expect(JSON.stringify(raw.body)).not.toMatch(/srid|gNumber|sticker|regionName/);

    const { records } = wildberriesSales.normalize(raw);
    expect(records).toEqual([
      expect.objectContaining({ type: "demand", listingSourceId: "wildberries", externalId: "7", title: "Органайзеры, арт. a-7", salesPerMonth: 1, periodStart: "2026-09-23", periodEnd: "2026-10-23", synthetic: false }),
    ]);
  });

  it("продажи до начала периода не считаются, возвраты вычитаются", async () => {
    const raw = await wildberriesSales.fetch({ query: "demo" }, { mode: "replay" });
    const { records, rejected } = wildberriesSales.normalize(raw);
    expect(records.map((r) => [r.externalId, r.type === "demand" && r.salesPerMonth])).toEqual([["101", 1]]);
    expect(rejected).toEqual([expect.objectContaining({ reason: "нет предмета и артикула" })]);
  });
});
