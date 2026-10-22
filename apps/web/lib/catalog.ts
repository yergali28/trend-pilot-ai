import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  budgetInCurrency,
  calculate,
  evaluate,
  summarize,
  volumetricWeightKg,
  wbBoxLogistics,
  type CalcInput,
  type CalcResult,
  type Evaluation,
  type Input,
  type Method,
  type MoneyInput,
  type MultipleMetric,
  type SourceRef,
} from "@tp/calc";
import type { SupabaseClient } from "@supabase/supabase-js";
import { selectAll } from "./supabase";

// Слой данных экранов: читает снимки из базы и собирает вход для @tp/calc. Арифметики юнит-экономики здесь нет.

export type Country = "KZ" | "RU";
export const COUNTRY_CURRENCY: Record<Country, string> = { KZ: "KZT", RU: "RUB" };
export const BUDGET_CURRENCIES = ["KZT", "RUB", "USD", "CNY"] as const;
export const TARGETS = [2, 3, 5, 10] as const;

export interface WizardParams {
  sell: "all" | string[];
  buy: "all" | string[];
  country: Country;
  budget: number | null;
  budgetCurrency: string;
  target: number;
  metric: MultipleMetric;
}

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | undefined): "all" | string[] => (!v || v === "all" ? "all" : v.split(",").filter(Boolean));

export function parseParams(sp: Raw): WizardParams {
  const country = one(sp.country) === "RU" ? "RU" : "KZ";
  const budget = Number(one(sp.budget));
  // Своё значение (поле xc) перекрывает пресет 2x/3x/5x/10x.
  const custom = Number(one(sp.xc));
  const target = Number.isFinite(custom) && custom > 0 ? custom : Number(one(sp.x));
  const cur = one(sp.cur);
  return {
    sell: list(one(sp.sell)),
    buy: list(one(sp.buy)),
    country,
    budget: Number.isFinite(budget) && budget > 0 ? budget : null,
    budgetCurrency: cur && (BUDGET_CURRENCIES as readonly string[]).includes(cur) ? cur : COUNTRY_CURRENCY[country],
    target: Number.isFinite(target) && target > 0 ? target : 3,
    metric: one(sp.metric) === "roi" ? "roi" : "priceToCost",
  };
}

export function toQuery(p: WizardParams) {
  const q = new URLSearchParams({
    sell: p.sell === "all" ? "all" : p.sell.join(","),
    buy: p.buy === "all" ? "all" : p.buy.join(","),
    country: p.country,
    cur: p.budgetCurrency,
    x: String(p.target),
    metric: p.metric,
  });
  if (p.budget !== null) q.set("budget", String(p.budget));
  return q.toString();
}

export interface Source {
  id: string;
  name: string;
  role: "sell" | "buy" | "analytics";
  status: "active" | "pending_registration" | "blocked" | "disabled";
  statusReason: string | null;
  mode: string;
  lastSuccessAt: string | null;
  checkedAt: string | null;
  provides: string | null;
  limitations: string | null;
}

export async function loadSources(db: SupabaseClient): Promise<Source[]> {
  const { data, error } = await db
    .from("data_sources")
    .select("id, marketplace_id, role, status, status_reason, mode, last_success_at, checked_at, provides, limitations, marketplaces(name)")
    .order("id");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    // У площадки может быть несколько источников (карточки и продажи WB): второй различаем по id.
    name: ((m) => (m && r.marketplace_id !== r.id ? `${m} (${r.id})` : (m ?? r.id)))((r.marketplaces as unknown as { name: string } | null)?.name),
    role: r.role,
    status: r.status,
    statusReason: r.status_reason,
    mode: r.mode,
    lastSuccessAt: r.last_success_at,
    checkedAt: r.checked_at,
    provides: r.provides,
    limitations: r.limitations,
  }));
}

/** Выбранные площадки роли: в «Все» входят только активные (раздел 3.1). */
export function selectedSources(sources: Source[], role: "sell" | "buy", pick: "all" | string[]) {
  const ofRole = sources.filter((s) => s.role === role);
  const active = ofRole.filter((s) => s.status === "active");
  const selected = pick === "all" ? active : active.filter((s) => pick.includes(s.id));
  return { all: ofRole, selected, inactive: ofRole.filter((s) => s.status !== "active") };
}

