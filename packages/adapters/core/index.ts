import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export type Mode = "live" | "replay" | "mock";

export const Method = z.enum(["api", "provider", "public_page", "user_input", "reference"]);

const base = {
  sourceId: z.string().min(1),
  externalId: z.string().min(1),
  title: z.string().min(1),
  method: Method,
  fetchedAt: z.iso.datetime(),
  synthetic: z.boolean(),
};

/** Предложение товара: на площадке закупки (source) или продажи (listing). */
export const OfferRecord = z.object({
  type: z.literal("offer"),
  ...base,
  kind: z.enum(["source", "listing"]),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  url: z.url().optional(),
  sellerId: z.string().optional(),
  moq: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().optional(),
});

/** Спрос от провайдера аналитики по товару площадки продажи `listingSourceId`. */
export const DemandRecord = z.object({
  type: z.literal("demand"),
  ...base,
  listingSourceId: z.string().min(1),
  salesPerMonth: z.number().nonnegative(),
  periodStart: z.iso.date().optional(),
  periodEnd: z.iso.date().optional(),
});

export const NormalizedRecord = z.discriminatedUnion("type", [OfferRecord, DemandRecord]);
export type NormalizedRecord = z.infer<typeof NormalizedRecord>;

export interface FetchRequest {
  query: string;
}

export interface RawResponse {
  sourceId: string;
  mode: Mode;
  request: FetchRequest;
  fetchedAt: string;
  body: unknown;
  synthetic: boolean;
}

export interface Rejected {
  reason: string;
  item: unknown;
}

export interface NormalizeResult {
  records: NormalizedRecord[];
  rejected: Rejected[];
}

export interface FetchOptions {
  mode: Mode;
  fixturesDir?: string;
  env?: Record<string, string | undefined>;
}

export interface Adapter {
  sourceId: string;
  tokenEnv: string;
  rawSchema: z.ZodType;
  fetch(req: FetchRequest, opts: FetchOptions): Promise<RawResponse>;
  normalize(raw: RawResponse): NormalizeResult;
}

export type AdapterErrorCode = "token_not_configured" | "not_implemented" | "fixture_not_found" | "contract_violation";

export class AdapterError extends Error {
  constructor(
    readonly code: AdapterErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AdapterError";
  }
}

export const defaultFixturesDir = fileURLToPath(new URL("../../../fixtures", import.meta.url));

// Запись ответа в fixtures/<source>/<query>.json.
const Fixture = z.object({ recordedAt: z.iso.datetime(), synthetic: z.boolean(), body: z.unknown() });

type Mapped<T> = NormalizedRecord | { reject: string; item: T };

interface Definition<Body extends z.ZodType> {
  sourceId: string;
  tokenEnv: string;
  /** Формат сырого ответа источника; на нём держится контрактный тест. */
  rawSchema: Body;
  /** Синтетический ответ в формате источника для режима mock. */
  mock(req: FetchRequest): z.infer<Body>;
  toRecords(body: z.infer<Body>, ctx: { fetchedAt: string; synthetic: boolean }): Mapped<unknown>[];
}

export function defineAdapter<Body extends z.ZodType>(def: Definition<Body>): Adapter {
  return {
    sourceId: def.sourceId,
    tokenEnv: def.tokenEnv,
    rawSchema: def.rawSchema,

    async fetch(req, opts) {
      const envelope = { sourceId: def.sourceId, mode: opts.mode, request: req };
      if (opts.mode === "live") {
        const token = (opts.env ?? process.env)[def.tokenEnv];
        if (!token) throw new AdapterError("token_not_configured", `Токен не настроен: ${def.tokenEnv} (${def.sourceId})`);
        throw new AdapterError("not_implemented", `Режим live для ${def.sourceId} ещё не реализован`);
      }
      if (opts.mode === "mock") {
        return { ...envelope, fetchedAt: new Date().toISOString(), body: def.mock(req), synthetic: true };
      }
      if (!/^[a-z0-9-]+$/.test(req.query)) {
        throw new AdapterError("fixture_not_found", `Недопустимое имя записи: ${req.query}`);
      }
      const file = `${opts.fixturesDir ?? defaultFixturesDir}/${def.sourceId}/${req.query}.json`;
      let text: string;
      try {
        text = await readFile(file, "utf8");
      } catch {
        throw new AdapterError("fixture_not_found", `Нет записанного ответа: ${file}`);
      }
      const fx = Fixture.parse(JSON.parse(text));
      return { ...envelope, fetchedAt: fx.recordedAt, body: fx.body, synthetic: fx.synthetic };
    },

    normalize(raw) {
      const parsed = def.rawSchema.safeParse(raw.body);
      if (!parsed.success) {
        throw new AdapterError("contract_violation", `${def.sourceId}: ответ не совпал со схемой: ${parsed.error.message}`);
      }
      const out: NormalizeResult = { records: [], rejected: [] };
      for (const m of def.toRecords(parsed.data, { fetchedAt: raw.fetchedAt, synthetic: raw.synthetic })) {
        if ("reject" in m) out.rejected.push({ reason: m.reject, item: m.item });
        else out.records.push(NormalizedRecord.parse(m));
      }
      return out;
    },
  };
}
