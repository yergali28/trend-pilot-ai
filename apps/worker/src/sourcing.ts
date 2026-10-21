import { createSourcingProvider, findSourcing, marginConfigFromEnv } from "@tp/adapters";

// Поиск закупки на 1688 и Taobao: `pnpm --filter @tp/worker sourcing <ключевое слово> --wb-price <₽> [--top N] [--max-moq N]`.
// Провайдер — PROVIDER (mock | onebound | apify), ставки маржи — SOURCING_* из окружения; ключи не выводятся.
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const keyword = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--")) ?? "";
const wbPriceRub = Number(flag("wb-price"));
if (!keyword || !Number.isFinite(wbPriceRub)) {
  console.error("Использование: sourcing <ключевое слово> --wb-price <₽> [--top N] [--max-moq N]");
  process.exit(2);
}

const provider = createSourcingProvider();
const { candidates, errors } = await findSourcing(keyword, {
  provider,
  wbPriceRub,
  margin: marginConfigFromEnv(),
  topN: Number(flag("top") ?? 10),
  ...(flag("max-moq") ? { maxMoq: Number(flag("max-moq")) } : {}),
});
const rub = (n: number) => Math.round(n * 100) / 100;
console.log(`провайдер: ${provider.name}, запрос: «${keyword}», цена WB: ${wbPriceRub} ₽`);
console.table(
  candidates.map((c) => ({
    площадка: c.marketplace,
    id: c.itemId,
    название: c.titleCn,
    "цена ¥": c.priceCny,
    MOQ: c.minOrderQty ?? "—",
    "партия ¥": c.minOrderCostCny === null ? "—" : rub(c.minOrderCostCny),
    "себест. ₽": rub(c.margin.costRub),
    "прибыль ₽": rub(c.margin.profitRub),
    "маржа %": c.margin.marginPct === null ? "—" : rub(c.margin.marginPct),
  })),
);
for (const e of errors) console.error(`${e.marketplace}: ${e.error.name}: ${e.error.message}`);
