import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarginConfig } from "@tp/calc";
import { resetRateState } from "../core/http";
import {
  apifyProvider,
  createSourcingProvider,
  findSourcing,
  mapApify1688,
  mapApifyTaobao,
  mapOneboundItem,
  mapOneboundSearchItem,
  marginConfigFromEnv,
  mockProvider,
  oneboundProvider,
  ProviderAuthError,
  ProviderRateLimit,
  ProviderUnavailable,
  withCache,
  type Product,
  type SourcingProvider,
} from "../sourcing";

// Сеть в тестах не используется: fetch подменяется, паузы идут по виртуальным часам.
const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const clock = () => {
  let t = 0;
  return { now: () => t, sleep: async (ms: number) => void (t += ms), random: () => 0.5 };
};
const KEY = "secret-key-value";

// Примеры ответов в формате, который публикует Onebound и README акторов Apify (sourcing/README.md).
const oneboundSearch = {
  items: {
    page: "1",
    item: [
      { title: "女装连衣裙", pic_url: "https://img.test/1.jpg", promotion_price: "17.00", price: "19.00", sales: 7000, num_iid: "45566582412", seller_nick: "广州某服饰有限公司", area: "广州市", detail_url: "https://detail.1688.com/offer/45566582412.html" },
      { title: null, pic_url: null, promotion_price: null, price: null, sales: null, seller_nick: null, area: null, detail_url: "https://detail.1688.com/offer/.html" },
    ],
  },
  error_code: "0000",
  reason: "ok",
};
const oneboundItem = { item: { num_iid: "610947572360", title: "智能手机", price: "799.00", min_num: 2, sales: 30, seller_id: "2206619673102", nick: "qin多亲科技", seller_info: { shop_name: "深圳市多亲科技有限公司" }, location: "广东省 深圳市", pic_url: "https://img.test/2.jpg", detail_url: "https://detail.1688.com/offer/610947572360.html" }, error_code: "0000" };
const apify1688Row = { productId: "549929725456", title: "TWS无线蓝牙耳机", url: "https://detail.1688.com/offer/549929725456.html", thumbnailUrl: "https://img.test/3.jpg", priceCny: 28.5, moq: 10, supplierName: "深圳市鸿达电子科技有限公司", supplierId: "b2b-2582465574fd1bb", province: "广东", city: "深圳市", orderCount: 2547 };
const apifyTaobaoRow = { productId: 789012345678, title: "无线蓝牙耳机", titleEnglish: "Wireless earbuds", price: 129, promotionPrice: 99, imageUrl: "https://img.test/4.jpg", url: "https://item.taobao.com/item.htm?id=789012345678", salesVolume: 2841 };

const cfg: MarginConfig = { cnyRubRate: 12, shippingPerUnitRub: 50, wbCommissionPct: 20, otherCostsPerUnitRub: 30 };

// Любой настоящий сетевой вызов роняет тест: набор работает без интернета и без ключей.
beforeEach(() => vi.stubGlobal("fetch", () => Promise.reject(new Error("сеть в тестах запрещена"))));
afterEach(() => {
  resetRateState();
  vi.unstubAllGlobals();
});

describe("интерфейс и фабрика провайдера", () => {
  it("провайдер выбирается только переменной PROVIDER, по умолчанию mock", () => {
    expect(createSourcingProvider({}).name).toBe("mock");
    expect(createSourcingProvider({ PROVIDER: "onebound" }).name).toBe("onebound");
    expect(createSourcingProvider({ PROVIDER: " Apify " }).name).toBe("apify");
    expect(() => createSourcingProvider({ PROVIDER: "scraper" })).toThrow(/mock, onebound, apify/);
  });

  it("у всех провайдеров одинаковый интерфейс search / getItem", () => {
    for (const p of [mockProvider(), oneboundProvider({}), apifyProvider({})] as SourcingProvider[]) {
      expect(typeof p.search).toBe("function");
      expect(typeof p.getItem).toBe("function");
    }
  });
});

