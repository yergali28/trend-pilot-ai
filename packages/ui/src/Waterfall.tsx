import type { WaterfallStep } from "@tp/calc";
import { NoData } from "./data";

export interface WaterfallProps {
  steps: WaterfallStep[];
  labels: Record<WaterfallStep["key"], string>;
  format: (value: number) => string;
  noDataLabel: string;
  estimatedLabel: string;
  title: string;
}

const barColor = (s: WaterfallStep) =>
  s.kind === "total" ? "var(--tp-chart-total)" : s.kind === "decrease" ? "var(--tp-chart-decrease)" : (s.value ?? 0) < 0 ? "var(--tp-chart-loss)" : "var(--tp-chart-result)";

/** Waterfall юнит-экономики: от цены продажи через расходы к чистой прибыли. Геометрия берётся из packages/calc. */
export function Waterfall({ steps, labels, format, noDataLabel, estimatedLabel, title }: WaterfallProps) {
  const levels = steps.flatMap((s) => [s.start, s.end]).filter((v): v is number => v !== null);
  const max = Math.max(...levels, 0);
  const min = Math.min(...levels, 0);
  const span = max - min || 1;
  const pos = (v: number) => ((v - min) / span) * 100;

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="mb-2 text-sm font-medium text-muted">{title}</figcaption>
      {steps.map((s) => {
        const drawable = s.start !== null && s.end !== null && s.value !== 0;
        const left = drawable ? pos(Math.min(s.start!, s.end!)) : 0;
        const width = drawable ? Math.max(pos(Math.max(s.start!, s.end!)) - left, 0.6) : 0;
        const strong = s.kind !== "decrease";
        return (
          <div key={s.key} className={`grid grid-cols-[7rem_minmax(4rem,1fr)_6.5rem] sm:grid-cols-[12rem_minmax(6rem,1fr)_7rem] items-center gap-3 py-1 ${strong ? "font-semibold text-ink" : "text-muted"}`}>
            <span className="text-base">{labels[s.key]}</span>
            <span className="relative h-5 rounded-sm bg-sunken" aria-hidden>
              {drawable ? <span className="absolute inset-y-0 rounded-sm" style={{ left: `${left}%`, width: `${width}%`, background: barColor(s) }} /> : null}
            </span>
            <span className="text-right text-base tabular-nums">
              {s.value === null ? (
                <NoData label={noDataLabel} />
              ) : (
                <>
                  {s.status === "estimated" ? <abbr title={estimatedLabel} className="mr-0.5 no-underline">≈</abbr> : null}
                  {s.kind === "decrease" && s.value !== 0 ? "− " : ""}
                  {format(s.value)}
                </>
              )}
            </span>
          </div>
        );
      })}
    </figure>
  );
}
