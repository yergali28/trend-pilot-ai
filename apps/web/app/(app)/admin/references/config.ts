// Поля справочников для ручного ввода администратором. Значения только из официальных источников, с датой.

export type FieldType = "text" | "number" | "rate" | "date" | "datetime" | "url" | "select";
export interface RefField {
  name: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

const provenance: RefField[] = [
  { name: "valid_from", type: "date", required: true },
  { name: "valid_to", type: "date", required: false },
  { name: "source_url", type: "url", required: true },
  { name: "fetched_at", type: "datetime", required: true },
];
// Справочник — только официальные значения: статус «получено напрямую».
const status: RefField = { name: "status", type: "select", required: true, options: ["verified"] };

export const REFERENCES = {
  fee_rules: {
    fields: [
      { name: "marketplace_id", type: "select", required: true, options: ["kaspi", "ozon", "wildberries"] },
      { name: "country", type: "select", required: true, options: ["KZ", "RU"] },
      { name: "fee_type", type: "select", required: true, options: ["commission", "acquiring", "other"] },
      { name: "rate", type: "rate", required: false },
      { name: "fixed_amount", type: "number", required: false },
      { name: "currency", type: "text", required: false },
      ...provenance,
      status,
    ],
    columns: ["marketplace_id", "country", "fee_type", "rate", "fixed_amount", "valid_from", "status"],
  },
  logistics_rates: {
    fields: [
      { name: "marketplace_id", type: "select", required: true, options: ["kaspi", "ozon", "wildberries"] },
      { name: "country", type: "select", required: true, options: ["KZ", "RU"] },
      { name: "scheme", type: "select", required: true, options: ["FBO", "FBS", "other"] },
      { name: "rate_type", type: "text", required: true },
      { name: "amount", type: "number", required: true },
      { name: "currency", type: "text", required: true },
      ...provenance,
      status,
    ],
    columns: ["marketplace_id", "country", "scheme", "rate_type", "amount", "currency", "status"],
  },
  cargo_rates: {
    fields: [
      { name: "carrier", type: "text", required: true },
      { name: "route", type: "text", required: true },
      { name: "delivery_method", type: "text", required: true },
      { name: "basis", type: "select", required: true, options: ["kg", "m3"] },
      { name: "rate", type: "number", required: true },
      { name: "currency", type: "text", required: true },
      ...provenance,
      status,
    ],
    columns: ["carrier", "route", "delivery_method", "basis", "rate", "currency", "status"],
  },
  customs_rules: {
    fields: [
      { name: "country", type: "select", required: true, options: ["KZ", "RU"] },
      { name: "hs_code", type: "text", required: true },
      { name: "duty_rate", type: "rate", required: false },
      { name: "vat_rate", type: "rate", required: false },
      ...provenance,
      status,
    ],
    columns: ["country", "hs_code", "duty_rate", "vat_rate", "valid_from", "status"],
  },
  fx_rates: {
    fields: [
      { name: "base_currency", type: "text", required: true },
      { name: "quote_currency", type: "text", required: true },
      { name: "rate", type: "number", required: true },
      { name: "rate_date", type: "date", required: true },
      { name: "source_url", type: "url", required: true },
      { name: "fetched_at", type: "datetime", required: true },
    ],
    columns: ["base_currency", "quote_currency", "rate", "rate_date"],
  },
  tax_profiles: {
    fields: [
      { name: "country", type: "select", required: true, options: ["KZ", "RU"] },
      { name: "regime", type: "text", required: true },
      { name: "base", type: "select", required: true, options: ["revenue", "profit"] },
      { name: "rate", type: "rate", required: true },
      { name: "valid_from", type: "date", required: true },
      { name: "valid_to", type: "date", required: false },
      { name: "source_url", type: "url", required: true },
      { name: "fetched_at", type: "datetime", required: true },
    ],
    columns: ["country", "regime", "base", "rate", "valid_from"],
  },
} satisfies Record<string, { fields: RefField[]; columns: string[] }>;

export type ReferenceTable = keyof typeof REFERENCES;
export const REFERENCE_TABLES = Object.keys(REFERENCES) as ReferenceTable[];
