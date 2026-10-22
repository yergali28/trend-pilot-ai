"use client";

import { BarChart, LineChart, ScatterChart } from "echarts/charts";
import { DataZoomComponent, GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { LabelLayout } from "echarts/features";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";
import { formatMoney, formatNumber, type Locale } from "./format";

echarts.use([ScatterChart, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, DataZoomComponent, LabelLayout, SVGRenderer]);

/** Цвета графика из токенов дизайн-системы (tokens.css), чтобы светлая и тёмная тема совпадали с остальным UI. */
function tokens() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(`--tp-${name}`).trim();
  return {
    text: v("text"),
    muted: v("text-muted"),
    subtle: v("text-subtle"),
    line: v("line"),
    lineStrong: v("line-strong"),
    surface: v("surface"),
    hot: v("chart-result"),
    ok: v("x3-bg"),
    below: v("chart-decrease"),
    zone: v("x2-bg"),
    zoneText: v("x2-text"),
    threshold: v("chart-line"),
    action: v("action"),
    font: css.getPropertyValue("font-family"),
  };
}

type Theme = ReturnType<typeof tokens>;

/** Монтирование ECharts: SVG-рендер, перерисовка по размеру контейнера, очистка при размонтировании. */
function useChart(build: (t: Theme, chart: echarts.ECharts) => echarts.EChartsCoreOption, deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: "svg" });
    chart.setOption(build(tokens(), chart));
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, deps);
  return ref;
}

const tooltipBase = (t: Theme) => ({
  backgroundColor: t.surface,
  borderColor: t.lineStrong,
  textStyle: { color: t.text, fontFamily: t.font, fontSize: 13 },
  extraCssText: "box-shadow: var(--tp-overlay-shadow); border-radius: 8px;",
});

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export interface OpportunityPoint {
  id: string;
  label: string;
  /** Продаж в месяц. */
  x: number;
  /** Метрика подбора (кратность). */
  y: number;
  /** Вес точки: например, число подходящих товаров ниши. */
  weight?: number;
  href: string;
  /** Строки подсказки «название — значение», уже отформатированные на сервере. */
  details?: [string, string][];
}

