import { ArrowLeftIcon, DataTable, StatusTag, type Column } from "@tp/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { valueKit } from "../../../../components/values";
import { COUNTRY_CURRENCY, demoEnabled, evaluateCatalog, loadCatalog, loadSources, parseParams, selectedSources, toQuery, type Pair } from "../../../../lib/catalog";
import { prefs } from "../../../../lib/prefs";
import { requireUser } from "../../../../lib/session";
import { UnitEconomicsEditor } from "./UnitEconomicsEditor";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const p = parseParams(sp);
  const query = toQuery(p);
  const { db } = await requireUser(`/products/${id}?${query}`);
  const { t, locale } = await prefs();
  const [sources, catalog] = await Promise.all([loadSources(db), loadCatalog(db)]);
  const product = catalog.products.get(id);
  if (!product || product.kind !== "source") notFound();

  const sell = selectedSources(sources, "sell", p.sell);
  // Карточка открывается и для товара вне выбранных площадок закупки: расчёт по всем выбранным площадкам продажи.
  const outcome = evaluateCatalog(catalog, p, sell.selected, sources.filter((s) => s.id === product.source_id)).find((o) => o.id === id);
  if (!outcome) notFound();
  const m = typeof sp.m === "string" ? sp.m : outcome.best?.marketplace;
  const pair = outcome.pairs.find((x) => x.marketplace === m) ?? outcome.best;
  const v = valueKit(t, locale, COUNTRY_CURRENCY[p.country]);
  const sourceNames: Record<string, string> = {
    ...Object.fromEntries(sources.map((s) => [s.id, s.name])),
    analytics: t("source.analytics"),
    "demo:assumptions": t("source.demoAssumptions"),
    user: t("source.user"),
    "settings:default-tax-off": t("source.defaultTax"),
    ...Object.fromEntries(["fx_rates", "cargo_rates", "fee_rules"].map((tb) => [`reference:${tb}`, t("source.reference", { table: t(`ref.table.${tb}` as "ref.table.fx_rates") })])),
  };
  const category = product.category_id ? catalog.categories.get(product.category_id) : undefined;

  const matrix: Column<Pair>[] = [
    {
      key: "market",
      header: t("col.marketplace"),
      render: (x) =>
        x.marketplace === pair?.marketplace ? (
          <span className="font-semibold text-ink">{sourceNames[x.marketplace]}</span>
        ) : (
          <Link href={`/products/${id}?${query}&m=${x.marketplace}`} className="font-medium text-action-soft-ink underline-offset-2 hover:underline">
            {sourceNames[x.marketplace]}
          </Link>
        ),
    },
    { key: "price", header: t("col.price"), align: "end", from: "sm", render: (x) => v.money(x.result.salePrice) },
    { key: "profit", header: t("col.profit"), align: "end", render: (x) => v.profit(x.result.netProfit) },
    { key: "multiple", header: t("col.multiple"), align: "end", render: (x) => v.multiple(x.result.priceToCostMultiple.realistic) },
    { key: "roi", header: t("col.roi"), align: "end", from: "md", render: (x) => v.percent(x.result.roi) },
    { key: "demand", header: t("col.demand"), align: "end", from: "md", render: (x) => v.sales(x.salesPerMonth) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {category ? (
            <Link href={`/results/${category.id}?${query}`} className="inline-flex items-center gap-1 text-sm font-medium text-action-soft-ink underline-offset-2 hover:underline">
              <ArrowLeftIcon className="size-3.5" />
              {t("product.back", { category: category.name })}
            </Link>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold">{product.title}</h1>
          <p className="mt-1 text-base text-muted">{t("product.lead", { source: sourceNames[product.source_id] ?? product.source_id })}</p>
        </div>
        {/* В демо-режиме пометка в шапке; здесь — только синтетика вне демо-режима (например, mock). */}
        {product.synthetic && !demoEnabled() ? <StatusTag tone="info">{t("demo.badge")}</StatusTag> : null}
      </div>

      <section aria-labelledby="matrix-h" className="flex flex-col gap-3">
        <h2 id="matrix-h" className="text-md font-semibold">
          {t("product.matrix")}
        </h2>
        <DataTable columns={matrix} rows={outcome.pairs} rowKey={(x) => x.marketplace} caption={t("product.matrix")} />
      </section>

      {pair ? (
        <section aria-labelledby="ue-h" className="flex flex-col gap-4">
          <h2 id="ue-h" className="text-xl font-semibold">
            {t("product.unitEconomics", { marketplace: sourceNames[pair.marketplace] ?? pair.marketplace })}
          </h2>
          <UnitEconomicsEditor key={pair.marketplace} locale={locale} input={pair.input} sourceNames={sourceNames} save={{ sourceProductId: id, listingProductId: pair.listingId }} />
        </section>
      ) : null}
    </div>
  );
}
