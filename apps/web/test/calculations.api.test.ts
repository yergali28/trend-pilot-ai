import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "@tp/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET, POST } from "../app/api/calculations/route";

const local = localSupabase();
process.env.SUPABASE_URL = local.apiUrl;
process.env.SUPABASE_ANON_KEY = local.anonKey;
process.env.SUPABASE_SERVICE_ROLE_KEY = local.serviceRoleKey;

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(local.apiUrl, local.serviceRoleKey, opts);
const run = randomUUID().slice(0, 8);
const password = `pw-${randomUUID()}`; // одноразовый пароль тестовых пользователей
const users: string[] = [];
const orgs: string[] = [];

async function member(label: string) {
  const email = `${label}-${run}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  users.push(data.user.id);
  const org = await admin.from("organizations").insert({ name: `API ${label} ${run}` }).select("id").single().throwOnError();
  orgs.push(org.data!.id);
  await admin.from("memberships").insert({ org_id: org.data!.id, user_id: data.user.id, role: "owner" }).throwOnError();
  const session = await createClient(local.apiUrl, local.anonKey, opts).auth.signInWithPassword({ email, password });
  return { token: session.data.session!.access_token, orgId: org.data!.id };
}

const call = (handler: (r: Request) => Promise<Response>, token: string, body?: unknown) =>
  handler(
    new Request("http://localhost/api/calculations", {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );

let a: { token: string; orgId: string };
let b: { token: string; orgId: string };
let calcA: string;

beforeAll(async () => {
  a = await member("a");
  b = await member("b");
});

afterAll(async () => {
  for (const id of users) await admin.auth.admin.deleteUser(id);
  for (const id of orgs) await admin.from("organizations").delete().eq("id", id);
});

describe("/api/calculations: изоляция организаций на уровне API", () => {
  it("A сохраняет расчёт в своей организации", async () => {
    const res = await call(POST, a.token, { input: { synthetic: true }, result: {} });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; org_id: string };
    expect(body.org_id).toBe(a.orgId);
    calcA = body.id;
  });

  it("A видит свой расчёт", async () => {
    const { calculations } = (await (await call(GET, a.token)).json()) as { calculations: { id: string; org_id: string }[] };
    expect(calculations.map((c) => c.id)).toContain(calcA);
    expect(calculations.every((c) => c.org_id === a.orgId)).toBe(true);
  });

  it("B не видит расчёты A", async () => {
    const { calculations } = (await (await call(GET, b.token)).json()) as { calculations: { id: string; org_id: string }[] };
    expect(calculations.map((c) => c.id)).not.toContain(calcA);
    expect(calculations.every((c) => c.org_id === b.orgId)).toBe(true);
  });

  it("B не может записать в организацию A", async () => {
    const res = await call(POST, b.token, { orgId: a.orgId, input: {}, result: {} });
    expect(res.status).toBe(403);
    const { count } = await admin.from("calculations").select("*", { count: "exact", head: true }).eq("org_id", a.orgId);
    expect(count).toBe(1);
  });

  // Без заголовка маршрут читает сессию из cookies (это проверяет e2e через proxy); здесь — поддельный токен.
  it("с недействительным токеном — 401", async () => {
    expect((await call(GET, "not-a-jwt")).status).toBe(401);
    expect((await call(POST, "not-a-jwt", { input: {}, result: {} })).status).toBe(401);
  });
});
