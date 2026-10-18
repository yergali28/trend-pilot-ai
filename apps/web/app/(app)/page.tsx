import { Button, MarketplacePicker, SelectField, TextField } from "@tp/ui";
import { BUDGET_CURRENCIES, TARGETS, loadSources, parseParams, type Source } from "../../lib/catalog";
import { prefs } from "../../lib/prefs";
import { requireUser } from "../../lib/session";

const optionsOf = (sources: Source[], role: "sell" | "buy", reasonOf: (s: Source) => string) =>
  sources
    .filter((s) => s.role === role)
    .map((s) => (s.status === "active" ? { id: s.id, label: s.name, active: true } : { id: s.id, label: s.name, active: false, reason: reasonOf(s) }));

const radio = "peer sr-only";
const chip =
  "flex h-9 cursor-pointer items-center rounded-control border border-line-strong bg-surface px-3 text-base text-ink pointer-coarse:h-11 peer-checked:border-action peer-checked:bg-action-soft peer-checked:text-action-soft-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

export default async function WizardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { db } = await requireUser();
  const { t } = await prefs();
  const sources = await loadSources(db);
  const p = parseParams(await searchParams);
  const custom = !(TARGETS as readonly number[]).includes(p.target);
  const reasonOf = (s: Source) => s.statusReason ?? t(`sourceStatus.${s.status}`);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("wizard.title")}</h1>
        <p className="mt-2 max-w-[65ch] text-base text-muted">{t("wizard.lead")}</p>
      </div>

      <form action="/results" method="get" className="flex flex-col gap-8 rounded-panel border border-line bg-surface p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <MarketplacePicker name="sell" legend={t("wizard.sell")} allLabel={t("picker.all")} summary={t("picker.summary")} options={optionsOf(sources, "sell", reasonOf)} initial={p.sell} />
          <MarketplacePicker name="buy" legend={t("wizard.buy")} allLabel={t("picker.all")} summary={t("picker.summary")} options={optionsOf(sources, "buy", reasonOf)} initial={p.buy} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField
            label={t("field.country")}
            name="country"
            defaultValue={p.country}
            options={[
              { value: "KZ", label: t("country.kz") },
              { value: "RU", label: t("country.ru") },
            ]}
          />
          <TextField label={t("field.budget")} hint={t("field.budget.hint")} name="budget" type="number" min={1} step="any" inputMode="decimal" defaultValue={p.budget ?? ""} />
          <SelectField label={t("wizard.budgetCurrency")} name="cur" defaultValue={p.budgetCurrency} options={BUDGET_CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink">{t("wizard.target")}</legend>
            <div className="flex flex-wrap items-center gap-2">
              {TARGETS.map((x) => (
                <label key={x}>
                  <input type="radio" name="x" value={x} defaultChecked={p.target === x} className={radio} />
                  <span className={chip}>{x}x</span>
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-muted">
                {t("wizard.target.custom")}
                <input
                type="number"
                name="xc"
                min={0.1}
                step="any"
                aria-label={t("wizard.target.customValue")}
                defaultValue={custom ? p.target : ""}
                placeholder="x"
                className="h-9 w-24 rounded-control border border-line-strong bg-surface px-3 text-right text-base tabular-nums text-ink outline-none placeholder:text-subtle pointer-coarse:h-11 focus-visible:outline-2 focus-visible:outline-focus"
              />
              </label>
            </div>
          </fieldset>
          <fieldset className="group flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink">{t("wizard.metric")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["priceToCost", "roi"] as const).map((m) => (
                <label key={m}>
                  <input type="radio" name="metric" value={m} defaultChecked={p.metric === m} className={radio} />
                  <span className={chip}>{t(`metric.${m}`)}</span>
                </label>
              ))}
            </div>
            {/* Подсказка следует за выбором без отправки формы. */}
            <p className="text-sm text-subtle group-has-[input[value=roi]:checked]:hidden">{t("metric.priceToCost.hint")}</p>
            <p className="hidden text-sm text-subtle group-has-[input[value=roi]:checked]:block">{t("metric.roi.hint")}</p>
          </fieldset>
        </div>

        <div>
          <Button type="submit">{t("button.primary")}</Button>
        </div>
      </form>
    </div>
  );
}