describe("маппинг ответов провайдеров в Product", () => {
  it("Onebound: поиск 1688 — цена со скидкой, продажи, поставщик, город; запись без цены отбрасывается", () => {
    const [p, empty] = oneboundSearch.items.item.map((r) => mapOneboundSearchItem("1688", r));
    expect(p).toMatchObject({ marketplace: "1688", itemId: "45566582412", titleCn: "女装连衣裙", priceCny: 17, salesCount: 7000, supplierName: "广州某服饰有限公司", city: "广州市", minOrderQty: null });
    expect(p!.raw).toBe(oneboundSearch.items.item[0]);
    expect(empty).toBeNull();
  });

  it("Onebound: поиск Taobao в формате реального ответа (21.10.2026) — без продаж и продавца, area = провинция и город", () => {
    const r = { title: "适用于苹果17promax手机壳18高级", pic_url: "https://img.test/5.jpg", promotion_price: "48.00", orginal_price: "98.00", price: "48.00", num_iid: "1038418587864", area: "广东 东莞", detail_url: "https://item.taobao.com/item.htm?id=1038418587864" };
    expect(mapOneboundSearchItem("taobao", r)).toMatchObject({ marketplace: "taobao", itemId: "1038418587864", priceCny: 48, salesCount: null, supplierName: null, province: "广东", city: "东莞" });
  });

  it("Onebound: карточка — MOQ, провинция и город, магазин", () => {
    expect(mapOneboundItem("1688", oneboundItem.item)).toMatchObject({ itemId: "610947572360", priceCny: 799, minOrderQty: 2, supplierId: "2206619673102", supplierName: "深圳市多亲科技有限公司", province: "广东省", city: "深圳市" });
  });

  it("Apify: 1688 и Taobao", () => {
    expect(mapApify1688(apify1688Row)).toMatchObject({ marketplace: "1688", itemId: "549929725456", priceCny: 28.5, minOrderQty: 10, salesCount: 2547, province: "广东", city: "深圳市", supplierId: "b2b-2582465574fd1bb" });
    expect(mapApifyTaobao(apifyTaobaoRow)).toMatchObject({ marketplace: "taobao", itemId: "789012345678", titleEn: "Wireless earbuds", priceCny: 99, salesCount: 2841, supplierName: null, minOrderQty: null });
  });
});

