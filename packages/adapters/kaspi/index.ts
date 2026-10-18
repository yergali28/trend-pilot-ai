import { z } from "zod";
import { defineAdapter } from "../core";

// ponytail: формат предположительный (JSON:API Shop API, раздел 5.2 ТЗ), сверить с первой записью тестового токена.
const Body = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        name: z.string(),
        price: z.number().nullable().optional(),
        currency: z.string().nullable().optional(),
        url: z.string().optional(),
      }),
    }),
  ),
});

export const kaspi = defineAdapter({
  sourceId: "kaspi",
  tokenEnv: "KASPI_API_TOKEN",
  rawSchema: Body,
  mock: () => ({
    data: [
      { id: "mock-1", attributes: { name: "Синтетический товар 1", price: 1000, currency: "KZT" } },
      { id: "mock-2", attributes: { name: "Синтетический товар 2", price: 2000, currency: "KZT" } },
    ],
  }),
  toRecords: (body, ctx) =>
    body.data.map((p) =>
      p.attributes.price == null || !p.attributes.currency
        ? { reject: "нет цены или валюты", item: p }
        : {
            type: "offer" as const,
            sourceId: "kaspi",
            kind: "listing" as const,
            externalId: p.id,
            title: p.attributes.name,
            price: p.attributes.price,
            currency: p.attributes.currency,
            ...(p.attributes.url ? { url: p.attributes.url } : {}),
            method: "api" as const,
            ...ctx,
          },
    ),
});
