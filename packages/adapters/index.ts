import type { Adapter } from "./core";
import { aliexpress } from "./aliexpress";
import { analytics } from "./analytics";
import { kaspi } from "./kaspi";
import { ozon } from "./ozon";
import { wildberries } from "./wildberries";

export * from "./core";
export * from "./core/http";

export const adapters: Record<string, Adapter> = { kaspi, wildberries, ozon, aliexpress, analytics };
