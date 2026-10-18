"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "../../../lib/session";
import { serviceClient } from "../../../lib/supabase";
import { REFERENCES, type ReferenceTable } from "./references/config";

// ponytail: срок жизни ссылки 72 часа выбран без решения владельца (3.7 «ограниченный срок»); вынести в настройки.
const INVITATION_TTL = "72 hours";
const ROLES = ["owner", "member", "viewer"];
const STATUSES = ["active", "pending_registration", "blocked", "disabled"];

export async function createOrganization(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await serviceClient().from("organizations").insert({ name });
  revalidatePath("/admin");
}

export type InviteState = { link?: string; error?: "invalid" | "failed" };

/** Ссылка-приглашение показывается один раз: в базе хранится только хеш токена. */
export async function createInvite(_prev: InviteState, form: FormData): Promise<InviteState> {
  const { db } = await requireAdmin();
  const orgId = String(form.get("orgId") ?? "");
  const email = String(form.get("email") ?? "").trim();
  const role = String(form.get("role") ?? "");
  if (!orgId || !email.includes("@") || !ROLES.includes(role)) return { error: "invalid" };
  const { data, error } = await db.rpc("create_invitation", { p_org: orgId, p_email: email, p_role: role, p_ttl: INVITATION_TTL });
  if (error) return { error: "failed" };
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return { link: `${origin}/invite/${data as string}` };
}

export type SourceState = { ok?: boolean; error?: "invalid" | "reason" | "failed" };

/** Статус источника меняет выдачу у всех пользователей: для blocked/disabled причина обязательна. */
export async function updateSource(_prev: SourceState, form: FormData): Promise<SourceState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!id || !STATUSES.includes(status)) return { error: "invalid" };
  const reason = String(form.get("reason") ?? "").trim();
  if ((status === "blocked" || status === "disabled") && !reason) return { error: "reason" };
  const { error } = await serviceClient().from("data_sources").update({ status, status_reason: reason || null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "failed" };
  revalidatePath("/admin/sources");
  return { ok: true };
}

export type ReferenceState = { ok?: boolean; error?: string };

/** Ручное добавление значения справочника: только с источником и датой получения (раздел 4.3, 5.1). */
export async function addReference(_prev: ReferenceState, form: FormData): Promise<ReferenceState> {
  await requireAdmin();
  const table = String(form.get("table") ?? "") as ReferenceTable;
  const config = REFERENCES[table];
  if (!config) return { error: "invalid" };
  const row: Record<string, string | number | null> = {};
  for (const f of config.fields) {
    const raw = String(form.get(f.name) ?? "").trim();
    if (!raw) {
      if (f.required) return { error: "required" };
      row[f.name] = null;
      continue;
    }
    if (f.type === "number" || f.type === "rate") {
      const n = Number(raw.replace(",", "."));
      // Ставки вводятся в процентах, в базе хранится доля (12 % → 0.12).
      if (!Number.isFinite(n) || (f.type === "rate" && (n < 0 || n > 100))) return { error: "number" };
      row[f.name] = f.type === "rate" ? n / 100 : n;
    } else row[f.name] = raw;
  }
  const { error } = await serviceClient().from(table).insert(row);
  if (error) return { error: "db" };
  revalidatePath("/admin/references");
  return { ok: true };
}
