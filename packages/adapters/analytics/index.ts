import { z } from "zod";
import { defineAdapter } from "../core";

// ponytail: провайдер аналитики не выбран (пилот 5.6); формат условный, заменить схемой выбранного провайдера.
const Body = z.object({
  items: z.array(
    z.object({
      marketplace: z.enum(["kaspi", "wildberries", "ozon"]),
      external_id: z.string(),
      title: z.string(),
      sales_per_month: z.number().nullable(),
      period_start: z.iso.date().optional(),
      period_end: z.iso.date().optional(),
    }),
  ),
});

export const analytics = defineAdapter({
  sourceId: "analytics",
  tokenEnv: "ANALYTICS_API_KEY",
  rawSchema: Body,
  mock: () => ({
    items: [{ marketplace: "kaspi" as const, external_id: "mock-1", title: "Синтетический товар 1", sales_per_month: 10 }],
  }),
  // Нет продаж от провайдера значит нет записи спроса (no_data), прокси не строим.
  toRecords: (body, ctx) =>
    body.items.map((i) =>
      i.sales_per_month == null
        ? { reject: "провайдер не отдал продажи", item: i }
        : {
            type: "demand" as const,
            sourceId: "analytics",
            listingSourceId: i.marketplace,
            externalId: i.external_id,
            title: i.title,
            salesPerMonth: i.sales_per_month,
            ...(i.period_start ? { periodStart: i.period_start } : {}),
            ...(i.period_end ? { periodEnd: i.period_end } : {}),
            method: "provider" as const,
            ...ctx,
          },
    ),
});
