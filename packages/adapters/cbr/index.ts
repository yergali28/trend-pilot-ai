import { readFile } from "node:fs/promises";
import { z } from "zod";
import { AdapterError, defaultFixturesDir, type Mode } from "../core";
import { requestJson } from "../core/http";

// Курсы ЦБ РФ на день. Официальный адрес https://www.cbr.ru/scripts/XML_daily.asp из нашей среды недоступен
// (обрыв по таймауту, 22.10.2026), поэтому берём зеркало cbr-xml-daily.ru, которое публикует те же курсы ЦБ в JSON.
// В справочнике источником указано зеркало, а не ЦБ.

export const CBR_DAILY_URL = "https://www.cbr-xml-daily.ru/daily_json.js";

const Valute = z.object({ CharCode: z.string().length(3), Nominal: z.number().positive(), Value: z.number().positive() });
export const CbrDaily = z.object({ Date: z.string(), Valute: z.record(z.string(), Valute) });
export type CbrDaily = z.infer<typeof CbrDaily>;

export interface CbrSnapshot {
  fetchedAt: string;
  synthetic: boolean;
  body: CbrDaily;
}

/** Курсы ЦБ: live из зеркала или replay из fixtures/cbr/daily.json. */
export async function fetchCbrRates(opts: { mode: Exclude<Mode, "mock">; fixturesDir?: string }): Promise<CbrSnapshot> {
  if (opts.mode === "replay") {
    const file = `${opts.fixturesDir ?? defaultFixturesDir}/cbr/daily.json`;
    const text = await readFile(file, "utf8").catch(() => {
      throw new AdapterError("fixture_not_found", `Нет записанного ответа: ${file}`);
    });
    const fx = JSON.parse(text) as { recordedAt: string; synthetic: boolean; body: unknown };
    const body = CbrDaily.safeParse(fx.body);
    if (!body.success) throw new AdapterError("contract_violation", `cbr: запись не совпала со схемой: ${body.error.message}`);
    return { fetchedAt: fx.recordedAt, synthetic: fx.synthetic, body: body.data };
  }
  const fetchedAt = new Date().toISOString();
  const body = CbrDaily.safeParse(await requestJson<unknown>(CBR_DAILY_URL, {}, { key: "cbr", minIntervalMs: 1_000 }));
  if (!body.success) throw new AdapterError("contract_violation", `cbr: ответ не совпал со схемой: ${body.error.message}`);
  return { fetchedAt, synthetic: false, body: body.data };
}
