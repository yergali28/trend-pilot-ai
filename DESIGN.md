---
name: Trend Pilot AI
description: Seller analytics workbench where numbers read first; category standard finished to Stripe Dashboard / MPStats level.
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
  warning-line: "#e0a236"
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
  warning-line-dark: "#a87418"
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
  "10": "40px"
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
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  nav-item-current:
    backgroundColor: "{colors.action-soft}"
    textColor: "{colors.action-soft-text}"
  pref-item:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  pref-item-current:
    backgroundColor: "{colors.action-soft}"
    textColor: "{colors.action-soft-text}"
  app-header:
    backgroundColor: "{colors.surface}"
    padding: "12px 32px"
  chip-choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  chip-choice-selected:
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
  table-header:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    padding: "10px 12px"
  empty-state:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.panel}"
    padding: "32px 24px"
---

# Design System: Trend Pilot AI

## Overview

**Creative North Star: "The Honest Ledger"**

A working analytics tool for marketplace sellers, in the category standard and finished to the level of Stripe Dashboard and MPStats. The figure is the protagonist: tabular digits, right-aligned to the place value, currency beside the number, and an explicit word where a value is missing. Everything else steps back: a cool light-grey page, white surfaces, hairlines instead of shadows, one blue for action.

Color is semantic, never decorative. There are exactly three colored vocabularies: action (blue), the multiple scale 2x to 10x (green, deepening with value), and status (risk red, warning amber, no-data grey with a dashed underline, source-offline grey with an unplug icon). Every colored state is duplicated by a word or a shape. Light theme is the default; dark is the second theme, chosen in the header and set as `data-theme` on `<html>` (the token file also accepts it on a page wrapper and darkens the root via `:has`).

Density is moderate and even: 36px controls, 14px body, a 4px spacing step, tight inside a group and generous between groups. Screens are read top to bottom as a ledger: a title with a one-line lead, then sections each headed by a plain heading and holding one framed table, list, or form. Motion is functional only (150ms color transitions, the loading spinner) and respects `prefers-reduced-motion`.

**Key Characteristics:**
- Numbers read first: `tabular-nums` everywhere a figure appears, right-aligned in tables.
- One action blue; data visualization stays neutral grey unless it carries profit or loss.
- Flat surfaces separated by 1px lines and tonal steps; no shipped surface carries a shadow.
- Status by color + icon/shape + word; "no data" is a word, never a number.
- Tables shed secondary columns on narrow screens instead of becoming cards.
- Golos Text across all roles, Cyrillic-first with Kazakh coverage.

## Colors

A neutral cool-grey ledger with one blue voice and two semantic scales; both themes share roles token for token (dark values are the `-dark` keys in the frontmatter, served by the same `--tp-*` variables in `packages/ui/tokens.css`).

### Primary
- **Ledger Blue** (`action`; dark `action-dark`): primary button fill, selected marketplace chip border and checkbox fill, focus outline, caret. Hover deepens in light (`action-hover`) and lightens in dark (`action-hover-dark`).
- **Blue Wash** (`action-soft` with `action-soft-text`): current header nav item, current admin tab, current language and theme, selected wizard chip, ghost button and sign-out hover, info status tag (demo badge, "saved"). `action-soft-text` is also the in-text link color (category and product links, back links, "Why?" disclosures).

### Secondary
- **Multiple Scale** (`x-below-*`, `x2-*`, `x3-*`, `x5-*`, `x10-*`): background/text pairs for the multiple badge. Light theme deepens from pale mint to forest; dark theme brightens toward mint. The value is always printed (`3,9x`); the color only confirms it.

### Tertiary
- **Status set**: `risk` / `risk-soft` (loss, blocked source, field error, save error), `warning` / `warning-soft` / `warning-line` (amber), `nodata` / `nodata-soft` / `nodata-line` (grey word with dashed underline; also the "missing inputs" note in the Why list), `offline` / `offline-soft` (disabled or unregistered source), `ok` (filled dot for an active source or a covered marketplace; the "active" state word).
- **Chart roles**: `chart-line` and `chart-total` (neutral ink), `chart-decrease` (pale grey expense bars), `chart-result` (profit green), `chart-loss` (risk red).

### Neutral
- **Cool Paper** (`bg`): application background behind every screen, including auth.
- **White Sheet** (`surface`): app header band, table frames, the wizard form panel, framed lists, inputs, chips.
- **Recessed Grey** (`surface-sunken`): row hover (including the sticky first cell), nav item hover, waterfall tracks, disabled fields, secondary button hover.
- **Hairline** (`line`): header bottom border, panel borders, row and list dividers, section and tab underlines. **Strong Hairline** (`line-strong`): control borders, the empty-state dashed border, scrollbar thumb.
- **Ink** (`text`), **Graphite** (`text-muted`), **Slate** (`text-subtle`): primary text and figures; leads, column headers, secondary list text; hints, captions, metric labels, counts.
- **Selection** (`selection`): text selection background.

