import { waterfall, type ResultValue, type WaterfallStep } from "@tp/calc";
import {
  Button,
  CoverageBadge,
  DataTable,
  EmptyState,
  MarketplacePicker,
  MultipleBadge,
  NoData,
  ProductCard,
  RiskIcon,
  SelectField,
  SourceStatus,
  Sparkline,
  StatusTag,
  TextField,
  Value,
  Waterfall,
  formatMoney,
  formatPercent,
  type Column,
} from "@tp/ui";
import type { ReactNode } from "react";
import { isLocale, translator, type Locale, type MessageKey } from "../../lib/i18n";
import { demoCard, demoProducts } from "./demo";
import { SectionNav } from "./SectionNav";
import { TokenSwatch } from "./TokenSwatch";

type Search = Promise<{ theme?: string; lang?: string }>;
type Product = (typeof demoProducts)[number];

const MARKETPLACES_TOTAL = 3;

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-16 border-t border-line pt-10 pb-14 first:border-t-0">
      <h2 id={`${id}-h`} className="text-xl font-semibold text-ink">
        {title}
      </h2>
      {lead ? <p className="mt-2 max-w-[65ch] text-base text-muted">{lead}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Spec({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-start gap-2">
      {children}
      <figcaption className="text-sm text-subtle">{caption}</figcaption>
    </figure>
  );
}

export default async function DesignPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const theme = sp.theme === "dark" ? "dark" : "light";
  const locale: Locale = isLocale(sp.lang) ? sp.lang : "ru";
  const t = translator(locale);
  const money = (v: number) => formatMoney(v, "KZT", locale);
  const nd = t("value.nodata");
  const est = t("value.estimated");
  const contrastLabel = t("palette.contrast");
  const href = (o: { theme?: string; lang?: string }) => `?${new URLSearchParams({ theme, lang: locale, ...o })}`;

  const sections: { id: string; title: string }[] = (
    [
      ["palette", "section.palette"],
      ["type", "section.type"],
      ["spacing", "section.spacing"],
      ["controls", "section.controls"],
      ["picker", "section.picker"],
      ["table", "section.table"],
      ["card", "section.card"],
      ["badges", "section.badges"],
      ["states", "section.states"],
    ] as [string, MessageKey][]
  ).map(([id, key]) => ({ id, title: t(key) }));

  const moneyCell = (v: Pick<ResultValue, "status" | "realistic">) => (
    <Value status={v.status} noDataLabel={nd} estimatedLabel={est}>
      {v.realistic === null ? null : money(v.realistic)}
    </Value>
  );

  // Убыток виден сразу: цвет риска, иконка и слово для экранного диктора.
  const profitCell = (v: Pick<ResultValue, "status" | "realistic">) =>
    v.realistic !== null && v.realistic < 0 ? (
      <span className="inline-flex items-center gap-1 font-medium text-risk">
        <RiskIcon className="size-3.5" />
        <span className="sr-only">{t("value.loss")}</span>
        {moneyCell(v)}
      </span>
    ) : (
      moneyCell(v)
    );

  const columns: Column<Product>[] = [
    { key: "title", header: t("col.product"), render: (p) => <span className="font-medium text-ink">{p.title}</span> },
    { key: "purchase", header: t("col.purchase"), align: "end", render: (p) => moneyCell(p.result.landed.purchase) },
    { key: "landed", header: t("col.landed"), align: "end", render: (p) => moneyCell(p.result.landed.total) },
    { key: "price", header: t("col.price"), align: "end", render: (p) => moneyCell(p.result.salePrice) },
    { key: "profit", header: t("col.profit"), align: "end", render: (p) => profitCell(p.result.netProfit) },
    { key: "multiple", header: t("col.multiple"), align: "end", sort: "descending", render: (p) => <MultipleBadge value={p.result.priceToCostMultiple.realistic} locale={locale} noDataLabel={nd} /> },
    { key: "roi", header: t("col.roi"), align: "end", render: (p) => (p.result.roi.realistic === null ? <NoData label={nd} /> : formatPercent(p.result.roi.realistic, locale)) },
    { key: "trend", header: t("col.trend"), align: "end", render: (p) => <Sparkline points={p.history} label={t("trend.label")} /> },
    { key: "coverage", header: t("col.coverage"), render: (p) => <CoverageBadge covered={p.covered} total={MARKETPLACES_TOTAL} label={t("coverage.short", { covered: p.covered, total: MARKETPLACES_TOTAL })} /> },
  ];

  const wfLabels = Object.fromEntries(
    (["salePrice", "purchase", "delivery", "customs", "otherLanded", "marketplace", "ads", "returns", "tax", "netProfit"] as const).map((k) => [k, t(`wf.${k}`)]),
  ) as Record<WaterfallStep["key"], string>;
  const profit = demoCard.netProfit;
  const scenarios = [
    ["scenario.pessimistic", profit.pessimistic],
    ["scenario.realistic", profit.realistic],
    ["scenario.optimistic", profit.optimistic],
  ] as const;

  const multiples = [1.7, 2.4, 3.6, 5.6, 10.7];
  const typeScale: [string, string, MessageKey][] = [
    ["text-2xl font-semibold", "2xl · 32/40 · 600", "type.display"],
    ["text-xl font-semibold", "xl · 24/32 · 600", "type.heading"],
    ["text-lg font-semibold", "lg · 20/28 · 600", "card.range"],
    ["text-base", "base · 14/22 · 400", "type.body"],
    ["text-sm text-muted", "sm · 13/20 · 400", "type.caption"],
  ];

  return (
    <div data-theme={theme} lang={locale} className="min-h-screen bg-bg text-ink">
      <header className="bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-4 py-8 sm:px-8">
          <div>
            <h1 className="text-2xl font-semibold">{t("design.title")}</h1>
            <p className="mt-2 max-w-[60ch] text-base text-muted">{t("design.lead")}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <StatusTag tone="info">{t("design.demo")}</StatusTag>
            <div className="flex flex-wrap gap-4 text-sm">
              <nav aria-label={t("design.theme")} className="flex items-center gap-1">
                <span className="mr-1 text-muted">{t("design.theme")}</span>
                {(["light", "dark"] as const).map((v) => (
                  <a key={v} href={href({ theme: v })} aria-current={theme === v ? "true" : undefined} className={`rounded-control px-2.5 py-1.5 outline-none pointer-coarse:py-3 focus-visible:outline-2 focus-visible:outline-focus ${theme === v ? "bg-action-soft font-medium text-action-soft-ink" : "text-muted hover:text-ink"}`}>
                    {t(`design.theme.${v}`)}
                  </a>
                ))}
              </nav>
              <nav aria-label={t("design.language")} className="flex items-center gap-1">
                <span className="mr-1 text-muted">{t("design.language")}</span>
                {(["ru", "en", "kk"] as const).map((v) => (
                  <a key={v} href={href({ lang: v })} lang={v} aria-current={locale === v ? "true" : undefined} className={`rounded-control px-2.5 py-1.5 uppercase outline-none pointer-coarse:py-3 focus-visible:outline-2 focus-visible:outline-focus ${locale === v ? "bg-action-soft font-medium text-action-soft-ink" : "text-muted hover:text-ink"}`}>
                    {v}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
      <SectionNav label={t("design.nav")} items={sections} />

      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        <Section id="palette" title={t("section.palette")} lead={t("section.palette.lead")}>
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted">{t("palette.neutral")}</h3>
              <TokenSwatch fill="--tp-bg" label={t("palette.bg")} token="--tp-bg" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-surface" ink="--tp-text" label={t("palette.surface")} token="--tp-surface" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-surface-sunken" ink="--tp-text-muted" label={t("palette.sunken")} token="--tp-surface-sunken" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-line-strong" label={t("palette.line")} token="--tp-line-strong" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-text" label={t("palette.text")} token="--tp-text" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-text-muted" label={t("palette.muted")} token="--tp-text-muted" contrastLabel={contrastLabel} />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted">{t("palette.action")}</h3>
              <TokenSwatch fill="--tp-action" ink="--tp-action-text" label={t("palette.action.main")} token="--tp-action" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-action-soft" ink="--tp-action-soft-text" label={t("palette.action.soft")} token="--tp-action-soft" contrastLabel={contrastLabel} />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted">{t("palette.multiple")}</h3>
              <TokenSwatch fill="--tp-x-below-bg" ink="--tp-x-below-text" label={t("palette.multiple.below")} token="--tp-x-below-bg" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-x2-bg" ink="--tp-x2-text" label="2x" token="--tp-x2-bg" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-x3-bg" ink="--tp-x3-text" label="3x" token="--tp-x3-bg" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-x5-bg" ink="--tp-x5-text" label="5x" token="--tp-x5-bg" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-x10-bg" ink="--tp-x10-text" label="10x" token="--tp-x10-bg" contrastLabel={contrastLabel} />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted">{t("palette.status")}</h3>
              <TokenSwatch fill="--tp-risk-soft" ink="--tp-risk" label={t("status.risk")} token="--tp-risk" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-warning-soft" ink="--tp-warning" label={t("status.warning")} token="--tp-warning" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-nodata-soft" ink="--tp-nodata" form="dashed" label={t("status.nodata")} token="--tp-nodata" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-offline-soft" ink="--tp-offline" form="plug" label={t("status.offline")} token="--tp-offline" contrastLabel={contrastLabel} />
              <TokenSwatch fill="--tp-ok" ink="--tp-surface" label={t("status.ok")} token="--tp-ok" contrastLabel={contrastLabel} />
            </div>
          </div>
          <p className="mt-8 max-w-[65ch] text-sm text-muted">{t("palette.greys")}</p>
        </Section>

        <Section id="type" title={t("section.type")} lead={t("section.type.lead")}>
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-5">
              {typeScale.map(([cls, spec, key]) => (
                <div key={spec} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-6">
                  <code className="text-sm text-subtle">{spec}</code>
                  <p className={cls}>{t(key)}</p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted">{t("type.numbers")}</h3>
              <div className="flex flex-col gap-1 border-y border-line py-3 text-right text-md tabular-nums">
                {[1234567.5, 89000, 4119.2, -449.2].map((v) => (
                  <span key={v} className={v < 0 ? "text-risk" : undefined}>
                    {formatMoney(v, "KZT", locale, 2)}
                  </span>
                ))}
                <span>
                  <NoData label={nd} />
                </span>
              </div>
            </div>
          </div>
        </Section>

        <Section id="spacing" title={t("section.spacing")} lead={t("section.spacing.lead")}>
          <div className="flex flex-wrap items-end gap-6">
            {[1, 2, 3, 4, 6, 8, 12, 16].map((s) => (
              <div key={s} className="flex flex-col items-start gap-2">
                <span className="block bg-line-strong" style={{ width: `calc(var(--spacing) * ${s})`, height: `calc(var(--spacing) * ${s})` }} aria-hidden />
                <code className="text-sm text-subtle">{s * 4}px</code>
              </div>
            ))}
          </div>
        </Section>

        <Section id="controls" title={t("section.controls")}>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="flex flex-wrap items-start gap-x-6 gap-y-6">
              <Spec caption={t("spec.primary")}>
                <Button>{t("button.primary")}</Button>
              </Spec>
              <Spec caption={t("spec.hover")}>
                <Button className="bg-action-hover">{t("button.primary")}</Button>
              </Spec>
              <Spec caption={t("spec.focus")}>
                <Button className="outline-solid! outline-2! outline-offset-2! outline-focus!">{t("button.primary")}</Button>
              </Spec>
              <Spec caption={t("spec.secondary")}>
                <Button variant="secondary">{t("button.secondary")}</Button>
              </Spec>
              <Spec caption={t("spec.ghost")}>
                <Button variant="ghost">{t("button.ghost")}</Button>
              </Spec>
              <Spec caption={`${t("spec.disabled")}: ${t("spec.disabled.reason")}`}>
                <Button variant="secondary" disabled>
                  {t("button.disabled")}
                </Button>
              </Spec>
              <Spec caption={t("spec.loading")}>
                <Button loading loadingLabel={t("button.loading")}>
                  {t("button.loading")}
                </Button>
              </Spec>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label={t("field.budget")} hint={t("field.budget.hint")} defaultValue="1 500 000" suffix="₸" inputMode="numeric" />
              <TextField label={t("field.price")} error={t("field.price.error")} defaultValue="0" suffix="₸" inputMode="numeric" />
              <SelectField
                label={t("field.country")}
                options={[
                  { value: "KZ", label: t("country.kz") },
                  { value: "RU", label: t("country.ru") },
                ]}
              />
            </div>
          </div>
        </Section>

        <Section id="picker" title={t("section.picker")}>
          <MarketplacePicker
            legend={t("picker.legend")}
            allLabel={t("picker.all")}
            summary={t("picker.summary")}
            options={[
              { id: "kaspi", label: "Kaspi", active: true },
              { id: "ozon", label: "Ozon", active: true },
              { id: "wildberries", label: "Wildberries", active: false, reason: t("picker.reason.token") },
            ]}
          />
        </Section>

        <Section id="table" title={t("section.table")} lead={t("design.demo")}>
          <DataTable columns={columns} rows={demoProducts} rowKey={(p) => p.id} caption={t("table.caption")} />
        </Section>

        <Section id="card" title={t("section.card")} lead={t("design.demo")}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ProductCard
              title={demoProducts[0]!.title}
              meta={t("card.meta")}
              badge={<MultipleBadge value={demoCard.priceToCostMultiple.realistic} locale={locale} noDataLabel={nd} />}
              facts={[
                { label: t("col.landed"), value: moneyCell(demoCard.landed.total) },
                { label: t("col.price"), value: moneyCell(demoCard.salePrice) },
                { label: t("col.profit"), value: profitCell(demoCard.netProfit) },
                { label: t("col.roi"), value: demoCard.roi.realistic === null ? <NoData label={nd} /> : formatPercent(demoCard.roi.realistic, locale) },
              ]}
              whyLabel={t("card.why")}
              why={<p className="max-w-[65ch]">{t("card.why.text", { low: money(demoCard.salePrice.pessimistic ?? 0), high: money(demoCard.salePrice.optimistic ?? 0) })}</p>}
            >
              <Waterfall steps={waterfall(demoCard)} labels={wfLabels} format={money} noDataLabel={nd} estimatedLabel={est} title={t("card.waterfall")} />
              <div>
                <p className="mb-2 text-sm font-medium text-muted">{t("card.range")}</p>
                <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
                  {scenarios.map(([key, v]) => (
                    <div key={key} className="flex flex-col gap-0.5 px-4 py-3 first:pl-0">
                      <dt className="text-sm text-muted">{t(key)}</dt>
                      <dd className={`text-md tabular-nums ${key === "scenario.realistic" ? "font-semibold text-ink" : "text-muted"}`}>
                        <Value status={profit.status} noDataLabel={nd} estimatedLabel={est}>
                          {v === null ? null : money(v)}
                        </Value>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </ProductCard>
            <aside aria-labelledby="legend-h" className="flex flex-col gap-4">
              <h3 id="legend-h" className="text-md font-semibold text-ink">
                {t("legend.title")}
              </h3>
              <ul className="flex flex-col gap-3 text-base text-muted">
                {(["legend.landed", "legend.estimated", "legend.nodata", "legend.scenarios", "legend.loss"] as const).map((k) => (
                  <li key={k} className="max-w-[60ch] border-b border-line pb-3 last:border-0">
                    {t(k)}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Section>

        <Section id="badges" title={t("section.badges")}>
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted">{t("badges.multiple")}</h3>
              <div className="flex flex-wrap gap-2">
                {multiples.map((m) => (
                  <MultipleBadge key={m} value={m} locale={locale} noDataLabel={nd} />
                ))}
                <MultipleBadge value={null} locale={locale} noDataLabel={nd} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted">{t("badges.coverage")}</h3>
              {[3, 2, 1].map((c) => (
                <CoverageBadge key={c} covered={c} total={MARKETPLACES_TOTAL} label={t("coverage.label", { covered: c, total: MARKETPLACES_TOTAL })} />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-muted">{t("badges.sources")}</h3>
              <SourceStatus name="Kaspi" state="active" stateLabel={t("source.active")} />
              <SourceStatus name="Wildberries" state="pending_registration" stateLabel={t("source.pending")} reason={t("source.reason.pending")} />
              <SourceStatus name="Ozon" state="blocked" stateLabel={t("source.blocked")} reason={t("source.reason.blocked")} />
              <SourceStatus name="AliExpress" state="disabled" stateLabel={t("source.disabled")} reason={t("source.reason.disabled")} />
            </div>
          </div>
        </Section>

        <Section id="states" title={t("section.states")}>
          <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
            <EmptyState title={t("empty.title")} text={t("empty.text")} action={<Button variant="secondary">{t("button.ghost")}</Button>} />
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-muted">{t("nodata.title")}</h3>
              <p className="flex items-baseline justify-between gap-4 border-b border-line pb-3 text-base">
                <span className="text-muted">{t("nodata.demand")}</span>
                <NoData label={nd} reason={t("nodata.reason")} />
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusTag tone="risk">{t("tag.risk")}</StatusTag>
                <StatusTag tone="warning">{t("tag.warning")}</StatusTag>
                <StatusTag tone="nodata">{t("tag.nodata")}</StatusTag>
                <StatusTag tone="info">{t("tag.info")}</StatusTag>
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
