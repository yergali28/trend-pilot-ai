export type Status = "verified" | "estimated" | "no_data";
export type Method = "api" | "provider" | "public_page" | "user_input" | "reference";

export interface SourceRef {
  sourceId: string;
  method: Method;
  fetchedAt: string;
}

/**
 * Входное значение с происхождением. `low`/`high` — границы, если их дал источник
 * или пользователь (например, буфер курса); без них диапазон вырожден в `value`.
 */
export interface Input {
  value: number;
  status: "verified" | "estimated";
  source: SourceRef;
  low?: number;
  high?: number;
}

export interface MoneyInput extends Input {
  currency: string;
}

export type TaxSetting =
  | { mode: "off"; source: SourceRef }
  | { mode: "on"; regime: string; base: "revenue" | "profit"; rate?: Input };

/**
 * Все денежные значения — за единицу товара. Доли: 0.12 = 12%.
 * Поле, которое не применимо (например, сертификация не нужна), передаётся явным нулём
 * с источником; отсутствующее поле означает «нет данных».
 */
export interface CalcInput {
  /** Валюта расчёта (страна площадки продажи), например KZT или RUB. */
  currency: string;
  salePrice?: MoneyInput;
  /** Курс: 1 единица ключевой валюты = value единиц валюты расчёта. */
  fxRates?: Record<string, Input>;

  purchasePrice?: MoneyInput;
  chinaDelivery?: MoneyInput;
  /** Тариф карго за 1 кг или 1 м³. */
  cargoTariff?: MoneyInput & { basis: "kg" | "m3" };
  /** Вес (кг) или объём (м³) единицы, в той же базе, что и тариф. */
  shippingQuantity?: Input;
  /** Доля от таможенной стоимости. */
  customsDutyRate?: Input;
  /** Доля от (таможенная стоимость + пошлина). */
  importVatRate?: Input;
  certification?: MoneyInput;
  packaging?: MoneyInput;
  /** Доля от стоимости закупки. */
  agentCommissionRate?: Input;

  /** Доли от цены продажи. */
  marketplaceCommissionRate?: Input;
  acquiringRate?: Input;
  adRate?: Input;
  marketplaceLogistics?: MoneyInput;
  /** Доля возвратов и невыкупа. */
  returnRate?: Input;
  /** Стоимость обратной логистики одного возврата. */
  reverseLogistics?: MoneyInput;
  tax?: TaxSetting;
}

export interface InputRef {
  field: string;
  source: SourceRef;
}

export interface ResultValue {
  status: Status;
  pessimistic: number | null;
  realistic: number | null;
  optimistic: number | null;
  sources: InputRef[];
  /** Поля, которых не хватило для расчёта. */
  missing: string[];
  reason?: "missing_input" | "division_by_zero";
}

export interface CalcResult {
  currency: string;
  landed: {
    purchase: ResultValue;
    chinaDelivery: ResultValue;
    internationalShipping: ResultValue;
    customsDuty: ResultValue;
    importVat: ResultValue;
    certification: ResultValue;
    packaging: ResultValue;
    agentCommission: ResultValue;
    total: ResultValue;
  };
  selling: {
    marketplaceCommission: ResultValue;
    marketplaceLogistics: ResultValue;
    acquiring: ResultValue;
    ads: ResultValue;
    returns: ResultValue;
    tax: ResultValue;
    total: ResultValue;
  };
  salePrice: ResultValue;
  netProfit: ResultValue;
  /** Кратность = цена продажи ÷ landed cost. */
  priceToCostMultiple: ResultValue;
  /** ROI = чистая прибыль ÷ вложения (landed cost единицы). */
  roi: ResultValue;
  netMarginPct: ResultValue;
}