describe("Onebound: запросы, ошибки и повторы", () => {
  it("ищет по пути /1688/item_search/ с ключом, сортировкой и размером страницы", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200, oneboundSearch));
    const out = await oneboundProvider({ ONEBOUND_API_KEY: KEY, ONEBOUND_API_SECRET: "s" }, { fetchImpl, ...clock() }).search("1688", "女装", { page: 2, pageSize: 40, sort: "price_asc" });
    const url = new URL(fetchImpl.mock.calls[0]![0] as string);
    expect(url.pathname).toBe("/1688/item_search/");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ key: KEY, secret: "s", q: "女装", page: "2", page_size: "40", sort: "bid" });
    expect(out).toHaveLength(1);
  });

  it("без ключа — ProviderAuthError без запроса", async () => {
    const fetchImpl = vi.fn();
    await expect(oneboundProvider({}, { fetchImpl }).search("1688", "x")).rejects.toBeInstanceOf(ProviderAuthError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("401 — ProviderAuthError, ключ в сообщение не попадает", async () => {
    const err = await oneboundProvider({ ONEBOUND_API_KEY: KEY }, { fetchImpl: vi.fn().mockResolvedValue(res(401, {})), ...clock() })
      .search("1688", "x")
      .catch((e: Error) => e);
    expect(err).toBeInstanceOf(ProviderAuthError);
    expect((err as Error).message).not.toContain(KEY);
  });

  it("5xx повторяется с паузой и затем удаётся; 429 до исчерпания попыток — ProviderRateLimit", async () => {
    const ok = vi.fn().mockResolvedValueOnce(res(503, {})).mockResolvedValueOnce(res(200, oneboundSearch));
    expect(await oneboundProvider({ ONEBOUND_API_KEY: KEY }, { fetchImpl: ok, ...clock() }).search("1688", "x")).toHaveLength(1);
    expect(ok).toHaveBeenCalledTimes(2);

    const limited = vi.fn().mockImplementation(async () => res(429, {}));
    await expect(oneboundProvider({ ONEBOUND_API_KEY: KEY }, { fetchImpl: limited, ...clock() }).search("1688", "x")).rejects.toBeInstanceOf(ProviderRateLimit);
    expect(limited).toHaveBeenCalledTimes(4);
  });

  it("4005 «интерфейс не подключён» — ProviderAuthError; Taobao сортируется у нас, если Onebound не отсортировал", async () => {
    const denied = vi.fn().mockResolvedValue(res(200, { error: "1688无权访问,请开通接口", reason: "1688无权访问", error_code: "4005", success: 0 }));
    await expect(oneboundProvider({ ONEBOUND_API_KEY: KEY }, { fetchImpl: denied, ...clock() }).search("1688", "x")).rejects.toBeInstanceOf(ProviderAuthError);
    const unsorted = { error_code: "0000", items: { item: [{ num_iid: "a", title: "a", price: "48.00", area: "广东 东莞" }, { num_iid: "b", title: "b", price: "23.80" }] } };
    const out = await oneboundProvider({ ONEBOUND_API_KEY: KEY }, { fetchImpl: vi.fn().mockResolvedValue(res(200, unsorted)), ...clock() }).search("taobao", "x", { sort: "price_asc" });
    expect(out.map((p) => p.itemId)).toEqual(["b", "a"]);
  });

  it("ошибка в теле ответа — ProviderUnavailable; item-not-found — null", async () => {
    const bad = vi.fn().mockResolvedValue(res(200, { error: "server-error", reason: "错误", error_code: "5000" }));
    await expect(oneboundProvider({ ONEBOUND_API_KEY: KEY }, { fetchImpl: bad, ...clock() }).search("1688", "x")).rejects.toBeInstanceOf(ProviderUnavailable);
    const missing = vi.fn().mockResolvedValue(res(200, { error: "item-not-found", reason: "商品没找到", error_code: "2000" }));
    expect(await oneboundProvider({ ONEBOUND_API_KEY: KEY }, { fetchImpl: missing, ...clock() }).getItem("1688", "1")).toBeNull();
  });
});

describe("Apify: запуск актора", () => {
  it("POST run-sync-get-dataset-items с Bearer-токеном, страница вырезается, цены сортируются", async () => {
    const rows = [{ ...apify1688Row, productId: "a", priceCny: 30 }, { ...apify1688Row, productId: "b", priceCny: 10 }, { ...apify1688Row, productId: "c", priceCny: 20 }];
    const fetchImpl = vi.fn().mockResolvedValue(res(200, rows));
    const out = await apifyProvider({ APIFY_TOKEN: KEY }, { fetchImpl, ...clock() }).search("1688", "耳机", { page: 1, pageSize: 2, sort: "price_asc" });
    const [url, init] = fetchImpl.mock.calls[0]! as [string, RequestInit];
    expect(new URL(url).pathname).toBe("/v2/acts/automation-lab~1688-scraper/run-sync-get-dataset-items");
    expect(url).not.toContain(KEY);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    expect(JSON.parse(init.body as string)).toMatchObject({ keywords: ["耳机"], maxResults: 2 });
    expect(out.map((p) => p.itemId)).toEqual(["b", "c"]);
  });

  it("актор Taobao задаётся окружением; карточка Taobao по ID — ProviderUnavailable", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200, [apifyTaobaoRow]));
    const p = apifyProvider({ APIFY_TOKEN: KEY, APIFY_ACTOR_TAOBAO: "someone/taobao-actor" }, { fetchImpl, ...clock() });
    await p.search("taobao", "耳机");
    expect(fetchImpl.mock.calls[0]![0]).toContain("/acts/someone~taobao-actor/");
    await expect(p.getItem("taobao", "1")).rejects.toBeInstanceOf(ProviderUnavailable);
  });

  it("без токена — ProviderAuthError", async () => {
    await expect(apifyProvider({}).search("1688", "x")).rejects.toBeInstanceOf(ProviderAuthError);
  });
});

describe("mock-провайдер на фикстурах", () => {
  const mock = mockProvider();

  it("ищет по ключевому слову на любом языке, сортирует и листает", async () => {
    const all = await mock.search("1688", "чехол", { sort: "price_asc" });
    expect(all.map((p) => p.priceCny)).toEqual([2.8, 3.2, 6.5]);
    expect((await mock.search("1688", "手机壳", { page: 2, pageSize: 2, sort: "price_asc" })).map((p) => p.itemId)).toEqual(["mock-1688-003"]);
    expect(await mock.search("taobao", "нет такого")).toEqual([]);
  });

  it("карточка по ID и поиск по фото", async () => {
    expect(await mock.getItem("taobao", "mock-tb-001")).toMatchObject({ titleCn: "手机壳 卡通 女款" });
    expect(await mock.getItem("1688", "nope")).toBeNull();
    expect((await mock.searchByImage!("1688", "https://img.test/x.jpg", { pageSize: 3 })).length).toBe(3);
  });
});