### Named Rules
**The One Blue Rule.** Blue means "you can act here" (button, link, focus, selected filter, current location). Data, charts and badges never use it.

**The Said-Twice Rule.** No state is carried by color alone: risk has a crossed circle, warning a triangle, no-data a dashed underline and the word, offline an unplug icon and a reason, pending a hollow ring, ok a filled dot, multiple a printed value, loss a crossed circle plus a screen-reader "loss" word.

**The Honest Gap Rule.** A missing value renders the localized "no data" word in `nodata` with a dashed `nodata-line` underline. Never a zero, dash or average in its place. Estimated values carry a leading "≈" (an `abbr` with its meaning).

## Typography

**Display Font:** Golos Text (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Golos Text
**Label/Mono Font:** Golos Text; one-time invite links and token names use the browser `code` face at label size.

**Character:** One Cyrillic-first grotesque in every role, served by `next/font` with latin, cyrillic and cyrillic-ext subsets so Kazakh letters render natively. Hierarchy comes from size and weight steps, not from a second family.

### Hierarchy
- **Display** (600, 32px / 40px): the screen title (`h1`) on every app screen.
- **Headline** (600, 24px / 32px): section title (`h2`: "Category ranking", "Unit economics: Kaspi.kz", "Calculation parameters"); also the auth card title.
- **Title** (600, 20px / 28px): the UI-kit product card title only; product screens skip it.
- **Figure** (600, 16px / 24px, tabular): key figures in the unit-economics strip and scenario range; also the sub-section heading (`h2`/`h3` such as "Unavailable marketplaces", "Marketplace comparison", admin form headings), the empty-state title, and the app wordmark.
- **Body** (400-500, 14px / 22px): running text, leads, table cells, field values, header nav and admin tabs, chips; leads cap at 65ch.
- **Label** (400-500, 13px / 20px): field labels and legends, column headers, hints, captions, metric labels, badges and tags, back links, language and theme switches, sign-out.
- `xs` (12px / 16px) exists in the token file and is used nowhere.

### Named Rules
**The Tabular Rule.** Every figure uses `tabular-nums`; table number columns align right; currency and unit sit beside the value (`7 900 ₸`, `3,9x`, `191 %`), formatted per locale with `Intl.NumberFormat` and the narrow currency symbol. Numeric inputs right-align their value with the unit inside the field.

## Layout

Every app screen shares one column: a white header band with a bottom hairline, then `main` centered at 72rem (`max-w-6xl`) with 16px side padding (32px from 640px) and 32px top and bottom. Auth screens drop the header and center a single 24rem column on Cool Paper (top-aligned on phones, vertically centered from 640px).

A screen is a vertical stack: a title block (optional back link in label size, `h1`, a one-line muted lead), then sections 32-40px apart, each a heading plus one framed object 12-16px below it. A summary or action (coverage, "change parameters", demo tag) sits right of the title block and wraps under it on narrow screens.

Two-pane screens use a 3:2 split from 1024px (`minmax(0,3fr) minmax(0,2fr)`, 40-48px gap): the product's unit economics beside its parameter editor, the organizations table beside the create/invite forms, a reference table beside its add form. Below 1024px they stack; the product editor moves above the readout (`order-first`) so inputs come first on phones, and on desktop it is sticky at 24px from the top while the long readout scrolls.

Spacing is a 4px step (frontmatter `spacing`), used as 4/8/12/16/24/32/40/48/64. Groups are tight inside (4-8px between a label and its field, 8px between chips) and generous between groups (20-32px between field rows, 32-48px between sections). Form grids open to 2 or 3 columns at 640px or 1024px. Metric strips go 2, 3, then 6 columns. On coarse pointers every control and nav item grows to 44px.

### Named Rules
**The Shed-Columns Rule.** Tables never turn into cards on mobile. Each column declares the breakpoint it appears from (`sm`/`md`/`lg`/`xl`); the name column and the decisive figures (profit, multiple) are always visible, and the frame scrolls horizontally with a sticky first column if what remains still overflows.

## Elevation & Depth

Flat by construction. Panels are separated from the page by a 1px `line` border and the white-on-cool-grey tonal step; row hover drops to `surface-sunken`. No shipped surface, including the sticky parameter editor and the sticky table column, carries a shadow; the sticky cell keeps its own surface fill so scrolled content passes under it cleanly.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 8px 24px rgb(17 23 34 / 0.12), 0 1px 3px rgb(17 23 34 / 0.08)`; dark `0 8px 24px rgb(0 0 0 / 0.45), 0 1px 3px rgb(0 0 0 / 0.4)`): reserved for floating layers (popovers, menus, dialogs). Defined as `--shadow-overlay`; no shipped component uses it yet.

### Named Rules
**The Lines-Not-Shadows Rule.** Separation is a hairline or a tonal step. A shadow appears only on a layer that floats above the page.

## Shapes

Gently squared corners in two steps: controls at 6px (`control`: buttons, fields, chips, badges, tags, nav items, tabs, prefs) and containers at 8px (`panel`: table frame, wizard form panel, framed lists, empty state). A 4px `mark` radius covers the smallest marks (checkbox square, waterfall bars and tracks). Borders are 1px; dashed borders are semantic only (no-data underline, offline chip, empty state). Icons are custom 16x16 SVG with a 1.5 stroke, round caps, inheriting text color.

## Components

### Buttons
Quiet and exact.
- **Shape:** control radius (6px), 36px tall (32px `sm`), 44px on coarse pointers; weight 500.
- **Primary:** Ledger Blue fill, white text (dark theme: near-black text on the lighter blue), 16px horizontal padding. One per form: "Find products", "Sign in", "Create".
- **Hover / Focus:** 150ms color transition to `action-hover`; focus is a 2px `focus` outline at 2px offset, keyboard only.
- **Secondary:** white surface, ink text, 1px `line-strong` border, hover to `surface-sunken`. Used for row-level and save actions ("Save calculation", per-source "Save").
- **Ghost:** no fill, `action-soft-text`, hover to Blue Wash; the header sign-out is a compact ghost.
- **Disabled / Loading:** 50% opacity with not-allowed cursor; loading shows a 14px border spinner (dotted and static under reduced motion), sets `aria-busy`, and announces a label. The result appears beside the button as a status tag in a `role="status"` slot.

### Chips
- **Marketplace picker:** 36px label chips with a 16px checkbox square (4px radius); an "All" chip selects only active sources. Selected = `action` border on Blue Wash with a filled blue check; unselected = `line-strong` border on white; offline = dashed border on `offline-soft`, unplug icon, inline reason, not selectable. A polite live summary under the group counts selected of available.
- **Choice chips (wizard target and metric):** a visually hidden native radio followed by a 36px bordered label; checked = `action` border on Blue Wash in `action-soft-text`; keyboard focus draws the focus ring on the label. A custom value sits inline as a 96px right-aligned numeric field. A hint under the group follows the selection without a submit.

### Cards / Containers
- **Corner Style:** panel radius (8px).
- **Background:** `surface` on `bg`.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px `line`.
- **Internal Padding:** 24px for a form panel (the wizard); 16px x 12-16px per row in framed lists (insufficient-data products, source registry), rows split by `line` dividers. Panels never nest; inside a panel, grouping is by spacing and hairlines.

### Inputs / Fields
- **Style:** 36px, white, 1px `line-strong`, 6px radius, 12px padding; label above (13px, 500), hint below in `text-subtle`. Currency/unit suffix sits inside on the right with the value right-aligned and tabular. Selects are native with the same box.
- **Focus:** the shared 2px `focus` outline at 2px offset.
- **Error / Disabled:** error swaps the border to `risk`, shows the message in `risk`, and sets `aria-invalid`; disabled drops to `surface-sunken` with subtle text.

### Navigation
- **App header:** White Sheet band, 12px vertical padding, bottom hairline, content in the 72rem column. Left: the wordmark (16px, 600, ink) then the main nav. Right, pushed by auto margin: the demo info tag when demo data is on, the language switch (RU / EN / KK, uppercase), the theme switch, the user email (from 768px), and sign-out. Everything wraps onto a second row on phones; nothing hides behind a menu.
- **Nav items and admin tabs:** body size, 6px x 10px padding (vertical x horizontal), 6px radius; `text-muted` at rest, hover to ink on `surface-sunken`; current item in Blue Wash at weight 500 with `aria-current`. Admin tabs sit under the admin `h1` above a `line` underline; reference-table tabs use the same item with a subtle tabular count.
- **Prefs switches:** label size, 4px x 8px padding, same Blue Wash current state, hover to ink without a fill.
- **Back link:** label size, 500, `action-soft-text`, underline on hover, above the `h1`.

### Data Table
- Inside a panel frame; 13px `text-muted` headers, 14px tabular cells, 10px x 12px cell padding, row hairlines, row hover `surface-sunken`. The name column wraps (min 112px, 160px from 640px); every other column stays on one line.
- **Column priority:** columns declare `from` breakpoints so a 390px screen keeps product, profit and multiple; the frame scrolls horizontally beyond that. The first column is sticky with its own surface fill and follows row hover.
- **Sort indication:** the column the result is ranked by turns ink with a sort icon and carries `aria-sort`; it follows the chosen metric.
- **Cells:** names are `action-soft-text` links at 500 when they open the next level, ink at 500 otherwise (the current marketplace in the comparison matrix is ink at 600). A negative profit shows in `risk` with the crossed-circle icon and a screen-reader "loss" word.

### Product Card (product screen)
- **Header:** back link to the category, the product `h1`, a muted lead naming the purchase source.
- **Marketplace comparison:** a Data Table, one row per sell marketplace, linking to that marketplace's card.
- **Unit economics:** a six-figure definition strip (label in subtle 13px over a 16px 600 figure, multiple as its badge), then the 3:2 split: waterfall, scenario range and the Why panel on the left; the sticky parameter editor (money and percent fields, secondary save with inline status) on the right.
- **Scenario range:** three cells under top and bottom hairlines with vertical dividers; the realistic value is ink at 600, the others muted.

### Why Panel
- An open native `details` under a `line` top border; the summary is a 14px 500 `action-soft-text` disclosure. Inside, a divided list: formula text on the left, its value on the right (stacked on phones), and a `nodata` note naming any missing inputs.
- **Sources table:** a nested, collapsed `details` labelled with the input count opens a bare table (no panel frame, label size, `line` row dividers, 6-8px row padding): field, source, fetched date (tabular, no wrap), and status word. It scrolls horizontally on its own.

### Multiple Badge
- Min 48px wide, 2px x 6px padding, control radius, label size at 600, tabular; tier chosen by value (below 2, from 2, 3, 5, 10). A null value renders the no-data word instead.

### Status Tag, Source Status, Coverage
- **Status tag:** soft background + strong text of its tone, icon + word, control radius, label size 500. Info tone marks demo data and a successful save; risk tone a failed save.
- **Source status:** icon (dot / hollow ring / crossed circle / unplug) + name + "· state word" + optional reason line; inactive sources are muted, never hidden. On the results screen unavailable sources list in a 1-2-3 column grid; in the admin registry each row pairs the status block with an inline status select, reason field and secondary save (3:2 split from 1024px).
- **Coverage:** one dot per marketplace (filled `ok` for covered, hollow `nodata` ring for missing) followed by the "N of M" words; sits beside the screen title and in table columns.

### Waterfall and Sparkline
- **Waterfall:** label / bar track / value rows; track `surface-sunken`, total bar `chart-total`, expense bars `chart-decrease`, result bar `chart-result` or `chart-loss`; total and result rows are 600 ink, expense rows muted with a leading minus.
- **Sparkline:** 96x28 polyline in `chart-line`, 1.5 stroke, last point dotted in ink, `role="img"` with a label.

### Empty and Insufficient-Data States
- **Empty state:** dashed `line-strong` panel border, 32px x 24px padding (vertical x horizontal), a figure-size title, a muted 60ch explanation, and an optional next action. Used when no source is selected or nothing matches.
- **Insufficient data:** products that cannot be calculated are never dropped silently; they get their own headed section after the results, with a muted lead, listing each item and the missing inputs by name (a table on the ranking screen, a framed divided list on the category screen).

## Do's and Don'ts

### Do:
- **Do** take every value from the `--tp-*` variables in `packages/ui/tokens.css` (or their Tailwind aliases); never hard-code a hex in a component.
- **Do** render figures with `tabular-nums`, right-aligned in tables, with the unit or narrow currency symbol beside the value.
- **Do** pair every status color with its icon or shape and a word.
- **Do** show an unavailable source greyed with its reason instead of hiding it, and list uncalculable products with what is missing.
- **Do** keep controls at 36px (44px on coarse pointers) and use the 2px `focus` outline at 2px offset for keyboard focus.
- **Do** let tables shed secondary columns by breakpoint and keep the first column sticky, instead of reflowing rows into cards.
- **Do** mark the current location (nav item, admin tab, language, theme) with Blue Wash and `aria-current`.

### Don't:
- **Don't** use blue for data, charts or badges; it belongs to action.
- **Don't** put a number, zero or average where data is missing; use the no-data word.
- **Don't** add shadows to resting panels, cards or sticky elements; separate with a hairline or tonal step.
- **Don't** use gradients, emoji or text glyphs in place of icons, or decorative animation.
- **Don't** nest panels inside panels.
- **Don't** put a kicker or eyebrow label above a heading; the only lines allowed there are a back link on app screens and the wordmark on auth screens.
