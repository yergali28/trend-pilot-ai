import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Не задана переменная окружения ${name}`);
  return v;
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Клиент с правами сервиса: только на сервере, ключ не уходит в браузер. */
export const serviceClient = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), options);

/** Клиент от имени пользователя: RLS и проверки в функциях базы применяются к нему. */
export const userClient = (accessToken: string) =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    ...options,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

export const json = (status: number, body: unknown) => Response.json(body, { status });
