import { ArrowLeftIcon, CoverageBadge, DataTable, EmptyState, OpportunityMap, StatusTag, formatNumber, type Column } from "@tp/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { missingLabel, valueKit } from "../../../../components/values";
import { COUNTRY_CURRENCY, demoEnabled, evaluateCatalog, loadCatalog, loadSources, parseParams, selectedSources, toQuery, type ProductOutcome } from "../../../../lib/catalog";
import { prefs } from "../../../../lib/prefs";
import { requireUser } from "../../../../lib/session";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category } = await params;
  const p = parseParams(await searchParams);
  const query = toQuery(p);
  const { db } = await requireUser(`/results/${category}?${query}`);
  const { t, locale } = await prefs();
  const [sources, catalog] = await Promise.all([loadSources(db), loadCatalog(db)]);
  const cat = catalog.categories.get(category);
  if (!cat) notFound();

  const sell = selectedSources(sources, "sell", p.sell);
  const buy = selectedSources(sources, "buy", p.buy);
  const outcomes = evaluateCatalog(catalog, p, sell.selected, buy.selected).filter((o) => o.categoryId === category);
  const eligible = outcomes.filter((o) => o.verdict === "eligible").sort((a, b) => (b.best!.evaluation.metric ?? 0) - (a.best!.evaluation.metric ?? 0));
  const notMatching = outcomes.filter((o) => o.verdict === "below_target" || o.verdict === "over_budget").length;
  const insufficient = outcomes.filter((o) => o.verdict === "insufficient");
  const v = valueKit(t, locale, COUNTRY_CURRENCY[p.country]);
  const nameOf = (id: string) => sources.find((s) => s.id === id)?.name ?? id;

  const columns: Column<ProductOutcome>[] = [
    {
      key: "title",
      header: t("col.product"),
      wrap: true,
      render: (o) => (
        <Link href={`/products/${o.id}?${query}&m=${o.best!.marketplace}`} className="font-medium text-action-soft-ink underline-offset-2 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {o.title}
        </Link>
      ),
    },
    { key: "market", from: "lg", header: t("col.marketplace"), render: (o) => nameOf(o.best!.marketplace) },
    { key: "purchase", from: "xl", header: t("col.purchase"), align: "end", render: (o) => v.money(o.best!.result.landed.purchase) },
    { key: "landed", from: "md", header: t("col.landed"), align: "end", render: (o) => v.money(o.best!.result.landed.total) },
    { key: "price", from: "sm", header: t("col.price"), align: "end", render: (o) => v.money(o.best!.result.salePrice) },
    { key: "profit", header: t("col.profit"), align: "end", render: (o) => v.profit(o.best!.result.netProfit) },
    { key: "multiple", header: t("col.multiple"), align: "end", sort: p.metric === "priceToCost" ? "descending" : "none", render: (o) => v.multiple(o.best!.result.priceToCostMultiple.realistic) },
    { key: "roi", from: "md", header: t("col.roi"), align: "end", sort: p.metric === "roi" ? "descending" : "none", render: (o) => v.percent(o.best!.result.roi) },
    { key: "demand", from: "lg", header: t("col.demand"), align: "end", render: (o) => v.sales(o.best!.salesPerMonth) },
    { key: "coverage", from: "xl", header: t("col.coverage"), render: (o) => <CoverageBadge covered={o.covered} total={sell.selected.length} label={t("coverage.short", { covered: o.covered, total: sell.selected.length })} /> },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/results?${query}`} className="inline-flex items-center gap-1 text-sm font-medium text-action-soft-ink underline-offset-2 hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            {t("category.back")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{cat.name}</h1>
          <p className="mt-1 text-base text-muted">{t("category.lead", { eligible: eligible.length, target: p.target, metric: t(`metric.${p.metric}`) })}</p>
        </div>
        {/* В демо-режиме пометка в шапке; здесь — только синтетика вне демо-режима (например, mock). */}
        {(cat.synthetic || outcomes.some((o) => o.synthetic)) && !demoEnabled() ? <StatusTag tone="info">{t("demo.badge")}</StatusTag> : null}
      </div>

      {eligible.length > 0 ? (
        <>
          <OpportunityMap
            points={outcomes.flatMap((o) => (o.best?.salesPerMonth && o.best.evaluation.metric !== null ? [{ id: o.id, label: o.title, x: o.best.salesPerMonth, y: o.best.evaluation.metric, href: `/products/${o.id}?${query}&m=${o.best.marketplace}` }] : []))}
            target={p.target}
            title={t("map.products.title", { metric: t(`metric.${p.metric}`).toLowerCase() })}
            xLabel={t("map.x.products")}
            yLabel={t(`metric.${p.metric}`)}
            hotLabel={t("map.hot")}
            formatY={(n) => `${formatNumber(n, locale)}x`}
            pointTitle={(pt) => t("map.point.product", { title: pt.label, sales: formatNumber(pt.x, locale, 0), metric: `${formatNumber(pt.y, locale)}x` })}
            locale={locale}
          />
          <DataTable columns={columns} rows={eligible} rowKey={(o) => o.id} caption={cat.name} />
        </>
      ) : (
        <EmptyState title={t("empty.title")} text={t("empty.text")} />
      )}
      <p className="text-sm text-muted">{t("category.legend")}</p>
      {notMatching > 0 ? <p className="text-sm text-muted">{t("category.notMatching", { n: notMatching })}</p> : null}

      {insufficient.length > 0 ? (
        <section aria-labelledby="cat-insufficient-h" className="flex flex-col gap-3">
          <h2 id="cat-insufficient-h" className="text-xl font-semibold">
            {t("results.insufficient")}
          </h2>
          <ul className="flex flex-col divide-y divide-line rounded-panel border border-line bg-surface">
            {insufficient.map((o) => (
              <li key={o.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-medium text-ink">{o.title}</span>
                <span className="text-sm text-muted">{o.missing.map((f) => missingLabel(t, f)).join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
