import { z } from "zod";
import { AdapterError } from "../core";

export const Marketplace = z.enum(["1688", "taobao"]);
export type Marketplace = z.infer<typeof Marketplace>;

/** Единая карточка закупки с Taobao/1688. Чего провайдер не дал — null, без подстановок. */
export const Product = z.object({
  marketplace: Marketplace,
  itemId: z.string().min(1),
  titleCn: z.string().min(1),
  titleEn: z.string().nullable(),
  priceCny: z.number().nonnegative(),
  minOrderQty: z.number().int().positive().nullable(),
  salesCount: z.number().int().nonnegative().nullable(),
  supplierId: z.string().nullable(),
  supplierName: z.string().nullable(),
  city: z.string().nullable(),
  province: z.string().nullable(),
  imageUrl: z.string().nullable(),
  url: z.string().nullable(),
  /** Исходная запись провайдера, как пришла. */
  raw: z.unknown(),
});
export type Product = z.infer<typeof Product>;

export type SortOrder = "relevance" | "price_asc" | "price_desc" | "sales_desc";

export interface SearchOptions {
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
}

export type ProviderName = "mock" | "onebound" | "apify";

export interface SourcingProvider {
  readonly name: ProviderName;
  search(marketplace: Marketplace, keyword: string, opts?: SearchOptions): Promise<Product[]>;
  /** null — товар не найден у провайдера. */
  getItem(marketplace: Marketplace, itemId: string): Promise<Product | null>;
  searchByImage?(marketplace: Marketplace, imageUrl: string, opts?: SearchOptions): Promise<Product[]>;
}

/** Ключ не задан или отклонён провайдером. */
export class ProviderAuthError extends Error {
  override name = "ProviderAuthError";
}
/** Превышен лимит или квота провайдера и повторы не помогли. */
export class ProviderRateLimit extends Error {
  override name = "ProviderRateLimit";
}
/** Провайдер не ответил, ответил ошибкой или не поддерживает операцию. */
export class ProviderUnavailable extends Error {
  override name = "ProviderUnavailable";
}

/** Ошибки общего HTTP-клиента → ошибки слоя закупок. Сообщения без ключей: в них только хост и путь. */
export function toProviderError(e: unknown): Error {
  if (!(e instanceof AdapterError)) return e as Error;
  if (e.code === "auth_error" || e.code === "token_not_configured") return new ProviderAuthError(e.message);
  if (e.code === "rate_limited") return new ProviderRateLimit(e.message);
  return new ProviderUnavailable(e.message);
}

/** Число из строки или числа провайдера («17.00», 7000); пусто и мусор → null. */
export const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
export const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : typeof v === "number" ? String(v) : null);
export const int = (v: unknown, min: number): number | null => {
  const n = num(v);
  return n !== null && Number.isInteger(n) && n >= min ? n : null;
};
