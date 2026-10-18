---
name: Trend Pilot AI
description: Seller analytics workbench where numbers read first; category standard at Stripe Dashboard / MPStats finish.
colors:
  bg: "#f6f7f9"
  surface: "#ffffff"
  surface-sunken: "#eff1f4"
  line: "#e2e5ea"
  line-strong: "#cbd0d8"
  text: "#111722"
  text-muted: "#4a5361"
  text-subtle: "#5f6876"
  action: "#3346c7"
  action-hover: "#2a3aa6"
  action-text: "#ffffff"
  action-soft: "#eceffc"
  action-soft-text: "#2a3aa6"
  focus: "#3346c7"
  x-below-bg: "#eef0f3"
  x-below-text: "#4a5361"
  x2-bg: "#dcf1e4"
  x2-text: "#1a5e3c"
  x3-bg: "#a8dcbf"
  x3-text: "#0f4a2d"
  x5-bg: "#21804e"
  x5-text: "#ffffff"
  x10-bg: "#0e5132"
  x10-text: "#ffffff"
  risk: "#b42318"
  risk-soft: "#fdeceb"
  warning: "#8f5300"
  warning-soft: "#fff3dc"
  nodata: "#5f6876"
  nodata-soft: "#f1f2f4"
  nodata-line: "#9aa2ae"
  offline: "#5f6876"
  offline-soft: "#eceef1"
  ok: "#1a7f4b"
  chart-line: "#4a5361"
  chart-total: "#4a5361"
  chart-decrease: "#c9ced6"
  chart-result: "#21804e"
  chart-loss: "#b42318"
  selection: "#d7dcfa"
  bg-dark: "#0d1015"
  surface-dark: "#151a21"
  surface-sunken-dark: "#1b2129"
  line-dark: "#29303a"
  line-strong-dark: "#3a4350"
  text-dark: "#e8ebf0"
  text-muted-dark: "#b3bac5"
  text-subtle-dark: "#9aa2ae"
  action-dark: "#7f92ff"
  action-hover-dark: "#9eacff"
  action-text-dark: "#0d1015"
  action-soft-dark: "#1f2645"
  action-soft-text-dark: "#b4c0ff"
  focus-dark: "#9eacff"
  x-below-bg-dark: "#232a33"
  x-below-text-dark: "#b3bac5"
  x2-bg-dark: "#16352a"
  x2-text-dark: "#9fe3bf"
  x3-bg-dark: "#1f5a40"
  x3-text-dark: "#d2f5e2"
  x5-bg-dark: "#3fb57a"
  x5-text-dark: "#06140d"
  x10-bg-dark: "#8ee0b5"
  x10-text-dark: "#06140d"
  risk-dark: "#ff8f84"
  risk-soft-dark: "#3a1714"
  warning-dark: "#f4b955"
  warning-soft-dark: "#33250c"
  nodata-dark: "#9aa2ae"
  nodata-soft-dark: "#1b2129"
  nodata-line-dark: "#4a5361"
  offline-dark: "#9aa2ae"
  offline-soft-dark: "#1f252d"
  ok-dark: "#5fd197"
  chart-line-dark: "#b3bac5"
  chart-total-dark: "#b3bac5"
  chart-decrease-dark: "#3a4350"
  chart-result-dark: "#3fb57a"
  chart-loss-dark: "#ff8f84"
  selection-dark: "#2c3670"
typography:
  display:
    fontFamily: "Golos Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: "2.5rem"
  headline:
    fontFamily: "Golos Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
  title:
    fontFamily: "Golos Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  figure:
    fontFamily: "Golos Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    fontFeature: "tnum"
  body:
    fontFamily: "Golos Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.375rem"
  label:
    fontFamily: "Golos Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.25rem"
