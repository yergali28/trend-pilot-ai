import { z } from "zod";
import { defineAdapter } from "../core";
import { requestJson } from "../core/http";

// Формат по официальным спецификациям WB API (проверено 19.10.2026, docs/sources/wildberries.md):
// карточки — POST content-api /content/v2/get/cards/list, цены — GET discounts-prices-api /api/v2/list/goods/filter.

const Card = z.object({
  nmID: z.number().int(),
  title: z.string(),
  subjectID: z.number().int().optional(),
  subjectName: z.string().optional(),
  dimensions: z.object({ weightBrutto: z.number().nonnegative().optional() }).partial().optional(),
});

const Goods = z.object({
  nmID: z.number().int(),
  currencyIsoCode4217: z.string().optional(),
  sizes: z.array(z.object({ price: z.number(), discountedPrice: z.number() })).default([]),
});

/** Сырой ответ адаптера: карточки и цены своего магазина продавца. */
const Body = z.object({ cards: z.array(Card), goods: z.array(Goods) });

const CONTENT = "https://content-api.wildberries.ru/content/v2/get/cards/list";
const PRICES = "https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter";

export const wildberries = defineAdapter({
  sourceId: "wildberries",
  tokenEnv: "WB_API_TOKEN",
  rawSchema: Body,

  // ponytail: одна страница (до 100 карточек и 1000 цен); пагинация курсором — когда товаров станет больше.
  async live(_req, token) {
    const headers = { Authorization: token, "Content-Type": "application/json" };
    const cards = await requestJson<{ cards?: unknown[] }>(
      CONTENT,
      { method: "POST", headers, body: JSON.stringify({ settings: { sort: { ascending: true }, cursor: { limit: 100 }, filter: { withPhoto: -1 } } }) },
      { key: "wb:content", minIntervalMs: 600 }, // Контент: 100 запросов/мин, интервал 600 мс
    );
    const prices = await requestJson<{ data?: { listGoods?: unknown[] } }>(
      `${PRICES}?limit=1000&offset=0`,
      { headers },
      { key: "wb:prices", minIntervalMs: 600 }, // Цены и скидки: 10 запросов/6 с, интервал 600 мс
    );
    return Body.parse({ cards: cards.cards ?? [], goods: prices.data?.listGoods ?? [] });
  },

  mock: () => ({
    cards: [
      { nmID: 1, title: "Синтетический товар 1", subjectName: "Органайзеры", dimensions: { weightBrutto: 0.2 } },
      { nmID: 2, title: "Синтетический товар 2", subjectName: "Органайзеры", dimensions: { weightBrutto: 0.4 } },
    ],
    goods: [
      { nmID: 1, currencyIsoCode4217: "RUB", sizes: [{ price: 800, discountedPrice: 500 }] },
      { nmID: 2, currencyIsoCode4217: "RUB", sizes: [{ price: 1000, discountedPrice: 700 }] },
    ],
  }),

  // Цена продажи — цена со скидкой продавца (discountedPrice) минимального размера; без цены, валюты
  // или карточки запись отклоняется, а не получает число.
  toRecords: (body, ctx) => {
    const cards = new Map(body.cards.map((c) => [c.nmID, c]));
    return body.goods.map((g) => {
      const card = cards.get(g.nmID);
      const prices = g.sizes.map((s) => s.discountedPrice).filter((p) => p > 0);
      if (!card) return { reject: "нет карточки товара", item: g };
      if (prices.length === 0 || !g.currencyIsoCode4217) return { reject: "нет цены или валюты", item: g };
      const weight = card.dimensions?.weightBrutto;
      return {
        type: "offer" as const,
        sourceId: "wildberries",
        kind: "listing" as const,
        externalId: String(g.nmID),
        title: card.title,
        price: Math.min(...prices),
        currency: g.currencyIsoCode4217,
        ...(weight ? { weightKg: weight } : {}),
        method: "api" as const,
        ...ctx,
      };
    });
  },
});
