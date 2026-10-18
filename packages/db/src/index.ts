import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export interface SupabaseEnv {
  dbUrl: string;
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * Параметры локального Supabase для тестов и разработки: из переменных окружения,
 * иначе из `supabase status` (ключи локального стенда, не боевые). Значения не логируются.
 */
export function localSupabase(env: Record<string, string | undefined> = process.env): SupabaseEnv {
  if (env.SUPABASE_DB_URL && env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      dbUrl: env.SUPABASE_DB_URL,
      apiUrl: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }
  const workdir = fileURLToPath(new URL("..", import.meta.url));
  const out = execFileSync("supabase", ["status", "-o", "json", "--workdir", workdir], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const s = JSON.parse(out.slice(out.indexOf("{"))) as Record<string, string>;
  const pick = (k: string) => {
    const v = s[k];
    if (!v) throw new Error(`supabase status: нет ${k}, запустите pnpm db:start`);
    return v;
  };
  return { dbUrl: pick("DB_URL"), apiUrl: pick("API_URL"), anonKey: pick("ANON_KEY"), serviceRoleKey: pick("SERVICE_ROLE_KEY") };
}
export type { Database } from "./database.types";
