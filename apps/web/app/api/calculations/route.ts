import { json, requestClient } from "../../../lib/supabase";

const FORMULA_VERSION = "calc@1";

async function user(req: Request) {
  const db = await requestClient(req);
  const { data } = await db.auth.getUser();
  return data.user ? { db, userId: data.user.id } : null;
}

/** Расчёты организации пользователя. Изоляцию обеспечивает RLS: чужие строки не видны. */
export async function GET(req: Request) {
  const s = await user(req);
  if (!s) return json(401, { error: "unauthorized" });
  const { data, error } = await s.db.from("calculations").select("id, org_id, source_product_id, listing_product_id, formula_version, created_at").order("created_at", { ascending: false }).limit(100);
  if (error) return json(400, { error: "invalid_request" });
  return json(200, { calculations: data });
}

/** Сохранение снимка расчёта: вход, результат и версия формулы (раздел 5.8, п. 6). */
export async function POST(req: Request) {
  const s = await user(req);
  if (!s) return json(401, { error: "unauthorized" });
  const body = (await req.json().catch(() => null)) as { orgId?: unknown; sourceProductId?: unknown; listingProductId?: unknown; input?: unknown; result?: unknown } | null;
  if (!body || typeof body.input !== "object" || typeof body.result !== "object" || body.input === null || body.result === null) return json(400, { error: "invalid_request" });

  let orgId = typeof body.orgId === "string" ? body.orgId : null;
  if (!orgId) {
    const { data } = await s.db.from("memberships").select("org_id").eq("user_id", s.userId).order("created_at").limit(1);
    orgId = data?.[0]?.org_id ?? null;
  }
  if (!orgId) return json(403, { error: "no_organization" });

  const { data, error } = await s.db
    .from("calculations")
    .insert({
      org_id: orgId,
      created_by: s.userId,
      source_product_id: typeof body.sourceProductId === "string" ? body.sourceProductId : null,
      listing_product_id: typeof body.listingProductId === "string" ? body.listingProductId : null,
      input: body.input,
      result: body.result,
      formula_version: FORMULA_VERSION,
    })
    .select("id, org_id")
    .single();
  // 42501: RLS не дала записать в чужую организацию.
  if (error) return json(error.code === "42501" ? 403 : 400, { error: error.code === "42501" ? "forbidden" : "invalid_request" });
  return json(201, data);
}
