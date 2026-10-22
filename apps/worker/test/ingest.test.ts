import { localSupabase } from "@tp/db";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { INGEST_QUEUE, startWorker } from "../src";

const { dbUrl } = localSupabase();
let worker: Awaited<ReturnType<typeof startWorker>>;
const db = new pg.Pool({ connectionString: dbUrl });

beforeAll(async () => {
  worker = await startWorker(dbUrl);
});

afterAll(async () => {
  await worker?.stop();
  await db.end();
});

async function runJob(sourceId: string) {
  const id = await worker.boss.send(INGEST_QUEUE, { sourceId, request: { query: "demo" } });
  for (let i = 0; i < 100; i++) {
    const job = await worker.boss.getJobById<unknown>(INGEST_QUEUE, id!);
    if (job?.state === "completed") return job.output as { runId: string; rawResponseId: string; recordsOk: number; recordsRejected: number };
    if (job?.state === "failed") throw new Error(`job failed: ${JSON.stringify(job.output)}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("job did not complete");
}

describe("ingest worker (pg-boss, replay)", () => {
  it("stores raw response, then normalized offers with source and time", async () => {
    const before = new Date();
    const out = await runJob("kaspi");
    expect(out).toMatchObject({ recordsOk: 1, recordsRejected: 1 });

    const raw = await db.query("select source_id, mode, synthetic, fetched_at, body from public.raw_responses where id = $1", [out.rawResponseId]);
    expect(raw.rows[0]).toMatchObject({ source_id: "kaspi", mode: "replay", synthetic: true });
    expect(raw.rows[0].fetched_at.toISOString()).toBe("2026-10-18T00:00:00.000Z");
    expect(raw.rows[0].body.data).toHaveLength(2); // сырой ответ целиком, включая отклонённую позицию

    const offers = await db.query(
      `select o.source_id, o.method, o.price, o.currency, o.fetched_at, o.synthetic, p.external_id
       from public.offers o join public.products p on p.id = o.product_id where o.raw_response_id = $1`,
      [out.rawResponseId],
    );
    expect(offers.rows).toEqual([
      { source_id: "kaspi", method: "api", price: "12000", currency: "KZT", fetched_at: new Date("2026-10-18T00:00:00Z"), synthetic: true, external_id: "syn-k-1" },
    ]);
    const history = await db.query("select 1 from public.price_history where raw_response_id = $1", [out.rawResponseId]);
    expect(history.rows).toHaveLength(1);

    const run = await db.query("select status, records_ok, records_rejected from public.adapter_runs where id = $1", [out.runId]);
    expect(run.rows[0]).toEqual({ status: "succeeded", records_ok: 1, records_rejected: 1 });
    const src = await db.query("select last_success_at from public.data_sources where id = 'kaspi'");
    expect(src.rows[0].last_success_at.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
  });

  it("stores demand from the analytics provider against the marketplace listing", async () => {
    const out = await runJob("analytics");
    const rows = await db.query(
      `select d.source_id, d.sales_per_month, d.synthetic, p.source_id as listing_source, p.external_id
       from public.demand_history d join public.products p on p.id = d.product_id where d.raw_response_id = $1`,
      [out.rawResponseId],
    );
    expect(rows.rows).toEqual([{ source_id: "analytics", sales_per_month: "40", synthetic: true, listing_source: "kaspi", external_id: "syn-k-1" }]);
  });

  it("stores own-shop WB sales as demand of the WB listing for the period", async () => {
    const out = await runJob("wildberries-sales");
    expect(out).toMatchObject({ recordsOk: 1, recordsRejected: 1 });
    const rows = await db.query(
      `select d.source_id, d.sales_per_month, d.period_start::text, d.period_end::text, p.source_id as listing_source, p.external_id
       from public.demand_history d join public.products p on p.id = d.product_id where d.raw_response_id = $1`,
      [out.rawResponseId],
    );
    expect(rows.rows).toEqual([
      { source_id: "wildberries-sales", sales_per_month: "1", period_start: "2026-09-18", period_end: "2026-10-18", listing_source: "wildberries", external_id: "101" },
    ]);
  });
});
