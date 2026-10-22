import { CoverageBadge, DataTable, EmptyState, OpportunityMap, SourceStatus, StatusTag, formatNumber, type Column } from "@tp/ui";
import Link from "next/link";
import { missingLabel } from "../../../components/values";
import { demoEnabled, evaluateCatalog, loadCatalog, loadSources, parseParams, selectedSources, summarizeCategories, toQuery, type CategorySummary, type ProductOutcome } from "../../../lib/catalog";
import { prefs } from "../../../lib/prefs";
import { requireUser } from "../../../lib/session";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const p = parseParams(sp);
  const query = toQuery(p);
  const { db } = await requireUser(`/results?${query}`);
  const { t, locale } = await prefs();
  const [sources, catalog] = await Promise.all([loadSources(db), loadCatalog(db)]);
  const sell = selectedSources(sources, "sell", p.sell);
  const buy = selectedSources(sources, "buy", p.buy);
  const outcomes = evaluateCatalog(catalog, p, sell.selected, buy.selected);
  const categories = summarizeCategories(catalog, outcomes, sell.selected.length);
  const insufficient = outcomes.filter((o) => o.verdict === "insufficient");
  const covered = new Set(outcomes.flatMap((o) => o.pairs.filter((x) => x.result.salePrice.status !== "no_data").map((x) => x.marketplace))).size;
  const num = (v: number | null) => (v === null ? t("value.nodata") : `${formatNumber(v, locale)}x`);
  const reasonOf = (s: (typeof sources)[number]) => s.statusReason ?? t(`sourceStatus.${s.status}`);
  const demo = outcomes.some((o) => o.synthetic);

  const columns: Column<CategorySummary>[] = [
    {
      key: "name",
      header: t("results.col.category"),
      wrap: true,
      render: (c) => (
        <Link href={`/results/${c.id}?${query}`} className="font-medium text-action-soft-ink underline-offset-2 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {c.name}
        </Link>
      ),
    },
    { key: "eligible", header: t("results.col.eligible"), align: "end", sort: "descending", render: (c) => c.eligible },
    { key: "mean", header: t(`results.col.mean.${p.metric}`), align: "end", from: "md", render: (c) => num(c.mean) },
    { key: "median", header: t(`results.col.median.${p.metric}`), align: "end", render: (c) => num(c.median) },
    { key: "insufficient", header: t("results.col.insufficient"), align: "end", from: "lg", render: (c) => c.insufficient },
    { key: "coverage", header: t("col.coverage"), from: "sm", render: (c) => <CoverageBadge covered={c.covered} total={sell.selected.length} label={t("coverage.short", { covered: c.covered, total: sell.selected.length })} /> },
  ];

  const insufficientColumns: Column<ProductOutcome>[] = [
    { key: "title", header: t("col.product"), wrap: true, render: (o) => <span className="font-medium text-ink">{o.title}</span> },
    { key: "missing", header: t("results.col.missing"), wrap: true, render: (o) => <span className="text-muted">{o.missing.map((f) => missingLabel(t, f)).join(", ")}</span> },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("results.title")}</h1>
          <p className="mt-2 text-base text-muted">
            {t("results.params", { target: formatNumber(p.target, locale), metric: t(`metric.${p.metric}`), country: t(`country.${p.country === "KZ" ? "kz" : "ru"}`) })}
            {p.budget !== null ? ` · ${t("results.budget", { budget: formatNumber(p.budget, locale, 0), currency: p.budgetCurrency })}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {/* В демо-режиме пометка в шапке; здесь — только синтетика вне демо-режима (например, mock). */}
        {demo && !demoEnabled() ? <StatusTag tone="info">{t("demo.badge")}</StatusTag> : null}
          <CoverageBadge covered={covered} total={sell.selected.length} label={t("coverage.label", { covered, total: sell.selected.length })} />
          <Link href={`/?${query}`} className="text-sm font-medium text-action-soft-ink underline-offset-2 hover:underline">
            {t("results.edit")}
          </Link>
        </div>
      </div>

      {sell.inactive.length + buy.inactive.length > 0 ? (
        <section aria-labelledby="unavailable-h" className="flex flex-col gap-3">
          <h2 id="unavailable-h" className="text-md font-semibold">
            {t("results.unavailable")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...sell.inactive, ...buy.inactive].map((s) => (
              <SourceStatus key={s.id} name={s.name} state={s.status} stateLabel={t(`sourceStatus.${s.status}`)} reason={reasonOf(s)} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="categories-h" className="flex flex-col gap-4">
        <h2 id="categories-h" className="text-xl font-semibold">
          {t("results.categories")}
        </h2>
        {sell.selected.length === 0 || buy.selected.length === 0 ? (
          <EmptyState title={t("results.noSources.title")} text={t("results.noSources.text")} />
        ) : categories.some((c) => c.eligible > 0) ? (
          <>
            <OpportunityMap
              points={categories.flatMap((c) => (c.eligible > 0 && c.demand && c.median !== null ? [{ id: c.id, label: c.name, x: c.demand, y: c.median, weight: c.eligible, href: `/results/${c.id}?${query}` }] : []))}
              target={p.target}
              title={t("map.categories.title", { metric: t(`metric.${p.metric}`).toLowerCase() })}
              xLabel={t("map.x.categories")}
              yLabel={t(`results.col.median.${p.metric}`)}
              hotLabel={t("map.hot")}
              formatY={(v) => `${formatNumber(v, locale)}x`}
              pointTitle={(pt) => t("map.point.category", { title: pt.label, sales: formatNumber(pt.x, locale, 0), metric: `${formatNumber(pt.y, locale)}x`, n: pt.weight ?? 0 })}
              locale={locale}
            />
            <p className="text-sm text-muted">{t("map.legend", { target: `${formatNumber(p.target, locale)}x` })}</p>
            <DataTable columns={columns} rows={categories.filter((c) => c.eligible > 0)} rowKey={(c) => c.id} caption={t("results.categories")} />
          </>
        ) : (
          <EmptyState title={t("empty.title")} text={t("empty.text")} />
        )}
      </section>

      {insufficient.length > 0 ? (
        <section aria-labelledby="insufficient-h" className="flex flex-col gap-4">
          <div>
            <h2 id="insufficient-h" className="text-xl font-semibold">
              {t("results.insufficient")}
            </h2>
            <p className="mt-1 max-w-[65ch] text-base text-muted">{t("results.insufficient.lead")}</p>
          </div>
          <DataTable columns={insufficientColumns} rows={insufficient} rowKey={(o) => o.id} caption={t("results.insufficient")} />
        </section>
      ) : null}
    </div>
  );
}
