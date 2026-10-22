import { sourcingMargin, type MarginConfig, type MarginResult } from "@tp/calc";
import { apifyProvider, mockProvider, oneboundProvider } from "./providers";
import type { Marketplace, Product, ProviderName, SourcingProvider } from "./model";

export { Marketplace, Product, ProviderAuthError, ProviderRateLimit, ProviderUnavailable, toProviderError } from "./model";
export type { ProviderName, SearchOptions, SortOrder, SourcingProvider } from "./model";
export { apifyProvider, mockProvider, oneboundProvider, sortProducts, mapApify1688, mapApifyTaobao, mapOneboundItem, mapOneboundSearchItem, APIFY_ACTORS } from "./providers";

type Env = Record<string, string | undefined>;

/**
 * Кэш поиска и карточек на `ttlMs`, чтобы не тратить оплаченные запросы на повторы.
 * ponytail: кэш в памяти процесса; общий кэш между воркерами — через raw_responses, когда понадобится.
 */
export function withCache(provider: SourcingProvider, ttlMs: number, now: () => number = Date.now): SourcingProvider {
  const store = new Map<string, { at: number; value: Promise<unknown> }>();
  const memo = <T>(key: string, load: () => Promise<T>): Promise<T> => {
    const hit = store.get(key);
    if (hit && now() - hit.at < ttlMs) return hit.value as Promise<T>;
    const value = load();
    store.set(key, { at: now(), value });
    value.catch(() => store.delete(key)); // ошибки не кэшируются
    return value;
  };
  return {
    name: provider.name,
    search: (m, kw, o = {}) => memo(`s:${m}:${kw}:${o.page ?? 1}:${o.pageSize ?? 20}:${o.sort ?? "relevance"}`, () => provider.search(m, kw, o)),
    getItem: (m, id) => memo(`i:${m}:${id}`, () => provider.getItem(m, id)),
    ...(provider.searchByImage ? { searchByImage: provider.searchByImage.bind(provider) } : {}),
  };
}

const PROVIDERS: ProviderName[] = ["mock", "onebound", "apify"];

/** Провайдер по переменной PROVIDER (mock | onebound | apify; по умолчанию mock). Ключи — только из окружения. */
export function createSourcingProvider(env: Env = process.env, opts: { fixturesDir?: string; now?: () => number } = {}): SourcingProvider {
  const name = (env.PROVIDER ?? "mock").trim().toLowerCase() as ProviderName;
  if (!PROVIDERS.includes(name)) throw new Error(`PROVIDER=${name}: ожидается одно из ${PROVIDERS.join(", ")}`);
  if (name === "mock") return mockProvider(opts.fixturesDir);
  const hours = Number(env.SOURCING_CACHE_TTL_HOURS ?? 24);
  if (!Number.isFinite(hours) || hours < 0) throw new Error("SOURCING_CACHE_TTL_HOURS: ожидается число часов ≥ 0");
  const provider = name === "onebound" ? oneboundProvider(env) : apifyProvider(env);
  return hours > 0 ? withCache(provider, hours * 3_600_000, opts.now) : provider;
}

/** Ставки из окружения (SOURCING_CNY_RUB и др.); без значения — ошибка, а не подстановка. */
export function marginConfigFromEnv(env: Env = process.env): MarginConfig {
  const need = (k: string) => {
    const v = env[k];
    if (v === undefined || v.trim() === "") throw new Error(`Не задана ставка ${k}`);
    return Number(v.replace(",", "."));
  };
  return {
    cnyRubRate: need("SOURCING_CNY_RUB"),
    shippingPerUnitRub: need("SOURCING_SHIPPING_PER_UNIT_RUB"),
    wbCommissionPct: need("SOURCING_WB_COMMISSION_PCT"),
    otherCostsPerUnitRub: need("SOURCING_OTHER_COSTS_PER_UNIT_RUB"),
  };
}

export interface SourcingCandidate extends Product {
  /** Стоимость минимальной партии, ¥; null, если MOQ неизвестен. */
  minOrderCostCny: number | null;
  margin: MarginResult;
}

export interface FindSourcingOptions {
  provider: SourcingProvider;
  wbPriceRub: number;
  margin: MarginConfig;
  topN?: number;
  /** Сколько карточек запрашивать у провайдера с каждой площадки. */
  pageSize?: number;
  marketplaces?: Marketplace[];
  /** Отбросить кандидатов с известным MOQ больше этого. */
  maxMoq?: number;
}

export interface FindSourcingResult {
  candidates: SourcingCandidate[];
  /** Площадки, по которым поиск не удался; остальные результаты при этом возвращаются. */
  errors: { marketplace: Marketplace; error: Error }[];
}

/**
 * Поиск закупки на 1688 и Taobao: кандидаты по возрастанию цены за штуку, при равной цене — меньший MOQ выше,
 * неизвестный MOQ — ниже известного. Маржа считается относительно цены продажи на WB.
 */
export async function findSourcing(keyword: string, o: FindSourcingOptions): Promise<FindSourcingResult> {
  const marketplaces = o.marketplaces ?? ["1688", "taobao"];
  const settled = await Promise.allSettled(marketplaces.map((m) => o.provider.search(m, keyword, { pageSize: o.pageSize ?? 20, sort: "price_asc" })));
  const errors = settled.flatMap((s, i) => (s.status === "rejected" ? [{ marketplace: marketplaces[i]!, error: s.reason as Error }] : []));
  if (errors.length === marketplaces.length && errors[0]) throw errors[0].error;

  const moq = (p: Product) => p.minOrderQty ?? Infinity;
  const candidates = settled
    .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
    .filter((p) => o.maxMoq === undefined || p.minOrderQty === null || p.minOrderQty <= o.maxMoq)
    .sort((a, b) => a.priceCny - b.priceCny || (moq(a) === moq(b) ? 0 : moq(a) - moq(b)))
    .slice(0, o.topN ?? 10)
    .map((p) => ({ ...p, minOrderCostCny: p.minOrderQty === null ? null : p.priceCny * p.minOrderQty, margin: sourcingMargin(p.priceCny, o.wbPriceRub, o.margin) }));
  return { candidates, errors };
}
