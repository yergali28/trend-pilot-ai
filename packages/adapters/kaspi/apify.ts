import { z } from "zod";
import { defineAdapter } from "../core";
import { requestJson } from "../core/http";

// Рынок Kaspi.kz через Apify, актор piotrv1001/kaspi-listings-scraper (сбор публичных страниц; решение владельца
// по правилу 7 от 22.10.2026). Поля сверены с реальным ответом 22.10.2026: id, title, url, image, brand, price (KZT),
// rating, reviewsCount, inStock, category (путь массивом), categoryId. Продаж и выручки Kaspi не показывает —
// в записи их нет (no_data). Платно: 0,001 $ за товар в выдаче (цена со страницы актора, 22.10.2026).

export const APIFY_KASPI_ACTOR = "piotrv1001~kaspi-listings-scraper";
const RUN = `https://api.apify.com/v2/acts/${APIFY_KASPI_ACTOR}/run-sync-get-dataset-items`;
const MAX_ITEMS = 100;
/** Алматы — город по умолчанию у актора; цены и наличие зависят от города. */
const CITY = "750000000";

const Item = z.looseObject({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().optional(),
  image: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().optional(),
  rating: z.number().nullable().optional(),
  reviewsCount: z.number().nullable().optional(),
  category: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
});

/** Сохраняемый ответ: запрос, город, дата сбора и выдача актора как есть. */
const Body = z.object({ query: z.string().min(1), city: z.string(), date: z.iso.date(), items: z.array(Item) });

const https = (v: string | null | undefined) => (v && /^https:\/\//.test(v) ? v : undefined);
const n = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);

export const apifyKaspi = defineAdapter({
  sourceId: "apify-kaspi",
  tokenEnv: "APIFY_TOKEN",
  rawSchema: Body,

  // Запрос — ссылка на категорию Kaspi (https://kaspi.kz/shop/c/…) или поисковая фраза. До 100 товаров за запуск.
  async live(req, token) {
    const input = /^https:\/\/kaspi\.kz\//.test(req.query) ? { startUrls: [{ url: req.query }] } : { searchQueries: [req.query] };
    const items = await requestJson<unknown>(
      RUN,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...input, maxItems: MAX_ITEMS, city: CITY }) },
      { key: "apify", minIntervalMs: 1_000, timeoutMs: 300_000, maxAttempts: 2 },
    );
    return Body.parse({ query: req.query, city: CITY, date: new Date().toISOString().slice(0, 10), items });
  },

  mock: () => ({
    query: "синтетика",
    city: CITY,
    date: "2026-10-22",
    items: [
      { id: "1", title: "Синтетический товар 1", price: 2500, currency: "KZT", rating: 4.8, reviewsCount: 120, category: ["Синтетика", "Органайзеры"], categoryId: "00001" },
      { id: "2", title: "Синтетический товар 2", price: null },
    ],
  }),

  toRecords: (body, ctx) =>
    body.items.map((it) => {
      const price = n(it.price);
      if (price === undefined) return { reject: "нет цены", item: { id: it.id, title: it.title } };
      const niche = it.category?.at(-1);
      return {
        type: "listing" as const,
        sourceId: "apify-kaspi",
        listingSourceId: "kaspi",
        externalId: it.id,
        title: it.title,
        url: https(it.url),
        imageUrl: https(it.image),
        brand: it.brand || undefined,
        category: it.categoryId && niche ? { externalId: `kaspi-cat:${it.categoryId}`, name: niche } : undefined,
        price,
        currency: "KZT",
        rating: n(it.rating),
        reviews: n(it.reviewsCount),
        // Снимок на дату сбора: период — один день.
        periodStart: body.date,
        periodEnd: body.date,
        method: "public_page" as const,
        ...ctx,
      };
    }),
});
