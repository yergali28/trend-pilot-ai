import type { SupabaseClient } from "@supabase/supabase-js";
import { selectAll } from "./supabase";

// Рынок площадки продажи по данным провайдера аналитики (listing_stats): ниши, товары, ряды за период.
// Здесь только сборка и агрегаты для показа (суммы, медианы); формул юнит-экономики нет — они в packages/calc.

export interface MarketItem {
  id: string;
  externalId: string;
  title: string;
  url: string | null;
  imageUrl: string | null;
  brand: string | null;
  categoryId: string | null;
  synthetic: boolean;
  sourceId: string;
  price: number | null;
  currency: string | null;
  sales: number | null;
  revenue: number | null;
  rating: number | null;
  reviews: number | null;
  stock: number | null;
  seller: string | null;
  periodStart: string;
  periodEnd: string;
  daily: { sales?: (number | null)[]; price?: (number | null)[]; stock?: (number | null)[] } | null;
  fetchedAt: string;
  /** Товар закупки, сопоставленный с этой карточкой: из него открывается юнит-экономика. */
  sourceProductId: string | null;
}

export interface Niche {
  id: string;
  name: string;
  synthetic: boolean;
  items: number;
  revenue: number;
  sales: number;
  medianPrice: number | null;
  avgRating: number | null;
  /** Доля выручки трёх крупнейших товаров ниши: чем выше, тем сильнее концентрация. */
  top3Share: number | null;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const median = (xs: number[]) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

// ponytail: читается вся таблица (сотни товаров); на реальных объёмах — представление с последним снимком и пагинация.
export async function loadMarket(db: SupabaseClient, marketplace = "wildberries") {
  const all = selectAll;
  const [stats, products, categories, matches] = await Promise.all([
    all((a, b) => db.from("listing_stats").select("product_id, source_id, period_start, period_end, price, currency, sales, revenue, rating, reviews, stock, seller, daily, fetched_at, synthetic").order("fetched_at", { ascending: false }).range(a, b)),
    all((a, b) => db.from("products").select("id, external_id, title, url, image_url, brand, category_id, synthetic").eq("source_id", marketplace).eq("kind", "listing").order("id").range(a, b)),
    all((a, b) => db.from("categories").select("id, name, synthetic").eq("marketplace_id", marketplace).order("id").range(a, b)),
    all((a, b) => db.from("matches").select("source_product_id, listing_product_id").order("listing_product_id").range(a, b)),
  ]);

  const latest = new Map<string, (typeof stats)[number]>();
  for (const s of stats) if (!latest.has(s.product_id)) latest.set(s.product_id, s);
  const sourceOf = new Map(matches.map((m) => [m.listing_product_id, m.source_product_id]));

  const items: MarketItem[] = [];
  for (const p of products) {
    const s = latest.get(p.id);
    if (!s) continue;
    items.push({
      id: p.id,
      externalId: p.external_id,
      title: p.title,
      url: p.url,
      imageUrl: p.image_url,
      brand: p.brand,
      categoryId: p.category_id,
      synthetic: p.synthetic || s.synthetic,
      sourceId: s.source_id,
      price: num(s.price),
      currency: s.currency,
      sales: num(s.sales),
      revenue: num(s.revenue),
      rating: num(s.rating),
      reviews: num(s.reviews),
      stock: num(s.stock),
      seller: s.seller,
      periodStart: s.period_start,
      periodEnd: s.period_end,
      daily: s.daily as MarketItem["daily"],
      fetchedAt: s.fetched_at,
      sourceProductId: sourceOf.get(p.id) ?? null,
    });
  }
  items.sort((a, b) => (b.revenue ?? -1) - (a.revenue ?? -1));
  // Реальные данные провайдера и демо-синтетика не смешиваются: при наличии реальных синтетика скрыта.
  const real = items.filter((i) => !i.synthetic);
  if (real.length > 0) items.splice(0, items.length, ...real);

  const niches: Niche[] = categories
    .map((c) => {
      const its = items.filter((i) => i.categoryId === c.id);
      const revenue = its.reduce((s, i) => s + (i.revenue ?? 0), 0);
      const top3 = its.slice(0, 3).reduce((s, i) => s + (i.revenue ?? 0), 0);
      const ratings = its.flatMap((i) => (i.rating === null ? [] : [i.rating]));
      return {
        id: c.id,
        name: c.name,
        synthetic: Boolean(c.synthetic),
        items: its.length,
        revenue,
        sales: its.reduce((s, i) => s + (i.sales ?? 0), 0),
        medianPrice: median(its.flatMap((i) => (i.price === null ? [] : [i.price]))),
        avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
        top3Share: revenue > 0 ? top3 / revenue : null,
      };
    })
    .filter((n) => n.items > 0)
    .sort((a, b) => b.revenue - a.revenue);

  return { items, niches };
}

/** Даты периода по дням (ГГГГ-ММ-ДД) для дневных рядов, начиная с periodStart. */
export function periodDays(start: string, length: number) {
  const t0 = Date.parse(`${start}T00:00:00Z`);
  return Array.from({ length }, (_, i) => new Date(t0 + i * 86_400_000).toISOString().slice(0, 10));
}
