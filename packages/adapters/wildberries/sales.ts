import { z } from "zod";
import { defineAdapter } from "../core";
import { requestJson } from "../core/http";

// Статистика своего магазина WB (раздел «Основные отчёты», statistics-api, категория токена «Статистика»):
// заказы GET /api/v1/supplier/orders и продажи/возвраты GET /api/v1/supplier/sales (docs/sources/wildberries.md).
// Даты в ответе — московское время без зоны. Данные обновляются раз в 30 минут и хранятся 90 дней.

// Схемы — белый список: номер заказа (srid, gNumber), стикер, регион покупателя и прочее отбрасываются при разборе
// и не попадают ни в raw_responses, ни в записи.
const Row = {
  date: z.string().min(10),
  nmId: z.number().int(),
  supplierArticle: z.string().optional(),
  subject: z.string().optional(),
  countryName: z.string().optional(),
  warehouseName: z.string().optional(),
  priceWithDisc: z.number().optional(),
  finishedPrice: z.number().optional(),
};
const Order = z.object({ ...Row, isCancel: z.boolean().optional() });
// saleID: «S…» — продажа, «R…» — возврат.
const Sale = z.object({ ...Row, saleID: z.string(), forPay: z.number().optional() });

const Body = z.object({ periodStart: z.iso.date(), periodEnd: z.iso.date(), orders: z.array(Order), sales: z.array(Sale) });

export const WB_ORDERS_URL = "https://statistics-api.wildberries.ru/api/v1/supplier/orders";
export const WB_SALES_URL = "https://statistics-api.wildberries.ru/api/v1/supplier/sales";
const DAYS = 30;

/** Дата по Москве (UTC+3), в которой WB отдаёт и фильтрует отчёты. */
const moscowDate = (t: number) => new Date(t + 3 * 3_600_000).toISOString().slice(0, 10);

export const wildberriesSales = defineAdapter({
  sourceId: "wildberries-sales",
  tokenEnv: "WB_API_TOKEN",
  rawSchema: Body,

  // ponytail: один запрос на отчёт (до 80 000 строк); догрузка по lastChangeDate — когда строк станет больше.
  async live(_req, token) {
    const now = Date.now();
    const periodStart = moscowDate(now - DAYS * 86_400_000);
    const opts = { headers: { Authorization: token } };
    // Персональный токен: 1 запрос/мин на продавца для каждого отчёта.
    const orders = await requestJson<unknown[]>(`${WB_ORDERS_URL}?dateFrom=${periodStart}`, opts, { key: "wb:stats", minIntervalMs: 60_000 });
    const sales = await requestJson<unknown[]>(`${WB_SALES_URL}?dateFrom=${periodStart}`, opts, { key: "wb:stats", minIntervalMs: 60_000 });
    return Body.parse({ periodStart, periodEnd: moscowDate(now), orders, sales });
  },

  mock: () => ({
    periodStart: "2026-09-18",
    periodEnd: "2026-10-18",
    orders: [{ date: "2026-10-01T10:00:00", nmId: 1, subject: "Органайзеры", supplierArticle: "syn-1", isCancel: false }],
    sales: [
      { date: "2026-10-02T10:00:00", nmId: 1, subject: "Органайзеры", supplierArticle: "syn-1", saleID: "S1" },
      { date: "2026-10-03T10:00:00", nmId: 2, saleID: "S2" },
    ],
  }),

  // Спрос — выкупы минус возвраты за период по товару (nmId). Строки с датой раньше периода (отчёт фильтрует по
  // дате изменения) не считаются. Без предмета и артикула товару нечего показать вместо названия — отклоняется.
  toRecords: (body, ctx) => {
    const byNm = new Map<number, { net: number; row: z.infer<typeof Sale> }>();
    for (const s of body.sales) {
      if (s.date.slice(0, 10) < body.periodStart) continue;
      const cur = byNm.get(s.nmId) ?? { net: 0, row: s };
      cur.net += s.saleID.startsWith("R") ? -1 : s.saleID.startsWith("S") ? 1 : 0;
      byNm.set(s.nmId, cur);
    }
    return [...byNm].map(([nmId, { net, row }]) => {
      const title = [row.subject, row.supplierArticle && `арт. ${row.supplierArticle}`].filter(Boolean).join(", ");
      if (!title) return { reject: "нет предмета и артикула", item: row };
      return {
        type: "demand" as const,
        sourceId: "wildberries-sales",
        listingSourceId: "wildberries",
        externalId: String(nmId),
        title,
        salesPerMonth: Math.max(net, 0),
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        method: "api" as const,
        ...ctx,
      };
    });
  },
});