// ---------- Демо-допущения (синтетика, только при TP_DEMO_DATA=1) ----------

interface MoneySpec {
  value: number;
  currency: string;
}
interface CountryAssumptions {
  currency: string;
  fxRates: Record<string, number>;
  chinaDelivery: MoneySpec;
  cargoTariff: MoneySpec & { basis: "kg" | "m3" };
  customsDutyRate: number;
  importVatRate: number;
  agentCommissionRate: number;
  packaging: MoneySpec;
  certification: MoneySpec;
  marketplaces: Record<string, Record<string, number | MoneySpec>>;
}
interface Assumptions {
  synthetic: true;
  fetchedAt: string;
  countries: Record<Country, CountryAssumptions>;
}

export const demoEnabled = () => process.env.TP_DEMO_DATA === "1";

let cachedAssumptions: Assumptions | null = null;
function assumptions(): Assumptions {
  cachedAssumptions ??= JSON.parse(readFileSync(join(process.cwd(), "../../fixtures/demo/assumptions.json"), "utf8")) as Assumptions;
  if (cachedAssumptions.synthetic !== true) throw new Error("Демо-допущения должны быть помечены synthetic: true");
  return cachedAssumptions;
}

// ---------- Параметры продавца (решение владельца, fixtures/settings/seller-defaults.json) ----------

interface SellerDefaults {
  decidedAt: string;
  marketplaces: Record<string, { adRate?: number; returnRate?: number; acquiringRate?: number; reverseLogistics?: number | "same_as_delivery" }>;
}
let cachedSeller: SellerDefaults | null = null;
const sellerDefaults = () => (cachedSeller ??= JSON.parse(readFileSync(join(process.cwd(), "../../fixtures/settings/seller-defaults.json"), "utf8")) as SellerDefaults);

// ---------- Каталог ----------

interface ProductRow {
  id: string;
  source_id: string;
  kind: "source" | "listing";
  external_id: string;
  title: string;
  url: string | null;
  weight_kg: number | null;
  /** Габариты упаковки, см (у товара 1688 — от карточки WB, с которой он сопоставлен). */
  dimensions_cm: { length: number; width: number; height: number } | null;
  synthetic: boolean;
  category_id: string | null;
}
interface OfferRow {
  product_id: string;
  source_id: string;
  method: Method;
  price: number;
  currency: string;
  moq: number | null;
  fetched_at: string;
  synthetic: boolean;
}
interface DemandRow {
  product_id: string;
  source_id: string;
  sales_per_month: number;
  fetched_at: string;
  synthetic: boolean;
}

interface FxRow { base_currency: string; quote_currency: string; rate: number; rate_date: string; fetched_at: string }
interface CargoRow { basis: "kg" | "m3"; rate: number; currency: string; fetched_at: string; status: "verified" | "estimated" }
interface FeeRow { marketplace_id: string; country: string; fee_type: string; rate: number | null; valid_from: string; fetched_at: string; status: "verified" | "estimated" }

export interface Catalog {
  /** Справочники администратора: значения из официальных источников, перекрывают демо-допущения. */
  refs: { fx: FxRow[]; cargo: CargoRow[]; fees: FeeRow[]; wbBox?: { firstLiter: number; extraLiter: number; currency: string; fetchedAt: string } };
  products: Map<string, ProductRow>;
  offers: Map<string, OfferRow>;
  demand: Map<string, DemandRow>;
  listingsBySource: Map<string, string[]>;
  /** Комиссия площадки по карточке от провайдера аналитики (последний снимок). */
  listingCommission: Map<string, { pct: number; source_id: string; fetched_at: string }>;
  categories: Map<string, { id: string; name: string; synthetic: boolean }>;
}

const latest = <T extends { product_id: string; fetched_at: string }>(rows: T[]) => {
  const m = new Map<string, T>();
  for (const r of rows) if (!m.has(r.product_id) || m.get(r.product_id)!.fetched_at < r.fetched_at) m.set(r.product_id, r);
  return m;
};

