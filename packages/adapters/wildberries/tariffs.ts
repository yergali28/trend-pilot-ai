import { readFile } from "node:fs/promises";
import { z } from "zod";
import { AdapterError, defaultFixturesDir, type Mode } from "../core";
import { requestJson } from "../core/http";

// Тарифы WB (раздел «Тарифы», common-api, токен любой категории): комиссии по предметам и тарифы логистики коробов.
// Схемы сверены с официальной спецификацией 10-tariffs.yaml и с реальным ответом (docs/sources/wildberries.md).

const pct = z.number().nonnegative();
export const CommissionResponse = z.object({
  report: z.array(
    z.object({
      parentID: z.number().int(),
      parentName: z.string(),
      subjectID: z.number().int(),
      subjectName: z.string(),
      kgvpBooking: pct.optional(),
      kgvpMarketplace: pct.optional(),
      kgvpPickup: pct.optional(),
      kgvpSupplier: pct.optional(),
      kgvpSupplierExpress: pct.optional(),
      paidStorageKgvp: pct.optional(),
    }),
  ),
});

// Суммы в ответе — строки с запятой («11,2») или «-», если тарифа нет.
const money = z.string().optional();
export const BoxTariffsResponse = z.object({
  response: z.object({
    data: z.object({
      // Есть в реальном ответе и в английской спецификации; в русской суммы описаны в ₽.
      currency: z.string().optional(),
      dtNextBox: z.string().optional(),
      dtTillMax: z.string().optional(),
      warehouseList: z.array(
        z.object({
          warehouseName: z.string(),
          geoName: z.string().optional(),
          boxDeliveryBase: money,
          boxDeliveryLiter: money,
          boxDeliveryCoefExpr: money,
          boxDeliveryMarketplaceBase: money,
          boxDeliveryMarketplaceLiter: money,
          boxDeliveryMarketplaceCoefExpr: money,
          boxStorageBase: money,
          boxStorageLiter: money,
          boxStorageCoefExpr: money,
        }),
      ),
    }),
  }),
});

export const TariffsBody = z.object({ commission: CommissionResponse, box: BoxTariffsResponse, boxDate: z.iso.date() });
export type TariffsBody = z.infer<typeof TariffsBody>;

export const COMMISSION_URL = "https://common-api.wildberries.ru/api/v1/tariffs/commission";
export const BOX_URL = "https://common-api.wildberries.ru/api/v1/tariffs/box";

export interface TariffsSnapshot {
  fetchedAt: string;
  synthetic: boolean;
  body: TariffsBody;
}

/** Комиссии и тарифы логистики WB: live по документации или replay из fixtures/wildberries/tariffs.json. */
export async function fetchWbTariffs(opts: { mode: Exclude<Mode, "mock">; env?: Record<string, string | undefined>; date?: string; fixturesDir?: string }): Promise<TariffsSnapshot> {
  if (opts.mode === "replay") {
    const file = `${opts.fixturesDir ?? defaultFixturesDir}/wildberries/tariffs.json`;
    const text = await readFile(file, "utf8").catch(() => {
      throw new AdapterError("fixture_not_found", `Нет записанного ответа: ${file}`);
    });
    const fx = JSON.parse(text) as { recordedAt: string; synthetic: boolean; body: unknown };
    const body = TariffsBody.safeParse(fx.body);
    if (!body.success) throw new AdapterError("contract_violation", `wildberries tariffs: запись не совпала со схемой: ${body.error.message}`);
    return { fetchedAt: fx.recordedAt, synthetic: fx.synthetic, body: body.data };
  }
  const token = (opts.env ?? process.env).WB_API_TOKEN;
  if (!token) throw new AdapterError("token_not_configured", "Токен не настроен: WB_API_TOKEN (wildberries)");
  const headers = { Authorization: token };
  const boxDate = opts.date ?? new Date().toISOString().slice(0, 10);
  const fetchedAt = new Date().toISOString();
  // Комиссии: 1 запрос/мин, всплеск 2; коробы: 60 запросов/мин, интервал 1 с (персональный токен).
  const commission = await requestJson<unknown>(`${COMMISSION_URL}?locale=ru`, { headers }, { key: "wb:tariffs:commission", minIntervalMs: 60_000 });
  const box = await requestJson<unknown>(`${BOX_URL}?date=${boxDate}`, { headers }, { key: "wb:tariffs:box", minIntervalMs: 1_000 });
  const body = TariffsBody.safeParse({ commission, box, boxDate });
  if (!body.success) throw new AdapterError("contract_violation", `wildberries tariffs: ответ не совпал со схемой: ${body.error.message}`);
  return { fetchedAt, synthetic: false, body: body.data };
}
