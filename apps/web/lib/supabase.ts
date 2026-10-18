import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Не задана переменная окружения ${name}`);
  return v;
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Клиент с правами сервиса: только на сервере, ключ не уходит в браузер. */
export const serviceClient = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), options);

/** Клиент от имени пользователя по токену: RLS и проверки в функциях базы применяются к нему. */
export const userClient = (accessToken: string) =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    ...options,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

/** Клиент текущего пользователя по сессии в cookies (серверные компоненты, действия, маршруты). */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const c of list) store.set(c.name, c.value, c.options);
        } catch {
          // В серверном компоненте cookies только читаются; сессию обновляет proxy.ts.
        }
      },
    },
  });
}

/** Клиент маршрута API: токен из заголовка Authorization, иначе сессия из cookies. */
export async function requestClient(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  return token ? userClient(token) : serverClient();
}

export const json = (status: number, body: unknown) => Response.json(body, { status });
