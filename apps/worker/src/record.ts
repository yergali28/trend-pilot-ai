import { writeFile } from "node:fs/promises";
import { adapters, defaultFixturesDir, fetchWbTariffs } from "@tp/adapters";

// Запись живого ответа источника в fixtures/<источник>/<имя>.json для режима replay.
// Токен берётся из apps/worker/.env.local и никуда не выводится. В запись попадают только поля из белого списка.

type Json = Record<string, unknown>;
const LIMIT = 20;

/** Белый список полей по источникам: персональные и служебные данные продавца в запись не попадают. */
const sanitizers: Record<string, (body: Json) => Json> = {
  wildberries: (body) => {
    const cards = (body.cards as Json[]).slice(0, LIMIT).map((c) => ({
      nmID: c.nmID,
      title: c.title,
      subjectID: c.subjectID,
      subjectName: c.subjectName,
      dimensions: { weightBrutto: (c.dimensions as Json | undefined)?.weightBrutto },
    }));
    const ids = new Set(cards.map((c) => c.nmID));
    const goods = (body.goods as Json[])
      .filter((g) => ids.has(g.nmID))
      .map((g) => ({
        nmID: g.nmID,
        currencyIsoCode4217: g.currencyIsoCode4217,
        sizes: ((g.sizes as Json[]) ?? []).map((s) => ({ price: s.price, discountedPrice: s.discountedPrice })),
      }));
    return { cards, goods };
  },
  // MPSTATS: публичные карточки рынка (название, бренд, продавец-юрлицо, цены, продажи); первые 100 товаров как есть.
  mpstats: (body) => body,
  // Личные поля заказов (srid, gNumber, стикер, регион покупателя) отбрасывает уже схема адаптера.
  "wildberries-sales": (body) => ({ ...body, orders: (body.orders as Json[]).slice(0, LIMIT), sales: (body.sales as Json[]).slice(0, LIMIT) }),
};

const [sourceId = "", name = "seller"] = process.argv.slice(2);

// Тарифы WB — справочные данные (комиссии, логистика), без персональных данных; схема уже отбрасывает лишние поля.
if (sourceId === "wildberries" && name === "tariffs") {
  const snap = await fetchWbTariffs({ mode: "live" });
  const file = `${defaultFixturesDir}/wildberries/tariffs.json`;
  const fixture = { recordedAt: snap.fetchedAt, synthetic: false, note: "Живой ответ WB API «Тарифы» (комиссии и тарифы коробов), записан командой record.", body: snap.body };
  await writeFile(file, `${JSON.stringify(fixture, null, 2)}\n`);
  const wh = snap.body.box.response.data.warehouseList;
  console.log(`записано: fixtures/wildberries/tariffs.json; предметов с комиссиями ${snap.body.commission.report.length}, складов ${wh.length}, тариф на ${snap.body.boxDate}`);
  process.exit(0);
}
const adapter = adapters[sourceId];
const sanitize = sanitizers[sourceId];
if (!adapter || !sanitize) throw new Error(`Запись не настроена для источника: ${sourceId || "(не указан)"}`);
if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Недопустимое имя записи: ${name}`);

const raw = await adapter.fetch({ query: name }, { mode: "live" });
const body = sanitize(raw.body as Json);
const fixture = {
  recordedAt: raw.fetchedAt,
  synthetic: false,
  note: "Живой ответ источника (только чтение), записан командой record. Оставлены только поля из белого списка, не больше 20 позиций.",
  body,
};
const file = `${defaultFixturesDir}/${sourceId}/${name}.json`;
await writeFile(file, `${JSON.stringify(fixture, null, 2)}\n`);
const { records, rejected } = adapter.normalize({ ...raw, body });
console.log(`записано: ${file.replace(/^.*\/fixtures\//, "fixtures/")}; позиций ${((body.goods ?? body.sales) as unknown[] | undefined)?.length ?? 0}, записей ${records.length}, отклонено ${rejected.length}`);
