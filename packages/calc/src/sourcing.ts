// Маржа закупки на 1688/Taobao при продаже на Wildberries: упрощённая юнит-экономика для поиска поставщика
// (без налогов, возвратов и сценариев — полный расчёт в calculate()).

/** Ставки расчёта маржи: задаются конфигом (окружение, база или форма), в коде значений нет. */
export interface MarginConfig {
  /** Курс: рублей за 1 юань. */
  cnyRubRate: number;
  /** Доставка до склада WB за единицу, ₽. */
  shippingPerUnitRub: number;
  /** Комиссия Wildberries, % от цены продажи. */
  wbCommissionPct: number;
  /** Прочие расходы на единицу (упаковка, маркировка, логистика WB), ₽. */
  otherCostsPerUnitRub: number;
}

export interface MarginResult {
  purchaseRub: number;
  commissionRub: number;
  costRub: number;
  profitRub: number;
  /** Прибыль / цена продажи, %; null при нулевой цене продажи. */
  marginPct: number | null;
}

const finiteNonNeg = (name: string, v: number) => {
  if (!Number.isFinite(v) || v < 0) throw new RangeError(`${name}: ожидается число ≥ 0, получено ${v}`);
};

export function sourcingMargin(purchaseCny: number, wbPriceRub: number, c: MarginConfig): MarginResult {
  finiteNonNeg("purchaseCny", purchaseCny);
  finiteNonNeg("wbPriceRub", wbPriceRub);
  finiteNonNeg("shippingPerUnitRub", c.shippingPerUnitRub);
  finiteNonNeg("otherCostsPerUnitRub", c.otherCostsPerUnitRub);
  finiteNonNeg("wbCommissionPct", c.wbCommissionPct);
  // Нулевой курс превратил бы закупку в 0 ₽ и завысил прибыль — это ошибка конфигурации, а не расчёт.
  if (!Number.isFinite(c.cnyRubRate) || c.cnyRubRate <= 0) throw new RangeError(`cnyRubRate: ожидается курс > 0, получено ${c.cnyRubRate}`);
  if (c.wbCommissionPct > 100) throw new RangeError(`wbCommissionPct: ожидается 0–100 %, получено ${c.wbCommissionPct}`);

  const purchaseRub = purchaseCny * c.cnyRubRate;
  const commissionRub = (wbPriceRub * c.wbCommissionPct) / 100;
  const costRub = purchaseRub + c.shippingPerUnitRub + commissionRub + c.otherCostsPerUnitRub;
  const profitRub = wbPriceRub - costRub;
  return { purchaseRub, commissionRub, costRub, profitRub, marginPct: wbPriceRub > 0 ? (profitRub / wbPriceRub) * 100 : null };
}

/**
 * Объёмный вес, кг: длина × ширина × высота (см) ÷ делитель. Делитель 6000 — распространённая норма перевозчиков;
 * у карго бывает 5000 или расчёт по плотности, поэтому делитель — параметр.
 */
export function volumetricWeightKg(cm: { length: number; width: number; height: number }, divisor = 6000): number {
  const { length, width, height } = cm;
  if (![length, width, height, divisor].every((v) => Number.isFinite(v) && v > 0)) throw new RangeError("Габариты и делитель должны быть больше нуля");
  return (length * width * height) / divisor;
}

/**
 * Логистика WB до покупателя по тарифу коробов: первый литр по базовой ставке, каждый следующий (в том числе
 * неполный) — по ставке за литр. Литраж — объём упаковки в литрах (см³ ÷ 1000).
 */
export function wbBoxLogistics(cm: { length: number; width: number; height: number }, firstLiter: number, extraLiter: number): number {
  if (![firstLiter, extraLiter].every((v) => Number.isFinite(v) && v >= 0)) throw new RangeError("Тарифы должны быть неотрицательными");
  const liters = (cm.length * cm.width * cm.height) / 1000;
  if (!(liters > 0)) throw new RangeError("Габариты должны быть больше нуля");
  return firstLiter + Math.max(0, Math.ceil(liters - 1)) * extraLiter;
}
