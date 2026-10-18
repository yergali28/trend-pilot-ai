import { PgBoss } from "pg-boss";
import pg from "pg";
import { ingest, type IngestJob } from "./ingest";

export { ingest, type IngestJob } from "./ingest";

export const INGEST_QUEUE = "ingest";

/** Очередь pg-boss на той же базе: ретраи с экспоненциальной паузой (лимиты и 429 источников). */
export async function startWorker(dbUrl: string, opts: { fixturesDir?: string } = {}) {
  const pool = new pg.Pool({ connectionString: dbUrl });
  const boss = new PgBoss(dbUrl);
  boss.on("error", (e) => console.error("pg-boss:", e.message));
  await boss.start();
  // ponytail: 5 повторов с backoff выбраны без данных о лимитах источников; уточнить после регистрации.
  await boss.createQueue(INGEST_QUEUE, { retryLimit: 5, retryBackoff: true });
  await boss.work<IngestJob>(INGEST_QUEUE, async ([job]) => ingest(pool, job!.data, opts.fixturesDir));
  return {
    boss,
    async stop() {
      await boss.stop({ graceful: true });
      await pool.end();
    },
  };
}
