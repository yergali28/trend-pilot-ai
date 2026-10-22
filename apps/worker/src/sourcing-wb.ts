import { readFile } from "node:fs/promises";
import { apifyProvider, defaultFixturesDir } from "@tp/adapters";
import { localSupabase } from "@tp/db";
import pg from "pg";

// Подбор закупки для реальных товаров WB: поиск аналогов на 1688 через Apify по запросу из fixtures/sourcing/wb-queries.json.
// Для каждого товара: сырой ответ в raw_responses, выбранное предложение 1688 — товар закупки (products/offers),
// связь с карточкой WB — matches со статусом needs_review (аналог по запросу, не тот же товар).
// `pnpm --filter @tp/worker sourcing:wb [--limit N]`. Платно: каждый запрос — запуск актора Apify.

const RESULTS = 10;
const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const { items } = JSON.parse(await readFile(`${defaultFixturesDir}/sourcing/wb-queries.json`, "utf8")) as { items: { nmId: string; query: string }[] };
const provider = apifyProvider(process.env);
const db = new pg.Pool({ connectionString: process.env.INGEST_DB_URL ?? localSupabase().dbUrl });

/**
 * Выбор предложения: самое дешёвое среди выдачи без «копеечных» позиций (дешевле четверти медианы выдачи —
 * обычно запчасти, образцы или другой товар). ponytail: эвристика по цене; сверка по фото — после image-search.
 */
const pick = <T extends { priceCny: number }>(offers: T[]) => {
  const prices = offers.map((o) => o.priceCny).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)] ?? 0;
  return offers.filter((o) => o.priceCny >= median / 4).sort((a, b) => a.priceCny - b.priceCny)[0];
};

let done = 0;
try {
  for (const it of items.slice(0, limit)) {
    const wb = (await db.query<{ id: string; category_id: string | null; dimensions_cm: unknown; title: string }>(
      "select id, category_id, dimensions_cm, title from public.products where source_id = 'wildberries' and external_id = $1",
      [it.nmId],
    )).rows[0];
    if (!wb) {
      console.log(`${it.nmId}: нет карточки WB в базе, пропуск`);
      continue;
    }
    const run = (await db.query<{ id: string }>("insert into public.adapter_runs (source_id, mode) values ('1688', 'live') returning id")).rows[0]!.id;
    try {
      const offers = await provider.search("1688", it.query, { pageSize: RESULTS });
      const fetchedAt = new Date().toISOString();
      const raw = (await db.query<{ id: string }>(
        "insert into public.raw_responses (source_id, adapter_run_id, mode, request, body, fetched_at, synthetic) values ('1688', $1, 'live', $2, $3, $4, false) returning id",
        [run, { query: it.query, wbNmId: it.nmId, provider: "apify" }, JSON.stringify(offers.map((o) => o.raw)), fetchedAt],
      )).rows[0]!.id;
      const best = pick(offers);
      if (!best) {
        await db.query("update public.adapter_runs set status = 'succeeded', finished_at = now(), records_ok = 0, records_rejected = $2 where id = $1", [run, offers.length]);
        console.log(`${it.nmId}: на 1688 ничего подходящего (${offers.length} в выдаче)`);
        continue;
      }
      const client = await db.connect();
      try {
        await client.query("begin");
        // Габариты упаковки берём у карточки WB: у 1688 в поиске их нет; вес считает расчёт как объёмный (оценка).
        const src = (await client.query<{ id: string }>(
          `insert into public.products (source_id, kind, external_id, title, url, image_url, category_id, dimensions_cm, synthetic)
           values ('1688', 'source', $1, $2, $3, $4, $5, $6, false)
           on conflict (source_id, external_id) do update set title = excluded.title, url = excluded.url, image_url = excluded.image_url,
             category_id = coalesce(products.category_id, excluded.category_id), dimensions_cm = coalesce(excluded.dimensions_cm, products.dimensions_cm)
           returning id`,
          [best.itemId, best.titleCn, best.url, best.imageUrl, wb.category_id, wb.dimensions_cm],
        )).rows[0]!.id;
        await client.query(
          "insert into public.offers (product_id, source_id, raw_response_id, method, price, currency, seller_id, moq, fetched_at, synthetic) values ($1, '1688', $2, 'provider', $3, 'CNY', $4, $5, $6, false)",
          [src, raw, best.priceCny, best.supplierId, best.minOrderQty, fetchedAt],
        );
        await client.query("insert into public.price_history (product_id, source_id, raw_response_id, price, currency, fetched_at, synthetic) values ($1, '1688', $2, $3, 'CNY', $4, false)", [src, raw, best.priceCny, fetchedAt]);
        await client.query(
          `insert into public.matches (source_product_id, listing_product_id, confidence, status, synthetic) values ($1, $2, 0.5, 'needs_review', false)
           on conflict (source_product_id, listing_product_id) do nothing`,
          [src, wb.id],
        );
        await client.query("update public.adapter_runs set status = 'succeeded', finished_at = now(), records_ok = 1, records_rejected = $2 where id = $1", [run, offers.length - 1]);
        await client.query("update public.data_sources set last_success_at = now(), updated_at = now() where id = '1688'");
        await client.query("commit");
      } catch (e) {
        await client.query("rollback");
        throw e;
      } finally {
        client.release();
      }
      done++;
      console.log(`${it.nmId}: ${wb.title.slice(0, 40)} → ¥${best.priceCny} «${best.titleCn.slice(0, 30)}» (${offers.length} в выдаче)`);
    } catch (e) {
      await db.query("update public.adapter_runs set status = 'failed', finished_at = now(), error = $2 where id = $1", [run, (e as Error).message]);
      console.log(`${it.nmId}: ошибка ${(e as Error).name}: ${(e as Error).message.slice(0, 120)}`);
    }
  }
} finally {
  await db.end();
}
console.log(`сопоставлено: ${done}`);