export interface OpportunityChartProps {
  points: OpportunityPoint[];
  target: number;
  title: string;
  xLabel: string;
  yLabel: string;
  hotLabel: string;
  salesLabel: string;
  metricLabel: string;
  locale: Locale;
  height?: number;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

/**
 * Карта возможностей на ECharts: спрос (лог. шкала) против кратности. Зона «продаётся выше медианы и кратность
 * не ниже порога» подсвечена; подписи без наложений (labelLayout), масштаб колесом и жестом, клик открывает точку.
 */
export function OpportunityChart({ points, target, title, xLabel, yLabel, hotLabel, salesLabel, metricLabel, locale, height = 420 }: OpportunityChartProps) {
  const pts = points.filter((p) => p.x > 0 && Number.isFinite(p.y));
  const split = pts.length ? median(pts.map((p) => p.x)) : 0;
  const ref = useChart(
    (t, chart) => {
      chart.on("click", (e) => {
        const href = (e.data as { href?: string } | undefined)?.href;
        if (href) window.location.assign(href);
      });
      const maxW = Math.max(1, ...pts.map((p) => p.weight ?? 1));
      const fmt = (v: number, d = 1) => formatNumber(v, locale, d);
      const hot = (p: OpportunityPoint) => p.x >= split && p.y >= target;
      const bestHot = new Set(
        pts
          .filter(hot)
          .sort((a, b) => b.y * Math.log10(b.x) - a.y * Math.log10(a.x))
          .slice(0, 8)
          .map((p) => p.id),
      );
      const xs = pts.map((p) => p.x);
      const [xMin, xMax] = [Math.min(...xs) * 0.8, Math.max(...xs) * 1.25];
      const ys = pts.map((p) => p.y);
      const [yMin, yMax] = [Math.max(0, Math.floor(Math.min(...ys, target) - 1)), Math.ceil(Math.max(...ys, target) + 0.5)];
      return {
        textStyle: { fontFamily: t.font },
        animationDuration: 400,
        grid: { left: 64, right: 28, top: 28, bottom: 64 },
        tooltip: {
          ...tooltipBase(t),
          trigger: "item",
          formatter: (e: { data: OpportunityPoint & { value: number[] } }) => {
            const p = e.data;
            const rows: [string, string][] = [[salesLabel, fmt(p.x, 0)], [metricLabel, `${fmt(p.y)}x`], ...(p.details ?? [])];
            return `<div style="font-weight:600;margin-bottom:6px;max-width:280px;white-space:normal">${esc(p.label)}</div>${rows
              .map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:${t.muted}">${esc(k)}</span><b style="font-variant-numeric:tabular-nums">${esc(v)}</b></div>`)
              .join("")}`;
          },
        },
        xAxis: {
          type: "log",
          name: xLabel,
          nameLocation: "middle",
          nameGap: 36,
          nameTextStyle: { color: t.muted, fontSize: 12 },
          min: xMin,
          max: xMax,
          axisLine: { lineStyle: { color: t.lineStrong } },
          axisLabel: { color: t.subtle, formatter: (v: number) => fmt(v, 0) },
          splitLine: { lineStyle: { color: t.line, type: "dashed" } },
        },
        yAxis: {
          type: "value",
          name: yLabel,
          nameLocation: "middle",
          nameGap: 44,
          nameTextStyle: { color: t.muted, fontSize: 12 },
          min: yMin,
          max: yMax,
          axisLabel: { color: t.subtle, formatter: (v: number) => `${fmt(v)}x` },
          splitLine: { lineStyle: { color: t.line } },
        },
        dataZoom: [
          { type: "inside", xAxisIndex: 0, filterMode: "none" },
          { type: "inside", yAxisIndex: 0, filterMode: "none" },
        ],
        series: [
          {
            type: "scatter",
            data: pts.map((p) => ({
              ...p,
              name: p.label,
              value: [p.x, p.y],
              symbolSize: p.weight === undefined ? 12 : 10 + 22 * Math.sqrt(p.weight / maxW),
              itemStyle: { color: hot(p) ? t.hot : p.y >= target ? t.ok : t.below, borderColor: t.surface, borderWidth: 1.5, opacity: 0.95 },
              label: { show: bestHot.has(p.id) },
            })),
            cursor: "pointer",
            emphasis: { focus: "self", scale: 1.25, label: { show: true } },
            label: {
              position: "left",
              distance: 8,
              color: t.text,
              fontSize: 12,
              fontWeight: 500,
              textBorderColor: t.surface,
              textBorderWidth: 3,
              formatter: (e: { name: string }) => (e.name.length > 30 ? `${e.name.slice(0, 29)}…` : e.name),
            },
            labelLayout: { hideOverlap: true },
            markArea: {
              silent: true,
              itemStyle: { color: t.zone, opacity: 0.55 },
              label: { show: true, position: "insideBottomRight", color: t.zoneText, fontWeight: 600, fontSize: 13, distance: 10 },
              data: [[{ name: hotLabel, xAxis: split, yAxis: target }, { xAxis: xMax, yAxis: yMax }]],
            },
            markLine: {
              silent: true,
              symbol: "none",
              lineStyle: { color: t.threshold, type: "dashed", width: 1 },
              // Значения порогов видны на осях и в подписи под графиком.
              label: { show: false },
              data: [{ yAxis: target }, { xAxis: split }],
            },
          },
        ],
      };
    },
    [JSON.stringify(pts), target, locale],
  );
  if (pts.length < 2) return null;
  return (
    <figure className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-4">
      <figcaption className="text-sm font-medium text-muted">{title}</figcaption>
      <div className="-mx-4 overflow-x-auto px-4">
        <div ref={ref} role="img" aria-label={title} className="min-w-[600px]" style={{ height }} />
      </div>
    </figure>
  );
}

export interface TrendChartProps {
  title: string;
  /** Даты ГГГГ-ММ-ДД. */
  dates: string[];
  sales: (number | null)[];
  prices: (number | null)[];
  salesLabel: string;
  priceLabel: string;
  currency: string;
  locale: Locale;
  height?: number;
}

/** Динамика по дням: продажи столбцами, цена линией на второй оси. */
export function TrendChart({ title, dates, sales, prices, salesLabel, priceLabel, currency, locale, height = 300 }: TrendChartProps) {
  const ref = useChart(
    (t) => ({
      textStyle: { fontFamily: t.font },
      animationDuration: 400,
      grid: { left: 56, right: 72, top: 40, bottom: 32 },
      legend: { top: 0, left: 0, textStyle: { color: t.muted }, itemWidth: 14, itemHeight: 8 },
      tooltip: {
        ...tooltipBase(t),
        trigger: "axis",
        valueFormatter: undefined,
        formatter: (rows: { seriesIndex: number; axisValueLabel: string; value: number | null; marker: string; seriesName: string }[]) =>
          `<div style="font-weight:600;margin-bottom:4px">${esc(new Date(rows[0]!.axisValueLabel).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU"))}</div>${rows
            .map((r) => `<div>${r.marker}${esc(r.seriesName)}: <b>${r.value === null ? "—" : r.seriesIndex === 0 ? formatNumber(r.value, locale, 0) : formatMoney(r.value, currency, locale)}</b></div>`)
            .join("")}`,
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: t.lineStrong } },
        axisLabel: { color: t.subtle, formatter: (d: string) => d.slice(8, 10) + "." + d.slice(5, 7) },
      },
      yAxis: [
        { type: "value", axisLabel: { color: t.subtle, formatter: (v: number) => formatNumber(v, locale, 0) }, splitLine: { lineStyle: { color: t.line } } },
        { type: "value", axisLabel: { color: t.subtle, formatter: (v: number) => formatMoney(v, currency, locale) }, splitLine: { show: false }, scale: true },
      ],
      series: [
        { name: salesLabel, type: "bar", data: sales, itemStyle: { color: t.ok, borderRadius: [3, 3, 0, 0] }, emphasis: { itemStyle: { color: t.hot } } },
        { name: priceLabel, type: "line", yAxisIndex: 1, data: prices, symbol: "none", lineStyle: { color: t.action, width: 2 }, itemStyle: { color: t.action } },
      ],
    }),
    [JSON.stringify([dates, sales, prices]), locale, currency],
  );
  return (
    <figure className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-4">
      <figcaption className="text-sm font-medium text-muted">{title}</figcaption>
      <div ref={ref} role="img" aria-label={title} style={{ height }} />
    </figure>
  );
}

export interface RankItem {
  id: string;
  label: string;
  value: number;
  href: string;
  details?: [string, string][];
}

export interface RankChartProps {
  title: string;
  items: RankItem[];
  valueLabel: string;
  currency: string;
  locale: Locale;
}

/** Рейтинг (горизонтальные столбцы) по сумме, например ниши по выручке; клик открывает элемент. */
export function RankChart({ title, items, valueLabel, currency, locale }: RankChartProps) {
  const rows = [...items].sort((a, b) => a.value - b.value);
  const ref = useChart(
    (t, chart) => {
      chart.on("click", (e) => {
        const href = (e.data as { href?: string } | undefined)?.href;
        if (href) window.location.assign(href);
      });
      const money = (v: number) => formatMoney(v, currency, locale);
      const compact = (v: number) => new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(v);
      return {
        textStyle: { fontFamily: t.font },
        animationDuration: 400,
        grid: { left: 8, right: 72, top: 8, bottom: 8, containLabel: true },
        tooltip: {
          ...tooltipBase(t),
          trigger: "item",
          formatter: (e: { data: RankItem & { value: number } }) =>
            `<div style="font-weight:600;margin-bottom:6px">${esc(e.data.label)}</div>${[[valueLabel, money(e.data.value)] as [string, string], ...(e.data.details ?? [])]
              .map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:${t.muted}">${esc(k)}</span><b style="font-variant-numeric:tabular-nums">${esc(v)}</b></div>`)
              .join("")}`,
        },
        xAxis: { type: "value", show: false },
        yAxis: { type: "category", data: rows.map((r) => r.label), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: t.text, fontSize: 13 } },
        series: [
          {
            type: "bar",
            cursor: "pointer",
            barMaxWidth: 22,
            data: rows.map((r, i) => ({ ...r, value: r.value, itemStyle: { color: i >= rows.length - 3 ? t.hot : t.ok, borderRadius: [0, 4, 4, 0] } })),
            label: { show: true, position: "right", color: t.muted, fontSize: 12, formatter: (e: { value: number }) => `${compact(e.value)} ${currency === "RUB" ? "₽" : currency}` },
            emphasis: { itemStyle: { color: t.action } },
          },
        ],
      };
    },
    [JSON.stringify(rows), locale, currency],
  );
  return (
    <figure className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-4">
      <figcaption className="text-sm font-medium text-muted">{title}</figcaption>
      <div ref={ref} role="img" aria-label={title} style={{ height: Math.max(160, rows.length * 30 + 16) }} />
    </figure>
  );
}
