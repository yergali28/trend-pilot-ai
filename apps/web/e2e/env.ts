import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "@tp/db";
import { readFileSync } from "node:fs";

export const STATE = "e2e/.state";
export const local = localSupabase();
export const service = () => createClient(local.apiUrl, local.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
export const creds = () => JSON.parse(readFileSync(`${STATE}/creds.json`, "utf8")) as { email: string; password: string; orgId: string; userId: string };