// ponytail: каталог читается целиком (демо — десятки товаров); при реальных объёмах — снимки и пагинация (5.8, п. 7).
export async function loadCatalog(db: SupabaseClient): Promise<Catalog> {
  const [products, offers, demand, matches, commissions, categories, fx, cargo, fees, box] = await Promise.all([
    selectAll((a, b) => db.from("products").select("id, source_id, kind, external_id, title, url, weight_kg, dimensions_cm, synthetic, category_id").order("id").range(a, b)),
    selectAll((a, b) => db.from("offers").select("product_id, source_id, method, price, currency, moq, fetched_at, synthetic").order("id").range(a, b)),
    selectAll((a, b) => db.from("demand_history").select("product_id, source_id, sales_per_month, fetched_at, synthetic").order("fetched_at").order("product_id").range(a, b)),
    selectAll((a, b) => db.from("matches").select("source_product_id, listing_product_id").order("id").range(a, b)),
    selectAll((a, b) => db.from("listing_stats").select("product_id, source_id, commission_pct, fetched_at").not("commission_pct", "is", null).order("fetched_at").order("product_id").range(a, b)),
    selectAll((a, b) => db.from("categories").select("id, name, synthetic").order("id").range(a, b)),
    selectAll((a, b) => db.from("fx_rates").select("base_currency, quote_currency, rate, rate_date, fetched_at").order("rate_date", { ascending: false }).order("base_currency").range(a, b)),
    selectAll((a, b) => db.from("cargo_rates").select("basis, rate, currency, fetched_at, status").order("fetched_at", { ascending: false }).range(a, b)),
    // Комиссии по категориям площадки (например, предметы WB) не применяются, пока товар не привязан к категории.
    selectAll((a, b) => db.from("fee_rules").select("marketplace_id, country, fee_type, rate, valid_from, fetched_at, status").is("external_category_id", null).order("valid_from", { ascending: false }).range(a, b)),
    // Тарифы коробов WB (FBO, доставка до покупателя) по складам России.
    selectAll((a, b) => db.from("logistics_rates").select("amount, currency, size_rule, fetched_at").eq("marketplace_id", "wildberries").eq("scheme", "FBO").eq("rate_type", "delivery").eq("country", "RU").order("fetched_at", { ascending: false }).range(a, b)),
  ]);
  // Склад отгрузки заранее неизвестен: берём медиану по складам России (оценка).
  const boxRows = box as { amount: number; currency: string; size_rule: { unit?: string }; fetched_at: string }[];
  const med = (unit: string) => {
    const xs = boxRows.filter((r) => r.size_rule?.unit === unit).map((r) => Number(r.amount)).sort((a, b) => a - b);
    return xs.length ? xs[Math.floor(xs.length / 2)]! : null;
  };
  const [firstLiter, extraLiter] = [med("first_liter"), med("extra_liter")];
  const wbBox = firstLiter !== null && extraLiter !== null && boxRows[0] ? { firstLiter, extraLiter, currency: boxRows[0].currency, fetchedAt: boxRows[0].fetched_at } : undefined;
  const listingsBySource = new Map<string, string[]>();
  for (const m of matches) listingsBySource.set(m.source_product_id, [...(listingsBySource.get(m.source_product_id) ?? []), m.listing_product_id]);
  const num = <T extends { rate: number | null }>(rows: T[]) => rows.map((r) => ({ ...r, rate: r.rate === null ? null : Number(r.rate) }));
  return {
    refs: { fx: num(fx as FxRow[]) as FxRow[], cargo: num(cargo as CargoRow[]) as CargoRow[], fees: num(fee_rows(fees)), ...(wbBox ? { wbBox } : {}) },
    products: new Map((products as ProductRow[]).map((p) => [p.id, { ...p, weight_kg: p.weight_kg === null ? null : Number(p.weight_kg) }])),
    offers: latest((offers as OfferRow[]).map((o) => ({ ...o, price: Number(o.price) }))),
    demand: latest((demand as DemandRow[]).map((d) => ({ ...d, sales_per_month: Number(d.sales_per_month) }))),
    listingsBySource,
    listingCommission: new Map([...latest(commissions as { product_id: string; source_id: string; commission_pct: number; fetched_at: string }[])].map(([id, r]) => [id, { pct: Number(r.commission_pct), source_id: r.source_id, fetched_at: r.fetched_at }])),
    categories: new Map(categories.map((c) => [c.id, c])),
  };
}

