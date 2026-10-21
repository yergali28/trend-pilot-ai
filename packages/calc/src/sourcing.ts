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
