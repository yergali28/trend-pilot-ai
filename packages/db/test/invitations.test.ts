import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createOrg, createUser, pgError, txClient } from "./helpers";

let tx: Awaited<ReturnType<typeof txClient>>;
let db: pg.Client;
let admin: string;
let regular: string;
let org: string;

beforeAll(async () => {
  tx = await txClient();
  db = tx.client;
  admin = await createUser(db, "admin");
  regular = await createUser(db, "regular");
  org = await createOrg(db, "Invite Org");
  await db.query("insert into public.platform_admins (user_id) values ($1)", [admin]);
});

afterAll(async () => {
  await tx?.close();
});

// Приглашения создаются вне as(), чтобы пережить откат savepoint.
async function createAsAdmin(email: string, ttl = "1 hour") {
  await db.query("set local role authenticated");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: admin, role: "authenticated" })]);
  const { rows } = await db.query<{ token: string }>("select public.create_invitation($1, $2, 'member', $3::interval) as token", [org, email, ttl]);
  await db.query("reset role");
  return rows[0]!.token;
}

const consume = (token: string, user: string) =>
  as(db, "service_role", null, () => pgError(db.query("select public.consume_invitation($1, $2)", [token, user])));

describe("invitations at database level", () => {
  it("platform admin creates an invitation; only the hash is stored", async () => {
    const token = await createAsAdmin("new@test.local");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const { rows } = await db.query("select token_hash, created_by, expires_at > now() as valid from public.invitations where email = 'new@test.local'");
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);
    expect(rows[0]).toMatchObject({ created_by: admin, valid: true });
  });

  it("regular user and anonymous cannot create invitations", async () => {
    const sql = "select public.create_invitation($1, 'x@test.local', 'member', '1 hour')";
    expect(await as(db, "authenticated", regular, () => pgError(db.query(sql, [org])))).toBe("42501");
    expect(await as(db, "anon", null, () => pgError(db.query(sql, [org])))).toBe("42501");
  });

  it("non-positive ttl is rejected", async () => {
    await db.query("savepoint ttl");
    await expect(createAsAdmin("ttl@test.local", "0 seconds")).rejects.toMatchObject({ code: "22023" });
    await db.query("rollback to savepoint ttl");
  });
});

describe("one-time use and expiry", () => {
  let token: string;
  let invitee: string;

  beforeAll(async () => {
    token = await createAsAdmin("once@test.local");
    invitee = await createUser(db, "invitee");
  });

  it("peek returns the invitation without using it", async () => {
    const rows = await as(db, "service_role", null, async () => (await db.query("select * from public.peek_invitation($1)", [token])).rows);
    expect(rows).toEqual([{ org_id: org, email: "once@test.local", role: "member" }]);
  });

  it("authenticated users cannot call peek or consume", async () => {
    expect(await as(db, "authenticated", invitee, () => pgError(db.query("select public.peek_invitation($1)", [token])))).toBe("42501");
    expect(await as(db, "authenticated", invitee, () => pgError(db.query("select public.consume_invitation($1, $2)", [token, invitee])))).toBe("42501");
  });

  it("first use succeeds and creates membership, second use fails", async () => {
    await db.query("savepoint once");
    await db.query("set local role service_role");
    const first = await db.query<{ org: string }>("select public.consume_invitation($1, $2) as org", [token, invitee]);
    await db.query("reset role");
    expect(first.rows[0]!.org).toBe(org);
    const m = await db.query("select role from public.memberships where org_id = $1 and user_id = $2", [org, invitee]);
    expect(m.rows).toEqual([{ role: "member" }]);
    expect(await consume(token, invitee)).toBe("P0001");
    await db.query("rollback to savepoint once");
  });

  it("expired invitation cannot be used or peeked", async () => {
    const expired = await createAsAdmin("late@test.local");
    await db.query("update public.invitations set expires_at = now() - interval '1 second' where email = 'late@test.local'");
    const peek = await as(db, "service_role", null, async () => (await db.query("select * from public.peek_invitation($1)", [expired])).rows);
    expect(peek).toEqual([]);
    expect(await consume(expired, invitee)).toBe("P0001");
  });

  it("unknown token fails", async () => {
    expect(await consume("0".repeat(64), invitee)).toBe("P0001");
  });
});
