import { localSupabase } from "@tp/db";
import pg from "pg";
import { ingest } from "./ingest";

// Разовый ингест одного источника: `pnpm --filter @tp/worker ingest:once <источник> <запрос> [--live]`.
// База — INGEST_DB_URL (например, staging), иначе локальная. Токен источника берётся из .env.local и не выводится.
const args = process.argv.slice(2);
const [sourceId = "", query = "catalog"] = args.filter((a) => !a.startsWith("--"));
const live = args.includes("--live");
const dbUrl = process.env.INGEST_DB_URL ?? localSupabase().dbUrl;
const target = process.env.INGEST_DB_URL ? new URL(dbUrl).host : "local";

const db = new pg.Pool({ connectionString: dbUrl });
try {
  const r = await ingest(db, { sourceId, request: { query }, ...(live ? { mode: "live" as const } : {}) });
  const raw = await db.query<{ source_id: string; mode: string; synthetic: boolean; fetched_at: Date; bytes: number }>(
    "select source_id, mode, synthetic, fetched_at, length(body::text) as bytes from public.raw_responses where id = $1",
    [r.rawResponseId],
  );
  const run = await db.query<{ status: string }>("select status from public.adapter_runs where id = $1", [r.runId]);
  console.log(JSON.stringify({ target, run: run.rows[0]?.status, raw: raw.rows[0], recordsOk: r.recordsOk, recordsRejected: r.recordsRejected }, null, 2));
} finally {
  await db.end();
}