const ref = (sourceId: string, method: Method, fetchedAt: string): SourceRef => ({ sourceId, method, fetchedAt });
const fee_rows = (rows: unknown) => (rows ?? []) as FeeRow[];

/** Значения справочников для пары; null — справочник пуст для этой пары. */
function referenceInputs(c: Catalog, marketplace: string, country: Country) {
  const currency = COUNTRY_CURRENCY[country];
  const reference = (table: string, fetchedAt: string) => ref(`reference:${table}`, "reference", fetchedAt);
  const fx: Record<string, Input> = {};
  for (const r of c.refs.fx) {
    if (r.quote_currency !== currency || fx[r.base_currency]) continue; // строки уже отсортированы по дате курса
    fx[r.base_currency] = { value: r.rate, status: "verified", source: reference("fx_rates", r.fetched_at) };
  }
  const cargo = c.refs.cargo.find((r) => r.basis === "kg");
  const fee = (type: string) => c.refs.fees.find((r) => r.marketplace_id === marketplace && r.country === country && r.fee_type === type && r.rate !== null);
  const rate = (r: FeeRow | undefined): Input | undefined => (r ? { value: r.rate!, status: r.status, source: reference("fee_rules", r.fetched_at) } : undefined);
  return {
    fx,
    cargoTariff: cargo ? { value: cargo.rate, currency: cargo.currency, basis: cargo.basis, status: cargo.status, source: reference("cargo_rates", cargo.fetched_at) } : undefined,
    marketplaceCommissionRate: rate(fee("commission")),
    acquiringRate: rate(fee("acquiring")),
  };
}

