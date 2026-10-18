import { randomUUID } from "node:crypto";
import pg from "pg";
import { localSupabase } from "../src";

// Всё в одной транзакции с откатом в конце: тест не оставляет данных в базе.
export async function txClient() {
  const client = new pg.Client({ connectionString: localSupabase().dbUrl });
  await client.connect();
  await client.query("begin");
  return {
    client,
    async close() {
      await client.query("rollback");
      await client.end();
    },
  };
}

export async function createUser(client: pg.Client, label: string) {
  const id = randomUUID();
  await client.query(
    "insert into auth.users (id, email, aud, role) values ($1, $2, 'authenticated', 'authenticated')",
    [id, `${label}-${id}@test.local`],
  );
  return id;
}

export async function createOrg(client: pg.Client, name: string) {
  const { rows } = await client.query<{ id: string }>("insert into public.organizations (name) values ($1) returning id", [name]);
  return rows[0]!.id;
}

/** Выполнить fn от имени роли (authenticated/anon/service_role) и пользователя; изменения откатываются. */
export async function as<T>(client: pg.Client, role: string, userId: string | null, fn: () => Promise<T>) {
  await client.query("savepoint as_role");
  try {
    await client.query(`set local role ${role}`);
    const claims = JSON.stringify(userId ? { sub: userId, role } : { role });
    await client.query("select set_config('request.jwt.claims', $1, true)", [claims]);
    return await fn();
  } finally {
    await client.query("rollback to savepoint as_role");
  }
}

/** Ожидаемая ошибка Postgres внутри as(): возвращает код ошибки. */
export async function pgError(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return (e as { code?: string; message: string }).code ?? (e as Error).message;
  }
  return null;
}
