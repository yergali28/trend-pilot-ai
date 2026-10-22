import { readFile } from "node:fs/promises";
import { defaultFixturesDir } from "@tp/adapters";
import { localSupabase } from "@tp/db";
import pg from "pg";
import { ingest } from "./ingest";

// Загрузка демо-каталога в локальную базу: ингест записанных ответов (replay) и синтетические категории/сопоставления.
// Всё помечается synthetic = true; справочники не трогаются.

interface DemoCatalog {
  synthetic: true;
  categories: { id: string; name: string }[];
  productCategories: { source: [string, string]; category: string }[];
  matches: { source: [string, string]; listing: [string, string]; confidence: number }[];
}

export async function loadDemo(dbUrl: string, mode: "replay" | "mock" = "replay") {
  const db = new pg.Pool({ connectionString: dbUrl });
  try {
    const sources = await db.query<{ id: string }>("select id from public.data_sources where status = 'active' and mode in ('replay', 'mock') order by role desc, id");
    const runs = [];
    for (const { id } of sources.rows) {
      try {
        runs.push({ source: id, ...(await ingest(db, { sourceId: id, request: { query: "catalog" }, mode })) });
      } catch (e) {
        // У источника нет демо-каталога (например, есть только живая запись): пропускаем, а не придумываем данные.
        if ((e as { code?: string }).code !== "fixture_not_found") throw e;
      }
    }

    const catalog = JSON.parse(await readFile(`${defaultFixturesDir}/demo/catalog.json`, "utf8")) as DemoCatalog;
    if (catalog.synthetic !== true) throw new Error("Демо-каталог должен быть помечен synthetic: true");

    const categoryIds = new Map<string, string>();
    for (const c of catalog.categories) {
      const existing = await db.query<{ id: string }>("select id from public.categories where external_id = $1 and marketplace_id is null", [`demo:${c.id}`]);
      const id =
        existing.rows[0]?.id ??
        (await db.query<{ id: string }>("insert into public.categories (name, external_id, synthetic) values ($1, $2, true) returning id", [c.name, `demo:${c.id}`])).rows[0]!.id;
      categoryIds.set(c.id, id);
    }

    const productId = async ([sourceId, externalId]: [string, string]) =>
      (await db.query<{ id: string }>("select id from public.products where source_id = $1 and external_id = $2", [sourceId, externalId])).rows[0]?.id;

    for (const pc of catalog.productCategories) {
      const id = await productId(pc.source);
      if (id) await db.query("update public.products set category_id = $2 where id = $1", [id, categoryIds.get(pc.category)]);
    }

    let matches = 0;
    for (const m of catalog.matches) {
      const [s, l] = [await productId(m.source), await productId(m.listing)];
      if (!s || !l) continue;
      const r = await db.query(
        `insert into public.matches (source_product_id, listing_product_id, confidence, status, synthetic)
         values ($1, $2, $3, 'auto', true) on conflict (source_product_id, listing_product_id) do nothing`,
        [s, l, m.confidence],
      );
      matches += r.rowCount ?? 0;
    }
    return { runs, categories: categoryIds.size, matches };
  } finally {
    await db.end();
  }
}

if (process.argv[1]?.endsWith("demo-load.ts")) {
  const result = await loadDemo(localSupabase().dbUrl, process.argv.includes("--mock") ? "mock" : "replay");
  for (const r of result.runs) console.log(`${r.source}: записей ${r.recordsOk}, отклонено ${r.recordsRejected}`);
  console.log(`категорий ${result.categories}, новых сопоставлений ${result.matches}`);
}
