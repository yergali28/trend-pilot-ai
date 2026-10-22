import type { Adapter } from "./core";
import { aliexpress } from "./aliexpress";
import { analytics } from "./analytics";
import { kaspi } from "./kaspi";
import { mpstats } from "./mpstats";
import { ozon } from "./ozon";
import { wildberries } from "./wildberries";
import { wildberriesSales } from "./wildberries/sales";

export * from "./core";
export * from "./core/http";
export * from "./wildberries/tariffs";
export * from "./cbr";
export { MPSTATS_CATEGORY_ITEMS } from "./mpstats";
export { WB_ORDERS_URL, WB_SALES_URL } from "./wildberries/sales";
export * from "./sourcing";

export const adapters: Record<string, Adapter> = { kaspi, wildberries, "wildberries-sales": wildberriesSales, ozon, aliexpress, analytics, mpstats };
