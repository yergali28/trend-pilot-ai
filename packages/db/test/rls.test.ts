import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createOrg, createUser, pgError, txClient } from "./helpers";

let tx: Awaited<ReturnType<typeof txClient>>;
let db: pg.Client;
let userA: string;
let userB: string;
let orgA: string;
let orgB: string;

// Все таблицы с данными клиента. Тест ниже падает, если появится таблица с org_id, которой нет в списке.
const writable = ["calculations", "saved_lists", "saved_items", "alerts", "user_connections"];
const readOnly = ["memberships", "subscriptions", "usage_counters"];
const serviceOnly = ["invitations"];
const orgTables = [...writable, ...readOnly, ...serviceOnly];

async function seedOrg(org: string, user: string) {
  await db.query("insert into public.memberships (org_id, user_id, role) values ($1, $2, 'owner')", [org, user]);
  await db.query("insert into public.subscriptions (org_id, plan_id, status) values ($1, 'test-plan', 'trial')", [org]);
  await db.query("insert into public.usage_counters (org_id, metric, period_start) values ($1, 'calculations', '2026-10-01')", [org]);
  await db.query(
    "insert into public.invitations (org_id, email, role, token_hash, expires_at) values ($1, 'x@test.local', 'member', md5(random()::text), now() + interval '1 day')",
    [org],
  );
  await db.query("insert into public.calculations (org_id, input, result, formula_version) values ($1, '{}', '{}', 'test')", [org]);
  const { rows } = await db.query<{ id: string }>("insert into public.saved_lists (org_id, name) values ($1, 'list') returning id", [org]);
  await db.query("insert into public.saved_items (org_id, list_id) values ($1, $2)", [org, rows[0]!.id]);
  await db.query("insert into public.alerts (org_id, channel, rule) values ($1, 'email', '{}')", [org]);
  await db.query(
    "insert into public.user_connections (org_id, user_id, marketplace_id, token_ciphertext) values ($1, $2, 'kaspi', '\\x00')",
    [org, user],
  );
}

beforeAll(async () => {
  tx = await txClient();
  db = tx.client;
  userA = await createUser(db, "a");
  userB = await createUser(db, "b");
  orgA = await createOrg(db, "Org A");
  orgB = await createOrg(db, "Org B");
  await db.query("insert into public.plans (id, name) values ('test-plan', 'test')");
  await seedOrg(orgA, userA);
  await seedOrg(orgB, userB);
});

afterAll(async () => {
  await tx?.close();
});

describe("RLS coverage", () => {
  it("every public table has RLS enabled", async () => {
    const { rows } = await db.query<{ relname: string }>(
      "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity",
    );
    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it("every table with org_id is covered by the isolation test", async () => {
    const { rows } = await db.query<{ table_name: string }>(
      "select table_name from information_schema.columns where table_schema = 'public' and column_name = 'org_id' order by 1",
    );
    expect(rows.map((r) => r.table_name).sort()).toEqual([...orgTables].sort());
  });
});

describe("organization isolation: user of org A vs data of org B", () => {
  it.each(orgTables)("%s: A sees only own org rows", async (table) => {
    const orgIds = await as(db, "authenticated", userA, async () => {
      const { rows } = await db.query<{ org_id: string }>(`select org_id from public.${table}`);
      return rows.map((r) => r.org_id);
    });
    expect(orgIds).not.toContain(orgB);
    if (serviceOnly.includes(table)) expect(orgIds).toEqual([]);
    else expect(orgIds.length).toBeGreaterThan(0);
  });

  it("organizations: A sees only org A", async () => {
    const ids = await as(db, "authenticated", userA, async () => (await db.query<{ id: string }>("select id from public.organizations")).rows.map((r) => r.id));
    expect(ids).toEqual([orgA]);
  });

  it.each(orgTables)("%s: A cannot update or delete org B rows", async (table) => {
    const counts = await as(db, "authenticated", userA, async () => {
      const upd = await db.query(`update public.${table} set org_id = org_id where org_id = $1`, [orgB]);
      const del = await db.query(`delete from public.${table} where org_id = $1`, [orgB]);
      return [upd.rowCount, del.rowCount];
    });
    expect(counts).toEqual([0, 0]);
  });

  // Вставка строки в организацию org от имени user (для записываемых таблиц).
  const insertInto = (table: string, org: string, user: string): [string, unknown[]] =>
    ({
      calculations: ["insert into public.calculations (org_id, input, result, formula_version) values ($1, '{}', '{}', 'x')", [org]],
      saved_lists: ["insert into public.saved_lists (org_id, name) values ($1, 'x')", [org]],
      // Список берётся из организации A: даже со своим списком нельзя положить строку в чужую org.
      saved_items: ["insert into public.saved_items (org_id, list_id) select $1, id from public.saved_lists limit 1", [org]],
      alerts: ["insert into public.alerts (org_id, channel, rule) values ($1, 'email', '{}')", [org]],
      user_connections: ["insert into public.user_connections (org_id, user_id, marketplace_id, token_ciphertext) values ($1, $2, 'kaspi', '\\x00')", [org, user]],
    })[table] as [string, unknown[]];

  it.each(writable)("%s: A cannot insert a row into org B", async (table) => {
    const [sql, params] = insertInto(table, orgB, userA);
    expect(await as(db, "authenticated", userA, () => pgError(db.query(sql, params)))).toBe("42501");
  });

  it.each(writable)("%s: A can insert into own org (policy is not deny-all)", async (table) => {
    const [sql, params] = insertInto(table, orgA, userA);
    expect(await as(db, "authenticated", userA, () => pgError(db.query(sql, params)))).toBeNull();
  });

  // Членство, подписки, счётчики и приглашения меняет только админ через сервис, даже в своей организации.
  it.each([...readOnly, ...serviceOnly])("%s: A cannot insert even into own org", async (table) => {
    const sql: Record<string, string> = {
      memberships: "insert into public.memberships (org_id, user_id, role) values ($1, $2, 'owner')",
      subscriptions: "insert into public.subscriptions (org_id, plan_id, status) select $1, 'test-plan', 'active' where $2::uuid is not null",
      usage_counters: "insert into public.usage_counters (org_id, metric, period_start) select $1, 'x', '2026-11-01' where $2::uuid is not null",
      invitations: "insert into public.invitations (org_id, email, role, token_hash, expires_at) select $1, 'y@test.local', 'owner', 'h', now() + interval '1 day' where $2::uuid is not null",
    };
    const code = await as(db, "authenticated", userA, () => pgError(db.query(sql[table]!, [orgA, userB])));
    expect(code).toBe("42501");
  });

  it("org B rows are intact after all attempts", async () => {
    for (const table of orgTables) {
      const { rows } = await db.query(`select 1 from public.${table} where org_id = $1`, [orgB]);
      expect(rows.length, table).toBeGreaterThan(0);
    }
  });

  it("anonymous user sees no client data", async () => {
    for (const table of [...orgTables, "organizations"]) {
      const n = await as(db, "anon", null, async () => (await db.query(`select 1 from public.${table}`)).rows.length);
      expect(n, table).toBe(0);
    }
  });
});
