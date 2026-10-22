import { afterEach, describe, expect, it, vi } from "vitest";
import { resetRateState } from "../core/http";
import { apifyKaspi } from "../kaspi/apify";

afterEach(() => {
  resetRateState();
  vi.unstubAllGlobals();
});

describe("apify-kaspi: рынок Kaspi через актор Apify (поля сверены с ответом 22.10.2026)", () => {
  it("ссылка категории → startUrls, токен только в заголовке; карточки без продаж, отзывы и цена в KZT", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify([
          { id: "102120493", title: "Borofone BH53", url: "https://kaspi.kz/shop/p/borofone-bh53-102120493/?c=750000000", image: "https://resources.cdn-kaspi.kz/img/m/p/pa2/p1d/47199606.jpg?format=preview-large", brand: "Borofone", price: 2449, currency: "KZT", rating: 4.7, reviewsCount: 634, category: ["Телефоны и гаджеты", "Аксессуары для телефонов", "Держатели для телефонов"], categoryId: "01458" },
          { id: "2", title: "Без цены", price: null },
        ]),
      );
    });
    const raw = await apifyKaspi.fetch({ query: "https://kaspi.kz/shop/c/car%20holders/" }, { mode: "live", env: { APIFY_TOKEN: "test-token" } });
    expect(calls[0]!.url).not.toContain("test-token");
    expect(calls[0]!.init.headers).toMatchObject({ Authorization: "Bearer test-token" });
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ startUrls: [{ url: "https://kaspi.kz/shop/c/car%20holders/" }], maxItems: 100 });

    const { records, rejected } = apifyKaspi.normalize(raw);
    expect(rejected).toHaveLength(1);
    expect(records).toEqual([
      expect.objectContaining({ listingSourceId: "kaspi", externalId: "102120493", price: 2449, currency: "KZT", reviews: 634, category: { externalId: "kaspi-cat:01458", name: "Держатели для телефонов" }, method: "public_page" }),
    ]);
    expect(records[0]).not.toHaveProperty("salesPerMonth", expect.anything());
  });

  it("поисковая фраза → searchQueries", async () => {
    let body = "";
    vi.stubGlobal("fetch", async (_: string, init: RequestInit) => ((body = String(init.body)), new Response("[]")));
    await apifyKaspi.fetch({ query: "термос" }, { mode: "live", env: { APIFY_TOKEN: "t" } });
    expect(JSON.parse(body)).toMatchObject({ searchQueries: ["термос"] });
  });
});