rounded:
  mark: "4px"
  control: "6px"
  panel: "8px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunken}"
  button-ghost:
    textColor: "{colors.action-soft-text}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.action-soft}"
  button-sm:
    typography: "{typography.label}"
    padding: "0 12px"
    height: "32px"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  input-text-disabled:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-subtle}"
  chip-marketplace:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  chip-marketplace-selected:
    backgroundColor: "{colors.action-soft}"
    textColor: "{colors.action-soft-text}"
  chip-marketplace-offline:
    backgroundColor: "{colors.offline-soft}"
    textColor: "{colors.offline}"
  nav-item:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  nav-item-current:
    backgroundColor: "{colors.action-soft}"
    textColor: "{colors.action-soft-text}"
  badge-multiple-x5:
    backgroundColor: "{colors.x5-bg}"
    textColor: "{colors.x5-text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "2px 6px"
    width: "48px"
  status-tag-risk:
    backgroundColor: "{colors.risk-soft}"
    textColor: "{colors.risk}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "2px 6px"
  card-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
  table-cell:
    typography: "{typography.body}"
    padding: "10px 12px"
---

# Design System: Trend Pilot AI

## Overview

**Creative North Star: "The Honest Ledger"**

A working analytics screen for marketplace sellers in the category standard, finished to the level of Stripe Dashboard and MPStats. The figure is the protagonist: tabular digits, right-aligned to the place value, currency beside the number, and an explicit word where a value is missing. Everything else steps back: a cool light-grey page, white surfaces, hairlines instead of shadows, one blue for action.

Color is semantic, never decorative. There are exactly three colored vocabularies: action (blue), the multiple scale 2x to 10x (green, deepening with value), and status (risk red, warning amber, no-data grey with a dashed underline, source-offline grey with an unplug icon). Every colored state is duplicated by a word or a shape. Light theme is the default; dark is the second theme, set by `data-theme="dark"` on the page wrapper (which also darkens the document root via `:has`).

Density is moderate and even: 36px controls, 14px body, 4px spacing step, compact inside a group and generous between groups. Motion is functional only (the loading spinner, color transitions of 150ms), and respects `prefers-reduced-motion`.

**Key Characteristics:**
- Numbers read first: `tabular-nums` everywhere a figure appears, right-aligned in tables.
- One action blue; data visualization stays neutral grey unless it carries profit or loss.
- Flat surfaces separated by 1px lines and tonal steps; shadow reserved for floating layers.
- Status by color + icon/shape + word; "no data" is a word, never a number.
- Golos Text across all roles, Cyrillic-first with Kazakh coverage.

## Colors

A neutral cool-grey ledger with one blue voice and two semantic scales; both themes share roles token for token (dark values are the `-dark` keys in the frontmatter, served by the same `--tp-*` variables).

### Primary
- **Ledger Blue** (`action`; dark `action-dark`): primary button fill, selected chip border and checkbox fill, focus outline, link color. Hover deepens in light (`action-hover`) and lightens in dark (`action-hover-dark`).
- **Blue Wash** (`action-soft` with `action-soft-text`): selected marketplace chip, current nav/theme/language item, ghost button hover, info status tag.

### Secondary
- **Multiple Scale** (`x-below-*`, `x2-*`, `x3-*`, `x5-*`, `x10-*`): background/text pairs for the price-to-cost multiple badge. Light theme deepens from pale mint to forest; dark theme brightens toward mint. The value is always printed (`3,6x`); the color only confirms it.

### Tertiary
- **Status set**: `risk` / `risk-soft` (loss, blocked source, field error), `warning` / `warning-soft` (amber), `nodata` / `nodata-soft` / `nodata-line` (grey word with dashed underline), `offline` / `offline-soft` (disabled source), `ok` (filled dot for an active source or a covered marketplace).
- **Chart roles**: `chart-line` and `chart-total` (neutral ink), `chart-decrease` (pale grey expense bars), `chart-result` (profit green), `chart-loss` (risk red).

### Neutral
- **Cool Paper** (`bg`): application background.
- **White Sheet** (`surface`): header, sticky nav, tables, cards, inputs.
- **Recessed Grey** (`surface-sunken`): row hover, chart tracks, disabled fields, secondary button hover.
- **Hairline** (`line`): dividers, panel borders. **Strong Hairline** (`line-strong`): control borders, empty-state dashed border.
- **Ink** (`text`), **Graphite** (`text-muted`), **Slate** (`text-subtle`): primary text and figures; secondary text and column headers; hints, captions, units.
- **Selection** (`selection`): text selection background.

