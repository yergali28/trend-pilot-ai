import { readFile } from "node:fs/promises";
import { z } from "zod";
import { AdapterError, defaultFixturesDir } from "../core";
import { requestJson, type RateOptions } from "../core/http";
import { int, num, Product, ProviderUnavailable, str, toProviderError, type Marketplace, type SearchOptions, type SourcingProvider, type SortOrder } from "./model";

type Http = Pick<RateOptions, "fetchImpl" | "sleep" | "random" | "now"> & { minIntervalMs?: number };
type Env = Record<string, string | undefined>;
type Row = Record<string, unknown>;

const page = (o: SearchOptions = {}) => ({ page: Math.max(1, o.page ?? 1), pageSize: Math.max(1, o.pageSize ?? 20), sort: o.sort ?? "relevance" });

/** Сортировка на нашей стороне — для провайдеров, которые не сортируют по цене сами. */
export function sortProducts(items: Product[], sort: SortOrder): Product[] {
  if (sort === "price_asc") return [...items].sort((a, b) => a.priceCny - b.priceCny);
  if (sort === "price_desc") return [...items].sort((a, b) => b.priceCny - a.priceCny);
  if (sort === "sales_desc") return [...items].sort((a, b) => (b.salesCount ?? -1) - (a.salesCount ?? -1));
  return items;
}

/** Запись провайдера → Product; без ID, названия или цены запись отбрасывается, а не получает число. */
function toProduct(p: Omit<Product, "itemId" | "titleCn" | "priceCny"> & { itemId: string | null; titleCn: string | null; priceCny: number | null }): Product | null {
  if (!p.itemId || !p.titleCn || p.priceCny === null || p.priceCny < 0) return null;
  return Product.parse(p);
}
const compact = (xs: (Product | null)[]) => xs.filter((x): x is Product => x !== null);

// ───────────────────────── Onebound ─────────────────────────
// Документация: https://open.onebound.cn/help/api/1688.item_search.html (и …item_get, taobao.*) — только после входа
// в кабинет Onebound; без аккаунта не читается (проверено 21.10.2026). Формат ниже взят из примеров, которые
// публикует сам Onebound (juejin.cn, автор «万邦Noah», 2022): packages/adapters/sourcing/README.md.
// TODO(onebound): сверить с документацией в кабинете и с первым реальным ответом:
//   - нужен ли `secret` вместе с `key` (в примерах обязателен) — отсюда ONEBOUND_API_SECRET;
//   - пути и поля `taobao/item_search`, `taobao/item_get` (подтверждены только 1688; для Taobao — та же схема по аналогии);
//   - значения `sort` для Taobao (для 1688: bid, _bid, _sale, _credit) и параметр `page_size`;
//   - коды ошибок ключа и квоты (сейчас любой код, кроме 0000 и item-not-found, → ProviderUnavailable);
//   - лимиты: в ответе есть `api_info: "today:19 max:10000"` (суточная квота), QPS не опубликован.
const ONEBOUND = "https://api-gw.onebound.cn";
const OneboundBody = z.looseObject({
  error_code: z.union([z.string(), z.number()]).optional(),
  error: z.string().optional(),
  reason: z.string().optional(),
  items: z.looseObject({ item: z.array(z.looseObject({})).default([]) }).optional(),
  item: z.looseObject({}).optional(),
});
const ONEBOUND_SORT: Record<SortOrder, string> = { relevance: "", price_asc: "bid", price_desc: "_bid", sales_desc: "_sale" };

export const mapOneboundSearchItem = (marketplace: Marketplace, r: Row) =>
  toProduct({
    marketplace,
    itemId: str(r.num_iid),
    titleCn: str(r.title),
    titleEn: null,
    priceCny: num(r.promotion_price) ?? num(r.price),
    minOrderQty: null, // в выдаче поиска нет; есть в item_get (min_num)
    salesCount: int(r.sales, 0),
    supplierId: null,
    supplierName: str(r.seller_nick),
    city: str(r.area),
    province: null,
    imageUrl: str(r.pic_url),
    url: str(r.detail_url),
    raw: r,
  });

