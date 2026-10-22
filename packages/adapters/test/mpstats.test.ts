import { afterEach, describe, expect, it, vi } from "vitest";
import { resetRateState } from "../core/http";
import { mpstats } from "../mpstats";

afterEach(() => {
  resetRateState();
  vi.unstubAllGlobals();
});

describe("mpstats live: товары категории по документации", () => {
  it("POST category/items с путём и периодом, токен только в X-Mpstats-TOKEN, карточки с рядами", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          startRow: 0,
          endRow: 100,
          total: 1,
          data: [{ id: 7, name: "Тестовая маска", url: "https://www.wildberries.ru/catalog/7/detail.aspx", thumb_middle: "https://basket-01.wbbasket.ru/7/1.webp", subject_id: 1526, subject: "Красота / Маски тканевые", brand: "B", seller: "ООО Тест", final_price: 568, sales: 300, revenue: 170400, rating: 5, comments: 10, balance: 50, graph: [1, 2], price_graph: [568, 570] }],
        }),
      );
    });
    const raw = await mpstats.fetch({ query: "Красота/Маски" }, { mode: "live", env: { MPSTATS_TOKEN: "test-token" } });
    const u = new URL(calls[0]!.url);
    expect(u.origin + u.pathname).toBe("https://mpstats.io/api/analytics/v1/wb/category/items");
    expect(u.searchParams.get("path")).toBe("Красота/Маски");
    expect(u.searchParams.get("d1")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(calls[0]!.init).toMatchObject({ method: "POST", headers: { "X-Mpstats-TOKEN": "test-token" } });
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ startRow: 0, endRow: 100, sortModel: [{ colId: "revenue", sort: "desc" }] });

    const { records } = mpstats.normalize(raw);
    expect(records).toEqual([
      expect.objectContaining({ type: "listing", listingSourceId: "wildberries", externalId: "7", price: 568, salesPerMonth: 300, revenue: 170400, category: { externalId: "wb-subject:1526", name: "Маски тканевые" }, imageUrl: "https://basket-01.wbbasket.ru/7/1.webp", daily: { sales: [1, 2], price: [568, 570], stock: [] }, synthetic: false }),
    ]);
  });
});
