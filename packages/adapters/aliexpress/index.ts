import { z } from "zod";
import { defineAdapter } from "../core";

// ponytail: формат предположительный (Affiliate API Open Platform, раздел 5.2 ТЗ), сверить после выдачи App Key.
const Body = z.object({
  products: z.array(
    z.object({
      product_id: z.string(),
      product_title: z.string(),
      target_sale_price: z.string().nullable().optional(),
      target_sale_price_currency: z.string().nullable().optional(),
      product_detail_url: z.string().optional(),
      /** Вес упаковки, кг. */
      package_weight: z.number().nonnegative().optional(),
    }),
  ),
});

export const aliexpress = defineAdapter({
  sourceId: "aliexpress",
  tokenEnv: "ALIEXPRESS_APP_KEY",
  rawSchema: Body,
  mock: () => ({
    products: [
      { product_id: "mock-1", product_title: "Synthetic item 1", target_sale_price: "3.00", target_sale_price_currency: "USD" },
      { product_id: "mock-2", product_title: "Synthetic item 2", target_sale_price: "5.00", target_sale_price_currency: "USD" },
    ],
  }),
  toRecords: (body, ctx) =>
    body.products.map((p) => {
      const price = p.target_sale_price == null ? NaN : Number(p.target_sale_price);
      return !Number.isFinite(price) || !p.target_sale_price_currency
        ? { reject: "нет цены или валюты", item: p }
        : {
            type: "offer" as const,
            sourceId: "aliexpress",
            kind: "source" as const,
            externalId: p.product_id,
            title: p.product_title,
            price,
            currency: p.target_sale_price_currency,
            ...(p.product_detail_url ? { url: p.product_detail_url } : {}),
            ...(p.package_weight === undefined ? {} : { weightKg: p.package_weight }),
            method: "api" as const,
            ...ctx,
          };
    }),
});
