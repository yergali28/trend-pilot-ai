import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { localSupabase } from "@tp/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as accept } from "../app/api/invitations/accept/route";
import { POST as createInvitation } from "../app/api/admin/invitations/route";

const local = localSupabase();
process.env.SUPABASE_URL = local.apiUrl;
process.env.SUPABASE_ANON_KEY = local.anonKey;
process.env.SUPABASE_SERVICE_ROLE_KEY = local.serviceRoleKey;

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin: SupabaseClient = createClient(local.apiUrl, local.serviceRoleKey, opts);
const run = randomUUID().slice(0, 8);
const password = `pw-${randomUUID()}`; // одноразовый пароль тестового пользователя
const users: string[] = [];
let orgId: string;
let adminToken: string;
let regularToken: string;

async function makeUser(label: string, platformAdmin: boolean) {
  const email = `${label}-${run}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  users.push(data.user.id);
  if (platformAdmin) await admin.from("platform_admins").insert({ user_id: data.user.id }).throwOnError();
  const session = await createClient(local.apiUrl, local.anonKey, opts).auth.signInWithPassword({ email, password });
  return session.data.session!.access_token;
}

const post = (handler: (r: Request) => Promise<Response>, body: unknown, token?: string) =>
  handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );

async function invite(email: string) {
  const res = await post(createInvitation, { orgId, email, role: "member" }, adminToken);
  expect(res.status).toBe(201);
  const { invitePath } = (await res.json()) as { invitePath: string };
  return invitePath.split("/").pop()!;
}

beforeAll(async () => {
  const org = await admin.from("organizations").insert({ name: `API ${run}` }).select("id").single().throwOnError();
  orgId = org.data!.id as string;
  adminToken = await makeUser("admin", true);
  regularToken = await makeUser("regular", false);
});

afterAll(async () => {
  const { data } = await admin.from("memberships").select("user_id").eq("org_id", orgId);
  for (const id of [...users, ...(data ?? []).map((m) => m.user_id as string)]) await admin.auth.admin.deleteUser(id);
  await admin.from("organizations").delete().eq("id", orgId);
});

describe("POST /api/admin/invitations", () => {
  it("platform admin creates a one-time link", async () => {
    expect(await invite(`new-${run}@test.local`)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects missing auth, non-admin users and invalid input", async () => {
    const body = { orgId, email: `x-${run}@test.local`, role: "member" };
    expect((await post(createInvitation, body)).status).toBe(401);
    expect((await post(createInvitation, body, regularToken)).status).toBe(403);
    expect((await post(createInvitation, { ...body, role: "superuser" }, adminToken)).status).toBe(400);
  });
});

describe("POST /api/invitations/accept", () => {
  it("first use creates the user with membership, second use is rejected", async () => {
    const email = `once-${run}@test.local`;
    const token = await invite(email);

    const first = await post(accept, { token, password });
    expect(first.status).toBe(201);
    expect(await first.json()).toEqual({ orgId });

    // Пользователь входит с заданным паролем и видит свою организацию.
    const client = createClient(local.apiUrl, local.anonKey, opts);
    const signIn = await client.auth.signInWithPassword({ email, password });
    expect(signIn.error).toBeNull();
    const orgs = await client.from("organizations").select("id");
    expect(orgs.data).toEqual([{ id: orgId }]);

    const second = await post(accept, { token, password: `${password}-again` });
    expect(second.status).toBe(410);
  });

  it("expired invitation is rejected and creates no user", async () => {
    const email = `late-${run}@test.local`;
    const token = await invite(email);
    await admin.from("invitations").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("email", email).throwOnError();

    const res = await post(accept, { token, password });
    expect(res.status).toBe(410);
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    expect(data.users.some((u) => u.email === email)).toBe(false);
  });

  it("malformed token is rejected", async () => {
    expect((await post(accept, { token: "nope", password })).status).toBe(400);
    expect((await post(accept, { token: "0".repeat(64), password })).status).toBe(410);
  });
});
