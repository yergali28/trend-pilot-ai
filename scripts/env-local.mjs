// Пишет apps/web/.env.local из `supabase status` (ключи локального стенда, не боевые). Значения не печатаются.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const out = execFileSync("supabase", ["status", "-o", "json", "--workdir", "packages/db"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const s = JSON.parse(out.slice(out.indexOf("{")));
const env = {
  SUPABASE_URL: s.API_URL,
  SUPABASE_ANON_KEY: s.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: s.SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: s.DB_URL,
  // Демо-режим: синтетические допущения расчёта (fixtures/demo/assumptions.json), помечены в интерфейсе.
  TP_DEMO_DATA: "1",
};
for (const [k, v] of Object.entries(env)) if (!v) throw new Error(`supabase status: нет значения для ${k}, запустите pnpm db:start`);
writeFileSync("apps/web/.env.local", Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
console.log("apps/web/.env.local записан (значения не выводятся)");
