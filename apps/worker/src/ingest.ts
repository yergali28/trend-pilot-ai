import { adapters, type FetchRequest, type Mode, type NormalizedRecord } from "@tp/adapters";
import type pg from "pg";

export interface IngestJob {
  sourceId: string;
  request: FetchRequest;
  /** Переопределение режима реестра для разового запуска (ingest:once, демо). */
  mode?: Mode;
}

export interface IngestResult {
  runId: string;
  rawResponseId: string;
  recordsOk: number;
  recordsRejected: number;
}

/**
 * Загрузка по конвейеру 5.8: сырой ответ сохраняется до нормализации (для аудита даже при сбое),
 * затем нормализованные записи с источником, временем и ссылкой на raw пишутся в одной транзакции.
 */
export async function ingest(db: pg.Pool, job: IngestJob, fixturesDir?: string): Promise<IngestResult> {
  const adapter = adapters[job.sourceId];
  if (!adapter) throw new Error(`Неизвестный источник: ${job.sourceId}`);

  const src = await db.query<{ mode: Mode; status: string }>("select mode, status from public.data_sources where id = $1", [job.sourceId]);
  const source = src.rows[0];
  if (!source) throw new Error(`Источник ${job.sourceId} не зарегистрирован в data_sources`);
  const mode: Mode = job.mode ?? source.mode;
  // Живые запросы только у включённых источников; replay и mock работают без регистрации (local).
  if (mode === "live" && source.status !== "active") {
    throw new Error(`Источник ${job.sourceId} не активен: ${source.status}`);
  }

  const run = await db.query<{ id: string }>(
    "insert into public.adapter_runs (source_id, mode) values ($1, $2) returning id",
    [job.sourceId, mode],
  );
  const runId = run.rows[0]!.id;

  try {
    const raw = await adapter.fetch(job.request, { mode, ...(fixturesDir ? { fixturesDir } : {}) });
    const saved = await db.query<{ id: string }>(
      "insert into public.raw_responses (source_id, adapter_run_id, mode, request, body, fetched_at, synthetic) values ($1, $2, $3, $4, $5, $6, $7) returning id",
      [raw.sourceId, runId, raw.mode, raw.request, JSON.stringify(raw.body), raw.fetchedAt, raw.synthetic],
    );
    const rawResponseId = saved.rows[0]!.id;
    const { records, rejected } = adapter.normalize(raw);

    const client = await db.connect();
    try {
      await client.query("begin");
      for (const r of records) await saveRecord(client, r, rawResponseId);
      await client.query(
        "update public.adapter_runs set status = 'succeeded', finished_at = now(), records_ok = $2, records_rejected = $3 where id = $1",
        [runId, records.length, rejected.length],
      );
      await client.query("update public.data_sources set last_success_at = now(), updated_at = now() where id = $1", [job.sourceId]);
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
    return { runId, rawResponseId, recordsOk: records.length, recordsRejected: rejected.length };
  } catch (e) {
    await db.query("update public.adapter_runs set status = 'failed', finished_at = now(), error = $2 where id = $1", [
      runId,
      (e as Error).message,
    ]);
    throw e;
  }
}

interface ProductFields {
  sourceId: string;
  kind: "source" | "listing";
  externalId: string;
  title: string;
  url?: string | undefined;
  weightKg?: number | undefined;
  synthetic: boolean;
  /** Не перезаписывать название: у записи спроса название условное (предмет и артикул), настоящее — в карточке. */
  keepTitle?: boolean;
}

async function upsertProduct(db: pg.PoolClient, p: ProductFields) {
  const { rows } = await db.query<{ id: string }>(
    `insert into public.products (source_id, kind, external_id, title, url, weight_kg, synthetic)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (source_id, external_id) do update set title = case when $8 then excluded.title else products.title end,
       url = coalesce(excluded.url, products.url), weight_kg = coalesce(excluded.weight_kg, products.weight_kg)
     returning id`,
    [p.sourceId, p.kind, p.externalId, p.title, p.url ?? null, p.weightKg ?? null, p.synthetic, !p.keepTitle],
  );
  return rows[0]!.id;
}

/** Ниша площадки (предмет WB) как категория с внешним id; повторная загрузка находит ту же строку. */
async function upsertCategory(db: pg.PoolClient, marketplaceId: string, c: { externalId: string; name: string }, synthetic: boolean) {
  const found = await db.query<{ id: string }>("select id from public.categories where marketplace_id = $1 and external_id = $2", [marketplaceId, c.externalId]);
  if (found.rows[0]) return found.rows[0].id;
  const created = await db.query<{ id: string }>(
    "insert into public.categories (name, marketplace_id, external_id, synthetic) values ($1, $2, $3, $4) returning id",
    [c.name, marketplaceId, c.externalId, synthetic],
  );
  return created.rows[0]!.id;
}

async function saveRecord(db: pg.PoolClient, r: NormalizedRecord, rawResponseId: string) {
  if (r.type === "offer") {
    const productId = await upsertProduct(db, r);
    await db.query(
      `insert into public.offers (product_id, source_id, raw_response_id, method, price, currency, seller_id, moq, fetched_at, synthetic)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [productId, r.sourceId, rawResponseId, r.method, r.price, r.currency, r.sellerId ?? null, r.moq ?? null, r.fetchedAt, r.synthetic],
    );
    await db.query(
      "insert into public.price_history (product_id, source_id, raw_response_id, price, currency, fetched_at, synthetic) values ($1, $2, $3, $4, $5, $6, $7)",
      [productId, r.sourceId, rawResponseId, r.price, r.currency, r.fetchedAt, r.synthetic],
    );
  } else if (r.type === "listing") {
    // Рыночная карточка от провайдера аналитики: товар площадки продажи, его ниша, цена, спрос и показатели периода.
    const categoryId = r.category ? await upsertCategory(db, r.listingSourceId, r.category, r.synthetic) : null;
    const productId = await upsertProduct(db, { ...r, sourceId: r.listingSourceId, kind: "listing" });
    await db.query(
      `update public.products set image_url = coalesce($2, image_url), brand = coalesce($3, brand), category_id = coalesce($4, category_id) where id = $1`,
      [productId, r.imageUrl ?? null, r.brand ?? null, categoryId],
    );
    if (r.price !== undefined) {
      await db.query(
        `insert into public.offers (product_id, source_id, raw_response_id, method, price, currency, fetched_at, synthetic) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [productId, r.sourceId, rawResponseId, r.method, r.price, r.currency, r.fetchedAt, r.synthetic],
      );
      await db.query(
        "insert into public.price_history (product_id, source_id, raw_response_id, price, currency, fetched_at, synthetic) values ($1, $2, $3, $4, $5, $6, $7)",
        [productId, r.sourceId, rawResponseId, r.price, r.currency, r.fetchedAt, r.synthetic],
      );
    }
    if (r.salesPerMonth !== undefined) {
      await db.query(
        `insert into public.demand_history (product_id, source_id, raw_response_id, sales_per_month, period_start, period_end, fetched_at, synthetic)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [productId, r.sourceId, rawResponseId, r.salesPerMonth, r.periodStart, r.periodEnd, r.fetchedAt, r.synthetic],
      );
    }
    await db.query(
      `insert into public.listing_stats (product_id, source_id, raw_response_id, period_start, period_end, price, currency, sales, revenue, rating, reviews, stock, seller, daily, fetched_at, synthetic)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [productId, r.sourceId, rawResponseId, r.periodStart, r.periodEnd, r.price ?? null, r.currency, r.salesPerMonth ?? null, r.revenue ?? null, r.rating ?? null, r.reviews ?? null, r.stock ?? null, r.seller ?? null, r.daily ? JSON.stringify(r.daily) : null, r.fetchedAt, r.synthetic],
    );
  } else {
    // Спрос относится к товару площадки продажи, источник значения — провайдер аналитики.
    const productId = await upsertProduct(db, { ...r, sourceId: r.listingSourceId, kind: "listing", keepTitle: true });
    await db.query(
      `insert into public.demand_history (product_id, source_id, raw_response_id, sales_per_month, period_start, period_end, fetched_at, synthetic)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [productId, r.sourceId, rawResponseId, r.salesPerMonth, r.periodStart ?? null, r.periodEnd ?? null, r.fetchedAt, r.synthetic],
    );
  }
}
