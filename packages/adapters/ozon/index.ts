import { z } from "zod";
import { defineAdapter } from "../core";

// ponytail: формат предположительный (Seller API, раздел 5.2 ТЗ), сверить с первой записью ключа Seller API.
const Body = z.object({
  result: z.object({
    items: z.array(
      z.object({
        product_id: z.number().int(),
        name: z.string(),
        price: z.string().nullable().optional(),
        currency_code: z.string().nullable().optional(),
      }),
    ),
  }),
});

export const ozon = defineAdapter({
  sourceId: "ozon",
  tokenEnv: "OZON_API_KEY",
  rawSchema: Body,
  mock: () => ({
    result: {
      items: [
        { product_id: 1, name: "Синтетический товар 1", price: "600", currency_code: "RUB" },
        { product_id: 2, name: "Синтетический товар 2", price: "900", currency_code: "RUB" },
      ],
    },
  }),
  toRecords: (body, ctx) =>
    body.result.items.map((i) => {
      const price = i.price == null ? NaN : Number(i.price);
      return !Number.isFinite(price) || !i.currency_code
        ? { reject: "нет цены или валюты", item: i }
        : {
            type: "offer" as const,
            sourceId: "ozon",
            kind: "listing" as const,
            externalId: String(i.product_id),
            title: i.name,
            price,
            currency: i.currency_code,
            method: "api" as const,
            ...ctx,
          };
    }),
});