/** Вход расчёта для пары «товар закупки × площадка продажи». Нет данных — поле отсутствует (no_data). */
export function buildInput(c: Catalog, sourceProductId: string, marketplace: string, country: Country): { input: CalcInput; listingId: string | null; synthetic: boolean } {
  const product = c.products.get(sourceProductId);
  const purchase = c.offers.get(sourceProductId);
  const listingId = (c.listingsBySource.get(sourceProductId) ?? []).find((id) => c.products.get(id)?.source_id === marketplace) ?? null;
  const sale = listingId ? c.offers.get(listingId) : undefined;

  const input: CalcInput = { currency: COUNTRY_CURRENCY[country], tax: { mode: "off", source: ref("settings:default-tax-off", "user_input", "2026-10-18T00:00:00Z") } };
  const money = (o: OfferRow): MoneyInput => ({ value: o.price, currency: o.currency, status: "verified", source: ref(o.source_id, o.method, o.fetched_at) });
  if (purchase) input.purchasePrice = money(purchase);
  if (sale) input.salePrice = money(sale);
  if (product?.weight_kg !== null && product?.weight_kg !== undefined && purchase) {
    input.shippingQuantity = { value: product.weight_kg, status: "verified", source: ref(purchase.source_id, purchase.method, purchase.fetched_at) };
  } else if (product?.dimensions_cm && purchase) {
    // Веса нет — объёмный вес по габаритам упаковки (packages/calc), это оценка.
    const dimsFrom = sale ?? purchase;
    input.shippingQuantity = { value: volumetricWeightKg(product.dimensions_cm), status: "estimated", source: ref(dimsFrom.source_id, dimsFrom.method, dimsFrom.fetched_at) };
  }

  let synthetic = Boolean(product?.synthetic || (listingId && c.products.get(listingId)?.synthetic));
  if (demoEnabled()) {
    const a = assumptions();
    const ca = a.countries[country];
    const demo = ref("demo:assumptions", "reference", a.fetchedAt);
    const est = (value: number): Input => ({ value, status: "estimated", source: demo });
    const estMoney = (m: MoneySpec): MoneyInput => ({ ...est(m.value), currency: m.currency });
    input.fxRates = Object.fromEntries(Object.entries(ca.fxRates).map(([k, v]) => [k, est(v)]));
    input.chinaDelivery = estMoney(ca.chinaDelivery);
    input.cargoTariff = { ...estMoney(ca.cargoTariff), basis: ca.cargoTariff.basis };
    input.customsDutyRate = est(ca.customsDutyRate);
    input.importVatRate = est(ca.importVatRate);
    input.agentCommissionRate = est(ca.agentCommissionRate);
    input.packaging = estMoney(ca.packaging);
    input.certification = estMoney(ca.certification);
    const mp = ca.marketplaces[marketplace];
    if (mp) {
      for (const [k, v] of Object.entries(mp)) (input as unknown as Record<string, Input>)[k] = typeof v === "number" ? est(v) : estMoney(v);
    }
    synthetic = true;
  }

  // Справочник администратора перекрывает демо-допущение (приоритет источников, раздел 5.1, п. 7).
  const r = referenceInputs(c, marketplace, country);
  if (Object.keys(r.fx).length > 0) input.fxRates = { ...input.fxRates, ...r.fx };
  if (r.cargoTariff) input.cargoTariff = r.cargoTariff;
  if (r.marketplaceCommissionRate) input.marketplaceCommissionRate = r.marketplaceCommissionRate;
  // Логистика WB по тарифу коробов и литражу упаковки карточки (медиана складов России — оценка).
  const dims = (listingId ? c.products.get(listingId)?.dimensions_cm : null) ?? product?.dimensions_cm;
  if (marketplace === "wildberries" && c.refs.wbBox && dims) {
    const b = c.refs.wbBox;
    input.marketplaceLogistics = { value: wbBoxLogistics(dims, b.firstLiter, b.extraLiter), currency: b.currency, status: "estimated", source: ref("reference:logistics_rates", "reference", b.fetchedAt) };
  }
  // Параметры продавца по умолчанию (реклама, возвраты, эквайринг, обратная логистика) — ввод владельца, оценка.
  const seller = sellerDefaults().marketplaces[marketplace];
  if (seller) {
    const owner = ref("settings:owner-defaults", "user_input", sellerDefaults().decidedAt);
    const est = (value: number): Input => ({ value, status: "estimated", source: owner });
    if (seller.adRate !== undefined) input.adRate = est(seller.adRate);
    if (seller.returnRate !== undefined) input.returnRate = est(seller.returnRate);
    if (seller.acquiringRate !== undefined) input.acquiringRate = est(seller.acquiringRate);
    if (typeof seller.reverseLogistics === "number") input.reverseLogistics = { ...est(seller.reverseLogistics), currency: COUNTRY_CURRENCY[country] };
    else if (seller.reverseLogistics === "same_as_delivery" && input.marketplaceLogistics) input.reverseLogistics = { ...input.marketplaceLogistics, source: owner, status: "estimated" };
  }
  // Ставка провайдера для конкретной карточки точнее справочника и допущений.
  const commission = listingId ? c.listingCommission.get(listingId) : undefined;
  if (commission) input.marketplaceCommissionRate = { value: commission.pct / 100, status: "verified", source: ref(commission.source_id, "provider", commission.fetched_at) };
  if (r.acquiringRate) input.acquiringRate = r.acquiringRate;
  return { input, listingId, synthetic };
}

export interface Pair {
  marketplace: string;
  listingId: string | null;
  input: CalcInput;
  result: CalcResult;
  evaluation: Evaluation;
  salesPerMonth: number | null;
}

export interface ProductOutcome {
  id: string;
  title: string;
  categoryId: string | null;
  synthetic: boolean;
  pairs: Pair[];
  /** Лучшая пара по чистой прибыли среди подходящих, иначе первая с данными. */
  best: Pair | null;
  verdict: Evaluation["verdict"];
  /** Площадки продажи (из выбранных), где есть цена продажи. */
  covered: number;
  missing: string[];
}

const verdictRank = { eligible: 0, over_budget: 1, below_target: 2, insufficient: 3 } as const;