describe("кэш результатов", () => {
  it("повторный поиск в пределах TTL не идёт к провайдеру; после TTL — идёт; ошибки не кэшируются", async () => {
    let t = 0;
    const search = vi.fn().mockRejectedValueOnce(new ProviderUnavailable("down")).mockResolvedValue([]);
    const cached = withCache({ name: "onebound", search, getItem: vi.fn() }, 1000, () => t);
    await expect(cached.search("1688", "x")).rejects.toBeInstanceOf(ProviderUnavailable);
    await cached.search("1688", "x");
    await cached.search("1688", "x");
    expect(search).toHaveBeenCalledTimes(2);
    t = 1000;
    await cached.search("1688", "x");
    expect(search).toHaveBeenCalledTimes(3);
  });

  it("фабрика оборачивает платных провайдеров кэшем на SOURCING_CACHE_TTL_HOURS", () => {
    expect(() => createSourcingProvider({ PROVIDER: "apify", SOURCING_CACHE_TTL_HOURS: "-1" })).toThrow(/SOURCING_CACHE_TTL_HOURS/);
  });
});

describe("ставки маржи", () => {
  it("ставки из окружения обязательны, без подстановок", () => {
    expect(() => marginConfigFromEnv({})).toThrow(/SOURCING_CNY_RUB/);
    expect(marginConfigFromEnv({ SOURCING_CNY_RUB: "12,5", SOURCING_SHIPPING_PER_UNIT_RUB: "50", SOURCING_WB_COMMISSION_PCT: "20", SOURCING_OTHER_COSTS_PER_UNIT_RUB: "0" })).toEqual({ cnyRubRate: 12.5, shippingPerUnitRub: 50, wbCommissionPct: 20, otherCostsPerUnitRub: 0 });
  });
});

describe("findSourcing", () => {
  const product = (over: Partial<Product>): Product => ({ marketplace: "1688", itemId: "x", titleCn: "x", titleEn: null, priceCny: 1, minOrderQty: null, salesCount: null, supplierId: null, supplierName: null, city: null, province: null, imageUrl: null, url: null, raw: {}, ...over });

  it("на mock: 1688 и Taobao вместе, по цене, с маржой относительно цены WB", async () => {
    const { candidates, errors } = await findSourcing("phone case", { provider: createSourcingProvider({ PROVIDER: "mock" }), wbPriceRub: 600, margin: cfg, topN: 3 });
    expect(errors).toEqual([]);
    expect(candidates.map((c) => [c.marketplace, c.priceCny])).toEqual([["1688", 2.8], ["1688", 3.2], ["1688", 6.5]]);
    expect(candidates[0]!.minOrderCostCny).toBeCloseTo(280);
    expect(candidates[0]!.margin.profitRub).toBeCloseTo(600 - 2.8 * 12 - 50 - 120 - 30);
  });

  it("при равной цене меньший MOQ выше, неизвестный — ниже; maxMoq отсекает большие партии", async () => {
    const items = [product({ itemId: "unknown" }), product({ itemId: "big", minOrderQty: 500 }), product({ itemId: "small", minOrderQty: 5 })];
    const provider: SourcingProvider = { name: "mock", search: async (m) => (m === "1688" ? items : []), getItem: async () => null };
    expect((await findSourcing("x", { provider, wbPriceRub: 100, margin: cfg })).candidates.map((c) => c.itemId)).toEqual(["small", "big", "unknown"]);
    expect((await findSourcing("x", { provider, wbPriceRub: 100, margin: cfg, maxMoq: 100 })).candidates.map((c) => c.itemId)).toEqual(["small", "unknown"]);
  });

  it("сбой одной площадки возвращается в errors, сбой всех — исключение", async () => {
    const partial: SourcingProvider = { name: "mock", search: async (m) => (m === "taobao" ? Promise.reject(new ProviderRateLimit("429")) : [product({})]), getItem: async () => null };
    const out = await findSourcing("x", { provider: partial, wbPriceRub: 100, margin: cfg });
    expect(out.candidates).toHaveLength(1);
    expect(out.errors).toEqual([{ marketplace: "taobao", error: expect.any(ProviderRateLimit) }]);
    const down: SourcingProvider = { name: "mock", search: async () => Promise.reject(new ProviderAuthError("no key")), getItem: async () => null };
    await expect(findSourcing("x", { provider: down, wbPriceRub: 100, margin: cfg })).rejects.toBeInstanceOf(ProviderAuthError);
  });
});
