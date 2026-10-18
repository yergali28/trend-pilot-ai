"use client";

import { calculate, waterfall, type CalcInput, type CalcResult, type Input, type ResultValue } from "@tp/calc";
import { Button, MultipleBadge, RiskIcon, StatusTag, TextField, Value, Waterfall, formatMoney, formatNumber, formatPercent } from "@tp/ui";
import { useMemo, useState } from "react";
import { translator, type Locale, type MessageKey } from "../../../../lib/i18n";

export interface EditorProps {
  locale: Locale;
  input: CalcInput;
  sourceNames: Record<string, string>;
  save: { sourceProductId: string; listingProductId: string | null } | null;
}

type Field = "fx" | "cargoTariff" | "salePrice" | "marketplaceCommissionRate" | "adRate" | "returnRate" | "taxRate";
const PERCENT: Field[] = ["marketplaceCommissionRate", "adRate", "returnRate", "taxRate"];

const userSource = () => ({ sourceId: "user", method: "user_input" as const, fetchedAt: new Date().toISOString() });

/** Применяет ввод пользователя к входу расчёта: значение становится фактом пользователя (раздел 5.1, п. 5). */
function applyEdits(base: CalcInput, edits: Partial<Record<Field, number>>, fxCurrency: string | null): CalcInput {
  const next: CalcInput = structuredClone(base);
  const fact = (value: number): Input => ({ value, status: "verified", source: userSource() });
  for (const [k, raw] of Object.entries(edits) as [Field, number][]) {
    if (!Number.isFinite(raw)) continue;
    const value = PERCENT.includes(k) ? raw / 100 : raw;
    if (k === "fx" && fxCurrency) next.fxRates = { ...next.fxRates, [fxCurrency]: fact(value) };
    // Явный ввод заменяет оценочный диапазон: low/high не переносятся.
    else if (k === "cargoTariff" && next.cargoTariff) next.cargoTariff = { currency: next.cargoTariff.currency, basis: next.cargoTariff.basis, ...fact(value) };
    else if (k === "salePrice" && next.salePrice) next.salePrice = { currency: next.salePrice.currency, ...fact(value) };
    else if (k === "taxRate") next.tax = value > 0 ? { mode: "on", regime: "user", base: "revenue", rate: fact(value) } : { mode: "off", source: userSource() };
    else if (k !== "fx" && k !== "cargoTariff" && k !== "salePrice") next[k] = fact(value);
  }
  return next;
}

function inputStatus(input: CalcInput, field: string): "verified" | "estimated" {
  if (field.startsWith("fxRates.")) return input.fxRates?.[field.slice(8)]?.status ?? "verified";
  if (field === "tax") return "verified";
  if (field === "tax.rate") return input.tax?.mode === "on" ? (input.tax.rate?.status ?? "verified") : "verified";
  return ((input as unknown as Record<string, Input | undefined>)[field]?.status) ?? "verified";
}