### Named Rules
**The One Blue Rule.** Blue means "you can act here" (button, link, focus, selected filter). Data, charts and badges never use it.

**The Said-Twice Rule.** No state is carried by color alone: risk has a crossed circle, warning a triangle, no-data a dashed underline and the word, offline an unplug icon and a reason, ok a filled dot, multiple a printed value.

**The Honest Gap Rule.** A missing value renders the localized "no data" word in `nodata` with a dashed `nodata-line` underline. Never a zero, dash or average in its place. Estimated values carry a leading "≈".

## Typography

**Display Font:** Golos Text (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Golos Text
**Label/Mono Font:** Golos Text; token names and spec values use the browser `code` face at label size.

**Character:** One Cyrillic-first grotesque in every role, served by `next/font` with latin, cyrillic and cyrillic-ext subsets so Kazakh letters render natively. Hierarchy comes from size and weight steps, not from a second family.

### Hierarchy
- **Display** (600, 32px / 40px): screen title.
- **Headline** (600, 24px / 32px): section title.
- **Title** (600, 20px / 28px): card title.
- **Figure** (400-600, 16px / 24px, tabular): key figures in cards and scenario ranges; also the empty-state title.
- **Body** (400-500, 14px / 22px): running text, table cells, field values; lead paragraphs cap at 60-65ch.
- **Label** (400-500, 13px / 20px): field labels, column headers, hints, captions, badges, nav items.
- `xs` (12px / 16px) exists in the token file but is not used by any shipped component.

### Named Rules
**The Tabular Rule.** Every figure uses `tabular-nums`; table number columns align right; currency and unit sit beside the value (`10 000 ₸`, `3,6x`), formatted per locale with `Intl.NumberFormat` and the narrow currency symbol.

## Layout

Content sits in a centered column capped at 72rem (`max-w-6xl`) with 16px side padding, 32px from 640px up. The page header is a white band; directly under it a sticky white section nav with a bottom hairline (scrolls horizontally on small screens, wraps from 1024px). Sections are separated by a top hairline with 40px above the heading and 56px below the content; heading-to-content gap is 32px.

Spacing is a 4px step (frontmatter `spacing`), used as 4/8/12/16/24/32/48/64. Groups are tight inside (6-12px between a label and its field, 8px between chips) and generous between groups (24-48px). Grids collapse to one column on mobile and open to 2-4 columns at `md`/`lg`/`xl`. On coarse pointers every control grows to 44px height.

## Elevation & Depth

Flat by construction. Panels are separated from the page by a 1px `line` border and the white-on-cool-grey tonal step; row hover drops to `surface-sunken`. No resting surface carries a shadow.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 8px 24px rgb(17 23 34 / 0.12), 0 1px 3px rgb(17 23 34 / 0.08)`; dark `0 8px 24px rgb(0 0 0 / 0.45), 0 1px 3px rgb(0 0 0 / 0.4)`): reserved for floating layers (popovers, menus, dialogs). No shipped component uses it yet.

### Named Rules
**The Lines-Not-Shadows Rule.** Separation is a hairline or a tonal step. A shadow appears only on a layer that floats above the page.

## Shapes

Gently squared corners in two steps: controls at 6px (`control`: buttons, fields, chips, badges, tags, swatches, nav items) and containers at 8px (`panel`: table frame, product card, empty state). A 4px `mark` radius covers the smallest marks (checkbox square, waterfall bars and tracks). Borders are 1px; dashed borders are semantic only (no-data underline, offline chip, empty state). Icons are custom 16x16 SVG with a 1.5 stroke, round caps, inheriting text color.

## Components

### Buttons
Quiet and exact.
- **Shape:** control radius (6px), 36px tall (32px `sm`), 44px on coarse pointers; weight 500.
- **Primary:** Ledger Blue fill, white text (dark theme: near-black text on the lighter blue), 16px horizontal padding.
- **Hover / Focus:** 150ms color transition to `action-hover`; focus is a 2px `focus` outline at 2px offset, keyboard only.
- **Secondary:** white surface, ink text, 1px `line-strong` border, hover to `surface-sunken`.
- **Ghost:** no fill, `action-soft-text`, hover to Blue Wash.
- **Disabled / Loading:** 50% opacity with not-allowed cursor; loading shows a 14px border spinner (dotted and static under reduced motion), sets `aria-busy`, and announces a label.

### Chips (Marketplace Picker)
- **Style:** 36px label chips with a 16px checkbox square (4px radius); an "All" chip selects only active sources.
- **State:** selected = `action` border on Blue Wash with a filled blue check; unselected = `line-strong` border on white; offline = dashed border on `offline-soft`, unplug icon, inline reason, not selectable. A polite live summary under the group counts selected of available.

### Cards / Containers
- **Corner Style:** panel radius (8px).
- **Background:** `surface` on `bg`.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px `line`.
- **Internal Padding:** 24px, 20px gap between blocks; facts in a 2/4-column definition grid; the "Why?" disclosure is a native `details` under a hairline.

### Inputs / Fields
- **Style:** 36px, white, 1px `line-strong`, 6px radius, 12px padding; label above (13px, 500), hint below in `text-subtle`. Currency/unit suffix sits inside on the right with the value right-aligned and tabular.
- **Focus:** the shared 2px `focus` outline at 2px offset.
- **Error / Disabled:** error swaps the border to `risk`, shows the message in `risk`, and sets `aria-invalid`; disabled drops to `surface-sunken` with subtle text.

### Navigation
- Sticky section nav and the theme/language switches share one item: label size, 6px radius, `text-muted` at rest, hover to ink (section nav also to `surface-sunken`), current item in Blue Wash with weight 500 and `aria-current`.

### Data Table
- Inside a panel frame; 13px `text-muted` headers, 14px tabular cells, 10px x 12px cell padding, row hairlines, row hover `surface-sunken`. The first column is sticky during horizontal scroll. The sorted column header turns ink with a sort glyph and carries `aria-sort`. A negative profit shows in `risk` with the crossed-circle icon and a screen-reader "loss" word.

### Multiple Badge
- Min 48px wide, 2px x 6px padding, control radius, label size at 600, tabular; tier chosen by value (below 2, from 2, 3, 5, 10). A null value renders the no-data word instead.

### Status Tag, Source Status, Coverage
- **Status tag:** soft background + strong text of its tone, icon + word, control radius.
- **Source status:** icon (dot / dashed ring / crossed circle / unplug) + name + state word + optional reason; inactive sources are muted, never hidden.
- **Coverage:** one dot per marketplace (filled `ok` for covered, dashed `nodata` ring for missing) followed by the "N of M" words.

### Waterfall and Sparkline
- **Waterfall:** label / bar track / value rows; track `surface-sunken`, total bar `chart-total`, expense bars `chart-decrease`, result bar `chart-result` or `chart-loss`; total and result rows are 600 ink, expense rows muted with a leading minus.
- **Sparkline:** 96x28 polyline in `chart-line`, 1.5 stroke, last point dotted in ink, `role="img"` with a label.

### Empty State
- Dashed `line-strong` panel border, 32px x 24px padding, a figure-size title, a muted 60ch explanation, and an optional next action.

## Do's and Don'ts

### Do:
- **Do** take every value from the `--tp-*` variables in `packages/ui/tokens.css` (or their Tailwind aliases); never hard-code a hex in a component.
- **Do** render figures with `tabular-nums`, right-aligned in tables, with the unit or narrow currency symbol beside the value.
- **Do** pair every status color with its icon or shape and a word.
- **Do** show an unavailable source greyed with its reason instead of hiding it.
- **Do** keep controls at 36px (44px on coarse pointers) and use the 2px `focus` outline at 2px offset for keyboard focus.

### Don't:
- **Don't** use blue for data, charts or badges; it belongs to action.
- **Don't** put a number, zero or average where data is missing; use the no-data word.
- **Don't** add shadows to resting panels or cards; separate with a hairline or tonal step.
- **Don't** use gradients, emoji in place of icons, or decorative animation.
- **Don't** nest panels inside panels.
