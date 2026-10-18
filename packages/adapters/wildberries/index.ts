import { z } from "zod";
import { defineAdapter } from "../core";

// ponytail: формат предположительный (Seller API, раздел 5.2 ТЗ), сверить с первой записью тестового токена (Test scope).
const Body = z.object({
  cards: z.array(
    z.object({
      nmID: z.number().int(),
      title: z.string(),
      price: z.number().nullable().optional(),
      currency: z.string().nullable().optional(),
    }),
  ),
});

export const wildberries = defineAdapter({
  sourceId: "wildberries",
  tokenEnv: "WB_API_TOKEN",
  rawSchema: Body,
  mock: () => ({
    cards: [
      { nmID: 1, title: "Синтетический товар 1", price: 500, currency: "RUB" },
      { nmID: 2, title: "Синтетический товар 2", price: 700, currency: "RUB" },
    ],
  }),
  toRecords: (body, ctx) =>
    body.cards.map((c) =>
      c.price == null || !c.currency
        ? { reject: "нет цены или валюты", item: c }
        : {
            type: "offer" as const,
            sourceId: "wildberries",
            kind: "listing" as const,
            externalId: String(c.nmID),
            title: c.title,
            price: c.price,
            currency: c.currency,
            method: "api" as const,
            ...ctx,
          },
    ),
});
