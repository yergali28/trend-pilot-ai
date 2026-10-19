import { COMMISSION_URL, BOX_URL, fetchWbTariffs } from "@tp/adapters";
import { localSupabase } from "@tp/db";
import pg from "pg";

// Загрузка справочников Wildberries (комиссии → fee_rules, тарифы коробов → logistics_rates) только реальными
// значениями ответа WB. Пустое, «-» или отсутствующее значение строки не получает; ничего не усредняется.
// `pnpm --filter @tp/worker refs:load [--live]`: по умолчанию replay из fixtures/wildberries/tariffs.json.

const COMMISSION_SCHEMES = {
  paidStorageKgvp: "FBW",
  kgvpMarketplace: "FBS",
  kgvpSupplier: "DBS/DBW",
  kgvpSupplierExpress: "EDBS",
  kgvpPickup: "C&C",
  kgvpBooking: "booking",
} as const;

const BOX_RATES = [
  ["boxDeliveryBase", "FBO", "delivery", "first_liter", "boxDeliveryCoefExpr"],
  ["boxDeliveryLiter", "FBO", "delivery", "extra_liter", "boxDeliveryCoefExpr"],
  ["boxDeliveryMarketplaceBase", "FBS", "delivery", "first_liter", "boxDeliveryMarketplaceCoefExpr"],
  ["boxDeliveryMarketplaceLiter", "FBS", "delivery", "extra_liter", "boxDeliveryMarketplaceCoefExpr"],
  ["boxStorageBase", "FBO", "storage_day", "first_liter", "boxStorageCoefExpr"],
  ["boxStorageLiter", "FBO", "storage_day", "extra_liter", "boxStorageCoefExpr"],
] as const;

/** «11,2» → 11.2; «-», пусто и мусор → null (нет тарифа). */
export const wbNumber = (v: string | undefined) => {
  if (!v || !/^\d+([.,]\d+)?$/.test(v.trim())) return null;
  return Number(v.trim().replace(",", "."));
};

/** geoName по документации: страна, для РФ — округ. «Россия» и округа → RU; группы стран (СНГ) — страна неизвестна. */
export const wbCountry = (geo: string | undefined) => (geo === "Россия" || /федеральный округ$/i.test(geo ?? "") ? "RU" : null);

export async function loadWbReferences(dbUrl: string, live: boolean) {
  const snap = await fetchWbTariffs({ mode: live ? "live" : "replay" });
  if (snap.synthetic) throw new Error("В справочники попадают только реальные ответы (synthetic: false)");
  const fetchedAt = snap.fetchedAt;
  const asOf = fetchedAt.slice(0, 10);
  const data = snap.body.box.response.data;
  const db = new pg.Pool({ connectionString: dbUrl });
  const client = await db.connect();
  try {
    await client.query("begin");
    // Снимок заменяет предыдущий снимок из того же метода WB.
    await client.query("delete from public.fee_rules where marketplace_id = 'wildberries' and source_url = $1", [COMMISSION_URL]);
    await client.query("delete from public.logistics_rates where marketplace_id = 'wildberries' and source_url = $1", [BOX_URL]);

    let fees = 0;
    for (const r of snap.body.commission.report) {
      for (const [field, scheme] of Object.entries(COMMISSION_SCHEMES)) {
        const value = r[field as keyof typeof COMMISSION_SCHEMES];
        if (value === undefined || value === null) continue;
        await client.query(
          `insert into public.fee_rules (marketplace_id, country, fee_type, rate, valid_from, source_url, fetched_at, status,
             scheme, external_category_id, external_category_name, external_parent_name)
           values ('wildberries', null, 'commission', $1, $2, $3, $4, 'verified', $5, $6, $7, $8)`,
          [value / 100, asOf, COMMISSION_URL, fetchedAt, scheme, String(r.subjectID), r.subjectName, r.parentName],
        );
        fees++;
      }
    }

    let rates = 0;
    const currency = data.currency ?? "RUB"; // суммы в спецификации описаны в ₽
    for (const w of data.warehouseList) {
      for (const [field, scheme, type, unit, coef] of BOX_RATES) {
        const amount = wbNumber(w[field]);
        if (amount === null) continue;
        await client.query(
          `insert into public.logistics_rates (marketplace_id, country, scheme, rate_type, size_rule, amount, currency, valid_from, valid_to, source_url, fetched_at, status)
           values ('wildberries', $1, $2, $3, $4, $5, $6, $7, null, $8, $9, 'verified')`,
          [wbCountry(w.geoName), scheme, type, JSON.stringify({ warehouse: w.warehouseName, geoName: w.geoName ?? null, unit, coefficientPct: wbNumber(w[coef]) }), amount, currency, snap.body.boxDate, BOX_URL, fetchedAt],
        );
        rates++;
      }
    }
    await client.query("commit");
    return { fees, rates, subjects: snap.body.commission.report.length, warehouses: data.warehouseList.length, fetchedAt };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
    await db.end();
  }
}

if (process.argv[1]?.endsWith("refs-load.ts")) {
  const r = await loadWbReferences(process.env.INGEST_DB_URL ?? localSupabase().dbUrl, process.argv.includes("--live"));
  console.log(`fee_rules: ${r.fees} строк (${r.subjects} предметов); logistics_rates: ${r.rates} строк (${r.warehouses} складов); получено ${r.fetchedAt}`);
}
