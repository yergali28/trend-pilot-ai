import { z } from "zod";
import { defineAdapter } from "../core";
import { requestJson } from "../core/http";

// MPSTATS Analytics API, Wildberries и Ozon (https://mpstats.io/integrations/analytics-wb/, проверено 22.10.2026):
// POST https://mpstats.io/api/analytics/v1/{wb|oz}/category/items — товары категории за период, заголовок X-Mpstats-TOKEN.
// Ozon сверен с реальным ответом 22.10.2026: ниша в niche/niche_id («Дом и сад/Текстиль/Одеяла»), продажи по дням в graph,
// комиссии и габаритов упаковки в ответе нет. Период — не больше последних 30 дней (иначе 403 «бесплатная версия»).
// Коды: 202 — отчёт готовится (повторить), 401 — токен, 429 — лимит тарифа (Retry-After). Поля — по примеру ответа
// из документации, сверены с реальным ответом 22.10.2026: дневные продажи приходят в sales_graph (в примере документации — graph).

const nums = z.array(z.number().nullable()).optional();
const Item = z.looseObject({
  id: z.number().int(),
  name: z.string(),
  url: z.string().optional(),
  thumb: z.string().optional(),
  thumb_middle: z.string().optional(),
  subject_id: z.number().int().optional(),
  subject: z.string().optional(),
  niche_id: z.number().int().optional(),
  niche: z.string().optional(),
  brand: z.string().optional(),
  seller: z.string().optional(),
  final_price: z.number().nullable().optional(),
  sales: z.number().nullable().optional(),
  revenue: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  comments: z.number().nullable().optional(),
  balance: z.number().nullable().optional(),
  commission_fbo: z.number().nullable().optional(),
  package_length: z.number().nullable().optional(),
  package_width: z.number().nullable().optional(),
  package_height: z.number().nullable().optional(),
  graph: nums,
  sales_graph: nums,
  price_graph: nums,
  stocks_graph: nums,
});

/** Сохраняемый ответ: параметры запроса (категория и период) и ответ провайдера как есть. */
const Body = z.object({
  path: z.string().min(1),
  d1: z.iso.date(),
  d2: z.iso.date(),
  response: z.looseObject({ total: z.number().optional(), data: z.array(Item) }),
});

export const MPSTATS_CATEGORY_ITEMS = "https://mpstats.io/api/analytics/v1/wb/category/items";
const MARKETS = {
  wb: { sourceId: "mpstats", listingSourceId: "wildberries", url: MPSTATS_CATEGORY_ITEMS },
  oz: { sourceId: "mpstats-ozon", listingSourceId: "ozon", url: "https://mpstats.io/api/analytics/v1/oz/category/items" },
} as const;
const DAYS = 30;
const day = (t: number) => new Date(t).toISOString().slice(0, 10);
const url = (v: string | undefined) => (v && /^https:\/\//.test(v) ? v : undefined);
const n = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);

/** Ниша товара: предмет WB (subject_id) или ниша Ozon (niche_id, путь через «/»). */
const category = (it: z.infer<typeof Item>) => {
  const subject = it.subject?.split(" / ").at(-1);
  if (it.subject_id && subject) return { externalId: `wb-subject:${it.subject_id}`, name: subject };
  const niche = it.niche?.split("/").at(-1);
  if (it.niche_id && niche) return { externalId: `oz-niche:${it.niche_id}`, name: niche };
  return undefined;
};

const mpstatsFor = (market: keyof typeof MARKETS) =>
  defineAdapter({
    sourceId: MARKETS[market].sourceId,
    tokenEnv: "MPSTATS_TOKEN",
    rawSchema: Body,

    // Запрос — путь категории, как в MPSTATS («Дом/Хранение вещей» у WB, «Дом и сад/Текстиль» у Ozon). Топ-100 по выручке за 30 дней.
    // ponytail: одна страница (100 товаров); пагинация startRow/endRow — когда понадобится глубже топа.
    async live(req, token) {
      const now = Date.now();
      const [d1, d2] = [day(now - DAYS * 86_400_000), day(now - 86_400_000)];
      const qs = new URLSearchParams({ path: req.query, d1, d2 });
      const response = await requestJson<unknown>(
        `${MARKETS[market].url}?${qs}`,
        {
          method: "POST",
          headers: { "X-Mpstats-TOKEN": token, "Content-Type": "application/json" },
          body: JSON.stringify({ startRow: 0, endRow: 100, filterModel: {}, sortModel: [{ colId: "revenue", sort: "desc" }] }),
        },
        { key: "mpstats", minIntervalMs: 1_000 },
      );
      return Body.parse({ path: req.query, d1, d2, response });
    },

    mock: () => ({
      path: "Синтетика/Органайзеры",
      d1: "2026-09-21",
      d2: "2026-10-20",
      response: {
        total: 2,
        data: [
          { id: 1, name: "Синтетический товар 1", subject_id: 1, subject: "Органайзеры", final_price: 500, sales: 120, revenue: 60000, rating: 4.8, comments: 40, balance: 300 },
          { id: 2, name: "Синтетический товар 2", subject_id: 1, subject: "Органайзеры", final_price: null, sales: 10 },
        ],
      },
    }),

    // Без цены товар не попадает в записи: продажи и выручку без цены не с чем сравнивать.
    toRecords: (body, ctx) =>
      body.response.data.map((it) => {
        const price = n(it.final_price);
        if (price === undefined) return { reject: "нет цены", item: { id: it.id, name: it.name } };
        return {
          type: "listing" as const,
          sourceId: MARKETS[market].sourceId,
          listingSourceId: MARKETS[market].listingSourceId,
          externalId: String(it.id),
          title: it.name,
          url: url(it.url),
          imageUrl: url(it.thumb_middle ?? it.thumb),
          brand: it.brand || undefined,
          seller: it.seller || undefined,
          category: category(it),
          price,
          currency: "RUB",
          salesPerMonth: n(it.sales),
          revenue: n(it.revenue),
          rating: n(it.rating),
          reviews: n(it.comments),
          stock: n(it.balance),
          commissionPct: n(it.commission_fbo),
          // Габариты упаковки в см; нулевые в ответе — «нет данных».
          dimensionsCm: it.package_length && it.package_width && it.package_height ? { length: it.package_length, width: it.package_width, height: it.package_height } : undefined,
          periodStart: body.d1,
          periodEnd: body.d2,
          daily: { sales: it.sales_graph ?? it.graph ?? [], price: it.price_graph ?? [], stock: it.stocks_graph ?? [] },
          method: "provider" as const,
          ...ctx,
        };
      }),
  });

export const mpstats = mpstatsFor("wb");
export const mpstatsOzon = mpstatsFor("oz");