export const mapOneboundItem = (marketplace: Marketplace, r: Row) => {
  // location: «广东省 深圳市» — провинция и город через пробел.
  const [province, city] = (str(r.location) ?? "").split(/\s+/);
  const seller = (r.seller_info ?? {}) as Row;
  return toProduct({
    marketplace,
    itemId: str(r.num_iid),
    titleCn: str(r.title),
    titleEn: null,
    priceCny: num(r.price),
    minOrderQty: int(r.min_num, 1),
    salesCount: int(r.sales, 0),
    supplierId: str(r.seller_id),
    supplierName: str(seller.shop_name) ?? str(r.nick),
    city: city || null,
    province: province || null,
    imageUrl: str(r.pic_url),
    url: str(r.detail_url),
    raw: r,
  });
};

export function oneboundProvider(env: Env, http: Http = {}): SourcingProvider {
  const key = env.ONEBOUND_API_KEY;
  const secret = env.ONEBOUND_API_SECRET;

  async function call(marketplace: Marketplace, api: "item_search" | "item_get", params: Record<string, string>) {
    if (!key) throw toProviderError(new AdapterError("token_not_configured", "Ключ не настроен: ONEBOUND_API_KEY (onebound)"));
    // Ключ и секрет передаются в URL (так требует Onebound); в ошибки попадают только хост и путь.
    const qs = new URLSearchParams({ key, ...(secret ? { secret } : {}), ...params });
    let body: z.infer<typeof OneboundBody>;
    try {
      body = OneboundBody.parse(await requestJson(`${ONEBOUND}/${marketplace}/${api}/?${qs}`, {}, { key: "onebound", minIntervalMs: http.minIntervalMs ?? 1000, timeoutMs: 30_000, maxAttempts: 4, ...http }));
    } catch (e) {
      throw e instanceof z.ZodError ? new ProviderUnavailable(`onebound ${marketplace}/${api}: ответ не совпал со схемой`) : toProviderError(e);
    }
    const code = body.error_code === undefined ? "0000" : String(body.error_code);
    if (body.error === "item-not-found") return null;
    if (code !== "0000") throw new ProviderUnavailable(`onebound ${marketplace}/${api}: ${code} ${body.reason ?? body.error ?? ""}`.trim());
    return body;
  }

  return {
    name: "onebound",
    async search(marketplace, keyword, opts) {
      const p = page(opts);
      const body = await call(marketplace, "item_search", { q: keyword, page: String(p.page), page_size: String(p.pageSize), sort: ONEBOUND_SORT[p.sort] });
      return compact((body?.items?.item ?? []).map((r) => mapOneboundSearchItem(marketplace, r)));
    },
    async getItem(marketplace, itemId) {
      const body = await call(marketplace, "item_get", { num_iid: itemId });
      return body?.item ? mapOneboundItem(marketplace, body.item) : null;
    },
    // TODO(onebound): item_search_img (поиск по фото, 1688 «拍立淘») есть в списке методов, формат не подтверждён.
  };
}

// ───────────────────────── Apify ─────────────────────────
// API: https://docs.apify.com/api/v2 — POST /v2/acts/{owner~name}/run-sync-get-dataset-items, токен в
// `Authorization: Bearer`. Синхронный запуск ждёт не больше 300 с (иначе 408 run-timeout-exceeded),
// лимит API на запуск актора — 400 запросов/с на ресурс, превышение — 429 rate-limit-exceeded.
// Каждый запуск платный (цена — на странице актора), поэтому повторов мало, а результаты кэшируются.
const APIFY = "https://api.apify.com/v2/acts";
export const APIFY_ACTORS = { "1688": "automation-lab/1688-scraper", taobao: "ethereal_wool/taobao-product-search-scraper" } as const;

/** automation-lab/1688-scraper: поля по README актора (проверено 21.10.2026). */
export const mapApify1688 = (r: Row) =>
  toProduct({
    marketplace: "1688",
    itemId: str(r.productId),
    titleCn: str(r.title),
    titleEn: null,
    priceCny: num(r.priceCny),
    minOrderQty: int(r.moq, 1), // только в режиме карточки (productUrls)
    salesCount: int(r.orderCount, 0), // число заказов, не штук
    supplierId: str(r.supplierId),
    supplierName: str(r.supplierName),
    city: str(r.city),
    province: str(r.province),
    imageUrl: str(r.thumbnailUrl),
    url: str(r.url),
    raw: r,
  });

/** ethereal_wool/taobao-product-search-scraper: поля по README актора (проверено 21.10.2026; актор помечен DEPRECATED). */
export const mapApifyTaobao = (r: Row) =>
  toProduct({
    marketplace: "taobao",
    itemId: str(r.productId) ?? str(r.id),
    titleCn: str(r.title),
    titleEn: str(r.titleEnglish),
    priceCny: num(r.promotionPrice) ?? num(r.price),
    minOrderQty: null,
    salesCount: int(r.salesVolume, 0),
    supplierId: null,
    supplierName: null,
    city: null,
    province: null,
    imageUrl: str(r.imageUrl),
    url: str(r.url),
    raw: r,
  });

