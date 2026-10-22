import type { Adapter } from "./core";
import { aliexpress } from "./aliexpress";
import { analytics } from "./analytics";
import { kaspi } from "./kaspi";
import { ozon } from "./ozon";
import { wildberries } from "./wildberries";
import { wildberriesSales } from "./wildberries/sales";

export * from "./core";
export * from "./core/http";
export * from "./wildberries/tariffs";
export { WB_ORDERS_URL, WB_SALES_URL } from "./wildberries/sales";

export const adapters: Record<string, Adapter> = { kaspi, wildberries, "wildberries-sales": wildberriesSales, ozon, aliexpress, analytics };