export function evaluateCatalog(c: Catalog, p: WizardParams, sell: Source[], buy: Source[]): ProductOutcome[] {
  const buyIds = new Set(buy.map((s) => s.id));
  const out: ProductOutcome[] = [];
  // Внутри одного источника закупки реальные товары и синтетика не смешиваются: при реальных синтетика скрыта.
  const candidates = [...c.products.values()].filter((p) => p.kind === "source" && buyIds.has(p.source_id));
  const realSources = new Set(candidates.filter((p) => !p.synthetic).map((p) => p.source_id));
  for (const product of candidates) {
    if (product.synthetic && realSources.has(product.source_id)) continue;
    // Реальное предложение закупки без сопоставленной карточки продажи — не кандидат (поиск аналога не удался).
    const listings = c.listingsBySource.get(product.id) ?? [];
    if (!product.synthetic && listings.length === 0) continue;
    const pairs: Pair[] = sell.map((s) => {
      const { input, listingId } = buildInput(c, product.id, s.id, p.country);
      const result = calculate(input);
      const demand = listingId ? c.demand.get(listingId) : undefined;
      const salesPerMonth = demand ? demand.sales_per_month : null;
      const budget = p.budget === null ? null : budgetInCurrency(p.budget, p.budgetCurrency, input);
      const evaluation = evaluate(result, { metric: p.metric, target: p.target, budget, moq: c.offers.get(product.id)?.moq ?? 1, salesPerMonth });
      return { marketplace: s.id, listingId, input, result, evaluation, salesPerMonth };
    });
    const ranked = [...pairs].sort(
      (a, b) =>
        verdictRank[a.evaluation.verdict] - verdictRank[b.evaluation.verdict] ||
        (b.result.netProfit.realistic ?? -Infinity) - (a.result.netProfit.realistic ?? -Infinity),
    );
    const best = ranked[0] ?? null;
    out.push({
      id: product.id,
      // Для реальной пары название — с карточки продажи (на русском), название закупки — в карточке товара.
      title: (!product.synthetic && listings[0] ? c.products.get(listings[0])?.title : undefined) ?? product.title,
      categoryId: product.category_id,
      synthetic: product.synthetic || demoEnabled(),
      pairs,
      best,
      verdict: best?.evaluation.verdict ?? "insufficient",
      covered: pairs.filter((x) => x.result.salePrice.status !== "no_data").length,
      missing: best ? best.evaluation.missing : ["salePrice"],
    });
  }
  return out;
}

export interface CategorySummary {
  id: string;
  name: string;
  synthetic: boolean;
  eligible: number;
  insufficient: number;
  mean: number | null;
  median: number | null;
  covered: number;
  /** Продаж в месяц по подходящим товарам (на лучшей площадке каждого); null — ни у одного нет спроса. */
  demand: number | null;
}

export function summarizeCategories(c: Catalog, outcomes: ProductOutcome[], sellCount: number): CategorySummary[] {
  const byCat = new Map<string, ProductOutcome[]>();
  for (const o of outcomes) if (o.categoryId) byCat.set(o.categoryId, [...(byCat.get(o.categoryId) ?? []), o]);
  return [...byCat.entries()]
    .map(([id, items]) => {
      const eligible = items.filter((o) => o.verdict === "eligible");
      const s = summarize(eligible.map((o) => o.best!.evaluation.metric!));
      const cat = c.categories.get(id);
      const coveredMarkets = new Set(items.flatMap((o) => o.pairs.filter((x) => x.result.salePrice.status !== "no_data").map((x) => x.marketplace)));
      return {
        id,
        name: cat?.name ?? id,
        synthetic: Boolean(cat?.synthetic),
        eligible: s.count,
        insufficient: items.filter((o) => o.verdict === "insufficient").length,
        mean: s.mean,
        median: s.median,
        covered: Math.min(coveredMarkets.size, sellCount),
        demand: eligible.some((o) => o.best!.salesPerMonth !== null) ? eligible.reduce((sum, o) => sum + (o.best!.salesPerMonth ?? 0), 0) : null,
      };
    })
    .sort((a, b) => b.eligible - a.eligible || (b.median ?? 0) - (a.median ?? 0));
}
