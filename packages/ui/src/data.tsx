import type { ReactNode } from "react";
import { AlertIcon, DotIcon, InfoIcon, MinusIcon, PlugOffIcon, RingIcon, RiskIcon, SortIcon } from "./icons";
import { formatNumber, type Locale } from "./format";

/** Отсутствующее значение: серое, с пунктиром и словом, никогда не число. */
export function NoData({ label, reason }: { label: string; reason?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-nodata" title={reason}>
      <span className="border-b border-dashed border-nodata-line">{label}</span>
      {reason ? <span className="sr-only">{reason}</span> : null}
    </span>
  );
}

/** Значение со статусом: estimated помечается «≈», no_data — словом. */
export function Value({ status, children, noDataLabel, estimatedLabel }: { status: "verified" | "estimated" | "no_data"; children: ReactNode; noDataLabel: string; estimatedLabel: string }) {
  if (status === "no_data") return <NoData label={noDataLabel} />;
  return (
    <span className="tabular-nums">
      {status === "estimated" ? (
        <abbr title={estimatedLabel} className="mr-0.5 text-muted no-underline">
          ≈
        </abbr>
      ) : null}
      {children}
    </span>
  );
}

const tiers = [
  { min: 10, cls: "bg-[var(--tp-x10-bg)] text-[var(--tp-x10-text)]" },
  { min: 5, cls: "bg-[var(--tp-x5-bg)] text-[var(--tp-x5-text)]" },
  { min: 3, cls: "bg-[var(--tp-x3-bg)] text-[var(--tp-x3-text)]" },
  { min: 2, cls: "bg-[var(--tp-x2-bg)] text-[var(--tp-x2-text)]" },
  { min: -Infinity, cls: "bg-[var(--tp-x-below-bg)] text-[var(--tp-x-below-text)]" },
];

/** Бейдж кратности: ступень шкалы 2x/3x/5x/10x, значение всегда подписано текстом. */
export function MultipleBadge({ value, locale, noDataLabel }: { value: number | null; locale: Locale; noDataLabel: string }) {
  if (value === null) return <NoData label={noDataLabel} />;
  const tier = tiers.find((t) => value >= t.min)!;
  return (
    <span className={`inline-flex min-w-12 justify-center rounded-control px-1.5 py-0.5 text-sm font-semibold tabular-nums ${tier.cls}`}>
      {formatNumber(value, locale)}x
    </span>
  );
}

/** Спарклайн динамики: линия по точкам, последняя точка отмечена. */
export function Sparkline({ points, label, width = 96, height = 28 }: { points: number[]; label: string; width?: number; height?: number }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const xy = points.map((p, i) => [(i / (points.length - 1)) * (width - 4) + 2, height - 3 - ((p - min) / span) * (height - 6)] as const);
  const last = xy.at(-1)!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="overflow-visible">
      <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--tp-chart-line)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--tp-text)" />
    </svg>
  );
}

/** Бейдж покрытия «данные с N из M площадок»: точки повторяют число словами. */
export function CoverageBadge({ covered, total, label }: { covered: number; total: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <span className="flex" aria-hidden>
        {Array.from({ length: total }, (_, i) => (i < covered ? <DotIcon key={i} className="-mx-0.5 text-ok" /> : <RingIcon key={i} className="-mx-0.5 text-nodata" />))}
      </span>
      {label}
    </span>
  );
}

export type SourceState = "active" | "pending_registration" | "blocked" | "disabled";

const sourceLook: Record<SourceState, { icon: typeof DotIcon; cls: string }> = {
  active: { icon: DotIcon, cls: "text-ok" },
  pending_registration: { icon: RingIcon, cls: "text-offline" },
  blocked: { icon: RiskIcon, cls: "text-risk" },
  disabled: { icon: PlugOffIcon, cls: "text-offline" },
};

/** Статус источника: форма + цвет + слово; неактивный источник серый с причиной, не скрыт. */
export function SourceStatus({ name, state, stateLabel, reason }: { name: string; state: SourceState; stateLabel: string; reason?: string }) {
  const { icon: Icon, cls } = sourceLook[state];
  const inactive = state !== "active";
  return (
    <div className={`flex items-start gap-2 ${inactive ? "text-muted" : "text-ink"}`}>
      <Icon className={`mt-0.5 shrink-0 ${cls}`} />
      <div className="min-w-0">
        <p className="text-base font-medium">
          {name} <span className={`font-normal ${inactive ? "text-subtle" : "text-ok"}`}>· {stateLabel}</span>
        </p>
        {reason ? <p className="text-sm text-subtle">{reason}</p> : null}
      </div>
    </div>
  );
}

type Tone = "risk" | "warning" | "nodata" | "info";
const toneLook: Record<Tone, { icon: typeof InfoIcon; cls: string }> = {
  risk: { icon: RiskIcon, cls: "bg-risk-soft text-risk" },
  warning: { icon: AlertIcon, cls: "bg-warning-soft text-warning" },
  nodata: { icon: MinusIcon, cls: "bg-nodata-soft text-nodata" },
  info: { icon: InfoIcon, cls: "bg-action-soft text-action-soft-ink" },
};

/** Статусная метка: иконка + слово, цвет только дублирует смысл. */
export function StatusTag({ tone, children }: { tone: Tone; children: ReactNode }) {
  const { icon: Icon, cls } = toneLook[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-control px-1.5 py-0.5 text-sm font-medium ${cls}`}>
      <Icon />
      {children}
    </span>
  );
}

export interface Column<Row> {
  key: string;
  header: string;
  align?: "start" | "end";
  /** Текущая сортировка столбца; само переключение подключает экран, где есть данные. */
  sort?: "ascending" | "descending" | "none";
  render: (row: Row) => ReactNode;
}

// Первая колонка (название) остаётся на месте при горизонтальной прокрутке.
const stickyCell = "sticky left-0 z-10 bg-surface";

/** Таблица сравнения: числа справа, табличные цифры, сортируемые заголовки — кнопки. */
export function DataTable<Row>({ columns, rows, rowKey, caption }: { columns: Column<Row>[]; rows: Row[]; rowKey: (r: Row) => string; caption: string }) {
  return (
    <div className="relative overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="w-full border-collapse text-base">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {columns.map((c, i) => (
              <th key={c.key} scope="col" aria-sort={c.sort} className={`whitespace-nowrap px-3 py-2.5 text-sm font-medium text-muted ${c.align === "end" ? "text-right" : "text-left"} ${i === 0 ? stickyCell : ""}`}>
                <span className={`inline-flex items-center gap-1 ${c.sort && c.sort !== "none" ? "text-ink" : ""}`}>
                  {c.header}
                  {c.sort && c.sort !== "none" ? <SortIcon className="size-3.5" /> : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="group border-b border-line last:border-0 hover:bg-sunken">
              {columns.map((c, i) => (
                <td key={c.key} className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${c.align === "end" ? "text-right" : "text-left"} ${i === 0 ? `${stickyCell} group-hover:bg-sunken` : ""}`}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Пустое состояние: что произошло и что сделать дальше. */
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-panel border border-dashed border-line-strong px-6 py-8">
      <p className="text-md font-semibold text-ink">{title}</p>
      <p className="max-w-[60ch] text-base text-muted">{text}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