export function apifyProvider(env: Env, http: Http = {}): SourcingProvider {
  const token = env.APIFY_TOKEN;
  const actors = { "1688": env.APIFY_ACTOR_1688 || APIFY_ACTORS["1688"], taobao: env.APIFY_ACTOR_TAOBAO || APIFY_ACTORS.taobao };
  const runTimeoutS = 240;

  async function run(marketplace: Marketplace, input: Row, maxItems: number): Promise<Row[]> {
    if (!token) throw toProviderError(new AdapterError("token_not_configured", "Токен не настроен: APIFY_TOKEN (apify)"));
    const url = `${APIFY}/${actors[marketplace].replace("/", "~")}/run-sync-get-dataset-items?timeout=${runTimeoutS}&maxItems=${maxItems}&format=json&clean=true`;
    try {
      const rows = await requestJson<unknown>(
        url,
        { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) },
        // Повтор на 5xx запускает актор заново за деньги — не больше двух попыток.
        { key: "apify", minIntervalMs: http.minIntervalMs ?? 1000, timeoutMs: (runTimeoutS + 60) * 1000, maxAttempts: 2, ...http },
      );
      return z.array(z.looseObject({})).parse(rows);
    } catch (e) {
      throw e instanceof z.ZodError ? new ProviderUnavailable(`apify ${actors[marketplace]}: ответ не список записей`) : toProviderError(e);
    }
  }

  return {
    name: "apify",
    async search(marketplace, keyword, opts) {
      const p = page(opts);
      // У акторов нет номера страницы: берём page × pageSize записей и отрезаем нужную страницу.
      const need = p.page * p.pageSize;
      const rows =
        marketplace === "1688"
          ? await run("1688", { keywords: [keyword], maxResults: need, ...(p.sort === "sales_desc" ? { sortType: "bestSelling" } : {}) }, need)
          : await run("taobao", { searchQueries: [keyword], maxItems: need }, need);
      const items = compact(rows.map(marketplace === "1688" ? mapApify1688 : mapApifyTaobao));
      return sortProducts(items, p.sort).slice((p.page - 1) * p.pageSize, need);
    },
    async getItem(marketplace, itemId) {
      if (marketplace === "taobao") throw new ProviderUnavailable("apify: карточка Taobao по ID актором не поддерживается");
      const rows = await run("1688", { productUrls: [itemId], maxResults: 1 }, 1);
      return compact(rows.map(mapApify1688))[0] ?? null;
    },
    // TODO(apify): apivault_labs/1688-image-search — вход известен (imageUrl, marketplace, maxResults),
    // поля выхода в README не опубликованы; подключить после первого реального запуска.
  };
}

// ───────────────────────── Mock ─────────────────────────
const MockFile = z.object({ synthetic: z.literal(true), products: z.array(Product) });

/** Синтетические карточки из fixtures/sourcing/mock.json; работает без сети и ключей. */
export function mockProvider(fixturesDir = defaultFixturesDir): SourcingProvider {
  let cache: Promise<Product[]> | undefined;
  const all = () => (cache ??= readFile(`${fixturesDir}/sourcing/mock.json`, "utf8").then((t) => MockFile.parse(JSON.parse(t)).products));
  const matches = (p: Product, kw: string) => !kw || [p.titleCn, p.titleEn ?? "", ...((p.raw as { keywords?: string[] })?.keywords ?? [])].some((s) => s.toLowerCase().includes(kw));

  return {
    name: "mock",
    async search(marketplace, keyword, opts) {
      const p = page(opts);
      const kw = keyword.trim().toLowerCase();
      const found = (await all()).filter((x) => x.marketplace === marketplace && matches(x, kw));
      return sortProducts(found, p.sort).slice((p.page - 1) * p.pageSize, p.page * p.pageSize);
    },
    async getItem(marketplace, itemId) {
      return (await all()).find((x) => x.marketplace === marketplace && x.itemId === itemId) ?? null;
    },
    async searchByImage(marketplace, _imageUrl, opts) {
      return (await all()).filter((x) => x.marketplace === marketplace).slice(0, page(opts).pageSize);
    },
  };
}
