import { calculate, type CalcInput, type Input, type MoneyInput, type SourceRef } from "@tp/calc";

// Демо-данные UI-kit: синтетические (synthetic: true), не рыночные цены, комиссии или тарифы.
export const synthetic = true;

const source: SourceRef = { sourceId: "synthetic:ui-kit", method: "user_input", fetchedAt: "2026-10-18T00:00:00Z" };
const n = (value: number, extra: Partial<Input> = {}): Input => ({ value, status: "verified", source, ...extra });
const kzt = (value: number, extra: Partial<Input> = {}): MoneyInput => ({ ...n(value, extra), currency: "KZT" });

function demoInput(o: { price: number; purchase: number; cargo?: number; priceLow?: number; priceHigh?: number }): CalcInput {
  return {
    currency: "KZT",
    salePrice: kzt(o.price, o.priceLow ? { low: o.priceLow, high: o.priceHigh!, status: "estimated" } : {}),
    purchasePrice: kzt(o.purchase),
    chinaDelivery: kzt(100),
    ...(o.cargo === undefined ? {} : { cargoTariff: { ...kzt(o.cargo), basis: "kg" as const } }),
    shippingQuantity: n(2),
    customsDutyRate: n(0.1),
    importVatRate: n(0.12),
    certification: kzt(0),
    packaging: kzt(200),
    agentCommissionRate: n(0.05),
    marketplaceCommissionRate: n(0.1),
    marketplaceLogistics: kzt(500),
    acquiringRate: n(0.01),
    adRate: n(0.05),
    returnRate: n(0.1),
    reverseLogistics: kzt(300),
    tax: { mode: "off", source },
  };
}

export const demoProducts = [
  { id: "organizer", title: "Органайзер для кабеля, 3 шт.", covered: 2, history: [9800, 9900, 10100, 9950, 10000, 10050, 10000], input: demoInput({ price: 10000, purchase: 2000, cargo: 500, priceLow: 9000, priceHigh: 11000 }) },
  { id: "case", title: "Чехол для ноутбука 14″", covered: 1, history: [17200, 17000, 16800, 16900, 16600, 16500, 16500], input: demoInput({ price: 16500, purchase: 1600, cargo: 300 }) },
  { id: "brushes", title: "Набор щёток для чистки", covered: 2, history: [12100, 12400, 12600, 12500, 12800, 13000, 13000], input: demoInput({ price: 13000, purchase: 400, cargo: 150 }) },
  { id: "lamp", title: "Настольная лампа складная", covered: 2, history: [8100, 8000, 7900, 7950, 7800, 7700, 7600], input: demoInput({ price: 7600, purchase: 3000, cargo: 700 }) },
  { id: "stand", title: "Подставка для телефона", covered: 1, history: [6900, 6900, 7000, 6950, 6900, 6900, 6900], input: demoInput({ price: 6900, purchase: 1100 }) },
].map((p) => ({ ...p, result: calculate(p.input) }));

/** Товар для карточки — первая строка таблицы: цена продажи — оценочный диапазон, чтобы показать три сценария. */
export const demoCard = demoProducts[0]!.result;