export function UnitEconomicsEditor({ locale, input, sourceNames, save }: EditorProps) {
  const t = translator(locale);
  const fxCurrency = input.purchasePrice && input.purchasePrice.currency !== input.currency ? input.purchasePrice.currency : null;
  const [edits, setEdits] = useState<Partial<Record<Field, number>>>({});
  const [saved, setSaved] = useState<"idle" | "saving" | "done" | "error">("idle");
  const current = useMemo(() => applyEdits(input, edits, fxCurrency), [input, edits, fxCurrency]);
  const result: CalcResult = useMemo(() => calculate(current), [current]);

  const nd = t("value.nodata");
  const est = t("value.estimated");
  const money = (v: number) => formatMoney(v, current.currency, locale);
  const moneyValue = (v: ResultValue) => (
    <Value status={v.status} noDataLabel={nd} estimatedLabel={est}>
      {v.realistic === null ? null : money(v.realistic)}
    </Value>
  );
  const profit = result.netProfit;
  const loss = profit.realistic !== null && profit.realistic < 0;

  const initial = (f: Field): number | "" => {
    const v =
      f === "fx" ? (fxCurrency ? input.fxRates?.[fxCurrency]?.value : undefined) : f === "taxRate" ? (input.tax?.mode === "on" ? input.tax.rate?.value : 0) : (input[f] as Input | undefined)?.value;
    return v === undefined ? "" : PERCENT.includes(f) ? Number((v * 100).toFixed(4)) : v;
  };
  const field = (f: Field, label: string, suffix: string) => (
    <TextField
      key={f}
      label={label}
      suffix={suffix}
      type="number"
      step="any"
      inputMode="decimal"
      name={f}
      data-field={f}
      defaultValue={initial(f)}
      onChange={(e) => {
        const n = e.currentTarget.value === "" ? NaN : Number(e.currentTarget.value);
        setEdits((s) => ({ ...s, [f]: n }));
        setSaved("idle");
      }}
    />
  );

  const why: { key: string; formula: MessageKey; value: ResultValue; render: (v: ResultValue) => React.ReactNode }[] = [
    { key: "landed", formula: "formula.landed", value: result.landed.total, render: moneyValue },
    { key: "selling", formula: "formula.selling", value: result.selling.total, render: moneyValue },
    { key: "profit", formula: "formula.netProfit", value: result.netProfit, render: moneyValue },
    { key: "multiple", formula: "formula.multiple", value: result.priceToCostMultiple, render: (v) => <MultipleBadge value={v.realistic} locale={locale} noDataLabel={nd} /> },
    { key: "roi", formula: "formula.roi", value: result.roi, render: (v) => (
      <Value status={v.status} noDataLabel={nd} estimatedLabel={est}>
        {v.realistic === null ? null : formatPercent(v.realistic, locale)}
      </Value>
    ) },
  ];
  // Каждый вход один раз: источник, способ получения, дата и статус достоверности.
  const inputs = result.netProfit.sources.concat(result.priceToCostMultiple.sources).filter((x, i, all) => all.findIndex((y) => y.field === x.field) === i).map((x) => ({ ...x, status: inputStatus(current, x.field) }));
  const fieldLabel = (f: string) => (f.startsWith("fxRates.") ? t("field.fxRate", { currency: f.slice(8) }) : t(`field.${f}` as MessageKey));
  const date = (iso: string) => new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU", { dateStyle: "medium" }).format(new Date(iso));

  async function onSave() {
    if (!save) return;
    setSaved("saving");
    const res = await fetch("/api/calculations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...save, input: current, result }),
    });
    setSaved(res.ok ? "done" : "error");
  }

  return (
    <div className="flex flex-col gap-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6" aria-live="polite">
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-subtle">{t("col.landed")}</dt>
            <dd className="text-md font-semibold">{moneyValue(result.landed.total)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-subtle">{t("col.price")}</dt>
            <dd className="text-md font-semibold">{moneyValue(result.salePrice)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-subtle">{t("col.profit")}</dt>
            <dd data-testid="net-profit" className={`text-md font-semibold ${loss ? "text-risk" : ""}`}>
              {loss ? (
                <span className="inline-flex items-center gap-1">
                  <RiskIcon className="size-3.5" />
                  <span className="sr-only">{t("value.loss")}</span>
                </span>
              ) : null}
              {moneyValue(profit)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-subtle">{t("col.multiple")}</dt>
            <dd>
              <MultipleBadge value={result.priceToCostMultiple.realistic} locale={locale} noDataLabel={nd} />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-subtle">{t("col.roi")}</dt>
            <dd className="text-md font-semibold">
              <Value status={result.roi.status} noDataLabel={nd} estimatedLabel={est}>
                {result.roi.realistic === null ? null : formatPercent(result.roi.realistic, locale)}
              </Value>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-sm text-subtle">{t("col.margin")}</dt>
            <dd className="text-md font-semibold">
              <Value status={result.netMarginPct.status} noDataLabel={nd} estimatedLabel={est}>
                {result.netMarginPct.realistic === null ? null : `${formatNumber(result.netMarginPct.realistic, locale)} %`}
              </Value>
            </dd>
          </div>
        </dl>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-6">

        <Waterfall steps={waterfall(result)} labels={Object.fromEntries((["salePrice", "purchase", "delivery", "customs", "otherLanded", "marketplace", "ads", "returns", "tax", "netProfit"] as const).map((k) => [k, t(`wf.${k}`)])) as Parameters<typeof Waterfall>[0]["labels"]} format={money} noDataLabel={nd} estimatedLabel={est} title={t("card.waterfall")} />

        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t("card.range")}</p>
          {profit.pessimistic !== null && profit.pessimistic === profit.optimistic ? (
            <p className="mb-2 max-w-[60ch] text-sm text-muted">{t("range.flat")}</p>
          ) : null}
          <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
            {(["pessimistic", "realistic", "optimistic"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-0.5 px-4 py-3 first:pl-0">
                <dt className="text-sm text-muted">{t(`scenario.${k}`)}</dt>
                <dd className={`text-md tabular-nums ${k === "realistic" ? "font-semibold text-ink" : "text-muted"}`}>
                  <Value status={profit.status} noDataLabel={nd} estimatedLabel={est}>
                    {profit[k] === null ? null : money(profit[k]!)}
                  </Value>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <details className="border-t border-line pt-4" open>
          <summary className="cursor-pointer text-base font-medium text-action-soft-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{t("card.why")}</summary>
          <div className="mt-4 flex flex-col gap-6">
            <ul className="flex flex-col divide-y divide-line">
              {why.map((w) => (
                <li key={w.key} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span className="text-base text-ink">{t(w.formula)}</span>
                  <span className="shrink-0">{w.render(w.value)}</span>
                  {w.value.missing.length > 0 ? <span className="text-sm text-nodata">{t("why.missing", { fields: w.value.missing.map(fieldLabel).join(", ") })}</span> : null}
                </li>
              ))}
            </ul>
            <details className="flex flex-col gap-2">
              <summary className="cursor-pointer text-sm font-medium text-action-soft-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                {t("why.sourcesCount", { n: inputs.length })}
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">{t("why.sources")}</caption>
                  <thead>
                    <tr className="border-b border-line text-left text-muted">
                      <th scope="col" className="py-2 pr-4 font-medium">{t("why.col.field")}</th>
                      <th scope="col" className="py-2 pr-4 font-medium">{t("why.col.source")}</th>
                      <th scope="col" className="py-2 pr-4 font-medium">{t("why.col.date")}</th>
                      <th scope="col" className="py-2 font-medium">{t("why.col.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inputs.map(({ field: f, source: src, status }) => (
                      <tr key={f} className="border-b border-line last:border-0">
                        <td className="py-1.5 pr-4 text-ink">{fieldLabel(f)}</td>
                        <td className="py-1.5 pr-4 text-muted">
                          {sourceNames[src.sourceId] ?? src.sourceId} · {t(`method.${src.method}`)}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-4 tabular-nums text-muted">{date(src.fetchedAt)}</td>
                        <td className="py-1.5 text-muted">{t(`status.value.${status}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </details>
      </div>

      <aside aria-labelledby="edit-h" className="order-first flex flex-col gap-4 lg:sticky lg:top-6 lg:order-none lg:self-start">
        <h2 id="edit-h" className="text-xl font-semibold">
          {t("editor.title")}
        </h2>
        <p className="text-sm text-muted">{t("editor.lead")}</p>
        {fxCurrency ? field("fx", t("field.fxRate", { currency: fxCurrency }), current.currency) : null}
        {input.cargoTariff ? field("cargoTariff", t("field.cargoTariff"), input.cargoTariff.currency) : null}
        {input.salePrice ? field("salePrice", t("field.salePrice"), input.salePrice.currency) : null}
        {field("marketplaceCommissionRate", t("field.marketplaceCommissionRate"), "%")}
        {field("adRate", t("field.adRate"), "%")}
        {field("returnRate", t("field.returnRate"), "%")}
        {field("taxRate", t("editor.taxRate"), "%")}
        {save ? (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="secondary" onClick={onSave} loading={saved === "saving"} loadingLabel={t("editor.saving")}>
              {t("editor.save")}
            </Button>
            <span role="status">
              {saved === "done" ? <StatusTag tone="info">{t("editor.saved")}</StatusTag> : null}
              {saved === "error" ? <StatusTag tone="risk">{t("editor.saveError")}</StatusTag> : null}
            </span>
          </div>
        ) : null}
      </aside>
      </div>
    </div>
  );
}
